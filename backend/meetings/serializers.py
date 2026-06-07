from rest_framework import serializers

from .models import Meeting


class MeetingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Meeting
        fields = (
            "id", "lead", "meeting_date", "raw_notes", "summary",
            "action_items", "risks", "next_follow_up_date", "created_by", "created_at",
        )
        read_only_fields = ("id", "summary", "action_items", "risks", "next_follow_up_date", "created_by", "created_at")
