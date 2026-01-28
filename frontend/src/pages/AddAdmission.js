import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { patientAPI, doctorAPI, nurseAPI, roomAPI, admissionAPI, scheduleAPI } from "../api/api";

const AddAdmission = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [formData, setFormData] = useState({
    patient: "",
    doctor: "",
    nurse: "",
    room: "",
    status: "pending", // Default: pending (waiting for doctor)
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [nurseSchedules, setNurseSchedules] = useState([]);
  const [doctorSchedules, setDoctorSchedules] = useState([]);
  const [scheduleWarning, setScheduleWarning] = useState("");
  const [currentlyWorkingDoctors, setCurrentlyWorkingDoctors] = useState([]);
  const [currentlyWorkingNurses, setCurrentlyWorkingNurses] = useState([]);

  useEffect(() => {
    fetchPatients();
    fetchDoctors();
    fetchNurses();
    fetchRooms();
    checkCurrentlyWorking();
  }, []);

  const checkCurrentlyWorking = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes()
      ).padStart(2, "0")}:00`;

      console.log("Today's date:", today);
      console.log("Current time:", currentTime);

      // Fetch schedules for today
      const todaySchedules = await scheduleAPI.getByDateRange(today, today);

      console.log("Today's schedules:", todaySchedules);

      if (!Array.isArray(todaySchedules)) {
        console.log("No schedules found or not an array");
        return;
      }

      // Helper function to check if current time is within shift
      const isTimeInShift = (currentTime, startTime, endTime) => {
        // Handle night shifts that cross midnight (e.g., 20:00 - 08:00)
        if (endTime < startTime) {
          // Night shift: current time should be >= start OR <= end
          return currentTime >= startTime || currentTime <= endTime;
        } else {
          // Regular shift: current time should be >= start AND <= end
          return currentTime >= startTime && currentTime <= endTime;
        }
      };

      // Filter doctors and nurses who are currently working
      const workingDoctorIds = todaySchedules
        .filter((schedule) => {
          const isInShift = isTimeInShift(
            currentTime,
            schedule.start_time,
            schedule.end_time
          );

          console.log("Checking schedule:", {
            user: schedule.user_full_name,
            role: schedule.user_role,
            available: schedule.is_available,
            start: schedule.start_time,
            end: schedule.end_time,
            current: currentTime,
            isInShift: isInShift,
          });

          const isCurrentlyWorking =
            schedule.is_available &&
            isInShift &&
            schedule.user_role === "doctor";
          return isCurrentlyWorking;
        })
        .map((s) => s.user);

      const workingNurseIds = todaySchedules
        .filter((schedule) => {
          const isInShift = isTimeInShift(
            currentTime,
            schedule.start_time,
            schedule.end_time
          );

          const isCurrentlyWorking =
            schedule.is_available &&
            isInShift &&
            schedule.user_role === "nurse";
          return isCurrentlyWorking;
        })
        .map((s) => s.user);

      console.log("Working doctor IDs:", workingDoctorIds);
      console.log("Working nurse IDs:", workingNurseIds);

      setCurrentlyWorkingDoctors(workingDoctorIds);
      setCurrentlyWorkingNurses(workingNurseIds);
    } catch (error) {
      console.error("Error checking currently working staff:", error);
    }
  };

  const fetchPatients = async () => {
    try {
      // Only fetch patients who can be admitted (no active admissions)
      const data = await patientAPI.getAdmittable();
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

  const fetchNurses = async () => {
    try {
      const data = await nurseAPI.getAll();
      setNurses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching nurses:", error);
      setNurses([]);
    }
  };

  const fetchRooms = async () => {
    try {
      // Fetch only available rooms (with free beds)
      const data = await roomAPI.getAll({ available: 'true' });
      setRooms(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      setRooms([]);
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
    }

    // When nurse is selected, fetch their schedule for the next 2 weeks
    if (name === "nurse" && value) {
      await fetchNurseSchedule(value);
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

  const fetchNurseSchedule = async (nurseId) => {
    try {
      const nurse = nurses.find((n) => n.id === parseInt(nurseId));
      if (!nurse) return;

      // Get schedules for next 14 days
      const today = new Date();
      const twoWeeksLater = new Date();
      twoWeeksLater.setDate(today.getDate() + 14);

      const schedulesData = await scheduleAPI.getByDateRange(
        today.toISOString().split("T")[0],
        twoWeeksLater.toISOString().split("T")[0]
      );

      // Filter schedules for this specific nurse
      const nurseSchedulesData = schedulesData.filter(
        (s) => s.user === nurse.user.id
      );

      setNurseSchedules(Array.isArray(nurseSchedulesData) ? nurseSchedulesData : []);

      // Check if nurse has upcoming schedules
      if (nurseSchedulesData.length === 0) {
        setScheduleWarning(
          "⚠️ This nurse has no scheduled shifts in the next 2 weeks."
        );
      } else {
        setScheduleWarning("");
      }
    } catch (error) {
      console.error("Error fetching nurse schedule:", error);
      setNurseSchedules([]);
      setScheduleWarning("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await admissionAPI.create(formData);
      const message = formData.room
        ? "Patient admitted successfully! Room assigned."
        : "Patient admitted successfully! Room can be assigned later.";
      alert(message);
      navigate("/admissions");
    } catch (err) {
      console.error("Error creating admission:", err);
      setError(err.error || "Failed to create admission");
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
            <h1 style={styles.pageTitle}>Admit New Patient</h1>
            <button
              onClick={() => navigate("/admissions")}
              style={styles.backButton}
            >
              ← Back to Admissions
            </button>
          </div>

          <div style={styles.formContainer}>
            <div style={styles.infoBox}>
              <h4 style={styles.infoTitle}>📋 Admission Workflow</h4>
              <ol style={styles.workflowList}>
                <li>Admin: Register patient (this step) - room is optional</li>
                <li>Nurse: Fill medical parameters</li>
                <li>Doctor: Examine & decide (inpatient/outpatient)</li>
                <li>Admin: If inpatient → assign room, process payment & discharge</li>
              </ol>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              {error && <div style={styles.error}>{error}</div>}
              {scheduleWarning && <div style={styles.warning}>{scheduleWarning}</div>}

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
                      {patient.name} (Age: {patient.age}, Gender:{" "}
                      {patient.gender})
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.row}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Assign Doctor (Currently Working)</label>
                  <select
                    name="doctor"
                    value={formData.doctor}
                    onChange={handleChange}
                    style={styles.input}
                  >
                    <option value="">-- Select Doctor Currently in Hospital --</option>
                    {doctors
                      .filter((doctor) => currentlyWorkingDoctors.includes(doctor.user.id))
                      .map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>
                          Dr. {doctor.user?.first_name} {doctor.user?.last_name} ({doctor.specialty})
                        </option>
                      ))}
                  </select>
                  {doctors.filter((d) => currentlyWorkingDoctors.includes(d.user.id)).length === 0 && (
                    <div style={styles.noWorkingStaff}>
                      ⚠️ No doctors currently working. You can leave this empty.
                    </div>
                  )}
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Assign Nurse (Currently Working)</label>
                  <select
                    name="nurse"
                    value={formData.nurse}
                    onChange={handleChange}
                    style={styles.input}
                  >
                    <option value="">-- Select Nurse Currently in Hospital --</option>
                    {nurses
                      .filter((nurse) => currentlyWorkingNurses.includes(nurse.user.id))
                      .map((nurse) => (
                        <option key={nurse.id} value={nurse.id}>
                          {nurse.user?.first_name} {nurse.user?.last_name} ({nurse.department})
                        </option>
                      ))}
                  </select>
                  {nurses.filter((n) => currentlyWorkingNurses.includes(n.user.id)).length === 0 && (
                    <div style={styles.noWorkingStaff}>
                      ⚠️ No nurses currently working. You can leave this empty.
                    </div>
                  )}
                </div>
              </div>

              {/* Doctor's Schedule Display */}
              {formData.doctor && doctorSchedules.length > 0 && (
                <div style={styles.scheduleDisplay}>
                  <h3 style={styles.scheduleTitle}>
                    📅 Doctor's Schedule (Next 2 Weeks)
                  </h3>
                  <div style={styles.scheduleGrid}>
                    {doctorSchedules.map((schedule) => {
                      const isToday =
                        schedule.date === new Date().toISOString().split("T")[0];
                      return (
                        <div
                          key={schedule.id}
                          style={{
                            ...styles.scheduleCard,
                            ...(schedule.is_available
                              ? styles.scheduleCardAvailable
                              : styles.scheduleCardUnavailable),
                            ...(isToday ? styles.scheduleCardToday : {}),
                          }}
                        >
                          <div style={styles.scheduleDate}>
                            {isToday && "📍 TODAY - "}
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
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Nurse's Schedule Display */}
              {formData.nurse && nurseSchedules.length > 0 && (
                <div style={styles.scheduleDisplay}>
                  <h3 style={styles.scheduleTitle}>
                    📅 Nurse's Schedule (Next 2 Weeks)
                  </h3>
                  <div style={styles.scheduleGrid}>
                    {nurseSchedules.map((schedule) => {
                      const isToday =
                        schedule.date === new Date().toISOString().split("T")[0];
                      return (
                        <div
                          key={schedule.id}
                          style={{
                            ...styles.scheduleCard,
                            ...(schedule.is_available
                              ? styles.scheduleCardAvailable
                              : styles.scheduleCardUnavailable),
                            ...(isToday ? styles.scheduleCardToday : {}),
                          }}
                        >
                          <div style={styles.scheduleDate}>
                            {isToday && "📍 TODAY - "}
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
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={styles.inputGroup}>
                <label style={styles.label}>Assign Room (Optional)</label>
                <select
                  name="room"
                  value={formData.room}
                  onChange={handleChange}
                  style={styles.input}
                >
                  <option value="">-- Skip Room Assignment (assign later) --</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      Room {room.room_number} ({room.room_type}) -{" "}
                      {room.bed_capacity - room.occupied_beds} beds available
                    </option>
                  ))}
                </select>
                <small style={styles.hint}>
                  💡 Room can be assigned later after doctor's examination. Only rooms with free beds are shown.
                </small>
              </div>

              <button
                type="submit"
                style={styles.submitButton}
                disabled={loading}
              >
                {loading
                  ? "Creating Admission..."
                  : "✅ Create Admission"}
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
  infoBox: {
    backgroundColor: "#eff6ff",
    padding: "1.5rem",
    borderRadius: "8px",
    marginBottom: "2rem",
    border: "2px solid #bfdbfe",
  },
  infoTitle: {
    color: "#1e40af",
    marginTop: 0,
    marginBottom: "1rem",
  },
  workflowList: {
    color: "#1e3a8a",
    lineHeight: "1.8",
    margin: 0,
    paddingLeft: "1.5rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
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
  hint: {
    color: "#64748b",
    fontSize: "0.85rem",
    fontStyle: "italic",
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
  workingBadge: {
    backgroundColor: "#dcfce7",
    color: "#166534",
    padding: "0.5rem 0.75rem",
    borderRadius: "6px",
    fontSize: "0.85rem",
    fontWeight: "500",
    marginTop: "0.5rem",
    border: "1px solid #16a34a",
  },
  noWorkingStaff: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
    padding: "0.5rem 0.75rem",
    borderRadius: "6px",
    fontSize: "0.85rem",
    marginTop: "0.5rem",
    border: "1px solid #fbbf24",
  },
  scheduleCardToday: {
    border: "3px solid #2563eb",
    boxShadow: "0 0 10px rgba(37, 99, 235, 0.3)",
  },
};

export default AddAdmission;
