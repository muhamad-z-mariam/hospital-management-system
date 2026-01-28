from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    UserViewSet, PatientViewSet, DoctorViewSet, NurseViewSet,
    AppointmentViewSet, AdmissionViewSet, PaymentViewSet, PredictionRecordViewSet,
    ProcedureViewSet, RoomViewSet, ScheduleViewSet,
    predict_patient, login_user, dashboard_stats, patient_stats, create_payment_with_calculation,
    CustomTokenObtainPairView, UserRegistrationView, LogoutView,
    PasswordChangeView, PasswordResetRequestView, PasswordResetConfirmView, CurrentUserView,
    PharmacyStaffViewSet, MedicineViewSet, PrescriptionViewSet, PrescriptionItemViewSet,
    create_prescription, dispense_prescription_item, pending_prescriptions, patient_prescription_history
)
from .schedule_views import (
    ShiftSwapRequestViewSet, UnavailabilityRequestViewSet,
    get_weekly_schedule, bulk_create_schedules, night_shift_rotation_suggestion,
    check_appointment_coverage, my_schedule
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'patients', PatientViewSet)
router.register(r'doctors', DoctorViewSet)
router.register(r'nurses', NurseViewSet)
router.register(r'appointments', AppointmentViewSet)
router.register(r'admissions', AdmissionViewSet)
router.register(r'payments', PaymentViewSet)
router.register(r'predictions', PredictionRecordViewSet)
router.register(r'procedures', ProcedureViewSet)
router.register(r'rooms', RoomViewSet)
router.register(r'schedules', ScheduleViewSet)
router.register(r'shift-swaps', ShiftSwapRequestViewSet)
router.register(r'unavailability-requests', UnavailabilityRequestViewSet)
router.register(r'pharmacy-staff', PharmacyStaffViewSet)
router.register(r'medicines', MedicineViewSet)
router.register(r'prescriptions', PrescriptionViewSet)
router.register(r'prescription-items', PrescriptionItemViewSet)

urlpatterns = [
    # Authentication endpoints
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/register/', UserRegistrationView.as_view(), name='user_register'),
    path('auth/logout/', LogoutView.as_view(), name='user_logout'),
    path('auth/change-password/', PasswordChangeView.as_view(), name='change_password'),
    path('auth/password-reset/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('auth/password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('auth/me/', CurrentUserView.as_view(), name='current_user'),

    # Legacy login endpoint (deprecated)
    path('login/', login_user, name='login-user'),

    # Custom endpoints
    path('predict/<int:patient_id>/', predict_patient, name='predict-patient'),
    path('dashboard-stats/', dashboard_stats, name='dashboard-stats'),
    path('patient-stats/', patient_stats, name='patient-stats'),
    path('create-payment/', create_payment_with_calculation, name='create-payment'),

    # Schedule management endpoints
    path('schedules/weekly/', get_weekly_schedule, name='weekly-schedule'),
    path('schedules/bulk-create/', bulk_create_schedules, name='bulk-create-schedules'),
    path('schedules/night-rotation/', night_shift_rotation_suggestion, name='night-rotation'),
    path('schedules/my-schedule/', my_schedule, name='my-schedule'),
    path('appointments/<int:appointment_id>/check-coverage/', check_appointment_coverage, name='check-coverage'),

    # Pharmacy endpoints
    path('prescriptions/create/', create_prescription, name='create-prescription'),
    path('prescriptions/pending/', pending_prescriptions, name='pending-prescriptions'),
    path('prescriptions/items/<int:item_id>/dispense/', dispense_prescription_item, name='dispense-prescription-item'),
    path('patients/<int:patient_id>/prescriptions/', patient_prescription_history, name='patient-prescriptions'),

    # Router URLs
    path('', include(router.urls)),
]