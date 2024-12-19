# permissions.py

from rest_framework import permissions
from .models import UserFieldProgress

class CanAccessArticle(permissions.BasePermission):
    """
    Custom permission to allow access only if the user has enough points in the scientific domain
    and the UserFieldProgress is active.
    """

    def has_object_permission(self, request, view, obj):
        # obj here is an Article instance
        user = request.user
        if not user.is_authenticated:
            return False

        try:
            progress = UserFieldProgress.active_objects.get(
                user_profile=user.profile,
                scientific_domain=obj.scientific_domain
            )
            if obj.minimum_points is not None:
                return progress.current_points >= obj.minimum_points
            return True  # No minimum points required
        except UserFieldProgress.DoesNotExist:
            return False  # No active progress in the scientific domain



