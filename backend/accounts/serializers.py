from rest_framework import serializers

from .models import Organization, User


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ("id", "name", "is_active")


class UserSerializer(serializers.ModelSerializer):
    organization_detail = OrganizationSerializer(source="organization", read_only=True)

    class Meta:
        model = User
        fields = (
            "id", "username", "first_name", "last_name", "email", "organization",
            "organization_detail", "role", "team_visibility", "city_coverage", "is_active",
        )
        read_only_fields = ("id", "organization_detail")


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    organization_password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = (
            "id", "username", "first_name", "last_name", "email", "password",
            "organization", "organization_password", "role", "team_visibility", "city_coverage",
        )
        read_only_fields = ("id",)

    def validate(self, attrs):
        request = self.context["request"]
        current_user = request.user
        role = attrs.get("role", User.Role.EXECUTIVE)
        organization = attrs.get("organization") or current_user.organization

        if not current_user.can_manage:
            raise serializers.ValidationError("Only admins and managers can add team members.")
        if current_user.role == User.Role.MANAGER and role != User.Role.EXECUTIVE:
            raise serializers.ValidationError("Managers can only add sales executives.")
        if current_user.role == User.Role.MANAGER and organization != current_user.organization:
            raise serializers.ValidationError("Managers can only add users in their organization.")

        if current_user.role == User.Role.ADMIN and role == User.Role.ADMIN and organization:
            supplied = attrs.get("organization_password", "")
            if organization.access_password and supplied != organization.access_password:
                raise serializers.ValidationError({"organization_password": "Organization password is required to add another admin."})

        attrs["organization"] = organization
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        validated_data.pop("organization_password", None)
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
