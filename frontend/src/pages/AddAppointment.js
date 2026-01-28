import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { patientAPI, doctorAPI, appointmentAPI, scheduleAPI } from "../api/api";

const AddAppointment = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [formData, setFormData] = useState({
    patient: "",
    doctor: "",
    appointment_date: "",
    reason: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [availabilityWarning, setAvailabilityWarning] = useState("");
  const [doctorSchedules, setDoctorSchedules] = useState([]);

  useEffect(() => {
    fetchPatients();
    fetchDoctors();
  }, []);

  const fetchPatients = async () => {
    try {
      // Only fetch patients who can have appointments (no active admissions)
      const data = await patientAPI.getAppointable();
      setPatients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching patients:", error);
      setPatients([]);
    }
  };

  const fetchDoctors = async () => {
    try {
      const data = await doctorAPI.getAll();
      setDoctors(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      setDoctors([]);
    }
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // When doctor is selected, fetch their schedule for the next 2 weeks
    if (name === "doctor" && value) {
      await fetchDoctorSchedule(value);
      if (formData.appointment_date) {
        checkDoctorAvailability(value, formData.appointment_date);
      }
    }

    // Check availability when date/time or doctor changes
    if (name === "appointment_date" && formData.doctor) {
      checkDoctorAvailability(formData.doctor, value);
    }
  };

  const fetchDoctorSchedule = async (doctorId) => {
    try {
      const doctor = doctors.find((d) => d.id === parseInt(doctorId));
      if (!doctor) return;

      // Get schedules for next 14 days
      const today = new Date();
      const twoWeeksLater = new Date();
      twoWeeksLater.setDate(today.getDate() + 14);

      const schedulesData = await scheduleAPI.getByDateRange(
        today.toISOString().split("T")[0],
        twoWeeksLater.toISOString().split("T")[0]
      );

      // Filter schedules for this specific doctor
      const doctorSchedulesData = schedulesData.filter(
        (s) => s.user === doctor.user.id
      );

      setDoctorSchedules(Array.isArray(doctorSchedulesData) ? doctorSchedulesData : []);
    } catch (error) {
      console.error("Error fetching doctor schedule:", error);
      setDoctorSchedules([]);
    }
  };

  const checkDoctorAvailability = async (doctorId, appointmentDateTime) => {
    if (!doctorId || !appointmentDateTime) return;

    try {
      // Extract date and time from datetime-local input
      const appointmentDate = appointmentDateTime.split("T")[0];
      const appointmentTime = appointmentDateTime.split("T")[1];

      // Get doctor's user ID
      const doctor = doctors.find((d) => d.id === parseInt(doctorId));
      if (!doctor) return;

      // Fetch schedules for that date
      const schedulesData = await scheduleAPI.getAll({
        user: doctor.user.id,
        date: appointmentDate,
      });

      if (!Array.isArray(schedulesData) || schedulesData.length === 0) {
        setAvailabilityWarning(
          "⚠️ Warning: No schedule found for this doctor on the selected date. The doctor may not be available."
        );
        return;
      }

      // Check if any schedule is available and covers the appointment time
      const availableSchedule = schedulesData.find((schedule) => {
        if (!schedule.is_available) return false;

        // Check if appointment time falls within schedule time range
        const scheduleStart = schedule.start_time;
        const scheduleEnd = schedule.end_time;

        return appointmentTime >= scheduleStart && appointmentTime <= scheduleEnd;
      });

      if (availableSchedule) {
        setAvailabilityWarning("");
      } else {
        setAvailabilityWarning(
          "⚠️ Warning: The selected time is outside the doctor's scheduled hours or the doctor is marked as unavailable."
        );
      }
    } catch (error) {
      console.error("Error checking availability:", error);
      setAvailabilityWarning("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Fix timezone issue: send as ISO format without timezone adjustment
      // datetime-local gives us: "2025-11-06T10:00"
      // Add seconds and send as-is: "2025-11-06T10:00:00"
      const appointmentData = {
        ...formData,
        appointment_date: formData.appointment_date + ":00",
      };

      await appointmentAPI.create(appointmentData);
      alert("Appointment created successfully!");
      navigate("/appointments");
    } catch (err) {
      console.error("Error creating appointment:", err);
      setError(err.error || "Failed to create appointment");
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
            <h1 style={styles.pageTitle}>Schedule New Appointment</h1>
            <button
              onClick={() => navigate("/appointments")}
              style={styles.backButton}
            >
              ← Back to Appointments
            </button>
          </div>

          <div style={styles.formContainer}>
            <form onSubmit={handleSubmit} style={styles.form}>
              {error && <div style={styles.error}>{error}</div>}
              {availabilityWarning && (
                <div style={styles.warning}>{availabilityWarning}</div>
              )}

              <div style={styles.inputGroup}>
                <label style={styles.label}>Patient *</label>
                <select
                  name="patient"
                  value={formData.patient}
                  onChange={handleChange}
                  style={styles.input}
                  required
                >
                  <option value="">-- Select Patient --</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name} (Age: {patient.age})
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Doctor *</label>
                <select
                  name="doctor"
                  value={formData.doctor}
                  onChange={handleChange}
                  style={styles.input}
                  required
                >
                  <option value="">-- Select Doctor --</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      Dr. {doctor.user?.first_name} {doctor.user?.last_name} (
                      {doctor.specialty})
                    </option>
                  ))}
                </select>
              </div>

              {/* Doctor's Schedule Display */}
              {formData.doctor && doctorSchedules.length > 0 && (
                <div style={styles.scheduleDisplay}>
                  <h3 style={styles.scheduleTitle}>
                    📅 Doctor's Schedule (Next 2 Weeks)
                  </h3>
                  <div style={styles.scheduleGrid}>
                    {doctorSchedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        style={{
                          ...styles.scheduleCard,
                          ...(schedule.is_available
                            ? styles.scheduleCardAvailable
                            : styles.scheduleCardUnavailable),
                        }}
                      >
                        <div style={styles.scheduleDate}>
                          {new Date(schedule.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                        <div style={styles.scheduleShift}>
                          {schedule.shift.charAt(0).toUpperCase() +
                            schedule.shift.slice(1)}
                        </div>
                        <div style={styles.scheduleTime}>
                          {schedule.start_time} - {schedule.end_time}
                        </div>
                        {!schedule.is_available && (
                          <div style={styles.unavailableBadge}>Unavailable</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {formData.doctor && doctorSchedules.length === 0 && (
                <div style={styles.noScheduleWarning}>
                  ⚠️ No schedule found for this doctor in the next 2 weeks. The
                  doctor may be off or schedule not yet created.
                </div>
              )}

              <div style={styles.inputGroup}>
                <label style={styles.label}>Appointment Date & Time *</label>
                <input
                  type="datetime-local"
                  name="appointment_date"
                  value={formData.appointment_date}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Reason *</label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  style={{ ...styles.input, minHeight: "100px" }}
                  placeholder="Reason for appointment..."
                  required
                />
              </div>

              <button
                type="submit"
                style={styles.submitButton}
                disabled={loading}
              >
                {loading ? "Creating Appointment..." : "Create Appointment"}
              </button>
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
    gap: "1.5rem",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  label: {
    color: "#334155",
    fontSize: "0.95rem",
    fontWeight: "500",
  },
  input: {
    padding: "0.75rem",
    border: "2px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "1rem",
  },
  submitButton: {
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    padding: "0.875rem",
    borderRadius: "8px",
    fontSize: "1rem",
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
  warning: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
    padding: "0.75rem",
    borderRadius: "6px",
    border: "1px solid #fbbf24",
  },
  scheduleDisplay: {
    backgroundColor: "#f8fafc",
    padding: "1.5rem",
    borderRadius: "8px",
    border: "2px solid #e2e8f0",
  },
  scheduleTitle: {
    fontSize: "1.1rem",
    color: "#1e293b",
    marginTop: 0,
    marginBottom: "1rem",
  },
  scheduleGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "0.75rem",
  },
  scheduleCard: {
    padding: "1rem",
    borderRadius: "8px",
    border: "2px solid",
    textAlign: "center",
  },
  scheduleCardAvailable: {
    backgroundColor: "#dcfce7",
    borderColor: "#16a34a",
  },
  scheduleCardUnavailable: {
    backgroundColor: "#fee2e2",
    borderColor: "#dc2626",
    opacity: 0.7,
  },
  scheduleDate: {
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: "0.25rem",
  },
  scheduleShift: {
    fontSize: "0.85rem",
    fontWeight: "500",
    color: "#475569",
    marginBottom: "0.25rem",
  },
  scheduleTime: {
    fontSize: "0.8rem",
    color: "#64748b",
  },
  unavailableBadge: {
    fontSize: "0.7rem",
    backgroundColor: "#dc2626",
    color: "white",
    padding: "0.25rem 0.5rem",
    borderRadius: "4px",
    marginTop: "0.5rem",
    display: "inline-block",
  },
  noScheduleWarning: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
    padding: "1rem",
    borderRadius: "6px",
    border: "1px solid #fbbf24",
    textAlign: "center",
  },
};

export default AddAppointment;
