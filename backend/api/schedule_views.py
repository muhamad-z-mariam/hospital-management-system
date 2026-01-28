"""
Schedule management views for weekly scheduling system
"""
from datetime import datetime, timedelta
from django.http import JsonResponse
from django.utils import timezone
from django.db.models import Count, Q
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Schedule, ShiftSwapRequest, UnavailabilityRequest, User, Appointment, Doctor
from .serializers import ShiftSwapRequestSerializer, UnavailabilityRequestSerializer, ScheduleSerializer
from .permissions import IsAdminUser, IsAdminDoctorOrNurse


# -------------------------------
# Shift Swap Request ViewSet
# -------------------------------
class ShiftSwapRequestViewSet(viewsets.ModelViewSet):
    queryset = ShiftSwapRequest.objects.all()
    serializer_class = ShiftSwapRequestSerializer
    permission_classes = [IsAdminDoctorOrNurse]

    def get_queryset(self):
        """Filter by user role"""
        queryset = ShiftSwapRequest.objects.all()
        user = self.request.user

        # Non-admin users only see their own requests
        if user.role != 'admin':
            queryset = queryset.filter(Q(requester=user) | Q(recipient=user))

        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def approve(self, request, pk=None):
        """Approve shift swap and perform the swap"""
        swap_request = self.get_object()

        if swap_request.status != 'pending':
            return Response(
                {'error': 'Only pending requests can be approved'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            requester_shift = swap_request.requester_shift
            recipient_shift = swap_request.recipient_shift

            if not recipient_shift:
                return Response(
                    {'error': 'Cannot approve swap without a recipient shift. This is a coverage request, not a direct swap.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Store shift details before deletion
            requester_data = {
                'user': requester_shift.user,
                'date': requester_shift.date,
                'shift': requester_shift.shift,
                'start_time': requester_shift.start_time,
                'end_time': requester_shift.end_time,
                'is_available': requester_shift.is_available,
            }

            recipient_data = {
                'user': recipient_shift.user,
                'date': recipient_shift.date,
                'shift': recipient_shift.shift,
                'start_time': recipient_shift.start_time,
                'end_time': recipient_shift.end_time,
                'is_available': recipient_shift.is_available,
            }

            # Delete both schedules to avoid unique constraint violation
            requester_shift.delete()
            recipient_shift.delete()

            # Create new schedules with swapped users
            from .models import Schedule

            new_requester_shift = Schedule.objects.create(
                user=recipient_data['user'],
                date=requester_data['date'],
                shift=requester_data['shift'],
                start_time=requester_data['start_time'],
                end_time=requester_data['end_time'],
                is_available=requester_data['is_available'],
            )

            new_recipient_shift = Schedule.objects.create(
                user=requester_data['user'],
                date=recipient_data['date'],
                shift=recipient_data['shift'],
                start_time=recipient_data['start_time'],
                end_time=recipient_data['end_time'],
                is_available=recipient_data['is_available'],
            )

            # Update request status
            swap_request.status = 'approved'
            swap_request.reviewed_by = request.user
            swap_request.reviewed_at = timezone.now()
            swap_request.requester_shift = new_recipient_shift
            swap_request.recipient_shift = new_requester_shift
            swap_request.save()

            return Response({
                'message': 'Shift swap approved successfully',
                'swap_request': ShiftSwapRequestSerializer(swap_request).data
            })

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def reject(self, request, pk=None):
        """Reject shift swap request"""
        swap_request = self.get_object()

        if swap_request.status != 'pending':
            return Response(
                {'error': 'Only pending requests can be rejected'},
                status=status.HTTP_400_BAD_REQUEST
            )

        swap_request.status = 'rejected'
        swap_request.reviewed_by = request.user
        swap_request.reviewed_at = timezone.now()
        swap_request.admin_notes = request.data.get('admin_notes', '')
        swap_request.save()

        return Response({
            'message': 'Shift swap rejected',
            'swap_request': ShiftSwapRequestSerializer(swap_request).data
        })


# -------------------------------
# Unavailability Request ViewSet
# -------------------------------
class UnavailabilityRequestViewSet(viewsets.ModelViewSet):
    queryset = UnavailabilityRequest.objects.all()
    serializer_class = UnavailabilityRequestSerializer
    permission_classes = [IsAdminDoctorOrNurse]

    def get_queryset(self):
        """Filter by user role"""
        queryset = UnavailabilityRequest.objects.all()
        user = self.request.user

        # Non-admin users only see their own requests
        if user.role != 'admin':
            queryset = queryset.filter(user=user)

        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def approve(self, request, pk=None):
        """Approve unavailability and mark schedules as unavailable"""
        unavail_request = self.get_object()

        if unavail_request.status != 'pending':
            return Response(
                {'error': 'Only pending requests can be approved'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Mark all affected schedules as unavailable
        affected_schedules = unavail_request.get_affected_schedules()
        affected_schedules.update(is_available=False)

        # Update request status
        unavail_request.status = 'approved'
        unavail_request.reviewed_by = request.user
        unavail_request.reviewed_at = timezone.now()
        unavail_request.save()

        return Response({
            'message': f'Unavailability approved. {affected_schedules.count()} schedules marked as unavailable',
            'unavailability_request': UnavailabilityRequestSerializer(unavail_request).data
        })

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def reject(self, request, pk=None):
        """Reject unavailability request"""
        unavail_request = self.get_object()

        if unavail_request.status != 'pending':
            return Response(
                {'error': 'Only pending requests can be rejected'},
                status=status.HTTP_400_BAD_REQUEST
            )

        unavail_request.status = 'rejected'
        unavail_request.reviewed_by = request.user
        unavail_request.reviewed_at = timezone.now()
        unavail_request.admin_notes = request.data.get('admin_notes', '')
        unavail_request.save()

        return Response({
            'message': 'Unavailability request rejected',
            'unavailability_request': UnavailabilityRequestSerializer(unavail_request).data
        })


# -------------------------------
# Weekly Schedule Management Endpoints
# -------------------------------
@api_view(['GET'])
@permission_classes([IsAdminDoctorOrNurse])
def get_weekly_schedule(request):
    """
    Get weekly schedule for a specific week
    GET /api/schedules/weekly/?start_date=YYYY-MM-DD
    """
    start_date_str = request.GET.get('start_date')

    if not start_date_str:
        # Default to current week (Monday)
        today = timezone.now().date()
        start_date = today - timedelta(days=today.weekday())
    else:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()

    end_date = start_date + timedelta(days=6)

    # Get all schedules for the week
    schedules = Schedule.objects.filter(
        date__range=[start_date, end_date]
    ).order_by('date', 'shift')

    serializer = ScheduleSerializer(schedules, many=True)

    return Response({
        'start_date': start_date,
        'end_date': end_date,
        'schedules': serializer.data
    })


@api_view(['POST'])
@permission_classes([IsAdminUser])
def bulk_create_schedules(request):
    """
    Bulk create schedules for multiple days/users
    POST /api/schedules/bulk-create/
    Body: {
        "schedules": [
            {
                "user_id": 1,
                "date": "2025-10-23",
                "shift": "morning",
                "start_time": "08:00:00",
                "end_time": "16:00:00",
                "notes": ""
            },
            ...
        ]
    }
    """
    schedules_data = request.data.get('schedules', [])

    if not schedules_data:
        return Response(
            {'error': 'No schedules provided'},
            status=status.HTTP_400_BAD_REQUEST
        )

    created_schedules = []
    errors = []

    for idx, schedule_data in enumerate(schedules_data):
        try:
            user = User.objects.get(id=schedule_data['user_id'])

            # Check for duplicates
            existing = Schedule.objects.filter(
                user=user,
                date=schedule_data['date'],
                shift=schedule_data['shift']
            ).first()

            if existing:
                errors.append({
                    'index': idx,
                    'error': f'Schedule already exists for {user.username} on {schedule_data["date"]} ({schedule_data["shift"]})'
                })
                continue

            schedule = Schedule.objects.create(
                user=user,
                date=schedule_data['date'],
                shift=schedule_data['shift'],
                start_time=schedule_data['start_time'],
                end_time=schedule_data['end_time'],
                notes=schedule_data.get('notes', ''),
                is_available=schedule_data.get('is_available', True)
            )
            created_schedules.append(schedule)

        except User.DoesNotExist:
            errors.append({
                'index': idx,
                'error': f'User with id {schedule_data.get("user_id")} not found'
            })
        except Exception as e:
            errors.append({
                'index': idx,
                'error': str(e)
            })

    serializer = ScheduleSerializer(created_schedules, many=True)

    return Response({
        'message': f'Created {len(created_schedules)} schedules',
        'created': serializer.data,
        'errors': errors
    }, status=status.HTTP_201_CREATED if created_schedules else status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def night_shift_rotation_suggestion(request):
    """
    Get fair rotation suggestions for night shifts
    GET /api/schedules/night-rotation/?start_date=YYYY-MM-DD&weeks=4
    """
    start_date_str = request.GET.get('start_date')
    weeks = int(request.GET.get('weeks', 4))

    if not start_date_str:
        today = timezone.now().date()
        start_date = today - timedelta(days=today.weekday())
    else:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()

    end_date = start_date + timedelta(weeks=weeks)

    # Get all doctors and nurses
    staff = User.objects.filter(role__in=['doctor', 'nurse'])

    # Count current night shifts for each staff member
    night_shift_counts = {}
    for user in staff:
        count = Schedule.objects.filter(
            user=user,
            shift='night',
            date__range=[start_date, end_date]
        ).count()
        night_shift_counts[user.id] = {
            'user': user.username,
            'full_name': f"{user.first_name} {user.last_name}" if user.first_name else user.username,
            'role': user.role,
            'current_night_shifts': count
        }

    # Sort by count (ascending) to prioritize those with fewer night shifts
    sorted_staff = sorted(night_shift_counts.items(), key=lambda x: x[1]['current_night_shifts'])

    return Response({
        'start_date': start_date,
        'end_date': end_date,
        'weeks': weeks,
        'staff_night_shift_distribution': dict(sorted_staff),
        'recommendation': 'Assign night shifts to staff with lowest counts first'
    })


@api_view(['GET'])
@permission_classes([IsAdminDoctorOrNurse])
def check_appointment_coverage(request, appointment_id):
    """
    Check if an appointment has doctor coverage based on schedule
    GET /api/appointments/<id>/check-coverage/
    Returns warning if doctor is not scheduled
    """
    try:
        appointment = Appointment.objects.get(id=appointment_id)
        doctor = appointment.doctor
        appointment_date = appointment.appointment_date.date()
        appointment_time = appointment.appointment_date.time()

        if not doctor:
            return Response({
                'covered': False,
                'warning': 'No doctor assigned to appointment'
            })

        # Check if doctor has any schedule on that day
        doctor_schedules = Schedule.objects.filter(
            user=doctor.user,
            date=appointment_date,
            is_available=True
        )

        if not doctor_schedules.exists():
            return Response({
                'covered': False,
                'warning': f'Dr. {doctor.user.get_full_name() or doctor.user.username} is not scheduled on {appointment_date}',
                'allow_booking': True  # Still allow booking
            })

        # Check if appointment time falls within any shift
        covered = False
        for schedule in doctor_schedules:
            if schedule.start_time <= appointment_time <= schedule.end_time:
                covered = True
                break

        if not covered:
            return Response({
                'covered': False,
                'warning': f'Appointment time is outside Dr. {doctor.user.get_full_name() or doctor.user.username}\'s scheduled shifts',
                'scheduled_shifts': ScheduleSerializer(doctor_schedules, many=True).data,
                'allow_booking': True
            })

        return Response({
            'covered': True,
            'message': 'Doctor is scheduled during appointment time'
        })

    except Appointment.DoesNotExist:
        return Response(
            {'error': 'Appointment not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminDoctorOrNurse])
def my_schedule(request):
    """
    Get personal schedule for logged-in doctor/nurse
    GET /api/schedules/my-schedule/?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
    """
    user = request.user

    if user.role not in ['doctor', 'nurse']:
        return Response(
            {'error': 'Only doctors and nurses have schedules'},
            status=status.HTTP_403_FORBIDDEN
        )

    start_date_str = request.GET.get('start_date')
    end_date_str = request.GET.get('end_date')

    # Default to current month
    if not start_date_str or not end_date_str:
        today = timezone.now().date()
        start_date = today.replace(day=1)
        # Get last day of month
        if today.month == 12:
            end_date = today.replace(day=31)
        else:
            end_date = today.replace(month=today.month + 1, day=1) - timedelta(days=1)
    else:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()

    schedules = Schedule.objects.filter(
        user=user,
        date__range=[start_date, end_date]
    ).order_by('date', 'start_time')

    serializer = ScheduleSerializer(schedules, many=True)

    return Response({
        'user': {
            'id': user.id,
            'username': user.username,
            'full_name': f"{user.first_name} {user.last_name}" if user.first_name else user.username,
            'role': user.role
        },
        'start_date': start_date,
        'end_date': end_date,
        'schedules': serializer.data
    })
