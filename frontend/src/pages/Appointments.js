import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { appointmentAPI } from "../api/api";

const Appointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTodayOnly, setShowTodayOnly] = useState(true);
  const [viewType, setViewType] = useState('active'); // 'active' or 'completed'

  useEffect(() => {
    fetchAppointments();
  }, [viewType]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      // Fetch active or completed appointments based on viewType
      const data = viewType === 'active'
        ? await appointmentAPI.getActive()
        : await appointmentAPI.getCompleted();

      const appointmentsArray = Array.isArray(data) ? data : [];
      setAllAppointments(appointmentsArray);

      // Filter today's appointments
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayAppointments = appointmentsArray.filter(apt => {
        const aptDate = new Date(apt.appointment_date);
        return aptDate >= today && aptDate < tomorrow;
      });

      setAppointments(todayAppointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setAppointments([]);
      setAllAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleView = () => {
    setShowTodayOnly(!showTodayOnly);
    if (!showTodayOnly) {
      // Switch to today's view
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayAppointments = allAppointments.filter(apt => {
        const aptDate = new Date(apt.appointment_date);
        return aptDate >= today && aptDate < tomorrow;
      });
      setAppointments(todayAppointments);
    } else {
      // Switch to all appointments
      setAppointments(allAppointments);
    }
  };

  const toggleViewType = () => {
    setViewType(viewType === 'active' ? 'completed' : 'active');
    setShowTodayOnly(true); // Reset to today view when switching
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  return (
    <>
      <Navbar />
      <div style={styles.layout}>
        <Sidebar />
        <main style={styles.content}>
          <div style={styles.header}>
            <div>
              <h1 style={styles.pageTitle}>
                📅 {viewType === 'active' ? 'Appointments' : 'Completed Appointments'} {showTodayOnly && "(Today)"}
              </h1>
              <p style={styles.subtitle}>
                {viewType === 'active'
                  ? showTodayOnly ? "Showing today's active appointments" : "Showing all active appointments"
                  : showTodayOnly ? "Showing today's completed appointments" : "Showing all completed appointments"}
              </p>
            </div>
            <div style={styles.buttonGroup}>
              <button onClick={toggleViewType} style={styles.viewTypeButton}>
                {viewType === 'active' ? '✅ View Archive' : '📋 View Active'}
              </button>
              <button onClick={toggleView} style={styles.toggleButton}>
                {showTodayOnly ? "📋 Show All" : "📅 Show Today Only"}
              </button>
              <button
                onClick={() => navigate("/appointments/add")}
                style={styles.addButton}
              >
                ➕ Schedule Appointment
              </button>
            </div>
          </div>

          {loading ? (
            <div style={styles.loading}>Loading appointments...</div>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Patient</th>
                    <th style={styles.th}>Doctor</th>
                    <th style={styles.th}>Date & Time</th>
                    <th style={styles.th}>Reason</th>
                    {viewType === 'completed' && <th style={styles.th}>Status</th>}
                  </tr>
                </thead>
                <tbody>
                  {appointments.length === 0 ? (
                    <tr>
                      <td colSpan={viewType === 'completed' ? "6" : "5"} style={styles.noData}>
                        {viewType === 'active' ? 'No active appointments' : 'No completed appointments'}
                      </td>
                    </tr>
                  ) : (
                    appointments.map((appointment) => (
                      <tr key={appointment.id} style={styles.tableRow}>
                        <td style={styles.td}>{appointment.id}</td>
                        <td style={styles.td}>
                          {appointment.patient_name ||
                            `Patient #${appointment.patient}`}
                        </td>
                        <td style={styles.td}>
                          {appointment.doctor_name ||
                            `Doctor #${appointment.doctor}`}
                        </td>
                        <td style={styles.td}>
                          {formatDate(appointment.appointment_date)}
                        </td>
                        <td style={styles.td}>{appointment.reason}</td>
                        {viewType === 'completed' && (
                          <td style={styles.td}>
                            <span style={styles.statusBadge}>
                              {appointment.status || 'Completed'}
                            </span>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
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
    margin: "0 0 0.5rem 0",
  },
  subtitle: {
    color: "#64748b",
    margin: 0,
  },
  buttonGroup: {
    display: "flex",
    gap: "1rem",
  },
  viewTypeButton: {
    backgroundColor: "#7c3aed",
    color: "white",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  toggleButton: {
    backgroundColor: "#059669",
    color: "white",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  addButton: {
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  statusBadge: {
    backgroundColor: "#dcfce7",
    color: "#166534",
    padding: "0.25rem 0.75rem",
    borderRadius: "9999px",
    fontSize: "0.875rem",
    fontWeight: "500",
    textTransform: "capitalize",
  },
  loading: {
    textAlign: "center",
    padding: "3rem",
    fontSize: "1.1rem",
    color: "#64748b",
  },
  tableContainer: {
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    overflow: "hidden",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  tableHeader: {
    backgroundColor: "#f1f5f9",
  },
  th: {
    padding: "1rem",
    textAlign: "left",
    fontWeight: "600",
    color: "#475569",
    borderBottom: "2px solid #e2e8f0",
  },
  tableRow: {
    transition: "background-color 0.2s",
  },
  td: {
    padding: "1rem",
    borderBottom: "1px solid #e2e8f0",
    color: "#334155",
  },
  noData: {
    textAlign: "center",
    padding: "2rem",
    color: "#64748b",
  },
};

export default Appointments;
