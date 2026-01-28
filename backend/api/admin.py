
from django.contrib import admin
from .models import (
    User, Patient, Doctor, Nurse, Appointment, Admission, Payment, Schedule,
    ShiftSwapRequest, UnavailabilityRequest, PharmacyStaff, Medicine,
    Prescription, PrescriptionItem
)

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('id', 'username', 'role', 'email', 'is_staff')

@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'age', 'gender', 'contact']

@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'specialty')

@admin.register(Nurse)
class NurseAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'department')

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'patient', 'doctor', 'appointment_date', 'status', 'completed_at')
    list_filter = ('status', 'appointment_date', 'doctor')
    search_fields = ('patient__name', 'doctor__user__username', 'reason')
    date_hierarchy = 'appointment_date'
    readonly_fields = ('completed_at', 'created_at', 'updated_at')

    def get_queryset(self, request):
        """By default, show only active appointments (exclude completed/cancelled/no-show)"""
        qs = super().get_queryset(request)

        # If status filter is applied, show filtered results
        if request.GET.get('status'):
            return qs

        # Default: show only active appointments
        return qs.exclude(status__in=['completed', 'cancelled', 'no_show'])

@admin.register(Admission)
class AdmissionAdmin(admin.ModelAdmin):
    list_display = ('id', 'patient', 'status', 'admission_date', 'discharge_date', 'doctor', 'room')
    list_filter = ('status', 'admission_date', 'requires_inpatient')
    search_fields = ('patient__name', 'doctor__user__username')
    date_hierarchy = 'admission_date'
    filter_horizontal = ['procedures']

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['id', 'patient', 'payment_type', 'final_amount', 'method', 'payment_date']
    list_filter = ['payment_type', 'method', 'payment_date']
    search_fields = ['patient__name']
    filter_horizontal = ['procedures', 'appointments']  # Nice UI for selecting multiple procedures/appointments

@admin.register(Schedule)
class ScheduleAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'date', 'shift', 'start_time', 'end_time', 'is_available')
    list_filter = ('date', 'shift', 'is_available', 'user__role')
    search_fields = ('user__username', 'user__first_name', 'user__last_name')
    date_hierarchy = 'date'

@admin.register(ShiftSwapRequest)
class ShiftSwapRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'requester', 'requester_shift', 'recipient', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('requester__username', 'recipient__username')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(UnavailabilityRequest)
class UnavailabilityRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'start_date', 'end_date', 'status', 'created_at')
    list_filter = ('status', 'start_date', 'user__role')
    search_fields = ('user__username', 'user__first_name', 'user__last_name')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(PharmacyStaff)
class PharmacyStaffAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'license_number', 'shift')
    list_filter = ('shift',)
    search_fields = ('user__username', 'license_number')

@admin.register(Medicine)
class MedicineAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'category', 'strength', 'price_per_unit', 'stock_quantity', 'is_active')
    list_filter = ('category', 'is_active', 'requires_prescription')
    search_fields = ('name', 'generic_name', 'manufacturer')
    readonly_fields = ('created_at', 'updated_at')

class PrescriptionItemInline(admin.TabularInline):
    model = PrescriptionItem
    extra = 1
    fields = ('medicine', 'quantity', 'dosage_instructions', 'duration_days', 'status', 'dispensed_date')
    readonly_fields = ('dispensed_date',)

@admin.register(Prescription)
class PrescriptionAdmin(admin.ModelAdmin):
    list_display = ('id', 'patient', 'doctor', 'admission', 'appointment', 'status', 'prescribed_date', 'dispensed_by')
    list_filter = ('status', 'prescribed_date', 'is_paid')
    search_fields = ('patient__name', 'doctor__user__username')
    readonly_fields = ('prescribed_date', 'created_at', 'updated_at')
    inlines = [PrescriptionItemInline]

@admin.register(PrescriptionItem)
class PrescriptionItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'prescription', 'medicine', 'quantity', 'status', 'dispensed_date')
    list_filter = ('status', 'dispensed_date')
    search_fields = ('prescription__patient__name', 'medicine__name')
    readonly_fields = ('dispensed_date',)