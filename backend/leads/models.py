from django.conf import settings
from django.db import models


class LeadSource(models.Model):
    name = models.CharField(max_length=80, unique=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class LostReason(models.Model):
    name = models.CharField(max_length=120, unique=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class AssignmentCursor(models.Model):
    name = models.CharField(max_length=80, unique=True, default="sales_round_robin")
    last_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Lead(models.Model):
    class Stage(models.TextChoices):
        NEW = "new", "New Lead"
        CONTACTED = "contacted", "Contacted"
        SITE_VISIT_SCHEDULED = "site_visit_scheduled", "Site Visit Scheduled"
        SITE_VISIT_COMPLETED = "site_visit_completed", "Site Visit Completed"
        PROPOSAL_SENT = "proposal_sent", "Proposal Sent"
        NEGOTIATION = "negotiation", "Negotiation"
        WON = "won", "Won"
        LOST = "lost", "Lost"

    class ProjectType(models.TextChoices):
        RESIDENTIAL = "residential", "Residential House"
        OFFICE = "office", "Office Interior"
        COMMERCIAL = "commercial", "Commercial"
        RENOVATION = "renovation", "Renovation"
        VILLA = "villa", "Villa Construction"

    class Timeline(models.TextChoices):
        IMMEDIATE = "immediate", "Immediate"
        ONE_MONTH = "one_month", "1 Month"
        THREE_MONTHS = "three_months", "3 Months"
        NOT_DECIDED = "not_decided", "Not Decided"

    name = models.CharField(max_length=120)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, unique=True)
    city = models.CharField(max_length=80, blank=True)
    source = models.ForeignKey(LeadSource, on_delete=models.PROTECT, related_name="leads")
    project_type = models.CharField(max_length=30, choices=ProjectType.choices)
    budget = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    timeline = models.CharField(max_length=30, choices=Timeline.choices, default=Timeline.NOT_DECIDED)
    stage = models.CharField(max_length=40, choices=Stage.choices, default=Stage.NEW)
    notes = models.TextField(blank=True)
    site_visit_date = models.DateField(null=True, blank=True)
    site_visit_engineer = models.CharField(max_length=120, blank=True)
    deal_value = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    won_date = models.DateTimeField(null=True, blank=True)
    lost_reason = models.ForeignKey(LostReason, on_delete=models.PROTECT, null=True, blank=True)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="assigned_leads")
    assignment_method = models.CharField(max_length=40, blank=True)
    assignment_reason = models.CharField(max_length=255, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="created_leads")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.name} - {self.get_stage_display()}"
