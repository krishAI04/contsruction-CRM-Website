from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import IsNotViewerForWrite
from .models import EmailMessage
from .serializers import EmailMessageSerializer
from .services import EmailService


class EmailMessageViewSet(viewsets.ModelViewSet):
    serializer_class = EmailMessageSerializer
    permission_classes = [IsNotViewerForWrite]

    def get_queryset(self):
        qs = EmailMessage.objects.select_related("lead", "created_by")
        lead_id = self.request.query_params.get("lead")
        if lead_id:
            qs = qs.filter(lead_id=lead_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"], url_path="queue")
    def queue(self, request, pk=None):
        email_message = EmailService.queue_email(self.get_object(), request.user)
        return Response(EmailMessageSerializer(email_message).data)

    @action(detail=True, methods=["post"], url_path="send")
    def send(self, request, pk=None):
        email_message = EmailService.send_queued_email(self.get_object(), request.user)
        return Response(EmailMessageSerializer(email_message).data)

