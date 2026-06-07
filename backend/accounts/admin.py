from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Organization, User


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ("name", "is_active", "created_at")
    search_fields = ("name",)


@admin.register(User)
class BuildFlowUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ("BuildFlow", {"fields": ("organization", "role", "team_visibility", "city_coverage")}),
    )
    list_display = ("email", "username", "organization", "role", "city_coverage", "is_active", "is_staff")
    list_filter = ("organization", "role", "is_active", "is_staff")
