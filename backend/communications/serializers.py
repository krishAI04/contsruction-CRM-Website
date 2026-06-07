from rest_framework import serializers

from .models import EmailMessage


class EmailMessageSerializer(serializers.ModelSerializer):
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = EmailMessage
        fields = (
            "id", "lead", "recipient", "subject", "body", "status", "status_label",
            "error_message", "sent_at", "created_by", "created_at", "updated_at",
        )
        read_only_fields = ("id", "error_message", "sent_at", "created_by", "created_at", "updated_at")

