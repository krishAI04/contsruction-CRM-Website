from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from accounts.permissions import IsNotViewerForWrite
from activities.models import Activity
from activities.serializers import ActivitySerializer
from .assignment import AssignmentService
from .importers import LeadImportService
from .models import Lead, LeadSource, LostReason
from communications.models import Notification
from .serializers import (
    AssignLeadSerializer,
    CompleteSiteVisitSerializer,
    ContactLeadSerializer,
    LeadDetailSerializer,
    LeadImportSerializer,
    LeadSerializer,
    LeadSourceSerializer,
    LostReasonSerializer,
    ScheduleSiteVisitSerializer,
    StageMoveSerializer,
    ReopenLeadSerializer,
)
from .services import PipelineService

User = get_user_model()


class LeadPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class LeadSourceViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = LeadSourceSerializer
    permission_classes = [IsNotViewerForWrite]
    queryset = LeadSource.objects.filter(is_active=True).order_by("name")


class LostReasonViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = LostReasonSerializer
    permission_classes = [IsNotViewerForWrite]
    queryset = LostReason.objects.filter(is_active=True).order_by("name")


class LeadViewSet(viewsets.ModelViewSet):
    permission_classes = [IsNotViewerForWrite]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    pagination_class = LeadPagination

    def get_serializer_class(self):
        if self.action == "retrieve":
            return LeadDetailSerializer
        return LeadSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Lead.objects.select_related("source", "lost_reason", "assigned_to", "created_by").prefetch_related("activities", "proposals")
        if user.role == user.Role.EXECUTIVE and not user.team_visibility:
            qs = qs.filter(assigned_to=user)
        if user.role == user.Role.VIEWER:
            qs = qs.all()

        search = self.request.query_params.get("search")
        stage = self.request.query_params.get("stage")
        source = self.request.query_params.get("source")
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(phone__icontains=search) | Q(email__icontains=search))
        if stage:
            qs = qs.filter(stage=stage)
        if source:
            qs = qs.filter(source_id=source)
        return qs

    def perform_create(self, serializer):
        lead = serializer.save(created_by=self.request.user)
        if not lead.assigned_to_id:
            AssignmentService.assign_if_needed(lead, user=self.request.user)
        Activity.objects.create(
            lead=lead,
            type=Activity.Type.NOTE,
            description="Lead created.",
            created_by=self.request.user,
        )

    def perform_update(self, serializer):
        lead = serializer.save()
        Activity.objects.create(
            lead=lead,
            type=Activity.Type.NOTE,
            description="Lead details updated.",
            created_by=self.request.user,
        )

    @action(detail=True, methods=["patch"], url_path="stage")
    def stage(self, request, pk=None):
        lead = self.get_object()
        serializer = StageMoveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lead = PipelineService.move_stage(
            lead=lead,
            target_stage=serializer.validated_data["stage"],
            user=request.user,
            deal_value=serializer.validated_data.get("deal_value"),
            lost_reason=serializer.validated_data.get("lost_reason"),
        )
        return Response(LeadSerializer(lead).data)

    @action(detail=True, methods=["patch"], url_path="assign")
    def assign(self, request, pk=None):
        if not request.user.can_manage:
            return Response({"detail": "Only managers and admins can assign leads."}, status=status.HTTP_403_FORBIDDEN)
        lead = self.get_object()
        serializer = AssignLeadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        assignee = User.objects.get(id=serializer.validated_data["assigned_to"])
        if assignee.role != User.Role.EXECUTIVE:
            return Response({"detail": "Leads can only be assigned to sales executives."}, status=status.HTTP_400_BAD_REQUEST)
        lead.assigned_to = assignee
        lead.assignment_method = "manual"
        lead.assignment_reason = f"Manually assigned by {request.user.email}."
        lead.save(update_fields=["assigned_to", "assignment_method", "assignment_reason", "updated_at"])
        Activity.objects.create(
            lead=lead,
            type=Activity.Type.ASSIGNED,
            description=f"Lead assigned to {assignee.email}.",
            metadata={"assigned_to": assignee.id},
            created_by=request.user,
        )
        Notification.objects.create(
            recipient=assignee,
            lead=lead,
            title="New lead assigned",
            message=f"{lead.name} has been assigned to you. Recommended next step: call within 24 hours.",
        )
        return Response(LeadSerializer(lead).data)

    @action(detail=True, methods=["get"], url_path="activities")
    def activities(self, request, pk=None):
        lead = self.get_object()
        return Response(ActivitySerializer(lead.activities.all(), many=True).data)

    @action(detail=True, methods=["post"], url_path="contact")
    def contact(self, request, pk=None):
        lead = self.get_object()
        serializer = ContactLeadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        note = serializer.validated_data.get("note", "")
        lead.stage = Lead.Stage.CONTACTED
        if note:
            lead.notes = f"{lead.notes}\n{note}".strip()
        lead.save(update_fields=["stage", "notes", "updated_at"])
        Activity.objects.create(
            lead=lead,
            type=Activity.Type.CALL,
            description=note or "Lead contacted.",
            created_by=request.user,
        )
        return Response(LeadSerializer(lead).data)

    @action(detail=True, methods=["post"], url_path="schedule-site-visit")
    def schedule_site_visit(self, request, pk=None):
        lead = self.get_object()
        serializer = ScheduleSiteVisitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lead.stage = Lead.Stage.SITE_VISIT_SCHEDULED
        lead.site_visit_date = serializer.validated_data["site_visit_date"]
        lead.site_visit_engineer = serializer.validated_data["site_visit_engineer"]
        note = serializer.validated_data.get("note", "")
        if note:
            lead.notes = f"{lead.notes}\n{note}".strip()
        lead.save(update_fields=["stage", "site_visit_date", "site_visit_engineer", "notes", "updated_at"])
        Activity.objects.create(
            lead=lead,
            type=Activity.Type.MEETING,
            description=f"Site visit scheduled for {lead.site_visit_date} with {lead.site_visit_engineer}.",
            metadata={"site_visit_date": str(lead.site_visit_date), "engineer": lead.site_visit_engineer, "note": note},
            created_by=request.user,
        )
        return Response(LeadSerializer(lead).data)

    @action(detail=True, methods=["post"], url_path="complete-site-visit")
    def complete_site_visit(self, request, pk=None):
        lead = self.get_object()
        serializer = CompleteSiteVisitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        note = serializer.validated_data["note"]
        lead.stage = Lead.Stage.SITE_VISIT_COMPLETED
        lead.notes = f"{lead.notes}\n{note}".strip()
        lead.save(update_fields=["stage", "notes", "updated_at"])
        Activity.objects.create(
            lead=lead,
            type=Activity.Type.MEETING,
            description=note,
            metadata={"site_visit_completed": True},
            created_by=request.user,
        )
        return Response(LeadSerializer(lead).data)

    @action(detail=True, methods=["post"], url_path="reopen")
    def reopen(self, request, pk=None):
        lead = self.get_object()
        serializer = ReopenLeadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        note = serializer.validated_data.get("note") or "Lost lead reopened for follow-up."
        lead = PipelineService.move_stage(
            lead=lead,
            target_stage=Lead.Stage.CONTACTED,
            user=request.user,
        )
        Activity.objects.create(
            lead=lead,
            type=Activity.Type.NOTE,
            description=note,
            metadata={"reopened": True},
            created_by=request.user,
        )
        return Response(LeadSerializer(lead).data)

    @action(detail=False, methods=["post"], url_path="import-file")
    def import_file(self, request):
        serializer = LeadImportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        summary = LeadImportService.import_file(
            uploaded_file=serializer.validated_data["file"],
            default_source=serializer.validated_data.get("default_source"),
            assigned_to_id=serializer.validated_data.get("assigned_to"),
            auto_assign=serializer.validated_data.get("auto_assign", True),
            created_by=request.user,
        )
        return Response(summary, status=status.HTTP_201_CREATED)
