import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { doctorAPI, admissionAPI, patientAPI } from "../api/api";

const DoctorPatients = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyPatients();
  }, []);

  const fetchMyPatients = async () => {
    try {
      const doctors = await doctorAPI.getAll();
      const myDoctor = Array.isArray(doctors)
        ? doctors.find((d) => d.user?.id === user.id)
        : null;

      if (myDoctor) {
        const allAdmissions = await admissionAPI.getAll();
        const myAdmissions = Array.isArray(allAdmissions)
          ? allAdmissions.filter((a) => a.doctor === myDoctor.id)
          : [];

        const patientIds = [...new Set(myAdmissions.map((a) => a.patient))];

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
              <p style={styles.subtitle}>Patients assigned to you</p>
            </div>
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
                        No patients assigned yet
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
  noData: {
    textAlign: "center",
    padding: "2rem",
    color: "#64748b",
  },
};

export default DoctorPatients;
