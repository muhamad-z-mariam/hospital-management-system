#!/usr/bin/env python
"""
Create 10 low-risk patients with complete admission data
All patients will be admitted with Dr. Wasim and Nurse wnurse
Low risk means low values for cardiac/risk markers
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

def create_low_risk_patients():
    print("="*70)
    print("CREATING 10 LOW-RISK ADMITTED PATIENTS")
    print("="*70)

    # Get staff
    dr_wasim = Doctor.objects.get(id=6)
    nurse = Nurse.objects.filter(user__username='wnurse').first()

    if not nurse:
        print("ERROR: Nurse 'wnurse' not found!")
        return

    print(f"\nDoctor: Dr. {dr_wasim.user.first_name} {dr_wasim.user.last_name}")
    print(f"Nurse: {nurse.user.username}")

    # Get available room
    room = Room.objects.filter(is_available=True).first()
    if not room:
        print("ERROR: No available rooms!")
        return

    # Get pharmacy staff
    pharma_staff = PharmacyStaff.objects.first()

    # Get procedures (non-surgical, low cost)
    procedures = []
    procedure_data = [
        ("Blood Test", "Routine blood work", 50, "non_surgical"),
        ("X-Ray", "Chest X-ray", 100, "non_surgical"),
        ("ECG", "Electrocardiogram", 80, "non_surgical"),
        ("Ultrasound", "Abdominal ultrasound", 150, "non_surgical"),
    ]

    for name, desc, cost, ptype in procedure_data:
        proc, created = Procedure.objects.get_or_create(
            name=name,
            defaults={'description': desc, 'cost': cost, 'procedure_type': ptype}
        )
        procedures.append(proc)

    # Get medicines
    medicines = []
    medicine_data = [
        ("Paracetamol 500mg", "Paracetamol", "painkiller", "Tablet", "500mg", 0.20),
        ("Vitamin D 1000IU", "Cholecalciferol", "vitamin", "Tablet", "1000IU", 0.30),
        ("Ibuprofen 200mg", "Ibuprofen", "painkiller", "Tablet", "200mg", 0.25),
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

    print(f"Procedures available: {len(procedures)}")
    print(f"Medicines available: {len(medicines)}")

    # Patient names and ages
    patients_data = [
        ("Sarah Johnson", 28, "female"),
        ("David Miller", 35, "male"),
        ("Emma Wilson", 32, "female"),
        ("James Brown", 40, "male"),
        ("Olivia Davis", 29, "female"),
        ("William Garcia", 38, "male"),
        ("Sophia Martinez", 31, "female"),
        ("Michael Rodriguez", 36, "male"),
        ("Isabella Lopez", 27, "female"),
        ("Alexander Lee", 33, "male"),
    ]

    print(f"\n{'='*70}")
    print("Creating 10 low-risk admitted patients...")
    print(f"{'='*70}\n")

    created_count = 0
    start_id = 5000  # Start from ID 5000

    today = datetime.now()

    for idx, (name, age, gender) in enumerate(patients_data):
        patient_id = start_id + idx

        # Create patient with LOW RISK values
        patient = Patient.objects.create(
            id=patient_id,
            name=name,
            age=age,
            gender=gender,
            contact=f"+44-7700-{960000 + idx:06d}",
            nhs_number=f"500{5000 + idx:06d}",

            # LOW RISK - All markers in healthy ranges
            cholesterol=round(random.uniform(150, 180), 1),  # Low cholesterol
            brain_natriuretic_peptide=round(random.uniform(20, 80), 0),  # Low BNP
            glomerular_filtration_rate=round(random.uniform(90, 120), 0),  # Good kidney function
            high_sensitivity_troponin=round(random.uniform(0.01, 0.05), 3),  # Low troponin
            creatine_kinase=round(random.uniform(40, 120), 0),  # Normal CK

            # Blood counts - normal ranges
            eosinophil_count=round(random.uniform(0.5, 3.0), 1),
            neutrophil_ratio=round(random.uniform(40, 60), 1),
            lymphocyte_count=round(random.uniform(20, 40), 1),
            red_blood_cell=round(random.uniform(4.5, 5.5), 2),
            platelet=round(random.uniform(200, 350), 0),

            # Other markers - healthy
            creatinine_enzymatic_method=round(random.uniform(0.7, 1.2), 2),
            indirect_bilirubin=round(random.uniform(0.3, 1.0), 2),
            albumin=round(random.uniform(3.5, 5.0), 2),
            mean_hemoglobin_concentration=round(random.uniform(32.0, 36.0), 1),

            insurance_status=random.choice([True, True, False]),
            handicapped=False,
        )

        # Admission date (1-5 days ago)
        days_ago = random.randint(1, 5)
        admission_date = today - timedelta(days=days_ago)

        # Create admission
        admission = Admission.objects.create(
            patient=patient,
            doctor=dr_wasim,
            nurse=nurse,
            room=room,
            admission_date=admission_date,
            status='admitted',
            requires_inpatient=True,
            doctor_notes=f"Patient admitted for routine care and monitoring."
        )

        # Add 1-2 procedures (non-surgical only)
        num_procedures = random.randint(1, 2)
        selected_procedures = random.sample(procedures, num_procedures)
        admission.procedures.set(selected_procedures)

        # Create prescription with 1-2 medicines
        prescription = Prescription.objects.create(
            patient=patient,
            doctor=dr_wasim,
            admission=admission,
            status='dispensed',
            prescribed_date=admission_date + timedelta(hours=2),
            dispensed_by=pharma_staff,
            dispensed_date=admission_date + timedelta(hours=4),
            notes="Routine medication",
            is_paid=True
        )

        num_meds = random.randint(1, 2)
        selected_meds = random.sample(medicines, num_meds)

        for med in selected_meds:
            PrescriptionItem.objects.create(
                prescription=prescription,
                medicine=med,
                quantity=random.choice([14, 30]),
                dosage_instructions="Take as directed",
                duration_days=14,
                status='dispensed',
                dispensed_date=admission_date + timedelta(hours=4)
            )

        created_count += 1
        proc_names = ", ".join([p.name for p in selected_procedures])
        print(f"[{idx+1:2d}/10] {name:25s} | Age: {age} | {days_ago}d ago | {proc_names}")

    print(f"\n{'='*70}")
    print(f"SUCCESS! Created {created_count} low-risk admitted patients")
    print(f"{'='*70}")
    print("\nAll patients:")
    print(f"  - Admitted with Dr. Wasim & Nurse wnurse")
    print(f"  - Status: admitted")
    print(f"  - Have procedures and prescriptions")
    print(f"  - LOW RISK for ML prediction (healthy vitals)")

if __name__ == '__main__':
    try:
        create_low_risk_patients()
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
