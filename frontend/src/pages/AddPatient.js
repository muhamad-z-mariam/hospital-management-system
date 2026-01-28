import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { patientAPI } from "../api/api";

const AddPatient = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    // Basic Info
    name: "",
    age: "",
    gender: "male",
    contact: "",
    nhs_number: "",

    // Payment Status
    insurance_status: false,
    handicapped: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [existingPatient, setExistingPatient] = useState(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const checkNHSNumber = async () => {
    if (formData.nhs_number && formData.nhs_number.length === 10) {
      try {
        // Fetch all patients and check if NHS number exists
        const allPatients = await patientAPI.getAll();
        const patientsArray = Array.isArray(allPatients) ? allPatients : [];
        const existingPat = patientsArray.find(
          (p) => p.nhs_number === formData.nhs_number
        );

        if (existingPat) {
          setExistingPatient(existingPat);
          setShowDuplicateModal(true);
          return true; // Duplicate found
        }
      } catch (err) {
        console.error("Error checking NHS number:", err);
      }
    }
    return false; // No duplicate
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Check for duplicate NHS number first
    const isDuplicate = await checkNHSNumber();
    if (isDuplicate) {
      setLoading(false);
      return; // Stop submission, show modal
    }

    try {
      await patientAPI.create(formData);
      alert("Patient added successfully!");
      navigate("/patients");
    } catch (err) {
      console.error("Error adding patient:", err);
      setError(err.error || "Failed to add patient");
    } finally {
      setLoading(false);
    }
  };

  const handleViewPatient = () => {
    if (existingPatient) {
      navigate(`/patients/${existingPatient.id}/archive`);
    }
  };

  const handleCreateAdmission = () => {
    if (existingPatient) {
      navigate(`/admissions/add?patient=${existingPatient.id}`);
    }
  };

  return (
    <>
      <Navbar />
      <div style={styles.layout}>
        <Sidebar />
        <main style={styles.content}>
          <div style={styles.header}>
            <h1 style={styles.pageTitle}>Add New Patient</h1>
            <button
              onClick={() => navigate("/patients")}
              style={styles.backButton}
            >
              ← Back to Patients
            </button>
          </div>

          <div style={styles.formContainer}>
            <form onSubmit={handleSubmit} style={styles.form}>
              {error && <div style={styles.error}>{error}</div>}

              {/* SECTION 1: Basic Information */}
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>📋 Basic Information</h3>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Patient Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.row}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Age *</label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      style={styles.input}
                      required
                      min="0"
                    />
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Gender *</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      style={styles.input}
                      required
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Contact *</label>
                  <input
                    type="text"
                    name="contact"
                    value={formData.contact}
                    onChange={handleChange}
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>NHS Number *</label>
                  <input
                    type="text"
                    name="nhs_number"
                    value={formData.nhs_number}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="1234567890"
                    maxLength="10"
                    pattern="\d{10}"
                    title="NHS Number must be exactly 10 digits"
                    required
                  />
                  <small style={styles.helpText}>10-digit unique identifier</small>
                </div>
              </div>

              {/* SECTION 2: Payment Status */}
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>
                  💰 Payment & Insurance Status
                </h3>

                <div style={styles.checkboxGroup}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="insurance_status"
                      checked={formData.insurance_status}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    <span>✅ Patient has Insurance (20% copay)</span>
                  </label>
                </div>

                <div style={styles.checkboxGroup}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="handicapped"
                      checked={formData.handicapped}
                      onChange={handleChange}
                      style={styles.checkbox}
                    />
                    <span>🦽 Patient is Handicapped (special discount)</span>
                  </label>
                </div>

                <p style={styles.note}>
                  💡 <strong>Note:</strong> Medical parameters will be filled by
                  the assigned nurse after admission.
                </p>
              </div>

              <button
                type="submit"
                style={styles.submitButton}
                disabled={loading}
              >
                {loading ? "Adding Patient..." : "✅ Add Patient"}
              </button>
            </form>
          </div>
        </main>
      </div>

      {/* Duplicate NHS Number Modal */}
      {showDuplicateModal && existingPatient && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>Patient Already Exists</h2>
            <p style={styles.modalMessage}>
              This NHS Number already exists in the system. Do you want to make
              a new Admission for this patient?
            </p>

            <div style={styles.patientInfo}>
              <h3 style={styles.infoTitle}>Patient Information:</h3>
              <p>
                <strong>Name:</strong> {existingPatient.name}
              </p>
              <p>
                <strong>Age:</strong> {existingPatient.age}
              </p>
              <p>
                <strong>Contact:</strong> {existingPatient.contact}
              </p>
              <p>
                <strong>NHS Number:</strong> {existingPatient.nhs_number}
              </p>
            </div>

            <div style={styles.modalButtons}>
              <button
                onClick={handleViewPatient}
                style={styles.viewButton}
              >
                View Patient Archive
              </button>
              <button
                onClick={handleCreateAdmission}
                style={styles.yesButton}
              >
                Yes, Create Admission
              </button>
              <button
                onClick={() => setShowDuplicateModal(false)}
                style={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
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
    fontSize: "0.95rem",
  },
  formContainer: {
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    maxWidth: "800px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "2rem",
  },
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
  row: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "1rem",
    marginBottom: "1rem",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  label: {
    color: "#334155",
    fontSize: "0.9rem",
    fontWeight: "500",
  },
  input: {
    padding: "0.75rem",
    border: "2px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "1rem",
  },
  checkboxGroup: {
    marginBottom: "1rem",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    cursor: "pointer",
    fontSize: "1rem",
    color: "#334155",
  },
  checkbox: {
    width: "20px",
    height: "20px",
    cursor: "pointer",
  },
  note: {
    color: "#64748b",
    fontSize: "0.9rem",
    fontStyle: "italic",
    margin: "1rem 0 0 0",
    padding: "1rem",
    backgroundColor: "#eff6ff",
    borderRadius: "6px",
    border: "1px solid #bfdbfe",
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
    marginTop: "1rem",
  },
  error: {
    backgroundColor: "#fee2e2",
    color: "#dc2626",
    padding: "0.75rem",
    borderRadius: "6px",
  },
  helpText: {
    color: "#64748b",
    fontSize: "0.85rem",
    marginTop: "0.25rem",
    display: "block",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "12px",
    maxWidth: "500px",
    width: "90%",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
  modalTitle: {
    color: "#dc2626",
    fontSize: "1.5rem",
    marginTop: 0,
    marginBottom: "1rem",
    borderBottom: "2px solid #fecaca",
    paddingBottom: "0.5rem",
  },
  modalMessage: {
    color: "#334155",
    fontSize: "1rem",
    lineHeight: "1.6",
    marginBottom: "1.5rem",
  },
  patientInfo: {
    backgroundColor: "#f8fafc",
    padding: "1rem",
    borderRadius: "8px",
    marginBottom: "1.5rem",
    border: "2px solid #e2e8f0",
  },
  infoTitle: {
    color: "#1e293b",
    fontSize: "1rem",
    marginTop: 0,
    marginBottom: "0.75rem",
  },
  modalButtons: {
    display: "flex",
    gap: "0.75rem",
    justifyContent: "flex-end",
    flexWrap: "wrap",
  },
  viewButton: {
    backgroundColor: "#0891b2",
    color: "white",
    border: "none",
    padding: "0.75rem 1.25rem",
    borderRadius: "8px",
    fontSize: "0.95rem",
    fontWeight: "600",
    cursor: "pointer",
  },
  yesButton: {
    backgroundColor: "#16a34a",
    color: "white",
    border: "none",
    padding: "0.75rem 1.25rem",
    borderRadius: "8px",
    fontSize: "0.95rem",
    fontWeight: "600",
    cursor: "pointer",
  },
  cancelButton: {
    backgroundColor: "#64748b",
    color: "white",
    border: "none",
    padding: "0.75rem 1.25rem",
    borderRadius: "8px",
    fontSize: "0.95rem",
    fontWeight: "600",
    cursor: "pointer",
  },
};

export default AddPatient;
