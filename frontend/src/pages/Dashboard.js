import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { dashboardAPI } from "../api/api";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await dashboardAPI.getStats();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
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
      label: "Total Patients",
      value: stats?.total_patients || 0,
      icon: "👥",
      color: "#2563eb",
    },
    {
      label: "Total Doctors",
      value: stats?.total_doctors || 0,
      icon: "👨‍⚕️",
      color: "#059669",
    },
    {
      label: "Total Nurses",
      value: stats?.total_nurses || 0,
      icon: "👩‍⚕️",
      color: "#7c3aed",
    },
    {
      label: "Active Admissions",
      value: stats?.active_admissions || 0,
      icon: "🏥",
      color: "#dc2626",
    },
    {
      label: "Today's Appointments",
      value: stats?.today_appointments || 0,
      icon: "📅",
      color: "#ea580c",
    },
    {
      label: "Total Payments",
      value: stats?.total_payments || 0,
      icon: "💰",
      color: "#0891b2",
    },
  ];

  return (
    <>
      <Navbar />
      <div style={styles.layout}>
        <Sidebar />
        <main style={styles.content}>
          <div style={styles.header}>
            <h1 style={styles.pageTitle}>Dashboard</h1>
            <p style={styles.subtitle}>Welcome to Hospital Management System</p>
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
              <a href="/patients" style={styles.actionCard}>
                <span style={styles.actionIcon}>➕</span>
                <span>Add New Patient</span>
              </a>
              <a href="/appointments" style={styles.actionCard}>
                <span style={styles.actionIcon}>📅</span>
                <span>Schedule Appointment</span>
              </a>
              <a href="/admissions" style={styles.actionCard}>
                <span style={styles.actionIcon}>🏥</span>
                <span>New Admission</span>
              </a>
              <a href="/prediction" style={styles.actionCard}>
                <span style={styles.actionIcon}>🔮</span>
                <span>Run Prediction</span>
              </a>
              <a href="/pharmacy-staff/add" style={styles.actionCard}>
                <span style={styles.actionIcon}>💊</span>
                <span>Add Pharmacy Staff</span>
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
    transition: "transform 0.2s, box-shadow 0.2s",
    cursor: "pointer",
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
    border: "2px solid transparent",
  },
  actionIcon: {
    fontSize: "1.5rem",
  },
};

export default Dashboard;
