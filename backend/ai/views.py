from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from activities.models import Activity
from leads.models import Lead
from .models import AIOutput
from .services import AIService


class _AIBaseView(APIView):
    feature_type = None

    def limit_response(self):
        limit = getattr(settings, "AI_DAILY_LIMIT", 10)
        if limit <= 0:
            return None
        today = timezone.localdate()
        used = AIOutput.objects.filter(created_at__date=today).count()
        if used >= limit:
            return Response(
                {
                    "detail": f"Daily AI demo limit reached ({used}/{limit}). Try again tomorrow.",
                    "limit": limit,
                    "used": used,
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
        return None


    def save_output(self, request, lead, result, input_snapshot):
        ai_output = AIOutput.objects.create(
            feature_type=self.feature_type,
            lead=lead,
            provider=result["provider"],
            input_snapshot=input_snapshot,
            output_json=result["output"],
            fallback_used=result["fallback_used"],
            created_by=request.user,
        )
        if lead:
            Activity.objects.create(
                lead=lead,
                type=Activity.Type.AI,
                description=f"AI {self.feature_type} generated using {result['provider']}.",
                metadata={"fallback_used": result["fallback_used"]},
                created_by=request.user,
            )
        return ai_output


class AIScoreLeadView(_AIBaseView):
    feature_type = AIOutput.FeatureType.LEAD_SCORE

    def post(self, request):
        limited = self.limit_response()
        if limited:
            return limited
        lead = Lead.objects.get(id=request.data["lead_id"])
        result = AIService.generate_lead_score(lead)
        ai_output = self.save_output(request, lead, result, {"lead_id": lead.id})
        return Response({"id": ai_output.id, **result})


class AIFollowUpView(_AIBaseView):
    feature_type = AIOutput.FeatureType.FOLLOW_UP

    def post(self, request):
        limited = self.limit_response()
        if limited:
            return limited
        lead = Lead.objects.get(id=request.data["lead_id"])
        result = AIService.generate_followup(lead)
        ai_output = self.save_output(request, lead, result, {"lead_id": lead.id})
        return Response({"id": ai_output.id, **result})


class AIProposalView(_AIBaseView):
    feature_type = AIOutput.FeatureType.PROPOSAL

    def post(self, request):
        limited = self.limit_response()
        if limited:
            return limited
        lead = Lead.objects.get(id=request.data["lead_id"])
        result = AIService.generate_proposal(lead)
        ai_output = self.save_output(request, lead, result, {"lead_id": lead.id})
        return Response({"id": ai_output.id, **result})


class AIMeetingSummaryView(_AIBaseView):
    feature_type = AIOutput.FeatureType.MEETING_SUMMARY

    def post(self, request):
        limited = self.limit_response()
        if limited:
            return limited
        lead = Lead.objects.filter(id=request.data.get("lead_id")).first()
        raw_notes = request.data.get("raw_notes", "")
        result = AIService.summarize_meeting(raw_notes)
        ai_output = self.save_output(request, lead, result, {"lead_id": getattr(lead, "id", None), "raw_notes": raw_notes})
        return Response({"id": ai_output.id, **result})

