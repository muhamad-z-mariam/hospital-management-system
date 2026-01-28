import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { patientAPI, predictionAPI, admissionAPI, doctorAPI, nurseAPI } from "../api/api";

const RunPrediction = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      // Get current doctor or nurse ID
      let staffId = null;

      if (user.role === 'doctor') {
        const doctors = await doctorAPI.getAll();
        const doctorsArray = Array.isArray(doctors) ? doctors : [];
        const currentDoctor = doctorsArray.find(d => d.user.id === user.id);
        staffId = currentDoctor?.id;
      } else if (user.role === 'nurse') {
        const nurses = await nurseAPI.getAll();
        const nursesArray = Array.isArray(nurses) ? nurses : [];
        const currentNurse = nursesArray.find(n => n.user.id === user.id);
        staffId = currentNurse?.id;
      }

      if (!staffId) {
        console.error("Could not find staff ID for current user");
        setPatients([]);
        return;
      }

      // Fetch all admissions
      const admissions = await admissionAPI.getAll();
      const admissionsArray = Array.isArray(admissions) ? admissions : [];

      // Filter admissions by current doctor or nurse
      const myAdmissions = admissionsArray.filter(admission => {
        if (user.role === 'doctor') {
          return admission.doctor === staffId;
        } else if (user.role === 'nurse') {
          return admission.nurse === staffId;
        }
        return false;
      });

      // Get unique patient IDs from their admissions
      const patientIds = [...new Set(myAdmissions.map(a => a.patient))];

      // Fetch all patients
      const allPatients = await patientAPI.getAll();
      const patientsArray = Array.isArray(allPatients) ? allPatients : [];

      // Filter to only patients they have worked with
      const myPatients = patientsArray.filter(p => patientIds.includes(p.id));

      setPatients(myPatients);
    } catch (error) {
      console.error("Error fetching patients:", error);
      setPatients([]);
    }
  };

  const handlePredict = async () => {
    if (!selectedPatient) {
      alert("Please select a patient first");
      return;
    }

    setLoading(true);
    setPrediction(null);

    try {
      const data = await predictionAPI.predict(selectedPatient, user.id);

      setPrediction(data);
      if (data.risk === 1) {
        alert(
          "⚠️ HIGH RISK patient! This has been saved to the admin dashboard."
        );
      } else {
        alert("✅ LOW RISK patient. Prediction saved.");
      }
    } catch (error) {
      console.error("Error predicting:", error);
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div style={styles.layout}>
        <Sidebar />
        <main style={styles.content}>
          <div style={styles.header}>
            <h1 style={styles.pageTitle}>🔮 Run Readmission Prediction</h1>
            <p style={styles.subtitle}>
              Predict patient readmission risk using AI/ML
            </p>
          </div>

          <div style={styles.mainContainer}>
            <div style={styles.selectSection}>
              <h2 style={styles.sectionTitle}>Select Patient</h2>
              <select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                style={styles.select}
              >
                <option value="">-- Choose a patient --</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name} (Age: {patient.age}, ID: {patient.id})
                  </option>
                ))}
              </select>

              <button
                onClick={handlePredict}
                style={styles.predictButton}
                disabled={loading || !selectedPatient}
              >
                {loading ? "🔄 Analyzing..." : "🔮 Run Prediction"}
              </button>
            </div>

            {prediction && (
              <div
                style={{
                  ...styles.resultContainer,
                  backgroundColor:
                    prediction.risk === 1 ? "#fee2e2" : "#dcfce7",
                  borderColor: prediction.risk === 1 ? "#dc2626" : "#059669",
                }}
              >
                <div style={styles.resultIcon}>
                  {prediction.risk === 1 ? "⚠️" : "✅"}
                </div>
                <h2
                  style={{
                    ...styles.resultTitle,
                    color: prediction.risk === 1 ? "#dc2626" : "#059669",
                  }}
                >
                  {prediction.risk === 1 ? "HIGH RISK" : "LOW RISK"}
                </h2>
                <p style={styles.resultSubtitle}>
                  Patient: <strong>{prediction.patient}</strong>
                </p>
                <div style={styles.resultDescription}>
                  {prediction.risk === 1 ? (
                    <>
                      <p>
                        ⚠️ This patient has a <strong>HIGH risk</strong> of
                        readmission.
                      </p>
                      <p>
                        <strong>✅ Saved to Admin Dashboard</strong>
                      </p>
                      <p>Recommendations:</p>
                      <ul style={styles.recommendationList}>
                        <li>Schedule follow-up appointments</li>
                        <li>Monitor vital signs closely</li>
                        <li>Review medication adherence</li>
                        <li>Consider additional support services</li>
                      </ul>
                    </>
                  ) : (
                    <>
                      <p>
                        ✅ This patient has a <strong>LOW risk</strong> of
                        readmission.
                      </p>
                      <p>
                        Continue standard care protocols and routine monitoring.
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            <div style={styles.infoBox}>
              <h3 style={styles.infoTitle}>ℹ️ About This Prediction</h3>
              <p style={styles.infoText}>
                This AI-powered prediction model analyzes 32 medical parameters
                to predict readmission risk.
              </p>
              <p style={styles.infoText}>
                <strong>Note:</strong> All predictions are automatically saved.
                High-risk patients will appear in the Admin's "High Risk
                Patients" dashboard.
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
    marginBottom: "2rem",
  },
  pageTitle: {
    fontSize: "2rem",
    color: "#1e293b",
    margin: "0 0 0.5rem 0",
  },
  subtitle: {
    color: "#64748b",
    margin: 0,
  },
  mainContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "2rem",
  },
  selectSection: {
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
  select: {
    width: "100%",
    padding: "1rem",
    fontSize: "1rem",
    border: "2px solid #e2e8f0",
    borderRadius: "8px",
    marginBottom: "1.5rem",
    backgroundColor: "white",
  },
  predictButton: {
    width: "100%",
    backgroundColor: "#7c3aed",
    color: "white",
    border: "none",
    padding: "1.25rem",
    borderRadius: "8px",
    fontSize: "1.2rem",
    fontWeight: "600",
    cursor: "pointer",
  },
  resultContainer: {
    padding: "3rem",
    borderRadius: "12px",
    border: "3px solid",
    textAlign: "center",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
  },
  resultIcon: {
    fontSize: "5rem",
    marginBottom: "1rem",
  },
  resultTitle: {
    fontSize: "2.5rem",
    fontWeight: "bold",
    margin: "0 0 1rem 0",
  },
  resultSubtitle: {
    fontSize: "1.2rem",
    color: "#334155",
    marginBottom: "1.5rem",
  },
  resultDescription: {
    textAlign: "left",
    color: "#334155",
    fontSize: "1.05rem",
    lineHeight: "1.6",
  },
  recommendationList: {
    marginTop: "1rem",
    paddingLeft: "1.5rem",
  },
  infoBox: {
    backgroundColor: "#eff6ff",
    padding: "2rem",
    borderRadius: "12px",
    border: "2px solid #bfdbfe",
  },
  infoTitle: {
    color: "#1e40af",
    marginTop: 0,
    marginBottom: "1rem",
  },
  infoText: {
    color: "#1e3a8a",
    lineHeight: "1.6",
    marginBottom: "1rem",
  },
};

export default RunPrediction;
