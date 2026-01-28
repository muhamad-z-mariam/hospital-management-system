#!/usr/bin/env python
"""
Create a single test patient named 'low_test' with LOW RISK medical parameters
"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Patient

def create_low_test_patient():
    print("="*70)
    print("CREATING LOW RISK TEST PATIENT")
    print("="*70)

    # Create patient with LOW RISK values for all medical parameters
    patient = Patient.objects.create(
        name="low_test",
        age=30,
        gender="male",
        contact="+44-7700-999999",
        nhs_number="9999999999",

        # LOW RISK - All cardiac and risk markers LOW
        cholesterol=160.0,  # Low cholesterol (healthy: <200)
        brain_natriuretic_peptide=50.0,  # Low BNP (healthy: <100)
        glomerular_filtration_rate=100.0,  # Good kidney function (healthy: >90)
        high_sensitivity_troponin=0.02,  # Very low troponin (healthy: <0.04)
        creatine_kinase=80.0,  # Normal CK (healthy: 40-120)

        # Blood counts - normal/healthy ranges
        eosinophil_count=2.0,
        neutrophil_ratio=50.0,
        lymphocyte_count=30.0,
        red_blood_cell=5.0,
        platelet=250.0,

        # Other markers - all healthy
        creatinine_enzymatic_method=1.0,  # Normal kidney function
        indirect_bilirubin=0.5,  # Normal liver
        albumin=4.0,  # Good nutrition
        mean_hemoglobin_concentration=34.0,  # Normal

        # Additional parameters (all low/normal)
        total_bile_acid=5.0,
        mean_corpuscular_volume=90.0,
        creatine_kinase_isoenzyme_to_creatine_kinase=5.0,
        uric_acid=5.0,
        std_dev_red_blood_cell_distribution_width=12.0,
        alkaline_phosphatase=70.0,
        high_density_lipoprotein_cholesterol=60.0,  # High HDL is good
        chloride=100.0,
        creatine_kinase_isoenzyme=20.0,
        prothrombin_activity=100.0,
        triglyceride=100.0,
        glutamic_oxaloacetic_transaminase=25.0,
        nucleotidase=8.0,
        left_ventricular_end_diastolic_diameter_LV=50.0,
        d_dimer=0.3,
        thrombin_time=15.0,

        # Readmission model features (all low/normal)
        num_lab_procedures=3,
        num_medications=2,
        time_in_hospital=2,
        number_inpatient=0,
        num_procedures=1,

        insurance_status=True,
        handicapped=False,
    )

    print(f"\n[OK] Created patient: {patient.name}")
    print(f"  ID: {patient.id}")
    print(f"  Age: {patient.age}")
    print(f"  NHS Number: {patient.nhs_number}")
    print(f"\n[OK] All medical parameters filled with LOW RISK values")
    print(f"  - Cholesterol: {patient.cholesterol}")
    print(f"  - BNP: {patient.brain_natriuretic_peptide}")
    print(f"  - Troponin: {patient.high_sensitivity_troponin}")
    print(f"  - GFR: {patient.glomerular_filtration_rate}")
    print(f"\n{'='*70}")
    print("SUCCESS! Patient 'low_test' ready for LOW RISK prediction")
    print(f"{'='*70}")

if __name__ == '__main__':
    try:
        create_low_test_patient()
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
