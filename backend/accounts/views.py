from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User
from .serializers import UserCreateSerializer, UserSerializer


class LoginView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        serializer = TokenObtainPairSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.user
        if not user.is_active:
            raise serializers.ValidationError("This account is inactive.")
        return Response({
            "access": serializer.validated_data["access"],
            "refresh": serializer.validated_data["refresh"],
            "user": UserSerializer(user).data,
        })


class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)


class UserViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_serializer_class(self):
        if self.action == "create":
            return UserCreateSerializer
        return UserSerializer

    def get_queryset(self):
        user = self.request.user
        qs = User.objects.select_related("organization").filter(is_active=True)
        if user.organization_id:
            qs = qs.filter(organization=user.organization)
        if user.role == User.Role.MANAGER:
            qs = qs.filter(role__in=[User.Role.MANAGER, User.Role.EXECUTIVE])
        return qs.order_by("role", "email")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        target = self.get_object()
        if not request.user.can_manage:
            return Response({"detail": "Only admins and managers can update team members."}, status=status.HTTP_403_FORBIDDEN)
        if request.user.role == User.Role.MANAGER and target.role != User.Role.EXECUTIVE:
            return Response({"detail": "Managers can only update sales executives."}, status=status.HTTP_403_FORBIDDEN)
        allowed = {"first_name", "last_name", "team_visibility", "city_coverage", "is_active"}
        if request.user.role == User.Role.ADMIN:
            allowed.add("role")
        payload = {key: value for key, value in request.data.items() if key in allowed}
        serializer = UserSerializer(target, data=payload, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
