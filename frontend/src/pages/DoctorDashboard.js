import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { doctorAPI, admissionAPI, appointmentAPI } from "../api/api";

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [doctorId, setDoctorId] = useState(null);

  useEffect(() => {
    fetchDoctorData();
  }, []);

  const fetchDoctorData = async () => {
    try {
      // First, get the doctor ID for this user
      const doctors = await doctorAPI.getAll();
      const myDoctor = Array.isArray(doctors)
        ? doctors.find((d) => d.user?.id === user.id)
        : null;

      if (myDoctor) {
        setDoctorId(myDoctor.id);

        // Fetch admissions for this doctor
        const allAdmissions = await admissionAPI.getAll();
        const myAdmissions = Array.isArray(allAdmissions)
          ? allAdmissions.filter((a) => a.doctor === myDoctor.id)
          : [];

        // Fetch appointments for this doctor
        const allAppointments = await appointmentAPI.getAll();
        const myAppointments = Array.isArray(allAppointments)
          ? allAppointments.filter((a) => a.doctor === myDoctor.id)
          : [];

        // Get unique patients
        const patientIds = [...new Set(myAdmissions.map((a) => a.patient))];

        setStats({
          total_patients: patientIds.length,
          active_admissions: myAdmissions.filter((a) => a.status === "admitted")
            .length,
          total_appointments: myAppointments.length,
          today_appointments: myAppointments.filter((a) => {
            const appointmentDate = new Date(a.appointment_date);
            const today = new Date();
            return appointmentDate.toDateString() === today.toDateString();
          }).length,
        });
      }
    } catch (error) {
      console.error("Error fetching doctor data:", error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={styles.layout}>
          <Sidebar />
          <main style={styles.content}>
            <div style={styles.loading}>Loading dashboard...</div>
          </main>
        </div>
      </>
    );
  }

  const statCards = [
    {
      label: "My Patients",
      value: stats?.total_patients || 0,
      icon: "👥",
      color: "#2563eb",
    },
    {
      label: "Active Admissions",
      value: stats?.active_admissions || 0,
      icon: "🏥",
      color: "#dc2626",
    },
    {
      label: "Total Appointments",
      value: stats?.total_appointments || 0,
      icon: "📅",
      color: "#ea580c",
    },
    {
      label: "Today Appointments",
      value: stats?.today_appointments || 0,
      icon: "📆",
      color: "#059669",
    },
  ];

  return (
    <>
      <Navbar />
      <div style={styles.layout}>
        <Sidebar />
        <main style={styles.content}>
          <div style={styles.header}>
            <h1 style={styles.pageTitle}>Doctor Dashboard</h1>
            <p style={styles.subtitle}>
              Welcome back, Dr. {user?.first_name || user?.username}!
            </p>
          </div>

          <div style={styles.grid}>
            {statCards.map((card, index) => (
              <div
                key={index}
                style={{ ...styles.card, borderTopColor: card.color }}
              >
                <div style={styles.cardIcon}>{card.icon}</div>
                <div style={styles.cardContent}>
                  <p style={styles.cardLabel}>{card.label}</p>
                  <h2 style={{ ...styles.cardValue, color: card.color }}>
                    {card.value}
                  </h2>
                </div>
              </div>
            ))}
          </div>

          <div style={styles.infoSection}>
            <h3 style={styles.infoTitle}>Quick Actions</h3>
            <div style={styles.actionGrid}>
              <a href="/my-patients" style={styles.actionCard}>
                <span style={styles.actionIcon}>👥</span>
                <span>View My Patients</span>
              </a>
              <a href="/my-appointments" style={styles.actionCard}>
                <span style={styles.actionIcon}>📅</span>
                <span>My Appointments</span>
              </a>
              <a href="/run-prediction" style={styles.actionCard}>
                <span style={styles.actionIcon}>🔮</span>
                <span>Run Prediction</span>
              </a>
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
  loading: {
    textAlign: "center",
    padding: "3rem",
    fontSize: "1.1rem",
    color: "#64748b",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "1.5rem",
    marginBottom: "2rem",
  },
  card: {
    backgroundColor: "white",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    borderTop: "4px solid",
  },
  cardIcon: {
    fontSize: "3rem",
  },
  cardContent: {
    flex: 1,
  },
  cardLabel: {
    color: "#64748b",
    fontSize: "0.9rem",
    margin: "0 0 0.5rem 0",
  },
  cardValue: {
    fontSize: "2.5rem",
    fontWeight: "bold",
    margin: 0,
  },
  infoSection: {
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  infoTitle: {
    color: "#1e293b",
    marginTop: 0,
    marginBottom: "1.5rem",
  },
  actionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1rem",
  },
  actionCard: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "1rem",
    backgroundColor: "#f1f5f9",
    borderRadius: "8px",
    textDecoration: "none",
    color: "#334155",
    fontWeight: "500",
    transition: "all 0.2s",
  },
  actionIcon: {
    fontSize: "1.5rem",
  },
};

export default DoctorDashboard;
