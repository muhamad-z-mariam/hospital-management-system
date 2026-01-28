import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { nurseAPI } from "../api/api";
import { useAuth } from "../context/AuthContext";

const Nurses = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [nurses, setNurses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchNurses();
  }, [activeTab]);

  const fetchNurses = async () => {
    try {
      let params = {};
      if (activeTab === "archived") {
        params.archived = 'true';
      }
      const data = await nurseAPI.getAll(params);
      setNurses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching nurses:", error);
      setNurses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (id, name) => {
    if (window.confirm(`Are you sure you want to move ${name} to archive?`)) {
      try {
        await nurseAPI.archive(id);
        fetchNurses();
        alert(`${name} moved to archive successfully.`);
      } catch (error) {
        console.error("Error archiving nurse:", error);
        alert("Failed to archive nurse. You may not have permission.");
      }
    }
  };

  const handleRestore = async (id, name) => {
    if (window.confirm(`Are you sure you want to restore ${name} from archive?`)) {
      try {
        await nurseAPI.restore(id);
        fetchNurses();
        alert(`${name} has been restored successfully.`);
      } catch (error) {
        console.error("Error restoring nurse:", error);
        alert("Failed to restore nurse. You may not have permission.");
      }
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
              <h1 style={styles.pageTitle}>👩‍⚕️ Nurses</h1>
              <p style={styles.subtitle}>Manage hospital nurses</p>
            </div>
            <button
              onClick={() => navigate("/nurses/add")}
              style={styles.addButton}
            >
              ➕ Add New Nurse
            </button>
          </div>

          {user?.role === 'admin' && (
            <div style={styles.tabs}>
              <button
                onClick={() => setActiveTab("all")}
                style={activeTab === "all" ? {...styles.tab, ...styles.activeTab} : styles.tab}
              >
                All Nurses
              </button>
              <button
                onClick={() => setActiveTab("archived")}
                style={activeTab === "archived" ? {...styles.tab, ...styles.activeTab} : styles.tab}
              >
                Archived
              </button>
            </div>
          )}

          {loading ? (
            <div style={styles.loading}>Loading nurses...</div>
          ) : (
            <div style={styles.grid}>
              {nurses.length === 0 ? (
                <div style={styles.noData}>No nurses found</div>
              ) : (
                nurses.map((nurse) => (
                  <div key={nurse.id} style={styles.card}>
                    <div style={styles.cardIcon}>👩‍⚕️</div>
                    <div style={styles.cardContent}>
                      <h3 style={styles.cardTitle}>
                        {nurse.user?.first_name} {nurse.user?.last_name}
                      </h3>
                      <p style={styles.cardSubtitle}>@{nurse.user?.username}</p>
                      <div style={styles.departmentBadge}>
                        {nurse.department}
                      </div>
                      <div style={styles.cardInfo}>
                        <span>📧 {nurse.user?.email || "No email"}</span>
                      </div>
                      <button
                        onClick={() => navigate(`/nurses/${nurse.id}/profile`)}
                        style={styles.profileBtn}
                      >
                        📊 View Profile
                      </button>
                      {user?.role === 'admin' && (
                        <>
                          {activeTab !== 'archived' ? (
                            <button
                              onClick={() => handleArchive(nurse.id, `${nurse.user?.first_name} ${nurse.user?.last_name}`)}
                              style={styles.archiveBtn}
                            >
                              🗄️ Move to Archive
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRestore(nurse.id, `${nurse.user?.first_name} ${nurse.user?.last_name}`)}
                              style={styles.restoreBtn}
                            >
                              ↩️ Restore
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
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
  },
  subtitle: {
    color: "#64748b",
    margin: 0,
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
  },
  loading: {
    textAlign: "center",
    padding: "3rem",
    fontSize: "1.1rem",
    color: "#64748b",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "1.5rem",
  },
  card: {
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  cardIcon: {
    fontSize: "4rem",
    marginBottom: "1rem",
  },
  cardContent: {
    width: "100%",
  },
  cardTitle: {
    color: "#1e293b",
    margin: "0 0 0.5rem 0",
    fontSize: "1.25rem",
  },
  cardSubtitle: {
    color: "#64748b",
    margin: "0 0 1rem 0",
    fontSize: "0.9rem",
  },
  departmentBadge: {
    backgroundColor: "#f3e8ff",
    color: "#6b21a8",
    padding: "0.5rem 1rem",
    borderRadius: "20px",
    fontSize: "0.9rem",
    fontWeight: "600",
    display: "inline-block",
    marginBottom: "1rem",
  },
  cardInfo: {
    color: "#64748b",
    fontSize: "0.9rem",
  },
  noData: {
    textAlign: "center",
    padding: "3rem",
    color: "#64748b",
    gridColumn: "1 / -1",
  },
  profileBtn: {
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.95rem",
    marginTop: "1rem",
    width: "100%",
  },
  tabs: {
    display: "flex",
    gap: "0.5rem",
    marginBottom: "1.5rem",
    borderBottom: "2px solid #e2e8f0",
    paddingBottom: "0.5rem",
  },
  tab: {
    backgroundColor: "transparent",
    color: "#64748b",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "6px 6px 0 0",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: "500",
    transition: "all 0.2s",
  },
  activeTab: {
    backgroundColor: "#2563eb",
    color: "white",
    fontWeight: "600",
  },
  archiveBtn: {
    backgroundColor: "#f97316",
    color: "white",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.95rem",
    marginTop: "0.5rem",
    width: "100%",
  },
  restoreBtn: {
    backgroundColor: "#10b981",
    color: "white",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.95rem",
    marginTop: "0.5rem",
    width: "100%",
  },
};

export default Nurses;
