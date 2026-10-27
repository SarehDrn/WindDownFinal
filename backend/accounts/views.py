from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import AuthResponseSerializer, LoginSerializer, RegisterSerializer


def auth_response(user, status_code):
    token, _ = Token.objects.get_or_create(user=user)
    return Response({"token": token.key, "email": user.email}, status=status_code)


class RegisterView(APIView):
    """Sign up with email and password. Returns an auth token."""

    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(request=RegisterSerializer, responses={201: AuthResponseSerializer})
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return auth_response(user, status.HTTP_201_CREATED)


class LoginView(APIView):
    """Log in with email and password. Returns an auth token."""

    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(request=LoginSerializer, responses={200: AuthResponseSerializer})
    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        return auth_response(serializer.validated_data["user"], status.HTTP_200_OK)


class LogoutView(APIView):
    """Log out: deletes the caller's token so it can no longer be used."""

    permission_classes = [IsAuthenticated]

    @extend_schema(request=None, responses={204: None})
    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
