#!/usr/bin/env python
"""
Create appointments for all patients admitted with Dr. Wasim
"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Patient, Doctor, Admission, Appointment
from datetime import datetime, timedelta
import random

def create_appointments():
    print("Creating appointments for Dr. Wasim's admitted patients...\n")

    # Get Dr. Wasim
    dr_wasim = Doctor.objects.get(id=6)

    # Get all patients admitted with Dr. Wasim
    admissions = Admission.objects.filter(
        doctor=dr_wasim,
        status='admitted'
    ).select_related('patient')

    if not admissions:
        print("No admitted patients found for Dr. Wasim")
        return

    print(f"Found {admissions.count()} admitted patients with Dr. Wasim\n")

    # Time slots for appointments
    time_slots = [
        (9, 0),   # 9:00 AM
        (10, 30), # 10:30 AM
        (11, 0),  # 11:00 AM
        (13, 0),  # 1:00 PM
        (14, 30), # 2:30 PM
        (15, 0),  # 3:00 PM
        (16, 30), # 4:30 PM
    ]

    reasons = [
        "Post-admission checkup and treatment review",
        "Follow-up examination",
        "Medication adjustment consultation",
        "Progress evaluation",
        "Treatment response assessment",
        "Routine checkup during admission",
        "Cardiac monitoring review",
        "Lab results discussion"
    ]

    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

    # Distribute appointments: today, tomorrow, in 2 days
    day_offsets = [0, 0, 1, 1, 2, 2]  # Multiple today, tomorrow, day after
    random.shuffle(day_offsets)

    created_count = 0
    today_count = 0
    tomorrow_count = 0
    day_after_count = 0

    for idx, admission in enumerate(admissions):
        patient = admission.patient

        # Skip if appointment already exists
        if Appointment.objects.filter(patient=patient, doctor=dr_wasim).exists():
            print(f"  [SKIP] {patient.name:25s} - Already has appointment")
            continue

        # Get day offset
        day_offset = day_offsets[idx % len(day_offsets)]

        # Random time slot
        hour, minute = random.choice(time_slots)

        appointment_date = today + timedelta(days=day_offset, hours=hour, minutes=minute)

        # Create appointment
        appointment = Appointment.objects.create(
            patient=patient,
            doctor=dr_wasim,
            appointment_date=appointment_date,
            reason=random.choice(reasons),
            status='scheduled',
            notes=f"Follow-up during current admission in Room {admission.room.room_number if admission.room else 'N/A'}"
        )

        day_label = "TODAY" if day_offset == 0 else "TOMORROW" if day_offset == 1 else "DAY AFTER"

        if day_offset == 0:
            today_count += 1
        elif day_offset == 1:
            tomorrow_count += 1
        else:
            day_after_count += 1

        print(f"  [{day_label:10s}] {patient.name:25s} | {appointment_date.strftime('%d/%m/%Y %I:%M %p')}")

        created_count += 1

    print(f"\n{'='*70}")
    print(f"SUCCESS! Created {created_count} appointments")
    print(f"{'='*70}")
    print(f"\nDistribution:")
    print(f"  - Today:       {today_count} appointments")
    print(f"  - Tomorrow:    {tomorrow_count} appointments")
    print(f"  - In 2 days:   {day_after_count} appointments")
    print(f"\nAll appointments are with Dr. Wasim")

if __name__ == '__main__':
    try:
        create_appointments()
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
