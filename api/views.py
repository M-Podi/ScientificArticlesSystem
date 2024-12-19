from django.db import IntegrityError
from django.db.models import Q
from rest_framework import viewsets, permissions, generics
from django.db.models import Min

from . import models
from .models import ScientificDomain, Article, UserArticle, UserFieldProgress, Review
from .permissions import CanAccessArticle
from .serializers import (
    ScientificDomainSerializer, ArticleSerializer,
    UserArticleSerializer, UserSerializer, RegisterSerializer, ReviewSerializer, StoreArticleSerializer
)
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User

# Existing Views
class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({"message": "User created successfully"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# New ViewSets

class ScientificDomainViewSet(viewsets.ModelViewSet):
    queryset = ScientificDomain.objects.all()
    serializer_class = ScientificDomainSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.select_related('scientific_domain').all()
    serializer_class = ArticleSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, CanAccessArticle]

    def get_permissions(self):
        if self.action in ['retrieve']:
            self.permission_classes = [permissions.IsAuthenticated, CanAccessArticle]
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [permissions.IsAdminUser]
        else:
            self.permission_classes = [permissions.IsAuthenticatedOrReadOnly]
        return super(ArticleViewSet, self).get_permissions()

    def get_queryset(self):
        """
        Override the default queryset to filter articles based on the user's active interests
        and their current points in those corresponding scientific domains.
        """
        queryset = super().get_queryset()
        user = self.request.user

        if user.is_authenticated:
            # Retrieve only active UserFieldProgress entries
            active_progress = UserFieldProgress.objects.filter(
                user_profile=user.profile,
                active=True
            ).select_related('scientific_domain')

            if not active_progress.exists():
                # If no active progress, return no articles
                return Article.objects.none()

            # Create a mapping of domain_id to current_points
            domain_points_map = {
                progress.scientific_domain_id: progress.current_points
                for progress in active_progress
            }

            # Build Q conditions based on active domains and points
            q_conditions = Q()
            for domain_id, current_points in domain_points_map.items():
                q_conditions |= (
                    Q(scientific_domain_id=domain_id) &
                    (
                        Q(minimum_points__lte=current_points) |
                        Q(minimum_points__isnull=True)
                    )
                )

            # Filter the queryset based on the Q conditions
            queryset = queryset.filter(q_conditions)

        return queryset
#
class UserArticleViewSet(viewsets.ModelViewSet):
    serializer_class = UserArticleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserArticle.objects.filter(user=self.request.user)

    def get_serializer_context(self):
        context = super(UserArticleViewSet, self).get_serializer_context()
        context.update({"request": self.request})
        return context

    def create(self, request, *args, **kwargs):
        article = request.data.get('article')
        if UserArticle.objects.filter(article=article).exists():
            instance = UserArticle.objects.get(article=article)
            serializer = self.get_serializer(instance)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # Otherwise, create a new resource
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Review.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class StoreArticleListView(generics.ListAPIView):
    serializer_class = StoreArticleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        user_progress = UserFieldProgress.objects.filter(user_profile=user.profile, active=True)

        q_conditions = Q()
        for progress in user_progress:
            q_conditions |= Q(
                scientific_domain=progress.scientific_domain,
                minimum_points__gt=progress.current_points
            )

        return Article.objects.filter(q_conditions).distinct()