#!/usr/bin/env python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Patient, Doctor, Nurse, Admission, Room
from datetime import datetime, timedelta
import random

nurse = Nurse.objects.first()
rooms = list(Room.objects.filter(is_available=True)[:5])
dr_wasim = Doctor.objects.get(id=6)
dr_ahmad = Doctor.objects.filter(user__username='ahmad').first()

patients = Patient.objects.filter(id__gte=2002)
admitted = 0
pending = 0

for p in patients:
    if not Admission.objects.filter(patient=p).exists():
        status = random.choice(['admitted', 'admitted', 'pending'])
        doctor = random.choice([dr_wasim, dr_ahmad])
        days_ago = random.randint(1, 5)
        admission_date = datetime.now() - timedelta(days=days_ago)

        admission = Admission.objects.create(
            patient=p,
            doctor=doctor,
            nurse=nurse,
            room=random.choice(rooms) if status=='admitted' else None,
            admission_date=admission_date,
            status=status,
            requires_inpatient=(status=='admitted'),
            doctor_notes='Patient under observation'
        )

        if status == 'admitted':
            admitted += 1
            print(f"Admitted: {p.name:25s} | Dr: {doctor.user.first_name}")
        else:
            pending += 1
            print(f"Pending:  {p.name:25s} | Dr: {doctor.user.first_name}")

print(f"\nTotal: {admitted} admitted, {pending} pending")
