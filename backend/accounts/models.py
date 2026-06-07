from django.contrib.auth.models import AbstractUser
from django.db import models


class Organization(models.Model):
    name = models.CharField(max_length=120, unique=True)
    access_password = models.CharField(max_length=120)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        MANAGER = "manager", "Sales Manager"
        EXECUTIVE = "executive", "Sales Executive"
        VIEWER = "viewer", "Viewer"

    email = models.EmailField(unique=True)
    organization = models.ForeignKey(Organization, on_delete=models.PROTECT, null=True, blank=True, related_name="users")
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.EXECUTIVE)
    team_visibility = models.BooleanField(default=False)
    city_coverage = models.CharField(max_length=255, blank=True, help_text="Comma-separated cities this user can handle.")

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    @property
    def can_manage(self):
        return self.role in {self.Role.ADMIN, self.Role.MANAGER}

    @property
    def is_viewer(self):
        return self.role == self.Role.VIEWER
