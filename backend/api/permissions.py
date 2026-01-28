from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    """
    Permission class to check if user is an admin
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'admin'


class IsDoctorUser(permissions.BasePermission):
    """
    Permission class to check if user is a doctor
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'doctor'


class IsNurseUser(permissions.BasePermission):
    """
    Permission class to check if user is a nurse
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'nurse'


class IsStaffUser(permissions.BasePermission):
    """
    Permission class to check if user is staff
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'staff'


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Admin can do anything, others can only read
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_authenticated and request.user.role == 'admin'


class IsAdminOrDoctor(permissions.BasePermission):
    """
    Permission for admin or doctor users
    """
    def has_permission(self, request, view):
        return (request.user and request.user.is_authenticated and
                request.user.role in ['admin', 'doctor'])


class IsAdminOrNurse(permissions.BasePermission):
    """
    Permission for admin or nurse users
    """
    def has_permission(self, request, view):
        return (request.user and request.user.is_authenticated and
                request.user.role in ['admin', 'nurse'])


class IsAdminDoctorOrNurse(permissions.BasePermission):
    """
    Permission for admin, doctor, or nurse users
    """
    def has_permission(self, request, view):
        return (request.user and request.user.is_authenticated and
                request.user.role in ['admin', 'doctor', 'nurse'])
