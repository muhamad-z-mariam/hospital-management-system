from django.db import models
from django.contrib.auth.models import AbstractUser

# -------------------------------
# User with role
# -------------------------------
class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('doctor', 'Doctor'),
        ('nurse', 'Nurse'),
        ('staff', 'Staff'),
        ('pharmacy_staff', 'Pharmacy Staff'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)

    def __str__(self):
        return f"{self.username} ({self.role})"


# -------------------------------
# Patient
# -------------------------------
class Patient(models.Model):
    GENDER_CHOICES = (
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    )
    name = models.CharField(max_length=100)
    age = models.PositiveIntegerField()
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    contact = models.CharField(max_length=50)
    nhs_number = models.CharField(max_length=10, unique=True, help_text="10-digit NHS number", blank=True, null=True)

    # Medical features for prediction
    cholesterol = models.FloatField(null=True, blank=True)
    eosinophil_count = models.FloatField(null=True, blank=True)
    creatinine_enzymatic_method = models.FloatField(null=True, blank=True)
    platelet = models.FloatField(null=True, blank=True)
    total_bile_acid = models.FloatField(null=True, blank=True)
    mean_corpuscular_volume = models.FloatField(null=True, blank=True)
    indirect_bilirubin = models.FloatField(null=True, blank=True)
    creatine_kinase_isoenzyme_to_creatine_kinase = models.FloatField(null=True, blank=True)
    uric_acid = models.FloatField(null=True, blank=True)
    std_dev_red_blood_cell_distribution_width = models.FloatField(null=True, blank=True)
    alkaline_phosphatase = models.FloatField(null=True, blank=True)
    neutrophil_ratio = models.FloatField(null=True, blank=True)
    high_density_lipoprotein_cholesterol = models.FloatField(null=True, blank=True)
    high_sensitivity_troponin = models.FloatField(null=True, blank=True)
    chloride = models.FloatField(null=True, blank=True)
    glomerular_filtration_rate = models.FloatField(null=True, blank=True)
    creatine_kinase_isoenzyme = models.FloatField(null=True, blank=True)
    creatine_kinase = models.FloatField(null=True, blank=True)
    prothrombin_activity = models.FloatField(null=True, blank=True)
    brain_natriuretic_peptide = models.FloatField(null=True, blank=True)
    triglyceride = models.FloatField(null=True, blank=True)
    mean_hemoglobin_concentration = models.FloatField(null=True, blank=True)
    lymphocyte_count = models.FloatField(null=True, blank=True)
    red_blood_cell = models.FloatField(null=True, blank=True)
    glutamic_oxaloacetic_transaminase = models.FloatField(null=True, blank=True)
    nucleotidase = models.FloatField(null=True, blank=True)
    left_ventricular_end_diastolic_diameter_LV = models.FloatField(null=True, blank=True)
    d_dimer = models.FloatField(null=True, blank=True)
    albumin = models.FloatField(null=True, blank=True)
    thrombin_time = models.FloatField(null=True, blank=True)

    # New features for 70-feature readmission prediction model
    # Numeric/count fields
    num_lab_procedures = models.IntegerField(null=True, blank=True, default=0)
    num_medications = models.IntegerField(null=True, blank=True, default=0)
    time_in_hospital = models.IntegerField(null=True, blank=True, default=0)
    number_inpatient = models.IntegerField(null=True, blank=True, default=0)
    num_procedures = models.IntegerField(null=True, blank=True, default=0)
    discharge_disposition_id = models.IntegerField(null=True, blank=True, default=0)
    number_diagnoses = models.IntegerField(null=True, blank=True, default=0)
    admission_type_id = models.IntegerField(null=True, blank=True, default=0)
    admission_source_id = models.IntegerField(null=True, blank=True, default=0)
    number_outpatient = models.IntegerField(null=True, blank=True, default=0)
    number_emergency = models.IntegerField(null=True, blank=True, default=0)

    # One-hot encoded categorical fields (Boolean)
    gender_Male = models.BooleanField(default=False)
    race_Caucasian = models.BooleanField(default=False)

    # Age ranges (one-hot encoded)
    age_70_80 = models.BooleanField(default=False)
    age_60_70 = models.BooleanField(default=False)
    age_80_90 = models.BooleanField(default=False)
    age_50_60 = models.BooleanField(default=False)
    age_40_50 = models.BooleanField(default=False)
    age_30_40 = models.BooleanField(default=False)
    age_90_100 = models.BooleanField(default=False)

    # Insulin status (one-hot encoded)
    insulin_Steady = models.BooleanField(default=False)
    insulin_No = models.BooleanField(default=False)
    insulin_Up = models.BooleanField(default=False)

    # Change indicator
    change_No = models.BooleanField(default=False)

    # Metformin status
    metformin_Steady = models.BooleanField(default=False)
    metformin_No = models.BooleanField(default=False)

    # Diabetes medication
    diabetesMed_Yes = models.BooleanField(default=False)

    # Glipizide status
    glipizide_No = models.BooleanField(default=False)
    glipizide_Steady = models.BooleanField(default=False)

    # Glyburide status
    glyburide_No = models.BooleanField(default=False)
    glyburide_Steady = models.BooleanField(default=False)

    # Pioglitazone status
    pioglitazone_No = models.BooleanField(default=False)
    pioglitazone_Steady = models.BooleanField(default=False)

    # Rosiglitazone status
    rosiglitazone_No = models.BooleanField(default=False)
    rosiglitazone_Steady = models.BooleanField(default=False)

    # Glimepiride status
    glimepiride_No = models.BooleanField(default=False)
    glimepiride_Steady = models.BooleanField(default=False)

    # A1C result
    A1Cresult_gt8 = models.BooleanField(default=False)  # >8
    A1Cresult_Norm = models.BooleanField(default=False)

    # Max glucose serum
    max_glu_serum_Norm = models.BooleanField(default=False)

    # Diagnosis codes (one-hot encoded)
    diag_1_428 = models.BooleanField(default=False)
    diag_1_414 = models.BooleanField(default=False)
    diag_1_410 = models.BooleanField(default=False)
    diag_1_486 = models.BooleanField(default=False)
    diag_1_786 = models.BooleanField(default=False)
    diag_1_491 = models.BooleanField(default=False)
    diag_1_427 = models.BooleanField(default=False)
    diag_1_276 = models.BooleanField(default=False)
    diag_1_584 = models.BooleanField(default=False)

    diag_2_276 = models.BooleanField(default=False)
    diag_2_428 = models.BooleanField(default=False)
    diag_2_427 = models.BooleanField(default=False)
    diag_2_496 = models.BooleanField(default=False)
    diag_2_599 = models.BooleanField(default=False)
    diag_2_403 = models.BooleanField(default=False)
    diag_2_250 = models.BooleanField(default=False)
    diag_2_707 = models.BooleanField(default=False)
    diag_2_411 = models.BooleanField(default=False)
    diag_2_585 = models.BooleanField(default=False)
    diag_2_425 = models.BooleanField(default=False)

    diag_3_250 = models.BooleanField(default=False)
    diag_3_276 = models.BooleanField(default=False)
    diag_3_428 = models.BooleanField(default=False)
    diag_3_401 = models.BooleanField(default=False)
    diag_3_427 = models.BooleanField(default=False)
    diag_3_414 = models.BooleanField(default=False)
    diag_3_496 = models.BooleanField(default=False)
    diag_3_585 = models.BooleanField(default=False)
    diag_3_403 = models.BooleanField(default=False)
    diag_3_599 = models.BooleanField(default=False)

    # Payment-related fields
    insurance_status = models.BooleanField(default=False)  # True = has insurance
    handicapped = models.BooleanField(default=False)  # True = handicapped

    # Archive status (soft delete)
    is_archived = models.BooleanField(default=False)  # True = patient moved to archive

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


