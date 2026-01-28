import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { doctorAPI, appointmentAPI } from "../api/api";

const DoctorAppointments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('active'); // 'active' or 'completed'

  useEffect(() => {
    fetchMyAppointments();
  }, [view]);

  const fetchMyAppointments = async () => {
    try {
      setLoading(true);
      // Get doctor ID for this user
      const doctors = await doctorAPI.getAll();
      const myDoctor = Array.isArray(doctors)
        ? doctors.find((d) => d.user?.id === user.id)
        : null;

      if (myDoctor) {
        // Get appointments based on view (active or completed)
        const allAppointments = view === 'active'
          ? await appointmentAPI.getActive()
          : await appointmentAPI.getCompleted();

        const myAppointments = Array.isArray(allAppointments)
          ? allAppointments.filter((a) => a.doctor === myDoctor.id)
          : [];

        // Sort by appointment date - closest first for active, newest first for archive
        myAppointments.sort((a, b) => {
          const dateA = new Date(a.appointment_date);
          const dateB = new Date(b.appointment_date);
          return view === 'active' ? dateA - dateB : dateB - dateA;
        });

        setAppointments(myAppointments);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExamine = (appointment) => {
    // Navigate directly to examination with appointment ID
    // The examination page will create an admission if needed
    navigate(`/examine-appointment/${appointment.id}`);
  };

  const handleView = (appointment) => {
    if (appointment.patient) {
      navigate(`/patients/${appointment.patient}/archive`);
    }
  };

  const handleMarkAsDone = async (appointmentId) => {
    if (!window.confirm('Mark this appointment as completed?')) {
      return;
    }

    try {
      await appointmentAPI.markCompleted(appointmentId);
      alert('Appointment marked as completed!');
      fetchMyAppointments(); // Refresh the list
    } catch (error) {
      console.error('Error marking appointment as done:', error);
      alert('Failed to mark appointment as completed. Please try again.');
    }
  };

  const handleMarkAsNoShow = async (appointmentId) => {
    if (!window.confirm('Mark this appointment as no-show (patient did not attend)?')) {
      return;
    }

    try {
      await appointmentAPI.markNoShow(appointmentId);
      alert('Appointment marked as no-show!');
      fetchMyAppointments(); // Refresh the list
    } catch (error) {
      console.error('Error marking appointment as no-show:', error);
      alert('Failed to mark appointment as no-show. Please try again.');
    }
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
              <h1 style={styles.pageTitle}>📅 My Appointments</h1>
              <p style={styles.subtitle}>
                {view === 'active' ? 'Your scheduled appointments' : 'Completed appointments archive'}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div style={styles.tabs}>
            <button
              onClick={() => setView('active')}
              style={{
                ...styles.tab,
                ...(view === 'active' ? styles.activeTab : {})
              }}
            >
              📋 Active Appointments
            </button>
            <button
              onClick={() => setView('completed')}
              style={{
                ...styles.tab,
                ...(view === 'completed' ? styles.activeTab : {})
              }}
            >
              ✅ Archive
            </button>
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
                    <th style={styles.th}>Date & Time</th>
                    <th style={styles.th}>Reason</th>
                    {view === 'completed' && <th style={styles.th}>Status</th>}
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.length === 0 ? (
                    <tr>
                      <td colSpan={view === 'completed' ? "6" : "5"} style={styles.noData}>
                        {view === 'active' ? 'No active appointments' : 'No completed appointments'}
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
                          {formatDate(appointment.appointment_date)}
                        </td>
                        <td style={styles.td}>{appointment.reason}</td>
                        {view === 'completed' && (
                          <td style={styles.td}>
                            <span
                              style={{
                                ...styles.statusBadge,
                                backgroundColor:
                                  appointment.status === 'completed'
                                    ? '#dcfce7'
                                    : appointment.status === 'no_show'
                                    ? '#fee2e2'
                                    : '#f1f5f9',
                                color:
                                  appointment.status === 'completed'
                                    ? '#166534'
                                    : appointment.status === 'no_show'
                                    ? '#dc2626'
                                    : '#64748b',
                              }}
                            >
                              {appointment.status === 'completed'
                                ? '✅ Completed'
                                : appointment.status === 'no_show'
                                ? '❌ No-Show'
                                : appointment.status || 'Completed'}
                            </span>
                          </td>
                        )}
                        <td style={styles.td}>
                          <div style={styles.actionButtons}>
                            {view === 'active' ? (
                              <>
                                <button
                                  onClick={() => handleExamine(appointment)}
                                  style={styles.examineButton}
                                >
                                  🩺 Examine
                                </button>
                                <button
                                  onClick={() => handleView(appointment)}
                                  style={styles.viewButton}
                                >
                                  👁️ View
                                </button>
                                <button
                                  onClick={() => handleMarkAsDone(appointment.id)}
                                  style={styles.doneButton}
                                >
                                  ✓ Done
                                </button>
                                <button
                                  onClick={() => handleMarkAsNoShow(appointment.id)}
                                  style={styles.noShowButton}
                                >
                                  ❌ No-Show
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleView(appointment)}
                                style={styles.viewButton}
                              >
                                👁️ View
                              </button>
                            )}
                          </div>
                        </td>
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
    marginBottom: "1.5rem",
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
  tabs: {
    display: "flex",
    gap: "1rem",
    marginBottom: "1.5rem",
    borderBottom: "2px solid #e2e8f0",
  },
  tab: {
    backgroundColor: "transparent",
    border: "none",
    padding: "0.75rem 1.5rem",
    fontSize: "1rem",
    fontWeight: "500",
    color: "#64748b",
    cursor: "pointer",
    borderBottom: "3px solid transparent",
    transition: "all 0.2s",
    marginBottom: "-2px",
  },
  activeTab: {
    color: "#2563eb",
    borderBottomColor: "#2563eb",
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
  actionButtons: {
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap",
  },
  examineButton: {
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    fontSize: "0.9rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  viewButton: {
    backgroundColor: "#059669",
    color: "white",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    fontSize: "0.9rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  doneButton: {
    backgroundColor: "#10b981",
    color: "white",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    fontSize: "0.9rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  noShowButton: {
    backgroundColor: "#dc2626",
    color: "white",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    fontSize: "0.9rem",
    fontWeight: "500",
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
};

export default DoctorAppointments;
