from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from activities.models import Activity


class EmailService:
    @staticmethod
    def queue_email(email_message, user):
        email_message.status = email_message.Status.QUEUED
        email_message.save(update_fields=["status", "updated_at"])
        Activity.objects.create(
            lead=email_message.lead,
            type=Activity.Type.EMAIL,
            description=f"Email queued to {email_message.recipient}.",
            created_by=user,
        )
        return email_message

    @staticmethod
    def send_queued_email(email_message, user):
        if settings.EMAIL_MODE != "smtp":
            email_message.status = email_message.Status.SENT
            email_message.error_message = ""
            email_message.sent_at = timezone.now()
            email_message.save(update_fields=["status", "error_message", "sent_at", "updated_at"])
            Activity.objects.create(
                lead=email_message.lead,
                type=Activity.Type.EMAIL,
                description=f"Mock email sent to {email_message.recipient}.",
                metadata={"mode": "mock"},
                created_by=user,
            )
            return email_message
        try:
            send_mail(
                subject=email_message.subject,
                message=email_message.body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email_message.recipient],
                fail_silently=False,
            )
            email_message.status = email_message.Status.SENT
            email_message.error_message = ""
            email_message.sent_at = timezone.now()
        except Exception as exc:
            email_message.status = email_message.Status.FAILED
            email_message.error_message = str(exc)
        email_message.save(update_fields=["status", "error_message", "sent_at", "updated_at"])
        Activity.objects.create(
            lead=email_message.lead,
            type=Activity.Type.EMAIL,
            description=f"Email status: {email_message.status}.",
            created_by=user,
        )
        return email_message

