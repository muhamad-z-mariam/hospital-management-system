import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { nurseAPI, admissionAPI } from "../api/api";

const NurseAdmissions = () => {
  const { user } = useAuth();
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('admitted'); // 'admitted' or 'discharged'

  useEffect(() => {
    fetchMyAdmissions();
  }, [view]);

  const fetchMyAdmissions = async () => {
    try {
      // Get nurse ID for this user
      const nurses = await nurseAPI.getAll();
      const myNurse = Array.isArray(nurses)
        ? nurses.find((n) => n.user?.id === user.id)
        : null;

      if (myNurse) {
        // Get admissions for this nurse
        const allAdmissions = await admissionAPI.getAll();
        const myAdmissions = Array.isArray(allAdmissions)
          ? allAdmissions.filter((a) => a.nurse === myNurse.id)
          : [];

        // Filter by view: only admitted or only discharged
        const filteredAdmissions = view === 'admitted'
          ? myAdmissions.filter((a) => a.status === 'admitted')
          : myAdmissions.filter((a) => a.status === 'discharged');

        setAdmissions(filteredAdmissions);
      }
    } catch (error) {
      console.error("Error fetching admissions:", error);
      setAdmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
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
              <h1 style={styles.pageTitle}>🏥 My Admissions</h1>
              <p style={styles.subtitle}>
                {view === 'admitted' ? 'Currently admitted patients' : 'Discharged patients archive'}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div style={styles.tabs}>
            <button
              onClick={() => setView('admitted')}
              style={{
                ...styles.tab,
                ...(view === 'admitted' ? styles.activeTab : {})
              }}
            >
              🏥 Admitted
            </button>
            <button
              onClick={() => setView('discharged')}
              style={{
                ...styles.tab,
                ...(view === 'discharged' ? styles.activeTab : {})
              }}
            >
              📚 Archive
            </button>
          </div>

          {loading ? (
            <div style={styles.loading}>Loading admissions...</div>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Patient</th>
                    <th style={styles.th}>Doctor</th>
                    <th style={styles.th}>Admission Date</th>
                    <th style={styles.th}>Discharge Date</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {admissions.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={styles.noData}>
                        {view === 'admitted' ? 'No admitted patients' : 'No discharged patients'}
                      </td>
                    </tr>
                  ) : (
                    admissions.map((admission) => (
                      <tr key={admission.id} style={styles.tableRow}>
                        <td style={styles.td}>{admission.id}</td>
                        <td style={styles.td}>
                          {admission.patient_name ||
                            `Patient #${admission.patient}`}
                        </td>
                        <td style={styles.td}>
                          {admission.doctor_name || "N/A"}
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
                                admission.status === "Admitted"
                                  ? "#dcfce7"
                                  : "#f1f5f9",
                              color:
                                admission.status === "Admitted"
                                  ? "#166534"
                                  : "#64748b",
                            }}
                          >
                            {admission.status}
                          </span>
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
  statusBadge: {
    padding: "0.25rem 0.75rem",
    borderRadius: "12px",
    fontSize: "0.85rem",
    fontWeight: "500",
  },
  noData: {
    textAlign: "center",
    padding: "2rem",
    color: "#64748b",
  },
};

export default NurseAdmissions;
