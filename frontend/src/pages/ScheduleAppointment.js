import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { appointmentAPI, patientAPI, doctorAPI } from "../api/api";

const ScheduleAppointment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [patientId, setPatientId] = useState(searchParams.get('patientId') || '');
  const [doctorId, setDoctorId] = useState(searchParams.get('doctorId') || '');
  const [patientName, setPatientName] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    appointment_date: '',
    appointment_time: '',
    reason: '',
  });

  useEffect(() => {
    fetchDetails();
  }, [patientId, doctorId]);

  const fetchDetails = async () => {
    try {
      if (patientId) {
        const patient = await patientAPI.getById(patientId);
        setPatientName(patient.name);
      }

      if (doctorId) {
        const doctor = await doctorAPI.getById(doctorId);
        setDoctorName(`Dr. ${doctor.user?.first_name || ''} ${doctor.user?.last_name || ''}`);
      }
    } catch (error) {
      console.error("Error fetching details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.appointment_date || !formData.appointment_time || !formData.reason) {
      alert('Please fill in all fields');
      return;
    }

    if (!patientId || !doctorId) {
      alert('Patient and Doctor information is required');
      return;
    }

    setSaving(true);

    try {
      // Combine date and time into ISO datetime string
      const appointmentDateTime = `${formData.appointment_date}T${formData.appointment_time}:00`;

      const appointmentData = {
        patient: parseInt(patientId),
        doctor: parseInt(doctorId),
        appointment_date: appointmentDateTime,
        reason: formData.reason,
        status: 'scheduled',
      };

      await appointmentAPI.create(appointmentData);
      alert('Appointment scheduled successfully!');

      // Navigate back to my appointments
      navigate('/my-appointments');
    } catch (error) {
      console.error('Error creating appointment:', error);
      alert('Failed to schedule appointment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={styles.layout}>
          <Sidebar />
          <main style={styles.content}>
            <div style={styles.loading}>Loading...</div>
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
            <h1 style={styles.pageTitle}>📅 Schedule Follow-up Appointment</h1>
            <button
              onClick={() => navigate(-1)}
              style={styles.backButton}
            >
              ← Back
            </button>
          </div>

          <div style={styles.formCard}>
            <div style={styles.infoSection}>
              <div style={styles.infoRow}>
                <strong>Patient:</strong> {patientName || 'N/A'}
              </div>
              <div style={styles.infoRow}>
                <strong>Doctor:</strong> {doctorName || 'N/A'}
              </div>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Appointment Date <span style={styles.required}>*</span>
                </label>
                <input
                  type="date"
                  name="appointment_date"
                  value={formData.appointment_date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Appointment Time <span style={styles.required}>*</span>
                </label>
                <input
                  type="time"
                  name="appointment_time"
                  value={formData.appointment_time}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Reason for Visit <span style={styles.required}>*</span>
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  placeholder="E.g., Follow-up checkup, Lab results review, Medication adjustment..."
                  rows="4"
                  style={styles.textarea}
                  required
                />
              </div>

              <div style={styles.buttonGroup}>
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  style={styles.cancelButton}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.submitButton}
                  disabled={saving}
                >
                  {saving ? 'Scheduling...' : '✓ Schedule Appointment'}
                </button>
              </div>
            </form>
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
    fontSize: "1rem",
    fontWeight: "500",
  },
  loading: {
    textAlign: "center",
    padding: "3rem",
    fontSize: "1.1rem",
    color: "#64748b",
  },
  formCard: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "2rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    maxWidth: "800px",
  },
  infoSection: {
    backgroundColor: "#f1f5f9",
    padding: "1.5rem",
    borderRadius: "8px",
    marginBottom: "2rem",
  },
  infoRow: {
    color: "#334155",
    fontSize: "1rem",
    marginBottom: "0.5rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  label: {
    color: "#334155",
    fontWeight: "600",
    fontSize: "0.95rem",
  },
  required: {
    color: "#dc2626",
  },
  input: {
    padding: "0.75rem",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "1rem",
    fontFamily: "inherit",
  },
  textarea: {
    padding: "0.75rem",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "1rem",
    fontFamily: "inherit",
    resize: "vertical",
  },
  buttonGroup: {
    display: "flex",
    gap: "1rem",
    justifyContent: "flex-end",
    marginTop: "1rem",
  },
  cancelButton: {
    backgroundColor: "#e2e8f0",
    color: "#475569",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "500",
  },
};

export default ScheduleAppointment;
