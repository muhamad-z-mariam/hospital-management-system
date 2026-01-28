#!/usr/bin/env python
"""
Reset database and populate with 20 realistic patients
- Delete all old patients except test patient (ID 2001)
- Create Dr. Ahmad
- Add 20 diverse patients with admissions
"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.hashers import make_password
from api.models import (
    User, Patient, Doctor, Nurse, Appointment, Admission, Room
)
from datetime import datetime, timedelta
import random

def delete_old_patients():
    """Delete all patients except Michael Anderson (ID 2001)"""
    print("Step 1: Deleting old patients...")
    deleted = Patient.objects.exclude(id=2001).delete()
    print(f"  Deleted {deleted[0]} records")

def create_dr_ahmad():
    """Create Dr. Ahmad user and profile"""
    print("\nStep 2: Creating Dr. Ahmad...")

    # Check if user already exists
    if User.objects.filter(username='ahmad').exists():
        print("  Dr. Ahmad already exists, skipping...")
        user = User.objects.get(username='ahmad')
        doctor = Doctor.objects.filter(user=user).first()
        if not doctor:
            doctor = Doctor.objects.create(user=user, specialty='Internal Medicine')
            print("  Created Doctor profile for existing user")
        return doctor

    user = User.objects.create(
        username='ahmad',
        first_name='Ahmad',
        last_name='Hassan',
        email='ahmad.hassan@hospital.com',
        role='doctor',
        password=make_password('ahmad123'),
        is_active=True
    )

    doctor = Doctor.objects.create(
        user=user,
        specialty='Internal Medicine'
    )

    print(f"  Created: Dr. {user.first_name} {user.last_name}")
    print(f"  Username: {user.username}, Password: ahmad123")
    print(f"  Specialty: {doctor.specialty}")
    return doctor

def create_patients():
    """Create 20 diverse patients"""
    print("\nStep 3: Creating 20 patients...")

    # Get doctors
    dr_wasim = Doctor.objects.get(id=6)
    dr_ahmad = Doctor.objects.filter(user__username='ahmad').first()

    # Get available rooms
    rooms = list(Room.objects.filter(is_available=True)[:5])
    if not rooms:
        print("  WARNING: No available rooms!")
        return []

    # Get a nurse
    nurse = Nurse.objects.first()

    patients_data = [
        # High-risk elderly patients
        {
            'name': 'Sarah Thompson', 'age': 75, 'gender': 'female',
            'cholesterol': 290, 'brain_natriuretic_peptide': 500, 'glomerular_filtration_rate': 45,
            'status': 'admitted', 'doctor': dr_wasim, 'risk': 'high'
        },
        {
            'name': 'Robert Mitchell', 'age': 68, 'gender': 'male',
            'cholesterol': 270, 'brain_natriuretic_peptide': 420, 'glomerular_filtration_rate': 50,
            'status': 'admitted', 'doctor': dr_ahmad, 'risk': 'high'
        },
        {
            'name': 'Margaret Wilson', 'age': 72, 'gender': 'female',
            'cholesterol': 285, 'brain_natriuretic_peptide': 480, 'glomerular_filtration_rate': 48,
            'status': 'pending', 'doctor': dr_wasim, 'risk': 'high'
        },

        # Medium-risk middle-aged patients
        {
            'name': 'James Parker', 'age': 55, 'gender': 'male',
            'cholesterol': 230, 'brain_natriuretic_peptide': 180, 'glomerular_filtration_rate': 75,
            'status': 'admitted', 'doctor': dr_ahmad, 'risk': 'medium'
        },
        {
            'name': 'Linda Davis', 'age': 58, 'gender': 'female',
            'cholesterol': 225, 'brain_natriuretic_peptide': 160, 'glomerular_filtration_rate': 80,
            'status': 'admitted', 'doctor': dr_wasim, 'risk': 'medium'
        },
        {
            'name': 'David Brown', 'age': 52, 'gender': 'male',
            'cholesterol': 215, 'brain_natriuretic_peptide': 140, 'glomerular_filtration_rate': 85,
            'status': 'pending', 'doctor': dr_ahmad, 'risk': 'medium'
        },
        {
            'name': 'Patricia Miller', 'age': 60, 'gender': 'female',
            'cholesterol': 240, 'brain_natriuretic_peptide': 170, 'glomerular_filtration_rate': 78,
            'status': 'admitted', 'doctor': dr_wasim, 'risk': 'medium'
        },

        # Low-risk younger patients
        {
            'name': 'Jennifer Garcia', 'age': 35, 'gender': 'female',
            'cholesterol': 180, 'brain_natriuretic_peptide': 50, 'glomerular_filtration_rate': 95,
            'status': 'pending', 'doctor': dr_ahmad, 'risk': 'low'
        },
        {
            'name': 'Christopher Lee', 'age': 42, 'gender': 'male',
            'cholesterol': 190, 'brain_natriuretic_peptide': 60, 'glomerular_filtration_rate': 92,
            'status': 'admitted', 'doctor': dr_wasim, 'risk': 'low'
        },
        {
            'name': 'Emily White', 'age': 38, 'gender': 'female',
            'cholesterol': 175, 'brain_natriuretic_peptide': 55, 'glomerular_filtration_rate': 98,
            'status': 'pending', 'doctor': dr_ahmad, 'risk': 'low'
        },
        {
            'name': 'Daniel Martinez', 'age': 45, 'gender': 'male',
            'cholesterol': 195, 'brain_natriuretic_peptide': 65, 'glomerular_filtration_rate': 90,
            'status': 'admitted', 'doctor': dr_ahmad, 'risk': 'low'
        },

        # More diverse cases
        {
            'name': 'Susan Rodriguez', 'age': 63, 'gender': 'female',
            'cholesterol': 250, 'brain_natriuretic_peptide': 300, 'glomerular_filtration_rate': 65,
            'status': 'admitted', 'doctor': dr_wasim, 'risk': 'high'
        },
        {
            'name': 'Thomas Anderson', 'age': 50, 'gender': 'male',
            'cholesterol': 210, 'brain_natriuretic_peptide': 120, 'glomerular_filtration_rate': 88,
            'status': 'pending', 'doctor': dr_ahmad, 'risk': 'medium'
        },
        {
            'name': 'Mary Johnson', 'age': 70, 'gender': 'female',
            'cholesterol': 275, 'brain_natriuretic_peptide': 440, 'glomerular_filtration_rate': 52,
            'status': 'admitted', 'doctor': dr_wasim, 'risk': 'high'
        },
        {
            'name': 'Charles Taylor', 'age': 48, 'gender': 'male',
            'cholesterol': 200, 'brain_natriuretic_peptide': 100, 'glomerular_filtration_rate': 86,
            'status': 'pending', 'doctor': dr_ahmad, 'risk': 'low'
        },
        {
            'name': 'Barbara Thomas', 'age': 65, 'gender': 'female',
            'cholesterol': 260, 'brain_natriuretic_peptide': 350, 'glomerular_filtration_rate': 60,
            'status': 'admitted', 'doctor': dr_ahmad, 'risk': 'high'
        },
        {
            'name': 'Richard Jackson', 'age': 56, 'gender': 'male',
            'cholesterol': 220, 'brain_natriuretic_peptide': 150, 'glomerular_filtration_rate': 82,
            'status': 'pending', 'doctor': dr_wasim, 'risk': 'medium'
        },
        {
            'name': 'Nancy Harris', 'age': 40, 'gender': 'female',
            'cholesterol': 185, 'brain_natriuretic_peptide': 58, 'glomerular_filtration_rate': 94,
            'status': 'admitted', 'doctor': dr_wasim, 'risk': 'low'
        },
        {
            'name': 'Kevin Clark', 'age': 67, 'gender': 'male',
            'cholesterol': 265, 'brain_natriuretic_peptide': 390, 'glomerular_filtration_rate': 58,
            'status': 'admitted', 'doctor': dr_ahmad, 'risk': 'high'
        },
        {
            'name': 'Lisa Lewis', 'age': 53, 'gender': 'male',
            'cholesterol': 205, 'brain_natriuretic_peptide': 110, 'glomerular_filtration_rate': 84,
            'status': 'pending', 'doctor': dr_wasim, 'risk': 'medium'
        }
    ]

    created_patients = []
    start_id = 2002

    for idx, data in enumerate(patients_data):
        patient_id = start_id + idx

        # Create patient
        patient = Patient.objects.create(
            id=patient_id,
            name=data['name'],
            age=data['age'],
            gender=data['gender'],
            contact=f"+44-7700-{900400 + idx:06d}",
            nhs_number=f"200{2000 + idx:06d}",

            # Medical parameters
            cholesterol=data['cholesterol'],
            brain_natriuretic_peptide=data['brain_natriuretic_peptide'],
            glomerular_filtration_rate=data['glomerular_filtration_rate'],
            eosinophil_count=round(random.uniform(0.2, 0.5), 2),
            creatinine_enzymatic_method=round(random.uniform(0.8, 2.5), 1),
            platelet=round(random.uniform(150, 300), 0),
            high_sensitivity_troponin=round(random.uniform(0.01, 0.2), 3),
            uric_acid=round(random.uniform(3.5, 9.0), 1),
            alkaline_phosphatase=round(random.uniform(40, 120), 0),

            # Demographics
            gender_Male=(data['gender'] == 'male'),
            race_Caucasian=True,
            age_70_80=(70 <= data['age'] < 80),
            age_60_70=(60 <= data['age'] < 70),
            age_50_60=(50 <= data['age'] < 60),
            age_40_50=(40 <= data['age'] < 50),
            age_30_40=(30 <= data['age'] < 40),

            # Insurance
            insurance_status=random.choice([True, False]),
            handicapped=False
        )

        created_patients.append({
            'patient': patient,
            'doctor': data['doctor'],
            'status': data['status'],
            'risk': data['risk']
        })

        print(f"  [{idx+1:2d}/20] Created: {patient.name:25s} | Age: {patient.age:2d} | Risk: {data['risk']:6s} | Status: {data['status']:8s} | Dr: {data['doctor'].user.first_name}")

    return created_patients

def create_admissions(patients_data):
    """Create admissions for patients marked as 'admitted' or 'pending'"""
    print("\nStep 4: Creating admissions...")

    rooms = list(Room.objects.filter(is_available=True)[:5])
    nurse = Nurse.objects.first()

    admitted_count = 0
    pending_count = 0

    for data in patients_data:
        patient = data['patient']
        status = data['status']
        doctor = data['doctor']

        if status in ['admitted', 'pending']:
            # Random admission date in the past 1-5 days
            days_ago = random.randint(1, 5)
            admission_date = datetime.now() - timedelta(days=days_ago)

            admission = Admission.objects.create(
                patient=patient,
                doctor=doctor,
                nurse=nurse,
                room=random.choice(rooms) if status == 'admitted' else None,
                admission_date=admission_date,
                discharge_date=None,
                status=status,
                requires_inpatient=(status == 'admitted'),
                doctor_notes=f"Patient admitted for observation and treatment. {'Currently in room.' if status == 'admitted' else 'Waiting for doctor assessment.'}"
            )

            if status == 'admitted':
                admitted_count += 1
                print(f"  ✓ Admitted: {patient.name:25s} | Room: {admission.room.room_number if admission.room else 'N/A':10s} | Dr: {doctor.user.first_name}")
            else:
                pending_count += 1
                print(f"  ⏳ Pending:  {patient.name:25s} | Waiting for doctor | Dr: {doctor.user.first_name}")

    print(f"\n  Summary: {admitted_count} admitted, {pending_count} pending")

def main():
    print("="*70)
    print("HOSPITAL DATABASE RESET & POPULATION")
    print("="*70)

    delete_old_patients()
    dr_ahmad = create_dr_ahmad()
    patients_data = create_patients()
    create_admissions(patients_data)

    print("\n" + "="*70)
    print("SUCCESS! Database populated with 20 patients")
    print("="*70)
    print("\nSummary:")
    print(f"  - Kept: Michael Anderson (ID: 2001)")
    print(f"  - Created: 20 new patients (IDs: 2002-2021)")
    print(f"  - Doctors: Dr. Wasim & Dr. Ahmad")
    print(f"  - Mix of admitted/pending patients")
    print(f"\nDr. Ahmad Login:")
    print(f"  Username: ahmad")
    print(f"  Password: ahmad123")

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
