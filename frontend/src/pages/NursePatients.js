import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { nurseAPI, admissionAPI, patientAPI } from "../api/api";

const NursePatients = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('active'); // 'active' or 'archive'
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyPatients();
  }, [view]);

  const fetchMyPatients = async () => {
    try {
      const nurses = await nurseAPI.getAll();
      const myNurse = Array.isArray(nurses)
        ? nurses.find((n) => n.user?.id === user.id)
        : null;

      if (myNurse) {
        const allAdmissions = await admissionAPI.getAll();
        const myAdmissions = Array.isArray(allAdmissions)
          ? allAdmissions.filter((a) => a.nurse === myNurse.id)
          : [];

        // Filter by view: active (pending + admitted) or archive (discharged)
        const filteredAdmissions = view === 'active'
          ? myAdmissions.filter((a) => a.status === 'pending' || a.status === 'admitted')
          : myAdmissions.filter((a) => a.status === 'discharged');

        const patientIds = [...new Set(filteredAdmissions.map((a) => a.patient))];

        const allPatients = await patientAPI.getAll();
        const myPatients = Array.isArray(allPatients)
          ? allPatients.filter((p) => patientIds.includes(p.id))
          : [];

        setPatients(myPatients);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
      setPatients([]);
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
            <div>
              <h1 style={styles.pageTitle}>My Patients</h1>
              <p style={styles.subtitle}>
                {view === 'active' ? 'Active patients under your care' : 'Discharged patients archive'}
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
              👥 Active Patients
            </button>
            <button
              onClick={() => setView('archive')}
              style={{
                ...styles.tab,
                ...(view === 'archive' ? styles.activeTab : {})
              }}
            >
              📚 Archive
            </button>
          </div>

          {loading ? (
            <div style={styles.loading}>Loading patients...</div>
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
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={styles.noData}>
                        {view === 'active' ? 'No active patients' : 'No discharged patients'}
                      </td>
                    </tr>
                  ) : (
                    patients.map((patient) => (
                      <tr key={patient.id} style={styles.tableRow}>
                        <td style={styles.td}>{patient.id}</td>
                        <td style={styles.td}>{patient.name}</td>
                        <td style={styles.td}>{patient.age}</td>
                        <td style={styles.td}>{patient.gender}</td>
                        <td style={styles.td}>{patient.contact}</td>
                        <td style={styles.td}>
                          <button
                            onClick={() => navigate(`/patients/${patient.id}`)}
                            style={styles.viewBtn}
                          >
                            View
                          </button>
                          <button
                            onClick={() =>
                              navigate(`/edit-patient-medical/${patient.id}`)
                            }
                            style={styles.editBtn}
                          >
                            📝 Medical Data
                          </button>
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
  viewBtn: {
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    padding: "0.4rem 1rem",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  editBtn: {
    backgroundColor: "#059669",
    color: "white",
    border: "none",
    padding: "0.4rem 1rem",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.9rem",
    marginLeft: "0.5rem",
  },
  noData: {
    textAlign: "center",
    padding: "2rem",
    color: "#64748b",
  },
};

export default NursePatients;
