from django.conf import settings
from django.db import models


class Client(models.Model):
    lead = models.OneToOneField("leads.Lead", on_delete=models.PROTECT, related_name="client")
    name = models.CharField(max_length=120)
    phone = models.CharField(max_length=30)
    email = models.EmailField(blank=True)
    project_value = models.DecimalField(max_digits=12, decimal_places=2)
    project_type = models.CharField(max_length=30)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return self.name

