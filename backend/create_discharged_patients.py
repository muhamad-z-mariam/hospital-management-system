#!/usr/bin/env python
"""
Create 20 discharged patients with complete history:
- Admission & discharge (various dates)
- Procedures/Operations
- Prescriptions with medicines
- Payments with calculations
"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import (
    Patient, Doctor, Nurse, Admission, Room, Procedure,
    Payment, Medicine, Prescription, PrescriptionItem, PharmacyStaff
)
from datetime import datetime, timedelta
from decimal import Decimal
import random

def create_discharged_patients():
    print("="*70)
    print("CREATING 20 DISCHARGED PATIENTS WITH COMPLETE HISTORY")
    print("="*70)

    # Get staff
    dr_wasim = Doctor.objects.get(id=6)
    nurse = Nurse.objects.filter(user__username='wnurse').first()

    if not nurse:
        print("ERROR: Nurse 'wnurse' not found!")
        return

    print(f"\nDoctor: Dr. {dr_wasim.user.first_name} {dr_wasim.user.last_name}")
    print(f"Nurse: {nurse.user.username}")

    # Get pharmacy staff for dispensing
    pharma_staff = PharmacyStaff.objects.first()

    # Get or create procedures
    procedures = []
    procedure_data = [
        ("Cardiac Catheterization", "Invasive cardiac procedure", 2500, "surgical"),
        ("Appendectomy", "Surgical removal of appendix", 3000, "surgical"),
        ("Hip Replacement", "Total hip replacement surgery", 8000, "surgical"),
        ("Knee Arthroscopy", "Minimally invasive knee surgery", 2200, "surgical"),
        ("Blood Transfusion", "Blood transfusion procedure", 500, "non_surgical"),
        ("CT Scan", "Computed tomography imaging", 400, "non_surgical"),
        ("MRI Scan", "Magnetic resonance imaging", 600, "non_surgical"),
        ("X-Ray", "Radiographic imaging", 100, "non_surgical"),
        ("Ultrasound", "Ultrasound examination", 150, "non_surgical"),
        ("ECG Monitoring", "Electrocardiogram monitoring", 80, "non_surgical"),
    ]

    for name, desc, cost, ptype in procedure_data:
        proc, created = Procedure.objects.get_or_create(
            name=name,
            defaults={'description': desc, 'cost': cost, 'procedure_type': ptype}
        )
        procedures.append(proc)

    print(f"\nProcedures available: {len(procedures)}")

    # Get or create medicines
    medicines = []
    medicine_data = [
        ("Aspirin 100mg", "Acetylsalicylic Acid", "cardiovascular", "Tablet", "100mg", 0.50),
        ("Metformin 500mg", "Metformin", "diabetes", "Tablet", "500mg", 0.75),
        ("Lisinopril 10mg", "Lisinopril", "cardiovascular", "Tablet", "10mg", 1.20),
        ("Amoxicillin 500mg", "Amoxicillin", "antibiotic", "Capsule", "500mg", 0.80),
        ("Ibuprofen 400mg", "Ibuprofen", "painkiller", "Tablet", "400mg", 0.30),
        ("Omeprazole 20mg", "Omeprazole", "gastrointestinal", "Capsule", "20mg", 0.90),
    ]

    for name, generic, cat, form, strength, price in medicine_data:
        med, created = Medicine.objects.get_or_create(
            name=name,
            defaults={
                'generic_name': generic,
                'category': cat,
                'dosage_form': form,
                'strength': strength,
                'price_per_unit': price,
                'stock_quantity': 1000,
                'reorder_level': 100,
                'requires_prescription': True,
                'is_active': True
            }
        )
        medicines.append(med)

    print(f"Medicines available: {len(medicines)}")

    # Room
    room = Room.objects.filter(is_available=True).first()

    # Discharge date distributions
    today = datetime.now()
    discharge_ranges = [
        # This week (7 patients)
        (1, 7, "THIS WEEK"),
        (1, 7, "THIS WEEK"),
        (1, 7, "THIS WEEK"),
        (2, 7, "THIS WEEK"),
        (3, 7, "THIS WEEK"),
        (4, 7, "THIS WEEK"),
        (5, 7, "THIS WEEK"),

        # Last week (7 patients)
        (8, 14, "LAST WEEK"),
        (8, 14, "LAST WEEK"),
        (9, 14, "LAST WEEK"),
        (10, 14, "LAST WEEK"),
        (11, 14, "LAST WEEK"),
        (12, 14, "LAST WEEK"),
        (13, 14, "LAST WEEK"),

        # 1 month ago (6 patients)
        (25, 35, "1 MONTH AGO"),
        (26, 35, "1 MONTH AGO"),
        (28, 35, "1 MONTH AGO"),
        (30, 35, "1 MONTH AGO"),
        (32, 35, "1 MONTH AGO"),
        (34, 35, "1 MONTH AGO"),
    ]

    # Patient names
    patient_names = [
        ("George Harrison", 62, "male"),
        ("Helen Carter", 58, "female"),
        ("Ivan Peterson", 71, "male"),
        ("Julia Moore", 45, "female"),
        ("Kevin Walsh", 54, "male"),
        ("Laura Bennett", 66, "female"),
        ("Martin Cruz", 59, "male"),
        ("Nina Foster", 48, "female"),
        ("Oscar Webb", 73, "male"),
        ("Paula Griffin", 52, "female"),
        ("Quinn Butler", 64, "male"),
        ("Rachel Hayes", 57, "female"),
        ("Steven Kelly", 69, "male"),
        ("Teresa Brooks", 51, "female"),
        ("Ulysses Morgan", 75, "male"),
        ("Violet Reed", 46, "female"),
        ("Walter Scott", 68, "male"),
        ("Yvonne Baker", 55, "female"),
        ("Zachary Long", 72, "male"),
        ("Amanda Price", 49, "female"),
    ]

    print(f"\n{'='*70}")
    print("Creating patients with complete discharge history...")
    print(f"{'='*70}\n")

    created_count = 0
    start_id = 3000  # Start from ID 3000 to avoid conflicts

    for idx, ((name, age, gender), (days_back_min, days_back_max, period)) in enumerate(zip(patient_names, discharge_ranges)):
        patient_id = start_id + idx

        # Create patient
        patient = Patient.objects.create(
            id=patient_id,
            name=name,
            age=age,
            gender=gender,
            contact=f"+44-7700-{950000 + idx:06d}",
            nhs_number=f"300{3000 + idx:06d}",
            cholesterol=round(random.uniform(180, 280), 1),
            brain_natriuretic_peptide=round(random.uniform(50, 400), 0),
            glomerular_filtration_rate=round(random.uniform(50, 95), 0),
            insurance_status=random.choice([True, True, False]),  # 66% insured
            handicapped=random.choice([True, False, False, False]),  # 25% handicapped
        )

        # Determine discharge date
        days_back = random.randint(days_back_min, days_back_max)
        discharge_date = today - timedelta(days=days_back)

        # Stay duration (1-7 days)
        stay_days = random.randint(1, 7)
        admission_date = discharge_date - timedelta(days=stay_days)

        # Create admission
        admission = Admission.objects.create(
            patient=patient,
            doctor=dr_wasim,
            nurse=nurse,
            room=room,
            admission_date=admission_date,
            discharge_date=discharge_date,
            status='discharged',
            requires_inpatient=True,
            doctor_notes=f"Patient treated successfully and discharged in good condition after {stay_days} days."
        )

        # Add 1-3 procedures
        num_procedures = random.randint(1, 3)
        selected_procedures = random.sample(procedures, num_procedures)
        admission.procedures.set(selected_procedures)

        # Calculate costs
        procedure_cost = sum(p.cost for p in selected_procedures)
        daily_care_cost = stay_days * 30  # $30 per day
        total_before_discount = procedure_cost + daily_care_cost

        # Calculate discount
        if patient.handicapped:
            if total_before_discount < 3000:
                discount_percent = 100  # Free
            else:
                discount_percent = 90  # 10% to pay
        elif patient.insurance_status:
            discount_percent = 80  # 20% to pay
        else:
            discount_percent = 30  # 70% to pay

        final_amount = float(total_before_discount) * (1 - discount_percent / 100)

        # Create payment
        payment = Payment.objects.create(
            patient=patient,
            payment_type='inpatient',
            admission=admission,
            procedure_cost=Decimal(str(procedure_cost)),
            daily_care_cost=Decimal(str(daily_care_cost)),
            total_before_discount=Decimal(str(total_before_discount)),
            discount_percent=Decimal(str(discount_percent)),
            final_amount=Decimal(str(final_amount)),
            method="Insurance" if patient.insurance_status else "Cash",
            payment_date=discharge_date,
            notes=f"Payment processed at discharge. {'Handicapped discount applied.' if patient.handicapped else 'Insurance coverage' if patient.insurance_status else 'Self-pay'}"
        )
        payment.procedures.set(selected_procedures)

        # Create prescription with 2-4 medicines
        prescription = Prescription.objects.create(
            patient=patient,
            doctor=dr_wasim,
            admission=admission,
            status='dispensed',
            prescribed_date=admission_date + timedelta(days=1),
            dispensed_by=pharma_staff,
            dispensed_date=admission_date + timedelta(days=1, hours=4),
            notes="Prescribed during admission",
            is_paid=True
        )

        # Add medicines to prescription
        num_meds = random.randint(2, 4)
        selected_meds = random.sample(medicines, num_meds)

        for med in selected_meds:
            PrescriptionItem.objects.create(
                prescription=prescription,
                medicine=med,
                quantity=random.choice([30, 60, 90]),
                dosage_instructions=f"Take as directed by physician",
                duration_days=30,
                status='dispensed',
                dispensed_date=admission_date + timedelta(days=1, hours=4)
            )

        created_count += 1
        proc_names = ", ".join([p.name[:20] for p in selected_procedures])
        print(f"[{idx+1:2d}/20] [{period:12s}] {name:25s} | {stay_days}d | ${final_amount:7.2f} | {proc_names[:40]}")

    print(f"\n{'='*70}")
    print(f"SUCCESS! Created {created_count} discharged patients")
    print(f"{'='*70}")
    print("\nSummary:")
    print(f"  - All treated by: Dr. Wasim & Nurse wnurse")
    print(f"  - ~7 discharged this week")
    print(f"  - ~7 discharged last week")
    print(f"  - ~6 discharged 1 month ago")
    print(f"  - Each has: Admission, Procedures, Prescription, Payment")

if __name__ == '__main__':
    try:
        create_discharged_patients()
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
