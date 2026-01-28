from django.http import JsonResponse
from django.contrib.auth import authenticate
from django.utils import timezone
from django.db import models
from django.db import IntegrityError
from rest_framework import viewsets, status, generics, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import (
    User, Patient, Doctor, Nurse, Appointment, Admission, Payment,
    PredictionRecord, Procedure, Room, Schedule, ShiftSwapRequest,
    UnavailabilityRequest, PharmacyStaff, Medicine, Prescription, PrescriptionItem
)
from .serializers import (
    UserSerializer, PatientSerializer, DoctorSerializer, NurseSerializer,
    AppointmentSerializer, AdmissionSerializer, PaymentSerializer, PredictionRecordSerializer,
    ProcedureSerializer, RoomSerializer, ScheduleSerializer, UserRegistrationSerializer, PasswordChangeSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer, ShiftSwapRequestSerializer, UnavailabilityRequestSerializer,
    PharmacyStaffSerializer, MedicineSerializer, PrescriptionSerializer, PrescriptionItemSerializer, PrescriptionCreateSerializer
)
from .permissions import (
    IsAdminUser, IsAdminOrReadOnly, IsAdminOrDoctor, IsAdminOrNurse, IsAdminDoctorOrNurse
)


# -------------------------------
# Authentication Views
# -------------------------------

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT token serializer to include user data"""
    def validate(self, attrs):
        data = super().validate(attrs)
        # Add user data to response
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'role': self.user.role,
        }
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom login view that returns JWT tokens and user data"""
    serializer_class = CustomTokenObtainPairSerializer


class UserRegistrationView(generics.CreateAPIView):
    """
    User registration endpoint
    POST /api/auth/register/
    Body: {username, email, password, password_confirm, first_name, last_name, role}
    """
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = UserRegistrationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate tokens for the new user
        refresh = RefreshToken.for_user(user)

        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
            },
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'message': 'User registered successfully'
        }, status=status.HTTP_201_CREATED)


