import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { patientAPI, admissionAPI } from "../api/api";
import { useAuth } from "../context/AuthContext";

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [filters, setFilters] = useState({
    gender: "",
    insurance_status: "",
    handicapped: ""
  });
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchStats();
    fetchPatients();
  }, [activeTab, filters]);

  const fetchStats = async () => {
    try {
      const data = await patientAPI.getStats();
      setStats(data);
    } catch (error) {
      console.error("Error fetching patient stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      setLoading(true);

      // Build query params based on active tab and filters
      let params = {};

      // Apply search
      if (searchTerm) {
        params.search = searchTerm;
      }

      // Apply filters
      if (filters.gender) {
        params.gender = filters.gender;
      }
      if (filters.insurance_status) {
        params.insurance_status = filters.insurance_status;
      }
      if (filters.handicapped) {
        params.handicapped = filters.handicapped;
      }

      // Handle archived tab separately
      if (activeTab === "archived") {
        params.archived = 'true';
        const data = await patientAPI.getAll(params);
        setPatients(Array.isArray(data) ? data : []);
      } else {
        const data = await patientAPI.getAll(params);
        let filteredData = Array.isArray(data) ? data : [];

        // Filter by tab (client-side for admitted status)
        if (activeTab === "admitted") {
          const admissions = await admissionAPI.getAll();
          const admittedPatientIds = admissions
            .filter(adm => adm.status === 'admitted')
            .map(adm => adm.patient);
          filteredData = filteredData.filter(p => admittedPatientIds.includes(p.id));
        } else if (activeTab === "outpatient") {
          const admissions = await admissionAPI.getAll();
          const admittedPatientIds = admissions
            .filter(adm => adm.status === 'admitted')
            .map(adm => adm.patient);
          filteredData = filteredData.filter(p => !admittedPatientIds.includes(p.id));
        }

        setPatients(filteredData);
      }

      setError("");
    } catch (error) {
      console.error("Error fetching patients:", error);
      setError("Failed to load patients. Please try again.");
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (id) => {
    if (window.confirm("Are you sure you want to move this patient to archive? This will hide them from the main list but keep their records.")) {
      try {
        await patientAPI.archive(id);
        fetchPatients();
        fetchStats();
        alert("Patient moved to archive successfully.");
      } catch (error) {
        console.error("Error archiving patient:", error);
        alert("Failed to archive patient. You may not have permission.");
      }
    }
  };

  const handleRestore = async (id, name) => {
    if (window.confirm(`Are you sure you want to restore ${name} from archive?`)) {
      try {
        await patientAPI.restore(id);
        fetchPatients();
        fetchStats();
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
    fetchPatients();
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilters({
      gender: "",
      insurance_status: "",
      handicapped: ""
    });
  };

  return (
    <>
      <Navbar />
      <div style={styles.layout}>
        <Sidebar />
        <main style={styles.content}>
          {/* Header */}
          <div style={styles.header}>
            <div>
              <h1 style={styles.pageTitle}>Patient Registry</h1>
              <p style={styles.subtitle}>
                {user?.role === 'admin'
                  ? 'Manage patient demographics and records'
                  : 'View patient medical records'}
              </p>
            </div>
            {user?.role === 'admin' && (
              <button
                onClick={() => navigate("/patients/add")}
                style={styles.addButton}
              >
                + Add New Patient
              </button>
            )}
          </div>

          {/* Statistics Cards */}
          {!statsLoading && stats && (
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statIcon}>👥</div>
                <div style={styles.statContent}>
                  <p style={styles.statLabel}>Total Patients</p>
                  <h2 style={styles.statValue}>{stats.total_patients}</h2>
                </div>
              </div>
              <div style={{...styles.statCard, ...styles.statCardAdmitted}}>
                <div style={styles.statIcon}>🏥</div>
                <div style={styles.statContent}>
                  <p style={styles.statLabel}>Currently Admitted</p>
                  <h2 style={styles.statValue}>{stats.currently_admitted}</h2>
                </div>
              </div>
              <div style={{...styles.statCard, ...styles.statCardOutpatient}}>
                <div style={styles.statIcon}>🚶</div>
                <div style={styles.statContent}>
                  <p style={styles.statLabel}>Outpatients</p>
                  <h2 style={styles.statValue}>{stats.outpatients}</h2>
                </div>
              </div>
              <div style={{...styles.statCard, ...styles.statCardInsured}}>
                <div style={styles.statIcon}>🛡️</div>
                <div style={styles.statContent}>
                  <p style={styles.statLabel}>Insured</p>
                  <h2 style={styles.statValue}>{stats.insured_patients}</h2>
                </div>
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div style={styles.searchContainer}>
            <form onSubmit={handleSearchSubmit} style={styles.searchForm}>
              <input
                type="text"
                placeholder="Search by name, contact, or NHS number..."
                value={searchTerm}
                onChange={handleSearch}
                style={styles.searchInput}
              />
              <button type="submit" style={styles.searchButton}>
                Search
              </button>
            </form>

            <div style={styles.filterRow}>
              <select
                value={filters.gender}
                onChange={(e) => setFilters({...filters, gender: e.target.value})}
                style={styles.filterSelect}
              >
                <option value="">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>

              <select
                value={filters.insurance_status}
                onChange={(e) => setFilters({...filters, insurance_status: e.target.value})}
                style={styles.filterSelect}
              >
                <option value="">All Insurance Status</option>
                <option value="true">Insured</option>
                <option value="false">Uninsured</option>
              </select>

              <select
                value={filters.handicapped}
                onChange={(e) => setFilters({...filters, handicapped: e.target.value})}
                style={styles.filterSelect}
              >
                <option value="">All Patients</option>
                <option value="true">Handicapped</option>
                <option value="false">Not Handicapped</option>
              </select>

              <button onClick={clearFilters} style={styles.clearButton}>
                Clear Filters
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={styles.tabsContainer}>
            <button
              onClick={() => setActiveTab("all")}
              style={activeTab === "all" ? {...styles.tab, ...styles.activeTab} : styles.tab}
            >
              All Patients ({stats?.total_patients || 0})
            </button>
            <button
              onClick={() => setActiveTab("admitted")}
              style={activeTab === "admitted" ? {...styles.tab, ...styles.activeTab} : styles.tab}
            >
              Currently Admitted ({stats?.currently_admitted || 0})
            </button>
            <button
              onClick={() => setActiveTab("outpatient")}
              style={activeTab === "outpatient" ? {...styles.tab, ...styles.activeTab} : styles.tab}
            >
              Outpatients ({stats?.outpatients || 0})
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={() => setActiveTab("archived")}
                style={activeTab === "archived" ? {...styles.tab, ...styles.activeTab} : styles.tab}
              >
                Archived ({stats?.archived_patients || 0})
              </button>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div style={styles.error}>{error}</div>
          )}

          {/* Patient List */}
          {loading ? (
            <div style={styles.loading}>Loading patients...</div>
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
                        No patients found
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
                            {patient.insurance_status && (
                              <span style={styles.badgeInsured}>Insured</span>
                            )}
                            {patient.handicapped && (
                              <span style={styles.badgeHandicapped}>Handicapped</span>
                            )}
                            {!patient.insurance_status && !patient.handicapped && (
                              <span style={styles.badgeNormal}>Standard</span>
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
                            {user?.role === 'admin' && (
                              <>
                                {activeTab !== 'archived' && (
                                  <>
                                    <button
                                      onClick={() => navigate(`/patients/${patient.id}/archive`)}
                                      style={styles.viewArchiveBtn}
                                      title="View Patient History"
                                    >
                                      History
                                    </button>
                                    <button
                                      onClick={() => handleArchive(patient.id)}
                                      style={styles.archiveBtn}
                                      title="Move to Archive"
                                    >
                                      Move to Archive
                                    </button>
                                  </>
                                )}
                                {activeTab === 'archived' && (
                                  <button
                                    onClick={() => handleRestore(patient.id, patient.name)}
                                    style={styles.restoreBtn}
                                    title="Restore Patient"
                                  >
                                    Restore
                                  </button>
                                )}
                              </>
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
  addButton: {
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
  // Statistics Cards
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "1.5rem",
    marginBottom: "2rem",
  },
  statCard: {
    backgroundColor: "white",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    border: "1px solid #e2e8f0",
  },
  statCardAdmitted: {
    borderLeft: "4px solid #10b981",
  },
  statCardOutpatient: {
    borderLeft: "4px solid #3b82f6",
  },
  statCardInsured: {
    borderLeft: "4px solid #8b5cf6",
  },
  statIcon: {
    fontSize: "2.5rem",
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: "0.875rem",
    color: "#64748b",
    margin: "0 0 0.25rem 0",
    fontWeight: "500",
  },
  statValue: {
    fontSize: "2rem",
    color: "#1e293b",
    margin: 0,
    fontWeight: "700",
  },
  // Search and Filters
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
    marginBottom: "1rem",
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
  filterRow: {
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap",
  },
  filterSelect: {
    padding: "0.5rem 1rem",
    fontSize: "0.95rem",
    border: "2px solid #e2e8f0",
    borderRadius: "6px",
    backgroundColor: "white",
    cursor: "pointer",
    outline: "none",
  },
  clearButton: {
    backgroundColor: "#f1f5f9",
    color: "#475569",
    border: "2px solid #e2e8f0",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    fontSize: "0.95rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  // Tabs
  tabsContainer: {
    display: "flex",
    gap: "0.5rem",
    marginBottom: "1.5rem",
    borderBottom: "2px solid #e2e8f0",
  },
  tab: {
    backgroundColor: "transparent",
    color: "#64748b",
    border: "none",
    padding: "0.75rem 1.5rem",
    fontSize: "0.95rem",
    fontWeight: "500",
    cursor: "pointer",
    borderBottom: "2px solid transparent",
    marginBottom: "-2px",
    transition: "all 0.2s",
  },
  activeTab: {
    color: "#2563eb",
    borderBottom: "2px solid #2563eb",
    fontWeight: "600",
  },
  // Table
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
  badgeNormal: {
    backgroundColor: "#f1f5f9",
    color: "#64748b",
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
  viewArchiveBtn: {
    backgroundColor: "#7c3aed",
    color: "white",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "500",
    transition: "background-color 0.2s",
  },
  archiveBtn: {
    backgroundColor: "#f59e0b",
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
};

export default Patients;
