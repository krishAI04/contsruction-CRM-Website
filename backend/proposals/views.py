from django.http import FileResponse
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import IsNotViewerForWrite
from activities.models import Activity
from .models import Proposal
from .serializers import ProposalSerializer
from .services import ProposalService


class ProposalViewSet(viewsets.ModelViewSet):
    serializer_class = ProposalSerializer
    permission_classes = [IsNotViewerForWrite]

    def get_queryset(self):
        qs = Proposal.objects.select_related("lead", "created_by", "approved_by")
        lead_id = self.request.query_params.get("lead")
        if lead_id:
            qs = qs.filter(lead_id=lead_id)
        return qs

    def perform_create(self, serializer):
        proposal = serializer.save(created_by=self.request.user)
        Activity.objects.create(
            lead=proposal.lead,
            type=Activity.Type.PROPOSAL,
            description=f"Proposal draft created: {proposal.title}.",
            created_by=self.request.user,
        )

    @action(detail=True, methods=["patch"], url_path="approve")
    def approve(self, request, pk=None):
        try:
            proposal = ProposalService.approve(self.get_object(), request.user)
        except PermissionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_403_FORBIDDEN)
        return Response(ProposalSerializer(proposal).data)

    @action(detail=True, methods=["get"], url_path="pdf")
    def pdf(self, request, pk=None):
        proposal = self.get_object()
        if not proposal.pdf_file:
            ProposalService.generate_pdf(proposal)
        return FileResponse(proposal.pdf_file.open("rb"), as_attachment=True, filename=f"proposal-{proposal.id}.pdf")

