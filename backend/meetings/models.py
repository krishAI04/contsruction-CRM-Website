from django.conf import settings
from django.db import models


class Meeting(models.Model):
    lead = models.ForeignKey("leads.Lead", on_delete=models.CASCADE, related_name="meetings")
    meeting_date = models.DateField(null=True, blank=True)
    raw_notes = models.TextField()
    summary = models.TextField(blank=True)
    action_items = models.JSONField(default=list, blank=True)
    risks = models.JSONField(default=list, blank=True)
    next_follow_up_date = models.CharField(max_length=120, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"Meeting for {self.lead_id}"
