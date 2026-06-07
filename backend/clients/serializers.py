from rest_framework import serializers

from .models import Client


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = ("id", "lead", "name", "phone", "email", "project_value", "project_type", "created_by", "created_at")
        read_only_fields = ("id", "created_by", "created_at")

