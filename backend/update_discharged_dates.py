#!/usr/bin/env python
"""
Update discharged patients with realistic admission and discharge dates
"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Admission
from datetime import datetime, timedelta
import random

def update_discharged_dates():
    print("="*70)
    print("UPDATING DISCHARGED PATIENT DATES")
    print("="*70)

    # Get all discharged admissions (limiting to 20 most recent)
    discharged = Admission.objects.filter(status='discharged').order_by('-id')[:20]

    if discharged.count() == 0:
        print("No discharged patients found!")
        return

    print(f"\nFound {discharged.count()} discharged patients\n")

    today = datetime.now()

    # Define discharge periods
    discharge_periods = [
        # This week (7 patients) - discharged 1-7 days ago
        (1, 7, "THIS WEEK"),
        (2, 7, "THIS WEEK"),
        (3, 7, "THIS WEEK"),
        (4, 7, "THIS WEEK"),
        (5, 7, "THIS WEEK"),
        (6, 7, "THIS WEEK"),
        (7, 7, "THIS WEEK"),

        # Two weeks ago (7 patients) - discharged 8-14 days ago
        (8, 14, "2 WEEKS AGO"),
        (9, 14, "2 WEEKS AGO"),
        (10, 14, "2 WEEKS AGO"),
        (11, 14, "2 WEEKS AGO"),
        (12, 14, "2 WEEKS AGO"),
        (13, 14, "2 WEEKS AGO"),
        (14, 14, "2 WEEKS AGO"),

        # One month ago (6 patients) - discharged 25-35 days ago
        (25, 35, "1 MONTH AGO"),
        (28, 35, "1 MONTH AGO"),
        (30, 35, "1 MONTH AGO"),
        (32, 35, "1 MONTH AGO"),
        (34, 35, "1 MONTH AGO"),
        (35, 35, "1 MONTH AGO"),
    ]

    updated = 0

    for idx, (admission, (days_back_min, days_back_max, period)) in enumerate(zip(discharged, discharge_periods)):
        # Calculate discharge date
        days_back = random.randint(days_back_min, days_back_max)
        discharge_date = today - timedelta(days=days_back)

        # Calculate admission date (1-7 days before discharge, within last 2 months)
        stay_days = random.randint(1, 7)
        admission_date = discharge_date - timedelta(days=stay_days)

        # Make sure admission is within last 2 months
        two_months_ago = today - timedelta(days=60)
        if admission_date < two_months_ago:
            admission_date = two_months_ago + timedelta(days=random.randint(1, 5))

        # Update admission
        admission.admission_date = admission_date
        admission.discharge_date = discharge_date
        admission.save()

        updated += 1
        print(f"[{idx+1:2d}/20] [{period:12s}] {admission.patient.name:25s} | Admitted: {admission_date.strftime('%d/%m/%Y')} | Discharged: {discharge_date.strftime('%d/%m/%Y')} | Stay: {stay_days}d")

    print(f"\n{'='*70}")
    print(f"SUCCESS! Updated {updated} discharged patient dates")
    print(f"{'='*70}")
    print("\nDistribution:")
    print(f"  - This week:    ~7 patients")
    print(f"  - 2 weeks ago:  ~7 patients")
    print(f"  - 1 month ago:  ~6 patients")
    print(f"  - All admissions within last 2 months")

if __name__ == '__main__':
    try:
        update_discharged_dates()
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
