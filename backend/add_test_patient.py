#!/usr/bin/env python
"""
Add a single test patient with high-risk profile, appointment, and admission
"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Patient, Doctor, Appointment, Admission, Room
from datetime import datetime

def cleanup_test_data():
    """Clean up any existing test data"""
    print("Cleaning up any existing test data (IDs 2000+)...")
    Patient.objects.filter(id__gte=2000).delete()
    Appointment.objects.filter(id__gte=2000).delete()
    Admission.objects.filter(id__gte=2000).delete()
    print("Cleanup complete.")

def create_test_patient():
    print("\n=== Creating Test Patient ===\n")

    # Get Dr. Wasim
    doctor = Doctor.objects.get(id=6)  # Dr. Wasim
    print(f"Found doctor: {doctor.user.first_name} {doctor.user.last_name} (ID: {doctor.id})")

    # Get an available room
    room = Room.objects.filter(is_available=True).first()
    if not room:
        print("WARNING: No available rooms found, creating a test room...")
        room = Room.objects.create(
            room_number="TEST-301",
            room_type="General",
            bed_capacity=2,
            occupied_beds=0,
            is_available=True
        )
    print(f"Using room: {room.room_number}")

    # Create HIGH RISK patient with comprehensive medical data
    print("\nCreating patient with HIGH RISK profile...")
    patient = Patient.objects.create(
        id=2001,
        name="Michael Anderson",
        age=70,
        gender="male",
        contact="+44-7700-900333",
        nhs_number="2001111222",

        # High-risk cardiac markers
        cholesterol=280.5,  # High
        eosinophil_count=0.4,
        creatinine_enzymatic_method=2.1,  # Elevated (kidney issues)
        platelet=180.0,  # Low
        total_bile_acid=15.5,
        mean_corpuscular_volume=95.0,
        indirect_bilirubin=0.8,
        creatine_kinase_isoenzyme_to_creatine_kinase=0.06,
        uric_acid=8.5,  # High
        std_dev_red_blood_cell_distribution_width=15.5,
        alkaline_phosphatase=90.0,
        neutrophil_ratio=70.0,
        high_density_lipoprotein_cholesterol=30.0,  # Low (bad)
        high_sensitivity_troponin=0.15,  # Elevated (cardiac damage)
        chloride=98.0,
        glomerular_filtration_rate=55.0,  # Low (kidney dysfunction)
        creatine_kinase_isoenzyme=45.0,
        creatine_kinase=250.0,  # Elevated
        prothrombin_activity=85.0,
        brain_natriuretic_peptide=450.0,  # Very high (heart failure indicator)
        triglyceride=220.0,  # High
        mean_hemoglobin_concentration=32.0,
        lymphocyte_count=1.5,
        red_blood_cell=4.0,
        glutamic_oxaloacetic_transaminase=55.0,
        nucleotidase=8.0,
        left_ventricular_end_diastolic_diameter_LV=60.0,  # Enlarged
        d_dimer=1.2,  # Elevated
        albumin=3.2,  # Low
        thrombin_time=18.0,

        # Readmission model features
        num_lab_procedures=25,
        num_medications=8,
        time_in_hospital=5,
        number_inpatient=3,  # Multiple previous admissions
        num_procedures=2,
        discharge_disposition_id=1,
        number_diagnoses=5,
        admission_type_id=1,
        admission_source_id=7,
        number_outpatient=2,
        number_emergency=1,

        # Demographics (high-risk age group)
        gender_Male=True,
        race_Caucasian=True,
        age_70_80=True,  # High-risk age
        age_60_70=False,
        age_80_90=False,
        age_50_60=False,
        age_40_50=False,
        age_30_40=False,
        age_90_100=False,

        # Diabetes medication patterns
        insulin_Steady=True,
        insulin_No=False,
        insulin_Up=False,
        change_No=False,
        metformin_Steady=True,
        metformin_No=False,
        diabetesMed_Yes=True,
        glipizide_No=False,
        glipizide_Steady=True,
        glyburide_No=False,
        glyburide_Steady=True,
        pioglitazone_No=True,
        pioglitazone_Steady=False,
        rosiglitazone_No=True,
        rosiglitazone_Steady=False,
        glimepiride_No=False,
        glimepiride_Steady=True,

        # Lab results
        A1Cresult_gt8=True,  # Poor diabetes control
        A1Cresult_Norm=False,
        max_glu_serum_Norm=False,

        # High-risk diagnosis codes (heart failure, diabetes complications)
        diag_1_428=True,  # Congestive heart failure
        diag_1_414=False,
        diag_1_410=False,
        diag_1_486=False,
        diag_1_786=False,
        diag_1_491=False,
        diag_1_427=False,
        diag_1_276=False,
        diag_1_584=False,

        diag_2_276=True,  # Electrolyte imbalance
        diag_2_428=True,  # Heart failure
        diag_2_427=False,
        diag_2_496=False,
        diag_2_599=False,
        diag_2_403=False,
        diag_2_250=True,  # Diabetes
        diag_2_707=False,
        diag_2_411=False,
        diag_2_585=False,
        diag_2_425=False,

        diag_3_250=True,  # Diabetes
        diag_3_276=False,
        diag_3_428=False,
        diag_3_401=True,  # Hypertension
        diag_3_427=False,
        diag_3_414=False,
        diag_3_496=False,
        diag_3_585=True,  # Chronic kidney disease
        diag_3_403=False,
        diag_3_599=False,

        # Insurance
        insurance_status=True,
        handicapped=False
    )
    print(f"Created patient: {patient.name} (ID: {patient.id})")
    print(f"  Age: {patient.age}, Gender: {patient.gender}")
    print(f"  NHS Number: {patient.nhs_number}")
    print(f"  High-risk indicators: High BNP ({patient.brain_natriuretic_peptide}), Low GFR ({patient.glomerular_filtration_rate})")

    # Create appointment on 12/2/2025 at 1:30 PM
    print("\nCreating appointment...")
    appointment = Appointment.objects.create(
        id=2001,
        patient=patient,
        doctor=doctor,
        appointment_date=datetime(2025, 2, 12, 13, 30),  # 1:30 PM
        reason="Follow-up for cardiac symptoms and diabetes management",
        status="scheduled",
        notes="Patient reports chest discomfort and shortness of breath"
    )
    print(f"Created appointment: {appointment.appointment_date.strftime('%d/%m/%Y %I:%M %p')}")
    print(f"  Doctor: Dr. {doctor.user.first_name} {doctor.user.last_name}")
    print(f"  Reason: {appointment.reason}")

    # Create 2-day admission (10/2 - 12/2)
    print("\nCreating 2-day admission...")
    admission = Admission.objects.create(
        id=2001,
        patient=patient,
        doctor=doctor,
        nurse=None,  # Can be assigned later
        room=room,
        admission_date=datetime(2025, 2, 10, 8, 0),  # Admitted 10/2 at 8 AM
        discharge_date=datetime(2025, 2, 12, 16, 0),  # Discharged 12/2 at 4 PM
        status="discharged",
        requires_inpatient=True,
        doctor_notes="Patient admitted for cardiac monitoring and diabetes stabilization. Responded well to treatment. Discharged with adjusted medications."
    )

    # Update room occupancy
    room.occupy_bed()

    print(f"Created admission: {admission.admission_date.strftime('%d/%m/%Y')} to {admission.discharge_date.strftime('%d/%m/%Y')}")
    print(f"  Duration: 2 days")
    print(f"  Room: {room.room_number}")
    print(f"  Status: {admission.status}")

    print("\n" + "="*50)
    print("SUCCESS! Test patient created successfully!")
    print("="*50)
    print("\nTest Data Summary:")
    print(f"  Patient ID: {patient.id}")
    print(f"  Name: {patient.name}")
    print(f"  Appointment ID: {appointment.id}")
    print(f"  Admission ID: {admission.id}")
    print(f"\nNext Steps:")
    print("  1. Go to Patients page to see the new patient")
    print("  2. Run ML prediction to verify HIGH RISK classification")
    print("  3. Check appointments and admissions")
    print("  4. View patient profile to see all data")

if __name__ == '__main__':
    try:
        cleanup_test_data()
        create_test_patient()
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
