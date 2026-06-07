from django.contrib import admin

from .models import Lead, LeadSource, LostReason

admin.site.register(Lead)
admin.site.register(LeadSource)
admin.site.register(LostReason)

