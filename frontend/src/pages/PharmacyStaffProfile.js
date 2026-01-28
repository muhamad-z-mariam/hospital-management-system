import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { pharmacyStaffAPI, prescriptionAPI } from "../api/api";

const PharmacyStaffProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [staff, setStaff] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStaffProfile();
  }, [id]);

  const fetchStaffProfile = async () => {
    try {
      // Fetch pharmacy staff
      const staffData = await pharmacyStaffAPI.getById(id);
      setStaff(staffData);

      // Fetch all prescriptions dispensed by this staff
      const allPrescriptions = await prescriptionAPI.getAll();
      const staffPrescriptions = Array.isArray(allPrescriptions)
        ? allPrescriptions.filter((p) => p.dispensed_by === parseInt(id))
        : [];
      setPrescriptions(staffPrescriptions);
    } catch (error) {
      console.error("Error fetching pharmacy staff profile:", error);
      setStaff(null);
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const totalDispensed = prescriptions.length;
    const fullyDispensed = prescriptions.filter(
      (p) => p.status === "dispensed"
    ).length;
    const partiallyDispensed = prescriptions.filter(
      (p) => p.status === "partially_dispensed"
    ).length;
    const pending = prescriptions.filter(
      (p) => p.status === "pending"
    ).length;

    return { totalDispensed, fullyDispensed, partiallyDispensed, pending };
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const getShiftEmoji = (shift) => {
    if (shift === 'morning') return '🌅';
    if (shift === 'afternoon') return '☀️';
    if (shift === 'night') return '🌙';
    return '📅';
  };

  const getShiftLabel = (shift) => {
    if (shift === 'morning') return 'Morning Shift';
    if (shift === 'afternoon') return 'Afternoon Shift';
    if (shift === 'night') return 'Night Shift';
    return shift;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={styles.layout}>
          <Sidebar />
          <main style={styles.content}>
            <div style={styles.loading}>Loading pharmacy staff profile...</div>
          </main>
        </div>
      </>
    );
  }

  const stats = calculateStats();

  return (
    <>
      <Navbar />
      <div style={styles.layout}>
        <Sidebar />
        <main style={styles.content}>
          <div style={styles.header}>
            <h1 style={styles.pageTitle}>💊 Pharmacy Staff Profile</h1>
            <button
              onClick={() => navigate("/pharmacy-staff")}
              style={styles.backButton}
            >
              ← Back to Pharmacy Staff
            </button>
          </div>

          {/* Profile Header */}
          <div style={styles.profileCard}>
            <div style={styles.profileIcon}>💊</div>
            <div style={styles.profileInfo}>
              <h2 style={styles.staffName}>
                {staff?.user?.first_name} {staff?.user?.last_name}
              </h2>
              <p style={styles.shift}>
                {getShiftEmoji(staff?.shift)} {getShiftLabel(staff?.shift)}
              </p>
              <p style={styles.contact}>
                📧 {staff?.user?.email || "No email"} • 👤 @
                {staff?.user?.username}
              </p>
              {staff?.license_number && (
                <p style={styles.license}>📜 License: {staff.license_number}</p>
              )}
            </div>
          </div>

          {/* Statistics */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>📦</div>
              <div style={styles.statValue}>{stats.totalDispensed}</div>
              <div style={styles.statLabel}>Total Prescriptions</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>✅</div>
              <div style={styles.statValue}>{stats.fullyDispensed}</div>
              <div style={styles.statLabel}>Fully Dispensed</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>⏳</div>
              <div style={styles.statValue}>{stats.partiallyDispensed}</div>
              <div style={styles.statLabel}>Partially Dispensed</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>🕐</div>
              <div style={styles.statValue}>{stats.pending}</div>
              <div style={styles.statLabel}>Pending</div>
            </div>
          </div>

          {/* Recent Prescriptions */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>📋 Recent Prescriptions Dispensed</h3>
            {prescriptions.length === 0 ? (
              <p style={styles.noData}>No prescriptions dispensed yet</p>
            ) : (
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeader}>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Patient</th>
                      <th style={styles.th}>Doctor</th>
                      <th style={styles.th}>Prescribed</th>
                      <th style={styles.th}>Dispensed</th>
                      <th style={styles.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prescriptions.slice(0, 10).map((prescription) => (
                      <tr key={prescription.id} style={styles.tableRow}>
                        <td style={styles.td}>{prescription.id}</td>
                        <td style={styles.td}>
                          {prescription.patient_name || `#${prescription.patient}`}
                        </td>
                        <td style={styles.td}>
                          {prescription.doctor_name || "N/A"}
                        </td>
                        <td style={styles.td}>
                          {formatDate(prescription.prescribed_date)}
                        </td>
                        <td style={styles.td}>
                          {formatDate(prescription.dispensed_date)}
                        </td>
                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.statusBadge,
                              backgroundColor:
                                prescription.status === "dispensed"
                                  ? "#dcfce7"
                                  : prescription.status === "partially_dispensed"
                                  ? "#fef3c7"
                                  : "#f1f5f9",
                              color:
                                prescription.status === "dispensed"
                                  ? "#166534"
                                  : prescription.status === "partially_dispensed"
                                  ? "#92400e"
                                  : "#64748b",
                            }}
                          >
                            {prescription.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

const styles = {
  layout: { display: "flex" },
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
  pageTitle: { fontSize: "2rem", color: "#1e293b", margin: 0 },
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

  profileCard: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "2rem",
    marginBottom: "2rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    display: "flex",
    alignItems: "center",
    gap: "2rem",
  },
  profileIcon: { fontSize: "5rem" },
  profileInfo: { flex: 1 },
  staffName: { color: "#1e293b", margin: "0 0 0.5rem 0", fontSize: "2rem" },
  shift: {
    color: "#2563eb",
    fontSize: "1.25rem",
    fontWeight: "600",
    margin: "0 0 0.5rem 0",
  },
  contact: { color: "#64748b", margin: "0 0 0.5rem 0" },
  license: { color: "#64748b", margin: 0, fontWeight: "500" },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1.5rem",
    marginBottom: "2rem",
  },
  statCard: {
    backgroundColor: "white",
    textAlign: "center",
    padding: "2rem",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  statIcon: { fontSize: "3rem", marginBottom: "0.5rem" },
  statValue: {
    fontSize: "2.5rem",
    fontWeight: "bold",
    color: "#1e293b",
    margin: "0.5rem 0",
  },
  statLabel: { color: "#64748b", fontSize: "0.9rem" },

  section: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "2rem",
    marginBottom: "2rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  sectionTitle: {
    color: "#1e293b",
    marginTop: 0,
    marginBottom: "1.5rem",
    fontSize: "1.5rem",
  },
  noData: {
    color: "#64748b",
    fontStyle: "italic",
    textAlign: "center",
    padding: "2rem",
  },

  tableContainer: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  tableHeader: { backgroundColor: "#f1f5f9" },
  th: {
    padding: "1rem",
    textAlign: "left",
    fontWeight: "600",
    color: "#475569",
    borderBottom: "2px solid #e2e8f0",
  },
  tableRow: { transition: "background-color 0.2s" },
  td: { padding: "1rem", borderBottom: "1px solid #e2e8f0", color: "#334155" },
  statusBadge: {
    padding: "0.25rem 0.75rem",
    borderRadius: "12px",
    fontSize: "0.85rem",
    fontWeight: "500",
  },
};

export default PharmacyStaffProfile;
