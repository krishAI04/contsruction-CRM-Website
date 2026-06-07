from django.conf import settings
from django.db import models


class Activity(models.Model):
    class Type(models.TextChoices):
        CALL = "call", "Call"
        EMAIL = "email", "Email"
        WHATSAPP_COPY = "whatsapp_copy", "WhatsApp Copy"
        MEETING = "meeting", "Meeting"
        NOTE = "note", "Note"
        PROPOSAL = "proposal", "Proposal"
        STAGE_CHANGED = "stage_changed", "Stage Changed"
        ASSIGNED = "assigned", "Assigned"
        AI = "ai", "AI"

    lead = models.ForeignKey("leads.Lead", on_delete=models.CASCADE, related_name="activities")
    type = models.CharField(max_length=30, choices=Type.choices)
    description = models.TextField()
    metadata = models.JSONField(default=dict, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.get_type_display()} - {self.lead_id}"

