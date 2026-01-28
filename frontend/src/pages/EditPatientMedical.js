import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const EditPatientMedical = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPatient();
  }, [id]);

  const fetchPatient = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/patients/${id}/`);
      const data = await response.json();
      setPatient(data);
      setFormData(data);
    } catch (error) {
      console.error("Error fetching patient:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/patients/${id}/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        alert("Medical parameters updated successfully!");
        navigate("/my-patients");
      } else {
        setError("Failed to update patient");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={styles.layout}>
          <Sidebar />
          <main style={styles.content}>
            <div style={styles.loading}>Loading patient data...</div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div style={styles.layout}>
        <Sidebar />
        <main style={styles.content}>
          <div style={styles.header}>
            <h1 style={styles.pageTitle}>Update Medical Parameters</h1>
            <button
              onClick={() => navigate("/my-patients")}
              style={styles.backButton}
            >
              ← Back
            </button>
          </div>

          <div style={styles.infoCard}>
            <h3 style={styles.patientName}>👤 {patient?.name}</h3>
            <p style={styles.patientInfo}>
              Age: {patient?.age}
            </p>
          </div>

          <div style={styles.formContainer}>
            <form onSubmit={handleSubmit} style={styles.form}>
              {error && <div style={styles.error}>{error}</div>}

              {/* Hospital Stay Information */}
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>
                  🏥 Hospital Stay Information
                </h3>
                <div style={styles.row}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Number of Lab Procedures</label>
                    <input
                      type="number"
                      name="num_lab_procedures"
                      value={formData.num_lab_procedures || ""}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Number of Medications</label>
                    <input
                      type="number"
                      name="num_medications"
                      value={formData.num_medications || ""}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Time in Hospital (days)</label>
                    <input
                      type="number"
                      name="time_in_hospital"
                      value={formData.time_in_hospital || ""}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={styles.row}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Number of Inpatient Visits</label>
                    <input
                      type="number"
                      name="number_inpatient"
                      value={formData.number_inpatient || ""}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Number of Procedures</label>
                    <input
                      type="number"
                      name="num_procedures"
                      value={formData.num_procedures || ""}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Number of Outpatient Visits</label>
                    <input
                      type="number"
                      name="number_outpatient"
                      value={formData.number_outpatient || ""}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={styles.row}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Number of Emergency Visits</label>
                    <input
                      type="number"
                      name="number_emergency"
                      value={formData.number_emergency || ""}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Number of Diagnoses</label>
                    <input
                      type="number"
                      name="number_diagnoses"
                      value={formData.number_diagnoses || ""}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Discharge Disposition ID</label>
                    <input
                      type="number"
                      name="discharge_disposition_id"
                      value={formData.discharge_disposition_id || ""}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={styles.row}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Admission Type ID</label>
                    <input
                      type="number"
                      name="admission_type_id"
                      value={formData.admission_type_id || ""}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Admission Source ID</label>
                    <input
                      type="number"
                      name="admission_source_id"
                      value={formData.admission_source_id || ""}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  </div>
                </div>
              </div>

              {/* Demographics */}
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>👥 Demographics & Age Range</h3>
                <div style={styles.checkboxGrid}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="gender_Male"
                      checked={formData.gender_Male || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    Male Gender
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="race_Caucasian"
                      checked={formData.race_Caucasian || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    Caucasian Race
                  </label>
                </div>

                <h4 style={styles.subsectionTitle}>Age Range (Select One)</h4>
                <div style={styles.checkboxGrid}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="age_30_40"
                      checked={formData.age_30_40 || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    Age 30-40
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="age_40_50"
                      checked={formData.age_40_50 || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    Age 40-50
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="age_50_60"
                      checked={formData.age_50_60 || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    Age 50-60
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="age_60_70"
                      checked={formData.age_60_70 || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    Age 60-70
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="age_70_80"
                      checked={formData.age_70_80 || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    Age 70-80
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="age_80_90"
                      checked={formData.age_80_90 || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    Age 80-90
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="age_90_100"
                      checked={formData.age_90_100 || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    Age 90-100
                  </label>
                </div>
              </div>

              {/* Diabetes Medications */}
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>💊 Diabetes Medications</h3>

                <h4 style={styles.subsectionTitle}>General</h4>
                <div style={styles.checkboxGrid}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="diabetesMed_Yes"
                      checked={formData.diabetesMed_Yes || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    On Diabetes Medication
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="change_No"
                      checked={formData.change_No || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    No Medication Change
                  </label>
                </div>

                <h4 style={styles.subsectionTitle}>Insulin</h4>
                <div style={styles.checkboxGrid}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="insulin_No"
                      checked={formData.insulin_No || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    No Insulin
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="insulin_Steady"
                      checked={formData.insulin_Steady || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    Insulin Steady
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="insulin_Up"
                      checked={formData.insulin_Up || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    Insulin Increased
                  </label>
                </div>

                <h4 style={styles.subsectionTitle}>Metformin</h4>
                <div style={styles.checkboxGrid}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="metformin_No"
                      checked={formData.metformin_No || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    No Metformin
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="metformin_Steady"
                      checked={formData.metformin_Steady || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    Metformin Steady
                  </label>
                </div>

                <h4 style={styles.subsectionTitle}>Glipizide</h4>
                <div style={styles.checkboxGrid}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="glipizide_No"
                      checked={formData.glipizide_No || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    No Glipizide
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="glipizide_Steady"
                      checked={formData.glipizide_Steady || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    Glipizide Steady
                  </label>
                </div>

                <h4 style={styles.subsectionTitle}>Glyburide</h4>
                <div style={styles.checkboxGrid}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="glyburide_No"
                      checked={formData.glyburide_No || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    No Glyburide
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="glyburide_Steady"
                      checked={formData.glyburide_Steady || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    Glyburide Steady
                  </label>
                </div>

                <h4 style={styles.subsectionTitle}>Pioglitazone</h4>
                <div style={styles.checkboxGrid}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="pioglitazone_No"
                      checked={formData.pioglitazone_No || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    No Pioglitazone
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="pioglitazone_Steady"
                      checked={formData.pioglitazone_Steady || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    Pioglitazone Steady
                  </label>
                </div>

                <h4 style={styles.subsectionTitle}>Rosiglitazone</h4>
                <div style={styles.checkboxGrid}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="rosiglitazone_No"
                      checked={formData.rosiglitazone_No || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    No Rosiglitazone
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="rosiglitazone_Steady"
                      checked={formData.rosiglitazone_Steady || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    Rosiglitazone Steady
                  </label>
                </div>

                <h4 style={styles.subsectionTitle}>Glimepiride</h4>
                <div style={styles.checkboxGrid}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="glimepiride_No"
                      checked={formData.glimepiride_No || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    No Glimepiride
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="glimepiride_Steady"
                      checked={formData.glimepiride_Steady || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    Glimepiride Steady
                  </label>
                </div>
              </div>

              {/* Lab Results */}
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>🔬 Lab Results</h3>
                <div style={styles.checkboxGrid}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="A1Cresult_gt8"
                      checked={formData.A1Cresult_gt8 || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    A1C Result {'>'} 8
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="A1Cresult_Norm"
                      checked={formData.A1Cresult_Norm || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    A1C Result Normal
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="max_glu_serum_Norm"
                      checked={formData.max_glu_serum_Norm || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    Max Glucose Serum Normal
                  </label>
                </div>
              </div>

              {/* Diagnosis Codes */}
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>🩺 Diagnosis Codes (ICD)</h3>

                <h4 style={styles.subsectionTitle}>Primary Diagnosis</h4>
                <div style={styles.checkboxGrid}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="diag_1_428"
                      checked={formData.diag_1_428 || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    428 (Heart Failure)
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="diag_1_414"
                      checked={formData.diag_1_414 || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    414 (Coronary Artery)
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="diag_1_410"
                      checked={formData.diag_1_410 || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    410 (MI)
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="diag_1_486"
                      checked={formData.diag_1_486 || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    486 (Pneumonia)
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="diag_1_786"
                      checked={formData.diag_1_786 || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    786 (Chest Pain)
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="diag_1_491"
                      checked={formData.diag_1_491 || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    491 (COPD)
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="diag_1_427"
                      checked={formData.diag_1_427 || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    427 (Arrhythmia)
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="diag_1_276"
                      checked={formData.diag_1_276 || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    276 (Fluid Disorders)
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="diag_1_584"
                      checked={formData.diag_1_584 || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    584 (Acute Kidney)
                  </label>
                </div>

                <h4 style={styles.subsectionTitle}>Secondary Diagnosis</h4>
                <div style={styles.checkboxGrid}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="diag_2_276"
                      checked={formData.diag_2_276 || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    276 (Fluid Disorders)
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="diag_2_428"
                      checked={formData.diag_2_428 || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    428 (Heart Failure)
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="diag_2_427"
                      checked={formData.diag_2_427 || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    427 (Arrhythmia)
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="diag_2_496"
                      checked={formData.diag_2_496 || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    496 (COPD)
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="diag_2_599"
                      checked={formData.diag_2_599 || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    599 (UTI)
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="diag_2_403"
                      checked={formData.diag_2_403 || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    403 (Kidney/HTN)
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="diag_2_250"
                      checked={formData.diag_2_250 || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    250 (Diabetes)
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="diag_2_707"
                      checked={formData.diag_2_707 || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    707 (Skin Ulcer)
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="diag_2_411"
                      checked={formData.diag_2_411 || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    411 (Angina)
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="diag_2_585"
                      checked={formData.diag_2_585 || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    585 (Chronic Kidney)
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="diag_2_425"
                      checked={formData.diag_2_425 || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    425 (Cardiomyopathy)
                  </label>
                </div>

                <h4 style={styles.subsectionTitle}>Tertiary Diagnosis</h4>
                <div style={styles.checkboxGrid}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="diag_3_250"
                      checked={formData.diag_3_250 || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    250 (Diabetes)
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="diag_3_276"
                      checked={formData.diag_3_276 || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    276 (Fluid Disorders)
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="diag_3_428"
                      checked={formData.diag_3_428 || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    428 (Heart Failure)
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="diag_3_401"
                      checked={formData.diag_3_401 || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    401 (Hypertension)
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="diag_3_427"
                      checked={formData.diag_3_427 || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    427 (Arrhythmia)
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="diag_3_414"
                      checked={formData.diag_3_414 || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    414 (Coronary Artery)
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="diag_3_496"
                      checked={formData.diag_3_496 || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    496 (COPD)
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="diag_3_585"
                      checked={formData.diag_3_585 || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    585 (Chronic Kidney)
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="diag_3_403"
                      checked={formData.diag_3_403 || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    403 (Kidney/HTN)
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="diag_3_599"
                      checked={formData.diag_3_599 || false}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    599 (UTI)
                  </label>
                </div>

                <p style={styles.note}>
                  💡 These diagnosis codes are from the ICD-9 system used in the training data.
                </p>
              </div>

              <button
                type="submit"
                style={styles.submitButton}
                disabled={saving}
              >
                {saving ? "Saving..." : "✅ Save All Medical Parameters"}
              </button>
            </form>
          </div>
        </main>
      </div>
    </>
  );
};

const styles = {
  layout: { display: "flex" },
  content: {
    marginLeft: "250px",
    padding: "2rem",
    backgroundColor: "#f8fafc",
    minHeight: "calc(100vh - 73px)",
    width: "calc(100% - 250px)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
  },
  pageTitle: { fontSize: "2rem", color: "#1e293b", margin: 0 },
  backButton: {
    backgroundColor: "#64748b",
    color: "white",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    cursor: "pointer",
  },
  loading: {
    textAlign: "center",
    padding: "3rem",
    fontSize: "1.1rem",
    color: "#64748b",
  },
  infoCard: {
    backgroundColor: "white",
    padding: "1.5rem",
    borderRadius: "12px",
    marginBottom: "1.5rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  patientName: { color: "#1e293b", margin: "0 0 0.5rem 0" },
  patientInfo: { color: "#64748b", margin: 0 },
  formContainer: {
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  form: { display: "flex", flexDirection: "column", gap: "2rem" },
  section: {
    padding: "1.5rem",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    border: "2px solid #e2e8f0",
  },
  sectionTitle: {
    color: "#1e293b",
    fontSize: "1.25rem",
    marginTop: 0,
    marginBottom: "1rem",
    paddingBottom: "0.5rem",
    borderBottom: "2px solid #e2e8f0",
  },
  subsectionTitle: {
    color: "#475569",
    fontSize: "1rem",
    marginTop: "1.5rem",
    marginBottom: "1rem",
    fontWeight: "600",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "1rem",
    marginBottom: "1rem",
  },
  inputGroup: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  label: { color: "#334155", fontSize: "0.9rem", fontWeight: "500" },
  input: {
    padding: "0.75rem",
    border: "2px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "1rem",
  },
  checkboxGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "0.75rem",
    marginBottom: "1rem",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    color: "#334155",
    fontSize: "0.9rem",
    cursor: "pointer",
  },
  checkbox: {
    width: "18px",
    height: "18px",
    cursor: "pointer",
  },
  note: {
    color: "#64748b",
    fontSize: "0.9rem",
    fontStyle: "italic",
    margin: "1rem 0 0 0",
  },
  submitButton: {
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    padding: "1rem",
    borderRadius: "8px",
    fontSize: "1.1rem",
    fontWeight: "600",
    cursor: "pointer",
  },
  error: {
    backgroundColor: "#fee2e2",
    color: "#dc2626",
    padding: "0.75rem",
    borderRadius: "6px",
  },
};

export default EditPatientMedical;
