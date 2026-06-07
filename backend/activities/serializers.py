from rest_framework import serializers

from accounts.serializers import UserSerializer
from .models import Activity


class ActivitySerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    type_label = serializers.CharField(source="get_type_display", read_only=True)

    class Meta:
        model = Activity
        fields = ("id", "lead", "type", "type_label", "description", "metadata", "created_by", "created_at")
        read_only_fields = ("id", "created_by", "created_at")

