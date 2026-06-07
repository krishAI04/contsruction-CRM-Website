from django.conf import settings
from django.db import models


class AIOutput(models.Model):
    class FeatureType(models.TextChoices):
        LEAD_SCORE = "lead_score", "Lead Score"
        FOLLOW_UP = "follow_up", "Follow Up"
        PROPOSAL = "proposal", "Proposal"
        MEETING_SUMMARY = "meeting_summary", "Meeting Summary"

    feature_type = models.CharField(max_length=30, choices=FeatureType.choices)
    lead = models.ForeignKey("leads.Lead", on_delete=models.CASCADE, null=True, blank=True, related_name="ai_outputs")
    provider = models.CharField(max_length=30, default="mock")
    input_snapshot = models.JSONField(default=dict, blank=True)
    output_json = models.JSONField(default=dict, blank=True)
    fallback_used = models.BooleanField(default=False)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.feature_type} via {self.provider}"

