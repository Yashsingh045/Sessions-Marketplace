from rest_framework.permissions import SAFE_METHODS, BasePermission

from accounts.models import User


class IsCreatorOrReadOnly(BasePermission):
    """Anyone may read. Only authenticated CREATORs may create. Edits/deletes
    are further restricted to the session's owner via has_object_permission."""

    message = "Only creators can manage sessions."

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == User.Role.CREATOR
        )

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return obj.creator_id == request.user.id


class IsCreatorRole(BasePermission):
    """Hard gate: the requester must be an authenticated CREATOR."""

    message = "Only creators can access this resource."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == User.Role.CREATOR
        )