# -------------------------------
# Doctor
# -------------------------------
class Doctor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    specialty = models.CharField(max_length=100)
    is_archived = models.BooleanField(default=False)  # Soft delete

    def __str__(self):
        return f"{self.user.username} - {self.specialty}"


# -------------------------------
# Nurse
# -------------------------------
class Nurse(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    department = models.CharField(max_length=100)
    is_archived = models.BooleanField(default=False)  # Soft delete

    def __str__(self):
        return f"{self.user.username} - {self.department}"


# -------------------------------
# Room / Bed
# -------------------------------
class Room(models.Model):
    room_number = models.CharField(max_length=10, unique=True)
    room_type = models.CharField(max_length=50, default='General')  # General, ICU, Private, etc.
    bed_capacity = models.PositiveIntegerField(default=1)
    occupied_beds = models.PositiveIntegerField(default=0)
    is_available = models.BooleanField(default=True)
    
    def __str__(self):
        return f"Room {self.room_number} ({self.occupied_beds}/{self.bed_capacity} occupied)"
    
    def has_space(self):
        return self.occupied_beds < self.bed_capacity
    
    def occupy_bed(self):
        if self.has_space():
            self.occupied_beds += 1
            if self.occupied_beds >= self.bed_capacity:
                self.is_available = False
            self.save()
    
    def release_bed(self):
        if self.occupied_beds > 0:
            self.occupied_beds -= 1
            self.is_available = True
            self.save()


# -------------------------------
# Admission / Hospital Stay
# -------------------------------
class Admission(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending (Waiting for Doctor)'),
        ('admitted', 'Admitted (Inpatient)'),
        ('pending_discharge', 'Pending Discharge (Waiting for Payment)'),
        ('discharged', 'Discharged'),
    )
    
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    doctor = models.ForeignKey(Doctor, on_delete=models.SET_NULL, null=True, blank=True)
    nurse = models.ForeignKey(Nurse, on_delete=models.SET_NULL, null=True, blank=True)
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True)
    
    admission_date = models.DateTimeField(auto_now_add=True)
    discharge_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Doctor's notes
    requires_inpatient = models.BooleanField(default=False)  # Doctor decides
    doctor_notes = models.TextField(blank=True)

    # Procedures performed during this admission (accumulated across examinations)
    procedures = models.ManyToManyField('Procedure', blank=True, related_name='admissions')

    def get_length_of_stay(self):
        """Calculate number of days patient stayed"""
        if self.discharge_date:
            delta = self.discharge_date - self.admission_date
            return max(1, delta.days)
        else:
            from django.utils import timezone
            delta = timezone.now() - self.admission_date
            return max(1, delta.days)

    def __str__(self):
        return f"{self.patient.name} - {self.status}"


