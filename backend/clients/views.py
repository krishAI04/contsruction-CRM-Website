from rest_framework import viewsets

from .models import Client
from .serializers import ClientSerializer


class ClientViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ClientSerializer

    def get_queryset(self):
        return Client.objects.select_related("lead", "created_by")

