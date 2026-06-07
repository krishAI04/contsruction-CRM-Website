from rest_framework import serializers

from accounts.serializers import UserSerializer
from activities.serializers import ActivitySerializer
from .models import Lead, LeadSource, LostReason


class LeadSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeadSource
        fields = ("id", "name", "is_active")


class LostReasonSerializer(serializers.ModelSerializer):
    class Meta:
        model = LostReason
        fields = ("id", "name", "is_active")


class LeadSerializer(serializers.ModelSerializer):
    assigned_to_detail = UserSerializer(source="assigned_to", read_only=True)
    created_by_detail = UserSerializer(source="created_by", read_only=True)
    source_detail = LeadSourceSerializer(source="source", read_only=True)
    lost_reason_detail = LostReasonSerializer(source="lost_reason", read_only=True)
    stage_label = serializers.CharField(source="get_stage_display", read_only=True)
    project_type_label = serializers.CharField(source="get_project_type_display", read_only=True)
    timeline_label = serializers.CharField(source="get_timeline_display", read_only=True)

    class Meta:
        model = Lead
        fields = (
            "id", "name", "email", "phone", "city", "source", "source_detail",
            "project_type", "project_type_label", "budget", "timeline", "timeline_label",
            "stage", "stage_label", "notes", "site_visit_date", "site_visit_engineer", "deal_value", "won_date",
            "lost_reason", "lost_reason_detail", "assigned_to", "assigned_to_detail", "assignment_method", "assignment_reason",
            "created_by", "created_by_detail", "created_at", "updated_at",
        )
        read_only_fields = ("id", "assignment_method", "assignment_reason", "created_by", "created_at", "updated_at")

    def validate_budget(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError("Budget must be greater than zero.")
        return value


class LeadDetailSerializer(LeadSerializer):
    activities = ActivitySerializer(many=True, read_only=True)

    class Meta(LeadSerializer.Meta):
        fields = LeadSerializer.Meta.fields + ("activities",)


class StageMoveSerializer(serializers.Serializer):
    stage = serializers.ChoiceField(choices=Lead.Stage.choices)
    deal_value = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, allow_null=True)
    lost_reason = serializers.PrimaryKeyRelatedField(queryset=LostReason.objects.all(), required=False, allow_null=True)


class ReopenLeadSerializer(serializers.Serializer):
    note = serializers.CharField(required=False, allow_blank=True)


class AssignLeadSerializer(serializers.Serializer):
    assigned_to = serializers.IntegerField()


class ContactLeadSerializer(serializers.Serializer):
    note = serializers.CharField(required=False, allow_blank=True)


class ScheduleSiteVisitSerializer(serializers.Serializer):
    site_visit_date = serializers.DateField()
    site_visit_engineer = serializers.CharField(max_length=120)
    note = serializers.CharField(required=False, allow_blank=True)


class CompleteSiteVisitSerializer(serializers.Serializer):
    note = serializers.CharField()


class LeadImportSerializer(serializers.Serializer):
    file = serializers.FileField()
    default_source = serializers.PrimaryKeyRelatedField(queryset=LeadSource.objects.all(), required=False, allow_null=True)
    assigned_to = serializers.IntegerField(required=False, allow_null=True)
    auto_assign = serializers.BooleanField(required=False, default=True)
