import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { predictionAPI } from "../api/api";

const Prediction = () => {
  const [highRiskPatients, setHighRiskPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active"); // active, recent, archive

  useEffect(() => {
    fetchHighRiskPatients();
  }, []);

  const fetchHighRiskPatients = async () => {
    try {
      // Fetch all prediction records where risk_level = 1
      const data = await predictionAPI.getAll();
      const predictionsArray = Array.isArray(data) ? data : [];

      // Filter only high risk (risk_level = 1)
      const highRisk = predictionsArray.filter((pred) => pred.risk_level === 1);
      setHighRiskPatients(highRisk);
    } catch (error) {
      console.error("Error fetching predictions:", error);
      setHighRiskPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const categorizePatients = () => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const active = [];
    const recent = [];
    const archive = [];

    highRiskPatients.forEach((prediction) => {
      const predictionDate = new Date(prediction.prediction_date);

      // Priority 1: Currently admitted patients (regardless of prediction date)
      if (prediction.is_currently_admitted) {
        active.push(prediction);
      }
      // Priority 2: Recent predictions (last 7 days) that are discharged or no admission
      else if (predictionDate >= sevenDaysAgo) {
        recent.push(prediction);
      }
      // Priority 3: Archive (older than 7 days and discharged/no admission)
      else {
        archive.push(prediction);
      }
    });

    return { active, recent, archive };
  };

  const { active, recent, archive } = categorizePatients();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const renderPatientTable = (patients, emptyMessage) => {
    if (patients.length === 0) {
      return (
        <tr>
          <td colSpan="7" style={styles.noData}>
            {emptyMessage}
          </td>
        </tr>
      );
    }

    return patients.map((prediction) => (
      <tr key={prediction.id} style={styles.tableRow}>
        <td style={styles.td}>
          <strong>{prediction.patient_name}</strong>
        </td>
        <td style={styles.td}>{prediction.patient_age}</td>
        <td style={styles.td}>{prediction.patient_contact}</td>
        <td style={styles.td}>
          {prediction.predicted_by_username || "Unknown"}
        </td>
        <td style={styles.td}>
          {formatDate(prediction.prediction_date)}
        </td>
        <td style={styles.td}>
          {prediction.admission_status ? (
            <span style={styles.statusBadge(prediction.admission_status)}>
              {prediction.admission_status.toUpperCase()}
            </span>
          ) : (
            <span style={styles.noAdmissionBadge}>No Admission</span>
          )}
        </td>
        <td style={styles.td}>
          <span style={styles.highRiskBadge}>⚠️ HIGH RISK</span>
        </td>
      </tr>
    ));
  };

  return (
    <>
      <Navbar />
      <div style={styles.layout}>
        <Sidebar />
        <main style={styles.content}>
          <div style={styles.header}>
            <div>
              <h1 style={styles.pageTitle}>⚠️ High Risk Patients</h1>
              <p style={styles.subtitle}>
                Patients identified as high risk for readmission
              </p>
            </div>
            <div style={styles.statsCard}>
              <span style={styles.statsLabel}>Total High Risk</span>
              <span style={styles.statsNumber}>{highRiskPatients.length}</span>
            </div>
          </div>

          {loading ? (
            <div style={styles.loading}>Loading high risk patients...</div>
          ) : (
            <>
              {/* Tab Buttons */}
              <div style={styles.tabContainer}>
                <button
                  style={
                    activeTab === "active"
                      ? styles.tabButtonActive
                      : styles.tabButton
                  }
                  onClick={() => setActiveTab("active")}
                >
                  🚨 Active ({active.length})
                </button>
                <button
                  style={
                    activeTab === "recent"
                      ? styles.tabButtonActive
                      : styles.tabButton
                  }
                  onClick={() => setActiveTab("recent")}
                >
                  📅 Recent ({recent.length})
                </button>
                <button
                  style={
                    activeTab === "archive"
                      ? styles.tabButtonActive
                      : styles.tabButton
                  }
                  onClick={() => setActiveTab("archive")}
                >
                  📦 Archive ({archive.length})
                </button>
              </div>

              {/* Active High-Risk Patients */}
              {activeTab === "active" && (
                <div style={styles.section}>
                  <div style={styles.sectionHeader}>
                    <h2 style={styles.sectionTitle}>
                      🚨 Active High-Risk Patients
                    </h2>
                    <p style={styles.sectionSubtitle}>
                      Currently admitted patients requiring immediate attention
                    </p>
                  </div>
                  <div style={styles.tableContainer}>
                    <table style={styles.table}>
                      <thead>
                        <tr style={styles.tableHeader}>
                          <th style={styles.th}>Patient Name</th>
                          <th style={styles.th}>Age</th>
                          <th style={styles.th}>Contact</th>
                          <th style={styles.th}>Predicted By</th>
                          <th style={styles.th}>Prediction Date</th>
                          <th style={styles.th}>Admission Status</th>
                          <th style={styles.th}>Risk Level</th>
                        </tr>
                      </thead>
                      <tbody>
                        {renderPatientTable(
                          active,
                          "✅ No active high-risk patients at this time"
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Recent Predictions */}
              {activeTab === "recent" && (
                <div style={styles.section}>
                  <div style={styles.sectionHeader}>
                    <h2 style={styles.sectionTitle}>📅 Recent Predictions</h2>
                    <p style={styles.sectionSubtitle}>
                      High-risk predictions from the last 7 days
                    </p>
                  </div>
                  <div style={styles.tableContainer}>
                    <table style={styles.table}>
                      <thead>
                        <tr style={styles.tableHeader}>
                          <th style={styles.th}>Patient Name</th>
                          <th style={styles.th}>Age</th>
                          <th style={styles.th}>Contact</th>
                          <th style={styles.th}>Predicted By</th>
                          <th style={styles.th}>Prediction Date</th>
                          <th style={styles.th}>Admission Status</th>
                          <th style={styles.th}>Risk Level</th>
                        </tr>
                      </thead>
                      <tbody>
                        {renderPatientTable(
                          recent,
                          "No recent high-risk predictions"
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Archive */}
              {activeTab === "archive" && (
                <div style={styles.section}>
                  <div style={styles.sectionHeader}>
                    <h2 style={styles.sectionTitle}>📦 Archive</h2>
                    <p style={styles.sectionSubtitle}>
                      Historical high-risk predictions (older than 7 days or
                      discharged)
                    </p>
                  </div>
                  <div style={styles.tableContainer}>
                    <table style={styles.table}>
                      <thead>
                        <tr style={styles.tableHeader}>
                          <th style={styles.th}>Patient Name</th>
                          <th style={styles.th}>Age</th>
                          <th style={styles.th}>Contact</th>
                          <th style={styles.th}>Predicted By</th>
                          <th style={styles.th}>Prediction Date</th>
                          <th style={styles.th}>Admission Status</th>
                          <th style={styles.th}>Risk Level</th>
                        </tr>
                      </thead>
                      <tbody>
                        {renderPatientTable(
                          archive,
                          "No archived high-risk predictions"
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          <div style={styles.infoBox}>
            <h3 style={styles.infoTitle}>ℹ️ About This Page</h3>
            <p style={styles.infoText}>
              This page shows all patients who have been identified as{" "}
              <strong>high risk for readmission</strong> organized into sections:
            </p>
            <ul style={styles.infoList}>
              <li>
                <strong>Active:</strong> Currently admitted patients requiring immediate attention
              </li>
              <li>
                <strong>Recent:</strong> Predictions made in the last 7 days
              </li>
              <li>
                <strong>Archive:</strong> Historical predictions for reference
              </li>
            </ul>
            <p style={styles.infoText}>
              <strong>Recommended actions:</strong>
            </p>
            <ul style={styles.infoList}>
              <li>Schedule follow-up appointments for these patients</li>
              <li>Ensure proper medication adherence monitoring</li>
              <li>Consider additional support services</li>
              <li>Review their medical history and vital signs regularly</li>
            </ul>
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
    margin: "0 0 0.5rem 0",
  },
  subtitle: {
    color: "#64748b",
    margin: 0,
  },
  statsCard: {
    backgroundColor: "#dc2626",
    color: "white",
    padding: "1.5rem 2rem",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.5rem",
  },
  statsLabel: {
    fontSize: "0.9rem",
    opacity: 0.9,
  },
  statsNumber: {
    fontSize: "2.5rem",
    fontWeight: "bold",
  },
  loading: {
    textAlign: "center",
    padding: "3rem",
    fontSize: "1.1rem",
    color: "#64748b",
  },
  tabContainer: {
    display: "flex",
    gap: "1rem",
    marginBottom: "2rem",
    borderBottom: "2px solid #e2e8f0",
    paddingBottom: "0.5rem",
  },
  tabButton: {
    backgroundColor: "white",
    color: "#64748b",
    border: "2px solid #e2e8f0",
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  tabButtonActive: {
    backgroundColor: "#dc2626",
    color: "white",
    border: "2px solid #dc2626",
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 6px rgba(220, 38, 38, 0.2)",
  },
  section: {
    marginBottom: "2.5rem",
  },
  sectionHeader: {
    marginBottom: "1rem",
  },
  sectionTitle: {
    fontSize: "1.5rem",
    color: "#1e293b",
    margin: "0 0 0.5rem 0",
  },
  sectionSubtitle: {
    color: "#64748b",
    margin: 0,
    fontSize: "0.95rem",
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
    backgroundColor: "#fee2e2",
  },
  th: {
    padding: "1rem",
    textAlign: "left",
    fontWeight: "600",
    color: "#991b1b",
    borderBottom: "2px solid #fecaca",
  },
  tableRow: {
    transition: "background-color 0.2s",
  },
  td: {
    padding: "1rem",
    borderBottom: "1px solid #e2e8f0",
    color: "#334155",
  },
  highRiskBadge: {
    backgroundColor: "#fee2e2",
    color: "#dc2626",
    padding: "0.5rem 1rem",
    borderRadius: "12px",
    fontSize: "0.85rem",
    fontWeight: "600",
    display: "inline-block",
  },
  statusBadge: (status) => {
    const baseStyle = {
      padding: "0.5rem 1rem",
      borderRadius: "12px",
      fontSize: "0.85rem",
      fontWeight: "600",
      display: "inline-block",
    };

    switch (status) {
      case "pending":
        return {
          ...baseStyle,
          backgroundColor: "#fef3c7",
          color: "#92400e",
        };
      case "admitted":
        return {
          ...baseStyle,
          backgroundColor: "#dbeafe",
          color: "#1e40af",
        };
      case "pending_discharge":
        return {
          ...baseStyle,
          backgroundColor: "#e0e7ff",
          color: "#4338ca",
        };
      case "discharged":
        return {
          ...baseStyle,
          backgroundColor: "#d1fae5",
          color: "#065f46",
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: "#f3f4f6",
          color: "#6b7280",
        };
    }
  },
  noAdmissionBadge: {
    backgroundColor: "#f3f4f6",
    color: "#6b7280",
    padding: "0.5rem 1rem",
    borderRadius: "12px",
    fontSize: "0.85rem",
    fontWeight: "600",
    display: "inline-block",
  },
  noData: {
    textAlign: "center",
    padding: "3rem",
    color: "#64748b",
    fontSize: "1.1rem",
  },
  infoBox: {
    backgroundColor: "#fffbeb",
    padding: "2rem",
    borderRadius: "12px",
    border: "2px solid #fde68a",
    marginTop: "2rem",
  },
  infoTitle: {
    color: "#92400e",
    marginTop: 0,
    marginBottom: "1rem",
  },
  infoText: {
    color: "#78350f",
    lineHeight: "1.6",
    marginBottom: "1rem",
  },
  infoList: {
    color: "#78350f",
    lineHeight: "1.8",
    paddingLeft: "1.5rem",
  },
};

export default Prediction;
