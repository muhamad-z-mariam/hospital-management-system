#!/usr/bin/env python
"""
Update low_test and 10 low-risk patients (IDs 5000-5009) with ALL 70 features for LOW RISK prediction
"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Patient

def update_all_low_risk_features():
    print("="*70)
    print("UPDATING LOW RISK PATIENTS WITH ALL 70 FEATURES")
    print("="*70)

    # Get low_test and 10 patients (IDs 5000-5009)
    patient_ids = list(range(5000, 5010))  # 5000-5009

    # Also get low_test by NHS number
    low_test = Patient.objects.filter(nhs_number='9999999999').first()
    if low_test:
        patient_ids.append(low_test.id)

    patients = Patient.objects.filter(id__in=patient_ids)

    print(f"\nFound {patients.count()} patients to update\n")

    for patient in patients:
        # Determine age range based on actual age
        age = patient.age
        age_30_40 = (30 <= age < 40)
        age_40_50 = (40 <= age < 50)
        age_50_60 = (50 <= age < 60)
        age_60_70 = (60 <= age < 70)
        age_70_80 = (70 <= age < 80)
        age_80_90 = (80 <= age < 90)
        age_90_100 = (age >= 90)

        # Update with ALL LOW RISK features
        Patient.objects.filter(id=patient.id).update(
            # Numeric/count fields - LOW RISK values
            num_lab_procedures=2,  # Few lab procedures
            num_medications=2,  # Few medications
            time_in_hospital=2,  # Short hospital stay
            number_inpatient=0,  # No previous inpatient visits
            num_procedures=1,  # Few procedures
            discharge_disposition_id=1,  # Discharged to home
            number_diagnoses=2,  # Few diagnoses
            admission_type_id=1,  # Elective admission
            admission_source_id=7,  # Emergency room
            number_outpatient=0,  # No outpatient visits
            number_emergency=0,  # No emergency visits

            # Gender (based on existing gender field)
            gender_Male=(patient.gender == 'male'),

            # Race - assuming Caucasian for simplicity
            race_Caucasian=True,

            # Age ranges (one-hot encoded)
            age_30_40=age_30_40,
            age_40_50=age_40_50,
            age_50_60=age_50_60,
            age_60_70=age_60_70,
            age_70_80=age_70_80,
            age_80_90=age_80_90,
            age_90_100=age_90_100,

            # Insulin - NO insulin (low risk)
            insulin_Steady=False,
            insulin_No=True,  # Not taking insulin
            insulin_Up=False,

            # Change - No medication changes
            change_No=True,

            # Metformin - Not taking (low risk)
            metformin_Steady=False,
            metformin_No=True,

            # Diabetes medication - Not taking (low risk)
            diabetesMed_Yes=False,

            # Glipizide - Not taking
            glipizide_No=True,
            glipizide_Steady=False,

            # Glyburide - Not taking
            glyburide_No=True,
            glyburide_Steady=False,

            # Pioglitazone - Not taking
            pioglitazone_No=True,
            pioglitazone_Steady=False,

            # Rosiglitazone - Not taking
            rosiglitazone_No=True,
            rosiglitazone_Steady=False,

            # Glimepiride - Not taking
            glimepiride_No=True,
            glimepiride_Steady=False,

            # A1C result - Normal (low risk)
            A1Cresult_gt8=False,
            A1Cresult_Norm=True,

            # Max glucose serum - Normal
            max_glu_serum_Norm=True,

            # Diagnosis codes - ALL FALSE (no serious conditions = low risk)
            diag_1_428=False,  # Heart failure
            diag_1_414=False,  # Coronary atherosclerosis
            diag_1_410=False,  # Acute MI
            diag_1_486=False,  # Pneumonia
            diag_1_786=False,  # Chest symptoms
            diag_1_491=False,  # COPD
            diag_1_427=False,  # Cardiac dysrhythmias
            diag_1_276=False,  # Fluid/electrolyte disorders
            diag_1_584=False,  # Acute kidney failure

            diag_2_276=False,
            diag_2_428=False,
            diag_2_427=False,
            diag_2_496=False,
            diag_2_599=False,
            diag_2_403=False,
            diag_2_250=False,
            diag_2_707=False,
            diag_2_411=False,
            diag_2_585=False,
            diag_2_425=False,

            diag_3_250=False,
            diag_3_276=False,
            diag_3_428=False,
            diag_3_401=False,
            diag_3_427=False,
            diag_3_414=False,
            diag_3_496=False,
            diag_3_585=False,
            diag_3_403=False,
            diag_3_599=False,
        )

        print(f"[OK] Updated {patient.name:25s} (ID: {patient.id}) with all 70 LOW RISK features")

    print(f"\n{'='*70}")
    print(f"SUCCESS! Updated {patients.count()} patients with LOW RISK features")
    print(f"{'='*70}")
    print("\nLOW RISK Features Applied:")
    print("  - Short hospital stay (2 days)")
    print("  - No previous admissions")
    print("  - No diabetes medications")
    print("  - Normal A1C and glucose")
    print("  - No serious diagnosis codes")
    print("  - Discharged to home")
    print("\nAll patients ready for LOW RISK ML prediction!")

if __name__ == '__main__':
    try:
        update_all_low_risk_features()
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
