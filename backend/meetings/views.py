from rest_framework import viewsets

from accounts.permissions import IsNotViewerForWrite
from activities.models import Activity
from ai.services import AIService
from .models import Meeting
from .serializers import MeetingSerializer


class MeetingViewSet(viewsets.ModelViewSet):
    serializer_class = MeetingSerializer
    permission_classes = [IsNotViewerForWrite]

    def get_queryset(self):
        qs = Meeting.objects.select_related("lead", "created_by")
        lead_id = self.request.query_params.get("lead")
        if lead_id:
            qs = qs.filter(lead_id=lead_id)
        return qs

    def perform_create(self, serializer):
        raw_notes = serializer.validated_data["raw_notes"]
        result = AIService.summarize_meeting(raw_notes)
        output = result["output"]
        meeting = serializer.save(
            created_by=self.request.user,
            summary=output.get("summary", ""),
            action_items=output.get("action_items", []),
            risks=output.get("risks", []),
            next_follow_up_date=output.get("next_follow_up_date") or "Within 3 days",
        )
        Activity.objects.create(
            lead=meeting.lead,
            type=Activity.Type.MEETING,
            description="Meeting notes summarized with AI.",
            metadata={"meeting_id": meeting.id, "provider": result["provider"], "fallback_used": result["fallback_used"]},
            created_by=self.request.user,
        )