# -------------------------------
# Procedure (Surgeries & Treatments)
# -------------------------------
class Procedure(models.Model):
    PROCEDURE_TYPES = (
        ('surgical', 'Surgical Operation'),
        ('non_surgical', 'Non-Surgical Treatment'),
    )
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    cost = models.DecimalField(max_digits=10, decimal_places=2)
    procedure_type = models.CharField(max_length=20, choices=PROCEDURE_TYPES)
    
    def __str__(self):
        return f"{self.name} - ${self.cost}"


# -------------------------------
# Payment
# -------------------------------
class Payment(models.Model):
    PAYMENT_TYPE_CHOICES = (
        ('inpatient', 'Inpatient (Admission)'),
        ('outpatient', 'Outpatient (Appointments)'),
    )

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPE_CHOICES, default='inpatient')

    # For inpatient payments
    admission = models.ForeignKey(Admission, on_delete=models.CASCADE, null=True, blank=True)

    # For outpatient payments (multiple appointments)
    appointments = models.ManyToManyField('Appointment', blank=True, related_name='payments')

    procedures = models.ManyToManyField(Procedure, blank=True)  # Multiple procedures

    # Cost breakdown
    procedure_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    daily_care_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_before_discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    final_amount = models.DecimalField(max_digits=10, decimal_places=2)

    method = models.CharField(max_length=50)  # Cash, Card, Insurance
    payment_date = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.patient.name} - {self.payment_type} - ${self.final_amount}"


