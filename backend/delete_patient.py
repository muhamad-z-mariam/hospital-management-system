#!/usr/bin/env python
"""
Completely delete a patient and ALL related data from the system
"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import (
    Patient, Appointment, Admission, Payment, PredictionRecord, Prescription
)

def delete_patient(patient_id):
    try:
        patient = Patient.objects.get(id=patient_id)
        patient_name = patient.name

        print(f"Deleting patient: {patient_name} (ID: {patient_id})")
        print("="*50)

        # Count related records
        appointments = Appointment.objects.filter(patient=patient).count()
        admissions = Admission.objects.filter(patient=patient).count()
        payments = Payment.objects.filter(patient=patient).count()
        predictions = PredictionRecord.objects.filter(patient=patient).count()
        prescriptions = Prescription.objects.filter(patient=patient).count()

        print(f"\nRelated records to be deleted:")
        print(f"  - Appointments: {appointments}")
        print(f"  - Admissions: {admissions}")
        print(f"  - Payments: {payments}")
        print(f"  - Predictions: {predictions}")
        print(f"  - Prescriptions: {prescriptions}")

        # Django's CASCADE delete will handle all related records
        print(f"\nDeleting patient and all related data...")
        patient.delete()

        print(f"\nSUCCESS! Patient '{patient_name}' completely removed from system.")

    except Patient.DoesNotExist:
        print(f"ERROR: Patient with ID {patient_id} not found")
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    # Delete Talal (ID: 13)
    delete_patient(13)