class LogoutView(APIView):
    """
    Logout endpoint - blacklists the refresh token
    POST /api/auth/logout/
    Body: {refresh_token}
    """
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh_token")
            if not refresh_token:
                return Response(
                    {"error": "Refresh token is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            token = RefreshToken(refresh_token)
            token.blacklist()

            return Response(
                {"message": "Successfully logged out"},
                status=status.HTTP_205_RESET_CONTENT
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class PasswordChangeView(APIView):
    """
    Change password for authenticated user
    POST /api/auth/change-password/
    Body: {old_password, new_password, new_password_confirm}
    """
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user

            # Check old password
            if not user.check_password(serializer.validated_data['old_password']):
                return Response(
                    {"old_password": ["Wrong password."]},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Set new password
            user.set_password(serializer.validated_data['new_password'])
            user.save()

            return Response(
                {"message": "Password changed successfully"},
                status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetRequestView(APIView):
    """
    Request password reset (simplified version - sends reset token)
    POST /api/auth/password-reset/
    Body: {email}
    """
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            try:
                user = User.objects.get(email=email)
                # In production, send email with reset link
                # For now, we'll just return success
                # You can generate a token and send via email
                from django.contrib.auth.tokens import default_token_generator
                token = default_token_generator.make_token(user)

                # TODO: Send email with token
                # For now, return token in response (NOT for production)
                return Response({
                    "message": "Password reset instructions sent to email",
                    "user_id": user.id,
                    "token": token  # Remove in production
                }, status=status.HTTP_200_OK)
            except User.DoesNotExist:
                # Don't reveal if user exists
                return Response({
                    "message": "If an account exists with this email, you will receive password reset instructions."
                }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetConfirmView(APIView):
    """
    Confirm password reset with token
    POST /api/auth/password-reset-confirm/
    Body: {user_id, token, new_password, new_password_confirm}
    """
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            user_id = request.data.get('user_id')
            token = request.data.get('token')

            try:
                user = User.objects.get(id=user_id)
                from django.contrib.auth.tokens import default_token_generator

                if default_token_generator.check_token(user, token):
                    user.set_password(serializer.validated_data['new_password'])
                    user.save()
                    return Response({
                        "message": "Password has been reset successfully"
                    }, status=status.HTTP_200_OK)
                else:
                    return Response({
                        "error": "Invalid or expired token"
                    }, status=status.HTTP_400_BAD_REQUEST)
            except User.DoesNotExist:
                return Response({
                    "error": "Invalid user"
                }, status=status.HTTP_400_BAD_REQUEST)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CurrentUserView(APIView):
    """
    Get current authenticated user details
    GET /api/auth/me/
    """
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


# -------------------------------
# ViewSets for CRUD operations
# -------------------------------
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]


class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [IsAdminDoctorOrNurse]

    def get_queryset(self):
        """
        Allow filtering and searching patients
        Examples:
        /api/patients/?search=john
        /api/patients/?insurance_status=true
        /api/patients/?handicapped=true
        /api/patients/?gender=male
        /api/patients/?age_min=18&age_max=65
        /api/patients/?archived=true  (to view archived patients)
        """
        # Check if requesting archived patients
        show_archived = self.request.query_params.get('archived', 'false')
        if show_archived.lower() in ['true', '1']:
            queryset = Patient.objects.filter(is_archived=True)
        else:
            # Default: show only non-archived patients
            queryset = Patient.objects.filter(is_archived=False)

        # Search by name, contact, or NHS number
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                models.Q(name__icontains=search) |
                models.Q(contact__icontains=search) |
                models.Q(nhs_number__icontains=search)
            )

        # Filter by insurance status
        insurance_status = self.request.query_params.get('insurance_status', None)
        if insurance_status is not None:
            if insurance_status.lower() in ['true', '1']:
                queryset = queryset.filter(insurance_status=True)
            elif insurance_status.lower() in ['false', '0']:
                queryset = queryset.filter(insurance_status=False)

        # Filter by handicapped status
        handicapped = self.request.query_params.get('handicapped', None)
        if handicapped is not None:
            if handicapped.lower() in ['true', '1']:
                queryset = queryset.filter(handicapped=True)
            elif handicapped.lower() in ['false', '0']:
                queryset = queryset.filter(handicapped=False)

        # Filter by gender
        gender = self.request.query_params.get('gender', None)
        if gender:
            queryset = queryset.filter(gender=gender)

        # Filter by age range
        age_min = self.request.query_params.get('age_min', None)
        age_max = self.request.query_params.get('age_max', None)
        if age_min:
            queryset = queryset.filter(age__gte=age_min)
        if age_max:
            queryset = queryset.filter(age__lte=age_max)

        return queryset

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """
        Archive a patient (soft delete)
        POST /api/patients/{id}/archive/
        """
        patient = self.get_object()
        patient.is_archived = True
        patient.save()
        return Response({
            'status': 'success',
            'message': f'Patient {patient.name} has been moved to archive'
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """
        Restore an archived patient
        POST /api/patients/{id}/restore/
        """
        # Get patient directly without queryset filter (archived patients are filtered out by default)
        try:
            patient = Patient.objects.get(pk=pk)
        except Patient.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Patient not found'
            }, status=status.HTTP_404_NOT_FOUND)

        patient.is_archived = False
        patient.save()
        return Response({
            'status': 'success',
            'message': f'Patient {patient.name} has been restored from archive'
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='admittable')
    def admittable(self, request):
        """
        Get patients who can be admitted (not currently in hospital)
        GET /api/patients/admittable/
        Returns patients who don't have an active admission (pending or admitted status)
        """
        # Get patient IDs with active admissions (currently in hospital)
        active_admission_patient_ids = Admission.objects.filter(
            status__in=['pending', 'admitted']
        ).values_list('patient_id', flat=True).distinct()

        # Get patients who are NOT currently in hospital
        admittable_patients = Patient.objects.filter(
            is_archived=False
        ).exclude(
            id__in=active_admission_patient_ids
        )

        serializer = self.get_serializer(admittable_patients, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='appointable')
    def appointable(self, request):
        """
        Get patients who can have appointments (currently admitted patients only)
        GET /api/patients/appointable/
        Returns patients with admission status 'pending' or 'admitted'
        """
        # Get patient IDs with active admissions (currently in hospital)
        active_admission_patient_ids = Admission.objects.filter(
            status__in=['pending', 'admitted']
        ).values_list('patient_id', flat=True).distinct()

        # Get only patients who ARE currently in hospital
        appointable_patients = Patient.objects.filter(
            is_archived=False,
            id__in=active_admission_patient_ids
        )

        serializer = self.get_serializer(appointable_patients, many=True)
        return Response(serializer.data)


class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    permission_classes = [IsAdminOrReadOnly]

    def create(self, request, *args, **kwargs):
        """
        Create both User and Doctor in one transaction
        Body: {
            "username": "doctor1",
            "password": "password123",
            "first_name": "John",
            "last_name": "Doe",
            "email": "john@example.com",
            "specialty": "Cardiology"
        }
        """
        from django.db import transaction

        # Extract user fields and doctor fields
        user_data = {
            'username': request.data.get('username'),
            'password': request.data.get('password'),
            'first_name': request.data.get('first_name'),
            'last_name': request.data.get('last_name'),
            'email': request.data.get('email'),
            'role': 'doctor'
        }
        specialty = request.data.get('specialty')

        # Validate required fields
        if not specialty:
            return Response(
                {'error': 'Specialty is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if username already exists
        existing_user = User.objects.filter(username=user_data['username']).first()
        if existing_user:
            # Check if this user has a doctor profile
            if hasattr(existing_user, 'doctor'):
                return Response(
                    {'error': 'Username already exists'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            else:
                # Orphaned user - delete it and create fresh
                print(f"Deleting orphaned user {existing_user.id}: {existing_user.username}")
                existing_user.delete()

        # Create user first
        user_serializer = UserSerializer(data=user_data)
        if not user_serializer.is_valid():
            return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = user_serializer.save()

        # Try to create doctor profile - if fails, delete the user
        try:
            doctor = Doctor.objects.create(user=user, specialty=specialty)

            # Send credentials email
            from .email_utils import send_credentials_email
            send_credentials_email(
                user_email=user.email,
                username=user.username,
                password=user_data['password'],
                role='doctor'
            )

            # Return doctor with nested user data
            doctor_serializer = DoctorSerializer(doctor)
            return Response(doctor_serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            # Doctor creation failed - delete the user to avoid orphan
            user.delete()

            import traceback
            print("Exception:", str(e))
            print(traceback.format_exc())

            return Response(
                {'error': f'Failed to create doctor: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

    def get_queryset(self):
        """Filter out archived doctors by default, unless archived=true parameter"""
        show_archived = self.request.query_params.get('archived', 'false')
        if show_archived.lower() in ['true', '1']:
            return Doctor.objects.filter(is_archived=True)
        return Doctor.objects.filter(is_archived=False)

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """Archive a doctor (soft delete)"""
        doctor = self.get_object()
        doctor.is_archived = True
        doctor.save()
        return Response({
            'status': 'success',
            'message': f'Doctor {doctor.user.username} has been moved to archive'
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """Restore an archived doctor"""
        try:
            doctor = Doctor.objects.get(pk=pk)
        except Doctor.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Doctor not found'
            }, status=status.HTTP_404_NOT_FOUND)

        doctor.is_archived = False
        doctor.save()
        return Response({
            'status': 'success',
            'message': f'Doctor {doctor.user.username} has been restored from archive'
        }, status=status.HTTP_200_OK)


class NurseViewSet(viewsets.ModelViewSet):
    queryset = Nurse.objects.all()
    serializer_class = NurseSerializer
    permission_classes = [IsAdminOrReadOnly]

    def create(self, request, *args, **kwargs):
        """
        Create both User and Nurse in one transaction
        Body: {
            "username": "nurse1",
            "password": "password123",
            "first_name": "Jane",
            "last_name": "Doe",
            "email": "jane@example.com",
            "department": "Emergency"
        }
        """
        from django.db import transaction

        # Extract user fields and nurse fields
        user_data = {
            'username': request.data.get('username'),
            'password': request.data.get('password'),
            'first_name': request.data.get('first_name'),
            'last_name': request.data.get('last_name'),
            'email': request.data.get('email'),
            'role': 'nurse'
        }
        department = request.data.get('department')

        # Validate required fields
        if not department:
            return Response(
                {'error': 'Department is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if username already exists
        existing_user = User.objects.filter(username=user_data['username']).first()
        if existing_user:
            # Check if this user has a nurse profile
            if hasattr(existing_user, 'nurse'):
                return Response(
                    {'error': 'Username already exists'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            else:
                # Orphaned user - delete it and create fresh
                print(f"Deleting orphaned user {existing_user.id}: {existing_user.username}")
                existing_user.delete()

        try:
            with transaction.atomic():
                # Create user first
                user_serializer = UserSerializer(data=user_data)
                if not user_serializer.is_valid():
                    return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

                user = user_serializer.save()

                # Create nurse profile immediately
                nurse = Nurse.objects.create(user=user, department=department)

                # Send credentials email
                from .email_utils import send_credentials_email
                send_credentials_email(
                    user_email=user.email,
                    username=user.username,
                    password=user_data['password'],
                    role='nurse'
                )

                # Return nurse with nested user data
                nurse_serializer = NurseSerializer(nurse)
                return Response(nurse_serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            import traceback
            print("Exception:", str(e))
            print(traceback.format_exc())

            return Response(
                {'error': f'Failed to create nurse: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

    def get_queryset(self):
        """Filter out archived nurses by default, unless archived=true parameter"""
        show_archived = self.request.query_params.get('archived', 'false')
        if show_archived.lower() in ['true', '1']:
            return Nurse.objects.filter(is_archived=True)
        return Nurse.objects.filter(is_archived=False)

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """Archive a nurse (soft delete)"""
        nurse = self.get_object()
        nurse.is_archived = True
        nurse.save()
        return Response({
            'status': 'success',
            'message': f'Nurse {nurse.user.username} has been moved to archive'
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """Restore an archived nurse"""
        try:
            nurse = Nurse.objects.get(pk=pk)
        except Nurse.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Nurse not found'
            }, status=status.HTTP_404_NOT_FOUND)

        nurse.is_archived = False
        nurse.save()
        return Response({
            'status': 'success',
            'message': f'Nurse {nurse.user.username} has been restored from archive'
        }, status=status.HTTP_200_OK)


class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    permission_classes = [IsAdminDoctorOrNurse]

    @action(detail=True, methods=['post'], url_path='mark-completed')
    def mark_completed(self, request, pk=None):
        """
        Mark an appointment as completed
        POST /api/appointments/{id}/mark-completed/
        """
        appointment = self.get_object()
        appointment.mark_as_completed()
        serializer = self.get_serializer(appointment)
        return Response({
            'success': True,
            'message': 'Appointment marked as completed',
            'appointment': serializer.data
        })

    @action(detail=True, methods=['post'], url_path='mark-no-show')
    def mark_no_show(self, request, pk=None):
        """
        Mark an appointment as no-show (patient didn't attend)
        POST /api/appointments/{id}/mark-no-show/
        """
        appointment = self.get_object()
        appointment.status = 'no_show'
        appointment.save()
        serializer = self.get_serializer(appointment)
        return Response({
            'success': True,
            'message': 'Appointment marked as no-show',
            'appointment': serializer.data
        })

    @action(detail=False, methods=['get'], url_path='active')
    def active_appointments(self, request):
        """
        Get all active (non-completed) appointments
        GET /api/appointments/active/
        """
        active = self.queryset.exclude(status__in=['completed', 'cancelled', 'no_show'])
        serializer = self.get_serializer(active, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='completed')
    def completed_appointments(self, request):
        """
        Get all completed appointments (archive) - includes completed and no-show
        GET /api/appointments/completed/
        """
        completed = self.queryset.filter(status__in=['completed', 'no_show'])
        serializer = self.get_serializer(completed, many=True)
        return Response(serializer.data)


class AdmissionViewSet(viewsets.ModelViewSet):
    queryset = Admission.objects.all()
    serializer_class = AdmissionSerializer
    permission_classes = [IsAdminDoctorOrNurse]

    @action(detail=True, methods=['post'])
    def assign_room(self, request, pk=None):
        """
        Assign a room to an admission
        POST /api/admissions/{id}/assign_room/
        Body: {"room_id": 1}
        """
        admission = self.get_object()
        room_id = request.data.get('room_id')

        if not room_id:
            return Response(
                {'status': 'error', 'message': 'room_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            room = Room.objects.get(pk=room_id)
        except Room.DoesNotExist:
            return Response(
                {'status': 'error', 'message': 'Room not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if room has space
        if not room.has_space():
            return Response(
                {'status': 'error', 'message': f'Room {room.room_number} is full ({room.occupied_beds}/{room.bed_capacity} beds occupied)'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Release old room if exists and was occupied
        if admission.room and admission.status == 'admitted':
            admission.room.release_bed()

        # Assign new room
        admission.room = room

        # Occupy bed if status is admitted
        if admission.status == 'admitted':
            room.occupy_bed()

        admission.save()

        return Response({
            'status': 'success',
            'message': f'Room {room.room_number} assigned to admission',
            'admission': AdmissionSerializer(admission).data
        }, status=status.HTTP_200_OK)


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAdminUser]


class PredictionRecordViewSet(viewsets.ModelViewSet):
    queryset = PredictionRecord.objects.all()
    serializer_class = PredictionRecordSerializer
    permission_classes = [IsAdminDoctorOrNurse]


class ProcedureViewSet(viewsets.ModelViewSet):
    queryset = Procedure.objects.all()
    serializer_class = ProcedureSerializer
    permission_classes = [IsAdminOrReadOnly]


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    permission_classes = [IsAdminDoctorOrNurse]

    def get_queryset(self):
        """
        Filter rooms by availability
        GET /api/rooms/?available=true - returns only rooms with free beds
        GET /api/rooms/ - returns all rooms
        """
        queryset = Room.objects.all()

        available = self.request.query_params.get('available', None)
        if available and available.lower() in ['true', '1']:
            # Only return rooms that have space
            queryset = queryset.filter(occupied_beds__lt=models.F('bed_capacity'))

        return queryset


class ScheduleViewSet(viewsets.ModelViewSet):
    queryset = Schedule.objects.all()
    serializer_class = ScheduleSerializer
    permission_classes = [IsAdminDoctorOrNurse]

    def get_queryset(self):
        """
        Allow filtering by user, date range, and availability
        Examples:
        /api/schedules/?user=1
        /api/schedules/?date=2025-10-13
        /api/schedules/?start_date=2025-10-01&end_date=2025-10-31
        /api/schedules/?is_available=true
        """
        queryset = Schedule.objects.all()

        # Filter by user (doctor or nurse)
        user_id = self.request.query_params.get('user', None)
        if user_id:
            queryset = queryset.filter(user__id=user_id)

        # Filter by specific date
        date = self.request.query_params.get('date', None)
        if date:
            queryset = queryset.filter(date=date)

        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        if start_date and end_date:
            queryset = queryset.filter(date__range=[start_date, end_date])
        elif start_date:
            queryset = queryset.filter(date__gte=start_date)
        elif end_date:
            queryset = queryset.filter(date__lte=end_date)

        # Filter by availability
        is_available = self.request.query_params.get('is_available', None)
        if is_available is not None:
            if is_available.lower() in ['true', '1']:
                queryset = queryset.filter(is_available=True)
            elif is_available.lower() in ['false', '0']:
                queryset = queryset.filter(is_available=False)

        return queryset


# -------------------------------
# Legacy login endpoint (kept for backward compatibility - consider removing)
# Use /api/auth/login/ instead
# -------------------------------
@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    """
    DEPRECATED: Use /api/auth/login/ instead
    Legacy login endpoint - returns user data without tokens
    """
    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(username=username, password=password)

    if user is not None:
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        return JsonResponse({
            'user': {
                'id': user.id,
                'username': user.username,
                'role': user.role,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
            },
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })
    else:
        return JsonResponse({'error': 'Invalid credentials'}, status=401)


# -------------------------------
# Dashboard Stats endpoint
# -------------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """
    Return dashboard statistics
    """
    stats = {
        'total_patients': Patient.objects.count(),
        'total_doctors': Doctor.objects.count(),
        'total_nurses': Nurse.objects.count(),
        'active_admissions': Admission.objects.filter(status='admitted').count(),
        'today_appointments': Appointment.objects.filter(
            appointment_date__date=timezone.now().date()
        ).count(),
        'total_payments': Payment.objects.count(),
        'high_risk_patients': PredictionRecord.objects.filter(risk_level=1).values('patient').distinct().count(),
    }
    return JsonResponse(stats)


# -------------------------------
# Patient Statistics endpoint
# -------------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def patient_stats(request):
    """
    Return patient registry statistics
    """
    # Get currently admitted patients
    currently_admitted = Admission.objects.filter(
        status='admitted'
    ).values_list('patient_id', flat=True).distinct()

    # Get high-risk patients (latest prediction)
    high_risk_patients = PredictionRecord.objects.filter(
        risk_level=1
    ).values('patient').distinct().count()

    # Get patients with recent predictions (last 30 days)
    from datetime import timedelta
    thirty_days_ago = timezone.now() - timedelta(days=30)
    recent_predictions = PredictionRecord.objects.filter(
        prediction_date__gte=thirty_days_ago
    ).values('patient').distinct().count()

    stats = {
        'total_patients': Patient.objects.filter(is_archived=False).count(),
        'currently_admitted': len(currently_admitted),
        'outpatients': Patient.objects.filter(is_archived=False).exclude(id__in=currently_admitted).count(),
        'insured_patients': Patient.objects.filter(is_archived=False, insurance_status=True).count(),
        'handicapped_patients': Patient.objects.filter(is_archived=False, handicapped=True).count(),
        'high_risk_patients': high_risk_patients,
        'recent_predictions': recent_predictions,
        'archived_patients': Patient.objects.filter(is_archived=True).count(),
    }
    return JsonResponse(stats)


# -------------------------------
# Payment Calculation endpoint
# -------------------------------
@api_view(['POST'])
def create_payment_with_calculation(request):
    """
    Create payment with automatic calculation
    Body for INPATIENT: {
        "patient_id": 1,
        "payment_type": "inpatient",
        "admission_id": 1,
        "procedure_ids": [1, 2, 3],
        "method": "Cash"
    }
    Body for OUTPATIENT: {
        "patient_id": 1,
        "payment_type": "outpatient",
        "appointment_ids": [1, 2, 3],
        "procedure_ids": [1, 2],
        "method": "Card"
    }
    """
    try:
        from .payment_calculator import calculate_payment

        patient_id = request.data.get('patient_id')
        payment_type = request.data.get('payment_type', 'inpatient')
        admission_id = request.data.get('admission_id')
        appointment_ids = request.data.get('appointment_ids', [])
        procedure_ids = request.data.get('procedure_ids', [])
        method = request.data.get('method', 'Cash')

        # Get patient
        patient = Patient.objects.get(id=patient_id)

        # Initialize variables
        admission = None
        appointments = []
        procedures = []

        if payment_type == 'inpatient':
            # Inpatient payment requires admission
            if not admission_id:
                return JsonResponse({'error': 'admission_id is required for inpatient payment'}, status=400)
            admission = Admission.objects.get(id=admission_id)

            # Get procedures: from procedure_ids or from admission
            if procedure_ids:
                procedures = Procedure.objects.filter(id__in=procedure_ids)
            else:
                procedures = admission.procedures.all()

            # Calculate payment
            calc = calculate_payment(
                patient=patient,
                payment_type='inpatient',
                admission=admission,
                selected_procedures=procedures
            )

            # Create payment record
            payment = Payment.objects.create(
                patient=patient,
                payment_type='inpatient',
                admission=admission,
                procedure_cost=calc['procedure_cost'],
                daily_care_cost=calc['daily_care_cost'],
                total_before_discount=calc['total_before_discount'],
                discount_percent=calc['discount_percent'],
                final_amount=calc['final_amount'],
                method=method,
            )

        else:  # outpatient
            # Outpatient payment requires appointments
            if not appointment_ids:
                return JsonResponse({'error': 'appointment_ids is required for outpatient payment'}, status=400)
            appointments = Appointment.objects.filter(id__in=appointment_ids)

            # Collect procedures from appointments and procedure_ids
            appointment_procedures = set()
            for appointment in appointments:
                appointment_procedures.update(appointment.procedures.all())

            if procedure_ids:
                procedures = Procedure.objects.filter(id__in=procedure_ids)
            else:
                procedures = list(appointment_procedures)

            # Calculate payment
            calc = calculate_payment(
                patient=patient,
                payment_type='outpatient',
                appointments=appointments,
                selected_procedures=procedures
            )

            # Create payment record
            payment = Payment.objects.create(
                patient=patient,
                payment_type='outpatient',
                procedure_cost=calc['procedure_cost'],
                daily_care_cost=calc['daily_care_cost'],
                total_before_discount=calc['total_before_discount'],
                discount_percent=calc['discount_percent'],
                final_amount=calc['final_amount'],
                method=method,
            )

            # Link appointments to payment
            payment.appointments.set(appointments)

        # Add procedures to payment
        payment.procedures.set(procedures)

        return JsonResponse({
            'success': True,
            'payment_id': payment.id,
            'payment_type': payment_type,
            'calculation': {
                'procedure_cost': str(calc['procedure_cost']),
                'daily_care_cost': str(calc['daily_care_cost']),
                'medicine_cost': str(calc['medicine_cost']),
                'length_of_stay': calc['length_of_stay'],
                'total_before_discount': str(calc['total_before_discount']),
                'discount_percent': str(calc['discount_percent']),
                'final_amount': str(calc['final_amount']),
            }
        })

    except Patient.DoesNotExist:
        return JsonResponse({'error': 'Patient not found'}, status=404)
    except Admission.DoesNotExist:
        return JsonResponse({'error': 'Admission not found'}, status=404)
    except Appointment.DoesNotExist:
        return JsonResponse({'error': 'One or more appointments not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# -------------------------------
# Prediction endpoint (ML)
# -------------------------------
@api_view(['POST'])
@permission_classes([IsAdminDoctorOrNurse])
def predict_patient(request, patient_id):
    """
    Predict readmission risk for a patient and SAVE the result
    POST /api/predict/<patient_id>/
    Body: {"user_id": <doctor_or_nurse_id>}
    Returns: {"patient": "Name", "risk": 0 or 1, "saved": true}
    """
    try:
        from .ml_model import predict_readmission
        import pandas as pd
        import numpy as np
        
        # Get patient
        patient = Patient.objects.get(id=patient_id)
        
        # Get user who is making the prediction
        user_id = request.data.get('user_id')
        predicted_by = User.objects.get(id=user_id) if user_id else None
        
        # Build feature dictionary in EXACT order as training model (70 features)
        patient_data = {
            'num_lab_procedures': [patient.num_lab_procedures or 0],
            'num_medications': [patient.num_medications or 0],
            'time_in_hospital': [patient.time_in_hospital or 0],
            'number_inpatient': [patient.number_inpatient or 0],
            'num_procedures': [patient.num_procedures or 0],
            'discharge_disposition_id': [patient.discharge_disposition_id or 0],
            'number_diagnoses': [patient.number_diagnoses or 0],
            'admission_type_id': [patient.admission_type_id or 0],
            'admission_source_id': [patient.admission_source_id or 0],
            'gender_Male': [int(patient.gender_Male)],
            'number_outpatient': [patient.number_outpatient or 0],
            'number_emergency': [patient.number_emergency or 0],
            'race_Caucasian': [int(patient.race_Caucasian)],
            'age_[70-80)': [int(patient.age_70_80)],
            'age_[60-70)': [int(patient.age_60_70)],
            'insulin_Steady': [int(patient.insulin_Steady)],
            'change_No': [int(patient.change_No)],
            'age_[80-90)': [int(patient.age_80_90)],
            'insulin_No': [int(patient.insulin_No)],
            'age_[50-60)': [int(patient.age_50_60)],
            'metformin_Steady': [int(patient.metformin_Steady)],
            'metformin_No': [int(patient.metformin_No)],
            'diabetesMed_Yes': [int(patient.diabetesMed_Yes)],
            'glipizide_No': [int(patient.glipizide_No)],
            'age_[40-50)': [int(patient.age_40_50)],
            'insulin_Up': [int(patient.insulin_Up)],
            'diag_2_276': [int(patient.diag_2_276)],
            'A1Cresult_>8': [int(patient.A1Cresult_gt8)],
            'glyburide_No': [int(patient.glyburide_No)],
            'glipizide_Steady': [int(patient.glipizide_Steady)],
            'diag_3_250': [int(patient.diag_3_250)],
            'diag_1_428': [int(patient.diag_1_428)],
            'diag_2_428': [int(patient.diag_2_428)],
            'glyburide_Steady': [int(patient.glyburide_Steady)],
            'diag_3_276': [int(patient.diag_3_276)],
            'diag_2_427': [int(patient.diag_2_427)],
            'diag_3_428': [int(patient.diag_3_428)],
            'diag_3_401': [int(patient.diag_3_401)],
            'diag_3_427': [int(patient.diag_3_427)],
            'A1Cresult_Norm': [int(patient.A1Cresult_Norm)],
            'pioglitazone_No': [int(patient.pioglitazone_No)],
            'pioglitazone_Steady': [int(patient.pioglitazone_Steady)],
            'rosiglitazone_No': [int(patient.rosiglitazone_No)],
            'diag_1_414': [int(patient.diag_1_414)],
            'rosiglitazone_Steady': [int(patient.rosiglitazone_Steady)],
            'diag_2_496': [int(patient.diag_2_496)],
            'diag_3_414': [int(patient.diag_3_414)],
            'diag_3_496': [int(patient.diag_3_496)],
            'diag_2_599': [int(patient.diag_2_599)],
            'age_[30-40)': [int(patient.age_30_40)],
            'diag_1_410': [int(patient.diag_1_410)],
            'diag_2_403': [int(patient.diag_2_403)],
            'glimepiride_No': [int(patient.glimepiride_No)],
            'diag_2_250': [int(patient.diag_2_250)],
            'diag_1_486': [int(patient.diag_1_486)],
            'diag_3_585': [int(patient.diag_3_585)],
            'glimepiride_Steady': [int(patient.glimepiride_Steady)],
            'diag_3_403': [int(patient.diag_3_403)],
            'age_[90-100)': [int(patient.age_90_100)],
            'diag_1_786': [int(patient.diag_1_786)],
            'diag_3_599': [int(patient.diag_3_599)],
            'diag_1_491': [int(patient.diag_1_491)],
            'diag_1_427': [int(patient.diag_1_427)],
            'diag_2_707': [int(patient.diag_2_707)],
            'diag_1_276': [int(patient.diag_1_276)],
            'diag_2_411': [int(patient.diag_2_411)],
            'diag_1_584': [int(patient.diag_1_584)],
            'diag_2_585': [int(patient.diag_2_585)],
            'max_glu_serum_Norm': [int(patient.max_glu_serum_Norm)],
            'diag_2_425': [int(patient.diag_2_425)],
        }

        # Create DataFrame with columns in correct order
        features_df = pd.DataFrame(patient_data)
        
        # Get prediction
        risk = predict_readmission(features_df)
        
        # Convert numpy types to Python native types
        if isinstance(risk, np.generic):
            risk = risk.item()
        
        risk = int(risk)
        
        # SAVE the prediction record
        PredictionRecord.objects.create(
            patient=patient,
            predicted_by=predicted_by,
            risk_level=risk
        )
        
        return JsonResponse({
            'patient': patient.name,
            'patient_id': patient.id,
            'risk': risk,
            'saved': True
        })
        
    except Patient.DoesNotExist:
        return JsonResponse({'error': 'Patient not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': f'Prediction failed: {str(e)}'}, status=500)


# -------------------------------
# Pharmacy Module ViewSets
# -------------------------------
class PharmacyStaffViewSet(viewsets.ModelViewSet):
    queryset = PharmacyStaff.objects.all()
    serializer_class = PharmacyStaffSerializer
    permission_classes = [IsAdminOrReadOnly]

    def create(self, request, *args, **kwargs):
        """
        Create both User and PharmacyStaff in one transaction
        Body: {
            "username": "pharma1",
            "password": "password123",
            "first_name": "Mike",
            "last_name": "Smith",
            "email": "mike@example.com",
            "license_number": "PH12345",
            "shift": "morning"
        }
        """
        from django.db import transaction

        # Extract user fields and pharmacy staff fields
        user_data = {
            'username': request.data.get('username'),
            'password': request.data.get('password'),
            'first_name': request.data.get('first_name'),
            'last_name': request.data.get('last_name'),
            'email': request.data.get('email'),
            'role': 'pharmacy_staff'
        }
        license_number = request.data.get('license_number')
        shift = request.data.get('shift', 'morning')

        # Validate required fields
        if not license_number:
            return Response(
                {'error': 'License number is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if username already exists
        existing_user = User.objects.filter(username=user_data['username']).first()
        if existing_user:
            # Check if this user has a pharmacy staff profile
            if hasattr(existing_user, 'pharmacystaff'):
                return Response(
                    {'error': 'Username already exists'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            else:
                # Orphaned user - delete it and create fresh
                print(f"Deleting orphaned user {existing_user.id}: {existing_user.username}")
                existing_user.delete()

        try:
            with transaction.atomic():
                # Create user first
                user_serializer = UserSerializer(data=user_data)
                if not user_serializer.is_valid():
                    return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

                user = user_serializer.save()

                # Create pharmacy staff profile immediately
                pharmacy_staff = PharmacyStaff.objects.create(
                    user=user,
                    license_number=license_number,
                    shift=shift
                )

                # Send credentials email
                from .email_utils import send_credentials_email
                send_credentials_email(
                    user_email=user.email,
                    username=user.username,
                    password=user_data['password'],
                    role='pharmacy_staff'
                )

                # Return pharmacy staff with nested user data
                staff_serializer = PharmacyStaffSerializer(pharmacy_staff)
                return Response(staff_serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            import traceback
            print("Exception:", str(e))
            print(traceback.format_exc())

            return Response(
                {'error': f'Failed to create pharmacy staff: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

    def get_queryset(self):
        """Filter out archived pharmacy staff by default, unless archived=true parameter"""
        show_archived = self.request.query_params.get('archived', 'false')
        if show_archived.lower() in ['true', '1']:
            return PharmacyStaff.objects.filter(is_archived=True)
        return PharmacyStaff.objects.filter(is_archived=False)

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """Archive a pharmacy staff member (soft delete)"""
        staff = self.get_object()
        staff.is_archived = True
        staff.save()
        return Response({
            'status': 'success',
            'message': f'Pharmacy staff {staff.user.username} has been moved to archive'
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """Restore an archived pharmacy staff member"""
        try:
            staff = PharmacyStaff.objects.get(pk=pk)
        except PharmacyStaff.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Pharmacy staff not found'
            }, status=status.HTTP_404_NOT_FOUND)

        staff.is_archived = False
        staff.save()
        return Response({
            'status': 'success',
            'message': f'Pharmacy staff {staff.user.username} has been restored from archive'
        }, status=status.HTTP_200_OK)


class MedicineViewSet(viewsets.ModelViewSet):
    queryset = Medicine.objects.all()
    serializer_class = MedicineSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Allow filtering by category, active status, and low stock
        Examples:
        /api/medicines/?category=antibiotic
        /api/medicines/?is_active=true
        /api/medicines/?low_stock=true
        """
        queryset = Medicine.objects.all()

        # Filter by category
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category=category)

        # Filter by active status
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            if is_active.lower() in ['true', '1']:
                queryset = queryset.filter(is_active=True)
            elif is_active.lower() in ['false', '0']:
                queryset = queryset.filter(is_active=False)

        # Filter by low stock
        low_stock = self.request.query_params.get('low_stock', None)
        if low_stock and low_stock.lower() in ['true', '1']:
            # Get medicines where stock_quantity <= reorder_level
            queryset = queryset.filter(stock_quantity__lte=models.F('reorder_level'))

        return queryset


class PrescriptionViewSet(viewsets.ModelViewSet):
    queryset = Prescription.objects.all()
    serializer_class = PrescriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Allow filtering by patient, doctor, status, and date
        Examples:
        /api/prescriptions/?patient=1
        /api/prescriptions/?doctor=1
        /api/prescriptions/?status=pending
        /api/prescriptions/?date=2025-10-13
        """
        queryset = Prescription.objects.all()

        # Filter by patient
        patient_id = self.request.query_params.get('patient', None)
        if patient_id:
            queryset = queryset.filter(patient__id=patient_id)

        # Filter by doctor
        doctor_id = self.request.query_params.get('doctor', None)
        if doctor_id:
            queryset = queryset.filter(doctor__id=doctor_id)

        # Filter by status
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)

        # Filter by date
        date = self.request.query_params.get('date', None)
        if date:
            queryset = queryset.filter(prescribed_date__date=date)

        return queryset


class PrescriptionItemViewSet(viewsets.ModelViewSet):
    queryset = PrescriptionItem.objects.all()
    serializer_class = PrescriptionItemSerializer
    permission_classes = [permissions.IsAuthenticated]


# -------------------------------
# Pharmacy Custom Endpoints
# -------------------------------
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_prescription(request):
    """
    Create a prescription with medicines
    POST /api/prescriptions/create/
    Body: {
        "patient_id": 1,
        "doctor_id": 1,
        "admission_id": 1 (optional),
        "appointment_id": 1 (optional),
        "notes": "Take with food",
        "medicines": [
            {
                "medicine_id": 1,
                "quantity": 10,
                "dosage_instructions": "1 tablet twice daily",
                "duration_days": 7
            }
        ]
    }
    """
    try:
        serializer = PrescriptionCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return JsonResponse({'error': serializer.errors}, status=400)

        data = serializer.validated_data
        patient = Patient.objects.get(id=data['patient_id'])
        doctor = Doctor.objects.get(id=data['doctor_id'])
        admission_id = data.get('admission_id')
        admission = Admission.objects.get(id=admission_id) if admission_id else None
        appointment_id = data.get('appointment_id')
        appointment = Appointment.objects.get(id=appointment_id) if appointment_id else None

        # Create prescription
        prescription = Prescription.objects.create(
            patient=patient,
            doctor=doctor,
            admission=admission,
            appointment=appointment,
            notes=data.get('notes', '')
        )

        # Create prescription items
        for med_data in data['medicines']:
            medicine = Medicine.objects.get(id=int(med_data['medicine_id']))
            PrescriptionItem.objects.create(
                prescription=prescription,
                medicine=medicine,
                quantity=int(med_data['quantity']),
                dosage_instructions=med_data['dosage_instructions'],
                duration_days=int(med_data.get('duration_days', 7))
            )

        # Return created prescription with full details
        response_serializer = PrescriptionSerializer(prescription)
        return JsonResponse({
            'success': True,
            'message': 'Prescription created successfully',
            'prescription': response_serializer.data
        }, status=201)

    except Patient.DoesNotExist:
        return JsonResponse({'error': 'Patient not found'}, status=404)
    except Doctor.DoesNotExist:
        return JsonResponse({'error': 'Doctor not found'}, status=404)
    except Medicine.DoesNotExist:
        return JsonResponse({'error': 'Medicine not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def dispense_prescription_item(request, item_id):
    """
    Mark a prescription item as dispensed
    POST /api/prescriptions/items/<item_id>/dispense/
    Body: {
        "pharmacy_staff_id": 1
    }
    """
    try:
        item = PrescriptionItem.objects.get(id=item_id)

        # Check stock availability
        if item.medicine.stock_quantity < item.quantity:
            return JsonResponse({
                'error': f'Insufficient stock. Available: {item.medicine.stock_quantity}, Required: {item.quantity}'
            }, status=400)

        # Get pharmacy staff
        pharmacy_staff_id = request.data.get('pharmacy_staff_id')
        pharmacy_staff = PharmacyStaff.objects.get(id=pharmacy_staff_id) if pharmacy_staff_id else None

        # Dispense the item
        item.dispense()

        # Update prescription dispensed_by and dispensed_date if fully dispensed
        prescription = item.prescription
        if prescription.status == 'dispensed' and pharmacy_staff:
            prescription.dispensed_by = pharmacy_staff
            prescription.dispensed_date = timezone.now()
            prescription.save()

        return JsonResponse({
            'success': True,
            'message': 'Medicine dispensed successfully',
            'item': {
                'id': item.id,
                'medicine': item.medicine.name,
                'quantity': item.quantity,
                'status': item.status,
                'prescription_status': prescription.status
            }
        })

    except PrescriptionItem.DoesNotExist:
        return JsonResponse({'error': 'Prescription item not found'}, status=404)
    except PharmacyStaff.DoesNotExist:
        return JsonResponse({'error': 'Pharmacy staff not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def pending_prescriptions(request):
    """
    Get all pending prescriptions for pharmacy
    GET /api/prescriptions/pending/
    """
    try:
        prescriptions = Prescription.objects.filter(
            status__in=['pending', 'partially_dispensed']
        ).order_by('-prescribed_date')

        serializer = PrescriptionSerializer(prescriptions, many=True)
        return JsonResponse({
            'success': True,
            'count': prescriptions.count(),
            'prescriptions': serializer.data
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def patient_prescription_history(request, patient_id):
    """
    Get prescription history for a patient
    GET /api/patients/<patient_id>/prescriptions/
    """
    try:
        patient = Patient.objects.get(id=patient_id)
        prescriptions = Prescription.objects.filter(patient=patient).order_by('-prescribed_date')

        serializer = PrescriptionSerializer(prescriptions, many=True)
        return JsonResponse({
            'success': True,
            'patient': patient.name,
            'count': prescriptions.count(),
            'prescriptions': serializer.data
        })
    except Patient.DoesNotExist:
        return JsonResponse({'error': 'Patient not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)