# -------------------------------
# Appointment
# -------------------------------
class Appointment(models.Model):
    STATUS_CHOICES = (
        ('scheduled', 'Scheduled'),
        ('checked_in', 'Checked In'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('no_show', 'No Show'),
    )

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    doctor = models.ForeignKey(Doctor, on_delete=models.SET_NULL, null=True)
    appointment_date = models.DateTimeField()
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    procedures = models.ManyToManyField('Procedure', blank=True, related_name='appointments')
    notes = models.TextField(blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    class Meta:
        ordering = ['-appointment_date']

    def __str__(self):
        return f"{self.patient.name} with {self.doctor.user.username if self.doctor else 'N/A'} on {self.appointment_date} - {self.status}"

    def mark_as_completed(self):
        """Mark appointment as completed and set completion timestamp"""
        from django.utils import timezone
        self.status = 'completed'
        self.completed_at = timezone.now()
        self.save()


# -------------------------------
# Prediction Record
# -------------------------------
class PredictionRecord(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    predicted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)  # Doctor or Nurse who ran prediction
    risk_level = models.IntegerField()  # 0 = Low Risk, 1 = High Risk
    prediction_date = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-prediction_date']  # Most recent first

    def __str__(self):
        risk_text = "HIGH RISK" if self.risk_level == 1 else "LOW RISK"
        return f"{self.patient.name} - {risk_text} - By: {self.predicted_by.username if self.predicted_by else 'Unknown'}"


# -------------------------------
# Schedule (for Doctors and Nurses)
# -------------------------------
class Schedule(models.Model):
    SHIFT_CHOICES = (
        ('morning', 'Morning (8:00 AM - 4:00 PM)'),
        ('afternoon', 'Afternoon (12:00 PM - 8:00 PM)'),
        ('night', 'Night (8:00 PM - 8:00 AM)'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role__in': ['doctor', 'nurse']})
    date = models.DateField()
    shift = models.CharField(max_length=20, choices=SHIFT_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_available = models.BooleanField(default=True)  # Can be marked unavailable (sick leave, etc.)
    notes = models.TextField(blank=True)  # Admin notes or special instructions
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_locked = models.BooleanField(default=False)  # Lock past schedules from editing

    class Meta:
        ordering = ['date', 'start_time']
        unique_together = ['user', 'date', 'shift']  # One user can't have duplicate shifts on same day

    def __str__(self):
        status = "Available" if self.is_available else "Unavailable"
        return f"{self.user.username} - {self.date} ({self.shift}) - {status}"

    def is_past(self):
        """Check if this schedule is in the past"""
        from django.utils import timezone
        return self.date < timezone.now().date()


# -------------------------------
# Shift Swap Request
# -------------------------------
class ShiftSwapRequest(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    )

    requester = models.ForeignKey(User, on_delete=models.CASCADE, related_name='swap_requests_made')
    requester_shift = models.ForeignKey(Schedule, on_delete=models.CASCADE, related_name='swap_requests_from')

    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='swap_requests_received', null=True, blank=True)
    recipient_shift = models.ForeignKey(Schedule, on_delete=models.CASCADE, related_name='swap_requests_to', null=True, blank=True)

    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    admin_notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='swap_reviews')
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Swap Request: {self.requester.username} ({self.requester_shift.date}) - {self.status}"


# -------------------------------
# Unavailability Request
# -------------------------------
class UnavailabilityRequest(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role__in': ['doctor', 'nurse']})
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    admin_notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='unavailability_reviews')
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.start_date} to {self.end_date} - {self.status}"

    def get_affected_schedules(self):
        """Get all schedules that fall within this unavailability period"""
        return Schedule.objects.filter(
            user=self.user,
            date__gte=self.start_date,
            date__lte=self.end_date
        )


# -------------------------------
# Pharmacy Staff
# -------------------------------
class PharmacyStaff(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    license_number = models.CharField(max_length=100, unique=True, blank=True, null=True)
    shift = models.CharField(max_length=20, choices=[
        ('morning', 'Morning'),
        ('afternoon', 'Afternoon'),
        ('night', 'Night')
    ], default='morning')
    is_archived = models.BooleanField(default=False)  # Soft delete

    def __str__(self):
        return f"{self.user.username} - Pharmacy Staff"


# -------------------------------
# Medicine
# -------------------------------
class Medicine(models.Model):
    CATEGORY_CHOICES = (
        ('antibiotic', 'Antibiotic'),
        ('painkiller', 'Painkiller'),
        ('antiviral', 'Antiviral'),
        ('antifungal', 'Antifungal'),
        ('antihistamine', 'Antihistamine'),
        ('cardiovascular', 'Cardiovascular'),
        ('diabetes', 'Diabetes'),
        ('respiratory', 'Respiratory'),
        ('gastrointestinal', 'Gastrointestinal'),
        ('supplement', 'Supplement'),
        ('other', 'Other'),
    )

    name = models.CharField(max_length=200, unique=True)
    generic_name = models.CharField(max_length=200, blank=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    dosage_form = models.CharField(max_length=50, help_text="e.g., Tablet, Capsule, Syrup, Injection")
    strength = models.CharField(max_length=50, help_text="e.g., 500mg, 10ml")
    price_per_unit = models.DecimalField(max_digits=10, decimal_places=2)
    stock_quantity = models.PositiveIntegerField(default=0)
    reorder_level = models.PositiveIntegerField(default=10, help_text="Minimum stock before reorder")
    manufacturer = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    requires_prescription = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.strength}) - ${self.price_per_unit}"

    def is_low_stock(self):
        return self.stock_quantity <= self.reorder_level

    def update_stock(self, quantity_change):
        """Update stock quantity. Use negative values for dispensing."""
        self.stock_quantity = max(0, self.stock_quantity + quantity_change)
        self.save()


# -------------------------------
# Prescription
# -------------------------------
class Prescription(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('partially_dispensed', 'Partially Dispensed'),
        ('dispensed', 'Fully Dispensed'),
        ('cancelled', 'Cancelled'),
    )

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='prescriptions')
    doctor = models.ForeignKey(Doctor, on_delete=models.SET_NULL, null=True, related_name='prescriptions')
    admission = models.ForeignKey(Admission, on_delete=models.SET_NULL, null=True, blank=True, related_name='prescriptions')
    appointment = models.ForeignKey('Appointment', on_delete=models.SET_NULL, null=True, blank=True, related_name='prescriptions')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    prescribed_date = models.DateTimeField(auto_now_add=True)
    dispensed_by = models.ForeignKey(PharmacyStaff, on_delete=models.SET_NULL, null=True, blank=True, related_name='dispensed_prescriptions')
    dispensed_date = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, help_text="Doctor's notes or special instructions")
    is_paid = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-prescribed_date']

    def __str__(self):
        return f"Prescription #{self.id} - {self.patient.name} by Dr. {self.doctor.user.username if self.doctor else 'Unknown'}"

    def get_total_cost(self):
        """Calculate total cost of all medicines in prescription"""
        total = sum(item.get_total_price() for item in self.items.all())
        return total

    def update_status(self):
        """Auto-update prescription status based on prescription items"""
        items = self.items.all()
        if not items:
            self.status = 'pending'
        elif all(item.status == 'dispensed' for item in items):
            self.status = 'dispensed'
        elif any(item.status == 'dispensed' for item in items):
            self.status = 'partially_dispensed'
        else:
            self.status = 'pending'
        self.save()


# -------------------------------
# Prescription Item (Medicines in a Prescription)
# -------------------------------
class PrescriptionItem(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('dispensed', 'Dispensed'),
        ('cancelled', 'Cancelled'),
    )

    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name='items')
    medicine = models.ForeignKey(Medicine, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    dosage_instructions = models.TextField(help_text="e.g., 1 tablet twice daily after meals")
    duration_days = models.PositiveIntegerField(default=7, help_text="Duration of medication in days")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    dispensed_date = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.medicine.name} x{self.quantity} - {self.status}"

    def get_total_price(self):
        """Calculate total price for this prescription item"""
        return self.medicine.price_per_unit * self.quantity

    def dispense(self):
        """Mark item as dispensed and update medicine stock"""
        if self.status == 'pending':
            self.status = 'dispensed'
            from django.utils import timezone
            self.dispensed_date = timezone.now()
            self.save()

            # Update medicine stock
            self.medicine.update_stock(-self.quantity)

            # Update parent prescription status
            self.prescription.update_status()


