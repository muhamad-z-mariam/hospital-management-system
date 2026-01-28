import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { patientAPI, predictionAPI } from "../api/api";
import { useAuth } from "../context/AuthContext";

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [prediction, setPrediction] = useState(null);

  useEffect(() => {
    fetchPatient();
  }, [id]);

  const fetchPatient = async () => {
    try {
      const data = await patientAPI.getById(id);
      setPatient(data);
    } catch (error) {
      console.error("Error fetching patient:", error);
      setPatient(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePredict = async () => {
    setPredicting(true);
    try {
      const data = await predictionAPI.predict(id, user.id);
      setPrediction(data);
    } catch (error) {
      console.error("Error predicting:", error);
      alert("Prediction failed. Make sure patient has medical data.");
    } finally {
      setPredicting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={styles.layout}>
          <Sidebar />
          <main style={styles.content}>
            <div style={styles.loading}>Loading patient details...</div>
          </main>
        </div>
      </>
    );
  }

  if (!patient) {
    return (
      <>
        <Navbar />
        <div style={styles.layout}>
          <Sidebar />
          <main style={styles.content}>
            <div style={styles.error}>Patient not found</div>
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
            <h1 style={styles.pageTitle}>Patient Details</h1>
            <button
              onClick={() => navigate("/patients")}
              style={styles.backButton}
            >
              ← Back to Patients
            </button>
          </div>

          <div style={styles.detailsContainer}>
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Basic Information</h2>
              <div style={styles.infoGrid}>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Name:</span>
                  <span style={styles.infoValue}>{patient.name}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Age:</span>
                  <span style={styles.infoValue}>{patient.age} years</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Gender:</span>
                  <span style={styles.infoValue}>{patient.gender}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Contact:</span>
                  <span style={styles.infoValue}>{patient.contact}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Insurance:</span>
                  <span style={styles.infoValue}>
                    {patient.insurance_status
                      ? "✅ Insured"
                      : "❌ No Insurance"}
                  </span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Handicapped:</span>
                  <span style={styles.infoValue}>
                    {patient.handicapped ? "✅ Yes" : "❌ No"}
                  </span>
                </div>
              </div>
            </div>

            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>
                🔮 Readmission Risk Prediction
              </h2>
              <p style={styles.predictionInfo}>
                Click the button below to predict readmission risk based on
                patient's medical data
              </p>
              <button
                onClick={handlePredict}
                style={styles.predictButton}
                disabled={predicting}
              >
                {predicting ? "🔄 Predicting..." : "🔮 Run Prediction"}
              </button>

              {prediction && (
                <div
                  style={{
                    ...styles.predictionResult,
                    backgroundColor:
                      prediction.risk === 1 ? "#fee2e2" : "#dcfce7",
                    borderColor: prediction.risk === 1 ? "#dc2626" : "#059669",
                  }}
                >
                  <h3
                    style={{
                      ...styles.predictionTitle,
                      color: prediction.risk === 1 ? "#dc2626" : "#059669",
                    }}
                  >
                    {prediction.risk === 1 ? "⚠️ HIGH RISK" : "✅ LOW RISK"}
                  </h3>
                  <p style={styles.predictionText}>
                    {prediction.risk === 1
                      ? "This patient has a HIGH risk of readmission. Close monitoring recommended."
                      : "This patient has a LOW risk of readmission."}
                  </p>
                </div>
              )}
            </div>

            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>📋 Medical Parameters Summary</h2>

              <h3 style={styles.subsectionTitle}>Hospital Stay Information</h3>
              <div style={styles.medicalGrid}>
                <div style={styles.medicalItem}>
                  <span style={styles.medicalLabel}>Lab Procedures:</span>
                  <span style={styles.medicalValue}>
                    {patient.num_lab_procedures || "0"}
                  </span>
                </div>
                <div style={styles.medicalItem}>
                  <span style={styles.medicalLabel}>Medications:</span>
                  <span style={styles.medicalValue}>
                    {patient.num_medications || "0"}
                  </span>
                </div>
                <div style={styles.medicalItem}>
                  <span style={styles.medicalLabel}>Time in Hospital:</span>
                  <span style={styles.medicalValue}>
                    {patient.time_in_hospital || "0"} days
                  </span>
                </div>
                <div style={styles.medicalItem}>
                  <span style={styles.medicalLabel}>Inpatient Visits:</span>
                  <span style={styles.medicalValue}>
                    {patient.number_inpatient || "0"}
                  </span>
                </div>
                <div style={styles.medicalItem}>
                  <span style={styles.medicalLabel}>Procedures:</span>
                  <span style={styles.medicalValue}>
                    {patient.num_procedures || "0"}
                  </span>
                </div>
                <div style={styles.medicalItem}>
                  <span style={styles.medicalLabel}>Diagnoses:</span>
                  <span style={styles.medicalValue}>
                    {patient.number_diagnoses || "0"}
                  </span>
                </div>
              </div>

              <h3 style={styles.subsectionTitle}>Demographics</h3>
              <div style={styles.medicalGrid}>
                <div style={styles.medicalItem}>
                  <span style={styles.medicalLabel}>Gender (Male):</span>
                  <span style={styles.medicalValue}>
                    {patient.gender_Male ? "✅ Yes" : "❌ No"}
                  </span>
                </div>
                <div style={styles.medicalItem}>
                  <span style={styles.medicalLabel}>Race (Caucasian):</span>
                  <span style={styles.medicalValue}>
                    {patient.race_Caucasian ? "✅ Yes" : "❌ No"}
                  </span>
                </div>
                <div style={styles.medicalItem}>
                  <span style={styles.medicalLabel}>Age Range:</span>
                  <span style={styles.medicalValue}>
                    {patient.age_30_40 ? "30-40" :
                     patient.age_40_50 ? "40-50" :
                     patient.age_50_60 ? "50-60" :
                     patient.age_60_70 ? "60-70" :
                     patient.age_70_80 ? "70-80" :
                     patient.age_80_90 ? "80-90" :
                     patient.age_90_100 ? "90-100" : "N/A"}
                  </span>
                </div>
              </div>

              <h3 style={styles.subsectionTitle}>Diabetes Management</h3>
              <div style={styles.medicalGrid}>
                <div style={styles.medicalItem}>
                  <span style={styles.medicalLabel}>On Diabetes Meds:</span>
                  <span style={styles.medicalValue}>
                    {patient.diabetesMed_Yes ? "✅ Yes" : "❌ No"}
                  </span>
                </div>
                <div style={styles.medicalItem}>
                  <span style={styles.medicalLabel}>Insulin Status:</span>
                  <span style={styles.medicalValue}>
                    {patient.insulin_No ? "None" :
                     patient.insulin_Steady ? "Steady" :
                     patient.insulin_Up ? "Increased" : "N/A"}
                  </span>
                </div>
                <div style={styles.medicalItem}>
                  <span style={styles.medicalLabel}>A1C Result:</span>
                  <span style={styles.medicalValue}>
                    {patient.A1Cresult_gt8 ? ">8 (High)" :
                     patient.A1Cresult_Norm ? "Normal" : "N/A"}
                  </span>
                </div>
                <div style={styles.medicalItem}>
                  <span style={styles.medicalLabel}>Glucose Serum:</span>
                  <span style={styles.medicalValue}>
                    {patient.max_glu_serum_Norm ? "Normal" : "N/A"}
                  </span>
                </div>
              </div>

              <h3 style={styles.subsectionTitle}>Key Diagnoses</h3>
              <div style={styles.medicalGrid}>
                {patient.diag_1_428 && (
                  <div style={styles.diagnosisChip}>428 - Heart Failure</div>
                )}
                {patient.diag_1_414 && (
                  <div style={styles.diagnosisChip}>414 - Coronary Artery</div>
                )}
                {patient.diag_2_250 && (
                  <div style={styles.diagnosisChip}>250 - Diabetes</div>
                )}
                {patient.diag_3_401 && (
                  <div style={styles.diagnosisChip}>401 - Hypertension</div>
                )}
                {!patient.diag_1_428 && !patient.diag_1_414 && !patient.diag_2_250 && !patient.diag_3_401 && (
                  <div style={styles.medicalItem}>
                    <span style={styles.medicalLabel}>No diagnoses recorded</span>
                  </div>
                )}
              </div>

              <p style={styles.medicalNote}>
                💡 Showing key parameters from 70 total features used for ML prediction.
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

const styles = {
  layout: {
    display: "flex",
  },
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
  pageTitle: {
    fontSize: "2rem",
    color: "#1e293b",
    margin: 0,
  },
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
  error: {
    textAlign: "center",
    padding: "3rem",
    fontSize: "1.1rem",
    color: "#dc2626",
  },
  detailsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  section: {
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  sectionTitle: {
    color: "#1e293b",
    marginTop: 0,
    marginBottom: "1.5rem",
    fontSize: "1.5rem",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "1.5rem",
  },
  infoItem: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  infoLabel: {
    color: "#64748b",
    fontSize: "0.9rem",
    fontWeight: "500",
  },
  infoValue: {
    color: "#1e293b",
    fontSize: "1.1rem",
    fontWeight: "600",
  },
  predictionInfo: {
    color: "#64748b",
    marginBottom: "1.5rem",
  },
  predictButton: {
    backgroundColor: "#7c3aed",
    color: "white",
    border: "none",
    padding: "1rem 2rem",
    borderRadius: "8px",
    fontSize: "1.1rem",
    fontWeight: "600",
    cursor: "pointer",
  },
  predictionResult: {
    marginTop: "1.5rem",
    padding: "1.5rem",
    borderRadius: "12px",
    border: "3px solid",
  },
  predictionTitle: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    margin: "0 0 0.5rem 0",
  },
  predictionText: {
    fontSize: "1rem",
    margin: 0,
    color: "#334155",
  },
  medicalGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1rem",
    marginBottom: "1rem",
  },
  medicalItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "0.75rem",
    backgroundColor: "#f8fafc",
    borderRadius: "6px",
  },
  medicalLabel: {
    color: "#64748b",
    fontSize: "0.9rem",
  },
  medicalValue: {
    color: "#1e293b",
    fontWeight: "600",
  },
  medicalNote: {
    color: "#64748b",
    fontSize: "0.9rem",
    fontStyle: "italic",
    margin: "1rem 0 0 0",
  },
  subsectionTitle: {
    color: "#475569",
    fontSize: "1.1rem",
    marginTop: "1.5rem",
    marginBottom: "1rem",
    fontWeight: "600",
  },
  diagnosisChip: {
    backgroundColor: "#dbeafe",
    color: "#1e40af",
    padding: "0.5rem 1rem",
    borderRadius: "20px",
    fontSize: "0.85rem",
    fontWeight: "500",
    display: "inline-block",
  },
};

export default PatientDetail;
