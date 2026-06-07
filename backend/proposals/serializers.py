from rest_framework import serializers

from .models import Proposal


class ProposalSerializer(serializers.ModelSerializer):
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Proposal
        fields = (
            "id", "lead", "title", "proposal_text", "amount", "status", "status_label",
            "pdf_file", "created_by", "approved_by", "approved_at", "created_at", "updated_at",
        )
        read_only_fields = ("id", "created_by", "approved_by", "approved_at", "created_at", "updated_at", "pdf_file")

    def validate_amount(self, value):
        lead = self.initial_data.get("lead")
        if value <= 0:
            raise serializers.ValidationError("Proposal amount must be greater than zero.")
        return value

