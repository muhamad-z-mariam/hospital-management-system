#!/usr/bin/env python
"""
Safe test data loader - loads comprehensive test data for HMS
"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.hashers import make_password
from api.models import (
    User, Doctor, Nurse, PharmacyStaff, Patient, Room, Procedure,
    Appointment, Admission, Payment, PredictionRecord, Schedule,
    ShiftSwapRequest, UnavailabilityRequest, Medicine, Prescription, PrescriptionItem
)
from datetime import datetime, date

def create_test_data():
    print("Creating test data...")

    # 1. Users
    print("Creating users...")
    admin_user = User.objects.create(
        id=2001,
        username='test_admin_user',
        first_name='Test',
        last_name='Admin',
        email='test.admin@hospital.com',
        role='admin',
        password=make_password('test123'),
        is_staff=True,
        is_active=True
    )

    doctor_user = User.objects.create(
        id=2002,
        username='dr_john_smith',
        first_name='John',
        last_name='Smith',
        email='john.smith@hospital.com',
        role='doctor',
        password=make_password('test123'),
        is_active=True
    )

    nurse_user = User.objects.create(
        id=2003,
        username='nurse_jane_doe',
        first_name='Jane',
        last_name='Doe',
        email='jane.doe@hospital.com',
        role='nurse',
        password=make_password('test123'),
        is_active=True
    )

    pharma_user = User.objects.create(
        id=2004,
        username='pharma_mike_j',
        first_name='Mike',
        last_name='Johnson',
        email='mike.johnson@hospital.com',
        role='pharmacy_staff',
        password=make_password('test123'),
        is_active=True
    )

    # 2. Staff profiles
    print("Creating staff profiles...")
    doctor = Doctor.objects.create(
        id=2001,
        user=doctor_user,
        specialty='Cardiology'
    )

    nurse = Nurse.objects.create(
        id=2001,
        user=nurse_user,
        department='Emergency'
    )

    pharma_staff = PharmacyStaff.objects.create(
        id=2001,
        user=pharma_user,
        license_number='PH-TEST-123456',
        shift='morning'
    )

    # 3. Patients
    print("Creating patients...")
    patient1 = Patient.objects.create(
        id=2001,
        name='Alice Thompson',
        age=65,
        gender='female',
        contact='+44-7700-900111',
        nhs_number='2001234567',
        cholesterol=220.5,
        eosinophil_count=0.3,
        insurance_status=True,
        handicapped=False
    )

    patient2 = Patient.objects.create(
        id=2002,
        name='Bob Williams',
        age=45,
        gender='male',
        contact='+44-7700-900222',
        nhs_number='2000987654',
        cholesterol=180.0,
        insurance_status=False,
        handicapped=True
    )

    # 4. Rooms
    print("Creating rooms...")
    room1 = Room.objects.create(
        id=2001,
        room_number='TEST-101',
        room_type='General',
        bed_capacity=2,
        occupied_beds=1,
        is_available=True
    )

    room2 = Room.objects.create(
        id=2002,
        room_number='TEST-201',
        room_type='ICU',
        bed_capacity=1,
        occupied_beds=0,
        is_available=True
    )

    # 5. Procedures
    print("Creating procedures...")
    procedure1 = Procedure.objects.create(
        id=2001,
        name='Test Cardiac Catheterization',
        description='Invasive procedure to examine heart function',
        cost=2500.00,
        procedure_type='surgical'
    )

    procedure2 = Procedure.objects.create(
        id=2002,
        name='Test Blood Work',
        description='Standard blood work analysis',
        cost=50.00,
        procedure_type='non_surgical'
    )

    # 6. Appointments
    print("Creating appointments...")
    appt1 = Appointment.objects.create(
        id=2001,
        patient=patient1,
        doctor=doctor,
        appointment_date=datetime(2025, 1, 10, 14, 0),
        reason='Chest pain follow-up',
        status='completed',
        notes='Patient stable, medication adjusted',
        completed_at=datetime(2025, 1, 10, 15, 0)
    )

    appt2 = Appointment.objects.create(
        id=2002,
        patient=patient2,
        doctor=doctor,
        appointment_date=datetime(2025, 1, 25, 10, 0),
        reason='Routine checkup',
        status='scheduled'
    )

    # 7. Admissions
    print("Creating admissions...")
    admission1 = Admission.objects.create(
        id=2001,
        patient=patient1,
        doctor=doctor,
        nurse=nurse,
        room=room1,
        admission_date=datetime(2025, 1, 11, 8, 0),
        discharge_date=datetime(2025, 1, 14, 16, 0),
        status='discharged',
        requires_inpatient=True,
        doctor_notes='Patient recovered well from cardiac procedure'
    )

    admission2 = Admission.objects.create(
        id=2002,
        patient=patient2,
        doctor=doctor,
        nurse=nurse,
        room=room1,
        admission_date=datetime(2025, 1, 20, 10, 0),
        status='admitted',
        requires_inpatient=True,
        doctor_notes='Observation for fracture recovery'
    )

    # 8. Payments
    print("Creating payments...")
    payment = Payment.objects.create(
        id=2001,
        patient=patient1,
        payment_type='inpatient',
        admission=admission1,
        procedure_cost=2550.00,
        daily_care_cost=90.00,
        total_before_discount=2640.00,
        discount_percent=80.00,
        final_amount=528.00,
        method='Insurance',
        notes='Insurance covered 80%'
    )

    # 9. Predictions
    print("Creating prediction records...")
    pred1 = PredictionRecord.objects.create(
        id=2001,
        patient=patient1,
        predicted_by=doctor_user,
        risk_level=1,
        prediction_date=datetime(2025, 1, 10, 14, 30),
        notes='High readmission risk due to cardiac history'
    )

    pred2 = PredictionRecord.objects.create(
        id=2002,
        patient=patient2,
        predicted_by=doctor_user,
        risk_level=0,
        prediction_date=datetime(2025, 1, 20, 10, 30),
        notes='Low risk, young patient with minor injury'
    )

    # 10. Schedules
    print("Creating schedules...")
    schedule1 = Schedule.objects.create(
        id=2001,
        user=doctor_user,
        date=date(2025, 2, 22),
        shift='morning',
        start_time='08:00:00',
        end_time='16:00:00',
        is_available=True
    )

    schedule2 = Schedule.objects.create(
        id=2002,
        user=nurse_user,
        date=date(2025, 2, 22),
        shift='night',
        start_time='20:00:00',
        end_time='08:00:00',
        is_available=True
    )

    # 11. Shift Swap Request
    print("Creating shift swap request...")
    swap = ShiftSwapRequest.objects.create(
        id=2001,
        requester=doctor_user,
        requester_shift=schedule1,
        recipient=nurse_user,
        recipient_shift=schedule2,
        reason='Family emergency on morning of Feb 22',
        status='pending'
    )

    # 12. Unavailability Request
    print("Creating unavailability request...")
    unavail = UnavailabilityRequest.objects.create(
        id=2001,
        user=nurse_user,
        start_date=date(2025, 3, 1),
        end_date=date(2025, 3, 5),
        reason='Annual leave - vacation',
        status='approved',
        admin_notes='Approved, coverage arranged',
        reviewed_by=admin_user,
        reviewed_at=datetime(2025, 1, 16, 10, 0)
    )

    # 13. Medicines
    print("Creating medicines...")
    med1 = Medicine.objects.create(
        id=2001,
        name='Test Aspirin 100mg',
        generic_name='Acetylsalicylic Acid',
        category='cardiovascular',
        dosage_form='Tablet',
        strength='100mg',
        price_per_unit=0.50,
        stock_quantity=500,
        reorder_level=100,
        manufacturer='PharmaCorp Ltd',
        description='Blood thinner for cardiovascular protection',
        requires_prescription=False,
        is_active=True
    )

    med2 = Medicine.objects.create(
        id=2002,
        name='Test Metformin 500mg',
        generic_name='Metformin Hydrochloride',
        category='diabetes',
        dosage_form='Tablet',
        strength='500mg',
        price_per_unit=0.75,
        stock_quantity=300,
        reorder_level=50,
        manufacturer='DiabetesCare Inc',
        description='Type 2 diabetes medication',
        requires_prescription=True,
        is_active=True
    )

    # 14. Prescription
    print("Creating prescriptions...")
    prescription = Prescription.objects.create(
        id=2001,
        patient=patient1,
        doctor=doctor,
        admission=admission1,
        status='dispensed',
        prescribed_date=datetime(2025, 1, 11, 10, 0),
        dispensed_by=pharma_staff,
        dispensed_date=datetime(2025, 1, 11, 14, 0),
        notes='Post-cardiac catheterization medication',
        is_paid=True
    )

    # 15. Prescription Items
    print("Creating prescription items...")
    item1 = PrescriptionItem.objects.create(
        id=2001,
        prescription=prescription,
        medicine=med1,
        quantity=30,
        dosage_instructions='Take 1 tablet daily in the morning with food',
        duration_days=30,
        status='dispensed',
        dispensed_date=datetime(2025, 1, 11, 14, 0)
    )

    item2 = PrescriptionItem.objects.create(
        id=2002,
        prescription=prescription,
        medicine=med2,
        quantity=60,
        dosage_instructions='Take 1 tablet twice daily with meals',
        duration_days=30,
        status='dispensed',
        dispensed_date=datetime(2025, 1, 11, 14, 0)
    )

    print("\n✅ Test data created successfully!")
    print("\nTest Users Created:")
    print(f"  - Admin: test_admin_user / test123")
    print(f"  - Doctor: dr_john_smith / test123")
    print(f"  - Nurse: nurse_jane_doe / test123")
    print(f"  - Pharmacy: pharma_mike_j / test123")
    print("\nData Summary:")
    print(f"  - 4 Users")
    print(f"  - 2 Patients")
    print(f"  - 1 Doctor, 1 Nurse, 1 Pharmacy Staff")
    print(f"  - 2 Rooms")
    print(f"  - 2 Procedures")
    print(f"  - 2 Appointments")
    print(f"  - 2 Admissions (1 discharged, 1 active)")
    print(f"  - 1 Payment")
    print(f"  - 2 Prediction Records")
    print(f"  - 2 Schedules")
    print(f"  - 1 Shift Swap Request")
    print(f"  - 1 Unavailability Request")
    print(f"  - 2 Medicines")
    print(f"  - 1 Prescription with 2 items")

if __name__ == '__main__':
    try:
        create_test_data()
    except Exception as e:
        print(f"\n❌ Error creating test data: {e}")
        import traceback
        traceback.print_exc()
