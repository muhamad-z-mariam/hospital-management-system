import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { patientAPI } from "../api/api";
import { useAuth } from "../context/AuthContext";

const ArchivedPatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchArchivedPatients();
  }, []);

  const fetchArchivedPatients = async () => {
    try {
      setLoading(true);
      const data = await patientAPI.getArchived({ search: searchTerm });
      setPatients(Array.isArray(data) ? data : []);
      setError("");
    } catch (error) {
      console.error("Error fetching archived patients:", error);
      setError("Failed to load archived patients. Please try again.");
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id, name) => {
    if (window.confirm(`Are you sure you want to restore ${name} from archive?`)) {
      try {
        await patientAPI.restore(id);
        fetchArchivedPatients();
        alert(`${name} has been restored successfully.`);
      } catch (error) {
        console.error("Error restoring patient:", error);
        alert("Failed to restore patient. You may not have permission.");
      }
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchArchivedPatients();
  };

  // Redirect if not admin
  if (user?.role !== 'admin') {
    return (
      <>
        <Navbar />
        <div style={styles.layout}>
          <Sidebar />
          <main style={styles.content}>
            <div style={styles.error}>
              You do not have permission to view this page.
            </div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div style={styles.layout}>
        <Sidebar />
        <main style={styles.content}>
          {/* Header */}
          <div style={styles.header}>
            <div>
              <h1 style={styles.pageTitle}>Archived Patients</h1>
              <p style={styles.subtitle}>
                View and restore archived patient records
              </p>
            </div>
            <button
              onClick={() => navigate("/patients")}
              style={styles.backButton}
            >
              ← Back to Active Patients
            </button>
          </div>

          {/* Search */}
          <div style={styles.searchContainer}>
            <form onSubmit={handleSearchSubmit} style={styles.searchForm}>
              <input
                type="text"
                placeholder="Search archived patients by name, contact, or NHS number..."
                value={searchTerm}
                onChange={handleSearch}
                style={styles.searchInput}
              />
              <button type="submit" style={styles.searchButton}>
                Search
              </button>
            </form>
          </div>

          {/* Error Message */}
          {error && (
            <div style={styles.errorMessage}>{error}</div>
          )}

          {/* Patient List */}
          {loading ? (
            <div style={styles.loading}>Loading archived patients...</div>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Age/Gender</th>
                    <th style={styles.th}>Contact</th>
                    <th style={styles.th}>NHS Number</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={styles.noData}>
                        No archived patients found
                      </td>
                    </tr>
                  ) : (
                    patients.map((patient) => (
                      <tr key={patient.id} style={styles.tableRow}>
                        <td style={styles.td}>
                          <span style={styles.patientId}>#{patient.id}</span>
                        </td>
                        <td style={styles.td}>
                          <strong>{patient.name}</strong>
                        </td>
                        <td style={styles.td}>
                          {patient.age} / {patient.gender}
                        </td>
                        <td style={styles.td}>{patient.contact}</td>
                        <td style={styles.td}>
                          {patient.nhs_number || 'N/A'}
                        </td>
                        <td style={styles.td}>
                          <div style={styles.badgeContainer}>
                            <span style={styles.archivedBadge}>Archived</span>
                            {patient.insurance_status && (
                              <span style={styles.badgeInsured}>Insured</span>
                            )}
                            {patient.handicapped && (
                              <span style={styles.badgeHandicapped}>Handicapped</span>
                            )}
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.actionButtons}>
                            <button
                              onClick={() => navigate(`/patients/${patient.id}`)}
                              style={styles.viewBtn}
                              title="View Details"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleRestore(patient.id, patient.name)}
                              style={styles.restoreBtn}
                              title="Restore Patient"
                            >
                              Restore
                            </button>
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
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
  },
  pageTitle: {
    fontSize: "2rem",
    color: "#1e293b",
    margin: "0 0 0.5rem 0",
    fontWeight: "700",
  },
  subtitle: {
    color: "#64748b",
    margin: 0,
    fontSize: "1rem",
  },
  backButton: {
    backgroundColor: "#64748b",
    color: "white",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  searchContainer: {
    backgroundColor: "white",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    marginBottom: "1.5rem",
  },
  searchForm: {
    display: "flex",
    gap: "1rem",
  },
  searchInput: {
    flex: 1,
    padding: "0.75rem 1rem",
    fontSize: "1rem",
    border: "2px solid #e2e8f0",
    borderRadius: "8px",
    outline: "none",
  },
  searchButton: {
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
  loading: {
    textAlign: "center",
    padding: "3rem",
    fontSize: "1.1rem",
    color: "#64748b",
    backgroundColor: "white",
    borderRadius: "12px",
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
    backgroundColor: "#f8fafc",
  },
  th: {
    padding: "1rem",
    textAlign: "left",
    fontWeight: "600",
    color: "#475569",
    borderBottom: "2px solid #e2e8f0",
    fontSize: "0.875rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  tableRow: {
    transition: "background-color 0.2s",
    cursor: "pointer",
  },
  td: {
    padding: "1rem",
    borderBottom: "1px solid #e2e8f0",
    color: "#334155",
    fontSize: "0.95rem",
  },
  patientId: {
    color: "#64748b",
    fontWeight: "600",
    fontSize: "0.9rem",
  },
  badgeContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.25rem",
  },
  archivedBadge: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    padding: "0.25rem 0.75rem",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: "600",
  },
  badgeInsured: {
    backgroundColor: "#dbeafe",
    color: "#1e40af",
    padding: "0.25rem 0.75rem",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: "600",
  },
  badgeHandicapped: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
    padding: "0.25rem 0.75rem",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: "600",
  },
  actionButtons: {
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap",
  },
  viewBtn: {
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "500",
    transition: "background-color 0.2s",
  },
  restoreBtn: {
    backgroundColor: "#10b981",
    color: "white",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "500",
    transition: "background-color 0.2s",
  },
  noData: {
    textAlign: "center",
    padding: "3rem",
    color: "#64748b",
    fontSize: "1rem",
  },
  error: {
    backgroundColor: "#fee2e2",
    color: "#dc2626",
    padding: "1rem",
    borderRadius: "8px",
    marginBottom: "1rem",
    fontSize: "0.95rem",
    fontWeight: "500",
  },
  errorMessage: {
    backgroundColor: "#fee2e2",
    color: "#dc2626",
    padding: "1rem",
    borderRadius: "8px",
    marginBottom: "1rem",
    fontSize: "0.95rem",
    fontWeight: "500",
  },
};

export default ArchivedPatients;
