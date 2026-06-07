from django.contrib import admin

from .models import EmailMessage, Notification, WhatsAppCopy

admin.site.register(EmailMessage)
admin.site.register(WhatsAppCopy)
admin.site.register(Notification)
