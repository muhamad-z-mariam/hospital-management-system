import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { doctorAPI, admissionAPI, patientAPI } from "../api/api";

const DoctorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [admissions, setAdmissions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDoctorProfile();
  }, [id]);

  const fetchDoctorProfile = async () => {
    try {
      // Fetch doctor
      const doctorData = await doctorAPI.getById(id);
      setDoctor(doctorData);

      // Fetch all admissions for this doctor
      const allAdmissions = await admissionAPI.getAll();
      const doctorAdmissions = Array.isArray(allAdmissions)
        ? allAdmissions.filter((a) => a.doctor === parseInt(id))
        : [];
      setAdmissions(doctorAdmissions);

      // Get unique patients
      const patientIds = [...new Set(doctorAdmissions.map((a) => a.patient))];
      const allPatients = await patientAPI.getAll();
      const doctorPatients = Array.isArray(allPatients)
        ? allPatients.filter((p) => patientIds.includes(p.id))
        : [];
      setPatients(doctorPatients);
    } catch (error) {
      console.error("Error fetching doctor profile:", error);
      setDoctor(null);
      setAdmissions([]);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const totalAdmissions = admissions.length;
    const dischargedCount = admissions.filter(
      (a) => a.status === "discharged"
    ).length;
    const activeCount = admissions.filter(
      (a) => a.status !== "discharged"
    ).length;
    const successRate =
      totalAdmissions > 0
        ? ((dischargedCount / totalAdmissions) * 100).toFixed(1)
        : 0;

    return { totalAdmissions, dischargedCount, activeCount, successRate };
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={styles.layout}>
          <Sidebar />
          <main style={styles.content}>
            <div style={styles.loading}>Loading doctor profile...</div>
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
            <h1 style={styles.pageTitle}>👨‍⚕️ Doctor Profile</h1>
            <button
              onClick={() => navigate("/doctors")}
              style={styles.backButton}
            >
              ← Back to Doctors
            </button>
          </div>

          {/* Profile Header */}
          <div style={styles.profileCard}>
            <div style={styles.profileIcon}>👨‍⚕️</div>
            <div style={styles.profileInfo}>
              <h2 style={styles.doctorName}>
                Dr. {doctor?.user?.first_name} {doctor?.user?.last_name}
              </h2>
              <p style={styles.specialty}>{doctor?.specialty}</p>
              <p style={styles.contact}>
                📧 {doctor?.user?.email || "No email"} • 👤 @
                {doctor?.user?.username}
              </p>
            </div>
          </div>

          {/* Statistics */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>👥</div>
              <div style={styles.statValue}>{patients.length}</div>
              <div style={styles.statLabel}>Total Patients</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>🏥</div>
              <div style={styles.statValue}>{stats.totalAdmissions}</div>
              <div style={styles.statLabel}>Total Admissions</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>✅</div>
              <div style={styles.statValue}>{stats.dischargedCount}</div>
              <div style={styles.statLabel}>Discharged</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>📊</div>
              <div style={styles.statValue}>{stats.successRate}%</div>
              <div style={styles.statLabel}>Success Rate</div>
            </div>
          </div>

          {/* Recent Patients */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>👥 Patients Treated</h3>
            {patients.length === 0 ? (
              <p style={styles.noData}>No patients yet</p>
            ) : (
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeader}>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Name</th>
                      <th style={styles.th}>Age</th>
                      <th style={styles.th}>Gender</th>
                      <th style={styles.th}>Contact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((patient) => (
                      <tr key={patient.id} style={styles.tableRow}>
                        <td style={styles.td}>{patient.id}</td>
                        <td style={styles.td}>{patient.name}</td>
                        <td style={styles.td}>{patient.age}</td>
                        <td style={styles.td}>{patient.gender}</td>
                        <td style={styles.td}>{patient.contact}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Admissions */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>🏥 Recent Admissions</h3>
            {admissions.length === 0 ? (
              <p style={styles.noData}>No admissions yet</p>
            ) : (
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeader}>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Patient</th>
                      <th style={styles.th}>Nurse</th>
                      <th style={styles.th}>Admitted</th>
                      <th style={styles.th}>Discharged</th>
                      <th style={styles.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admissions.slice(0, 10).map((admission) => (
                      <tr key={admission.id} style={styles.tableRow}>
                        <td style={styles.td}>{admission.id}</td>
                        <td style={styles.td}>
                          {admission.patient_name || `#${admission.patient}`}
                        </td>
                        <td style={styles.td}>
                          {admission.nurse_name || "N/A"}
                        </td>
                        <td style={styles.td}>
                          {formatDate(admission.admission_date)}
                        </td>
                        <td style={styles.td}>
                          {formatDate(admission.discharge_date)}
                        </td>
                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.statusBadge,
                              backgroundColor:
                                admission.status === "discharged"
                                  ? "#f1f5f9"
                                  : "#dcfce7",
                              color:
                                admission.status === "discharged"
                                  ? "#64748b"
                                  : "#166534",
                            }}
                          >
                            {admission.status}
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
  doctorName: { color: "#1e293b", margin: "0 0 0.5rem 0", fontSize: "2rem" },
  specialty: {
    color: "#2563eb",
    fontSize: "1.25rem",
    fontWeight: "600",
    margin: "0 0 0.5rem 0",
  },
  contact: { color: "#64748b", margin: 0 },

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

export default DoctorProfile;
