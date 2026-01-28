import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { admissionAPI, roomAPI, paymentAPI } from "../api/api";

const Admissions = () => {
  const navigate = useNavigate();
  const [admissions, setAdmissions] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [showArchive, setShowArchive] = useState(false);

  // Modal states
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [admissionsData, roomsData] = await Promise.all([
        admissionAPI.getAll(),
        roomAPI.getAll()
      ]);
      setAdmissions(Array.isArray(admissionsData) ? admissionsData : []);
      setRooms(Array.isArray(roomsData) ? roomsData : []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setAdmissions([]);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmissions = async () => {
    try {
      const data = await admissionAPI.getAll();
      setAdmissions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching admissions:", error);
      setAdmissions([]);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const getFilteredAdmissions = () => {
    if (activeFilter === "all") return admissions;

    let filtered = admissions.filter(
      (admission) => admission.status.toLowerCase() === activeFilter.toLowerCase()
    );

    // Special handling for discharged: filter by date if not showing archive
    if (activeFilter === "discharged") {
      if (!showArchive) {
        // Show only this week's discharges
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        filtered = filtered.filter((admission) => {
          if (!admission.discharge_date) return false;
          const dischargeDate = new Date(admission.discharge_date);
          return dischargeDate >= oneWeekAgo;
        });
      }

      // Sort by discharge_date descending (newest first)
      filtered.sort((a, b) => {
        const dateA = a.discharge_date ? new Date(a.discharge_date) : new Date(0);
        const dateB = b.discharge_date ? new Date(b.discharge_date) : new Date(0);
        return dateB - dateA;
      });
    }

    return filtered;
  };

  const getStatusCount = (status) => {
    if (status === "all") return admissions.length;
    return admissions.filter(
      (admission) => admission.status.toLowerCase() === status.toLowerCase()
    ).length;
  };

  const getAvailableRooms = () => {
    return rooms.filter(room => room.occupied_beds < room.bed_capacity);
  };

  const getRoomInfo = (roomId) => {
    if (!roomId) return null;
    return rooms.find(r => r.id === roomId);
  };

  const needsRoomAssignment = (admission) => {
    return admission.status === 'admitted' && !admission.room;
  };

  const needsPayment = (admission) => {
    return admission.status === 'pending_discharge';
  };

  // Room Assignment Handler
  const handleAssignRoom = (admission) => {
    setSelectedAdmission(admission);
    setSelectedRoom(admission.room || "");
    setShowRoomModal(true);
  };

  const handleSaveRoom = async () => {
    if (!selectedRoom) {
      alert("Please select a room");
      return;
    }

    setModalLoading(true);
    try {
      await admissionAPI.update(selectedAdmission.id, {
        ...selectedAdmission,
        room: parseInt(selectedRoom)
      });

      alert("Room assigned successfully!");
      setShowRoomModal(false);
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Error assigning room:", error);
      alert("Failed to assign room. Please try again.");
    } finally {
      setModalLoading(false);
    }
  };


  const filteredAdmissions = getFilteredAdmissions();

  return (
    <>
      <Navbar />
      <div style={styles.layout}>
        <Sidebar />
        <main style={styles.content}>
          <div style={styles.header}>
            <div>
              <h1 style={styles.pageTitle}>🏥 Admissions</h1>
              <p style={styles.subtitle}>
                Manage patient admissions and discharges
              </p>
            </div>
            <button
              onClick={() => navigate("/admissions/add")}
              style={styles.addButton}
            >
              ➕ Admit Patient
            </button>
          </div>

          {/* Filter Buttons */}
          <div style={styles.filterContainer}>
            <button
              onClick={() => setActiveFilter("all")}
              style={{
                ...styles.filterButton,
                ...(activeFilter === "all" ? styles.activeFilterButton : {}),
              }}
            >
              All <span style={styles.countBadge}>({getStatusCount("all")})</span>
            </button>
            <button
              onClick={() => setActiveFilter("pending")}
              style={{
                ...styles.filterButton,
                ...(activeFilter === "pending" ? styles.activeFilterButton : {}),
              }}
            >
              Pending <span style={styles.countBadge}>({getStatusCount("pending")})</span>
            </button>
            <button
              onClick={() => setActiveFilter("admitted")}
              style={{
                ...styles.filterButton,
                ...(activeFilter === "admitted" ? styles.activeFilterButton : {}),
              }}
            >
              Admitted <span style={styles.countBadge}>({getStatusCount("admitted")})</span>
            </button>
            <button
              onClick={() => setActiveFilter("pending_discharge")}
              style={{
                ...styles.filterButton,
                ...(activeFilter === "pending_discharge" ? styles.activeFilterButton : {}),
              }}
            >
              Pending Discharge <span style={styles.countBadge}>({getStatusCount("pending_discharge")})</span>
            </button>
            <button
              onClick={() => {
                setActiveFilter("discharged");
                setShowArchive(false); // Reset to this week view when clicking discharged
              }}
              style={{
                ...styles.filterButton,
                ...(activeFilter === "discharged" ? styles.activeFilterButton : {}),
              }}
            >
              Discharged <span style={styles.countBadge}>({getStatusCount("discharged")})</span>
            </button>
          </div>

          {/* Archive Toggle - only show when discharged filter is active */}
          {activeFilter === "discharged" && (
            <div style={styles.archiveToggle}>
              <button
                onClick={() => setShowArchive(false)}
                style={{
                  ...styles.archiveButton,
                  ...(! showArchive ? styles.activeArchiveButton : {}),
                }}
              >
                📅 This Week
              </button>
              <button
                onClick={() => setShowArchive(true)}
                style={{
                  ...styles.archiveButton,
                  ...(showArchive ? styles.activeArchiveButton : {}),
                }}
              >
                📁 Full Archive
              </button>
            </div>
          )}

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
                    <th style={styles.th}>Room</th>
                    <th style={styles.th}>Admission Date</th>
                    {activeFilter === "discharged" && <th style={styles.th}>Discharge Date</th>}
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdmissions.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={styles.noData}>
                        No admissions found
                      </td>
                    </tr>
                  ) : (
                    filteredAdmissions.map((admission) => {
                      const roomInfo = getRoomInfo(admission.room);
                      const needsRoom = needsRoomAssignment(admission);
                      const needsPay = needsPayment(admission);

                      return (
                        <tr key={admission.id} style={styles.tableRow}>
                          <td style={styles.td}>#{admission.id}</td>
                          <td style={styles.td}>
                            <strong>{admission.patient_name || `Patient #${admission.patient}`}</strong>
                          </td>
                          <td style={styles.td}>
                            {admission.doctor_name || "N/A"}
                          </td>
                          <td style={styles.td}>
                            {roomInfo ? (
                              <div>
                                <strong>Room {roomInfo.room_number}</strong>
                                <div style={styles.roomDetails}>
                                  {roomInfo.room_type} | {roomInfo.occupied_beds}/{roomInfo.bed_capacity} beds
                                </div>
                              </div>
                            ) : needsRoom ? (
                              <span style={styles.badgeWarning}>⚠️ Need Assignment</span>
                            ) : (
                              <span style={styles.badgeLight}>No Room</span>
                            )}
                          </td>
                          <td style={styles.td}>
                            {formatDate(admission.admission_date)}
                          </td>
                          {activeFilter === "discharged" && (
                            <td style={styles.td}>
                              {formatDate(admission.discharge_date)}
                            </td>
                          )}
                          <td style={styles.td}>
                            <div style={styles.statusCell}>
                              <span
                                style={{
                                  ...styles.statusBadge,
                                  ...(admission.status === "admitted" && styles.statusAdmitted),
                                  ...(admission.status === "pending" && styles.statusPending),
                                  ...(admission.status === "pending_discharge" && styles.statusPendingDischarge),
                                  ...(admission.status === "discharged" && styles.statusDischarged),
                                }}
                              >
                                {admission.status}
                              </span>
                              {needsPay && (
                                <span style={styles.badgePayment}>💰 Pending Payment Approval</span>
                              )}
                            </div>
                          </td>
                          <td style={styles.td}>
                            <div style={styles.actionButtons}>
                              <button
                                onClick={() => navigate(`/patients/${admission.patient}/archive`)}
                                style={styles.btnView}
                                title="View Patient Details"
                              >
                                👁️ View
                              </button>

                              {needsRoom && (
                                <button
                                  onClick={() => handleAssignRoom(admission)}
                                  style={styles.btnAssign}
                                  title="Assign Room"
                                >
                                  🛏️ Assign Room
                                </button>
                              )}

                              {admission.status === 'pending_discharge' && (
                                <button
                                  onClick={() => navigate('/payments')}
                                  style={styles.btnPayment}
                                  title="Go to Payments Page to Approve"
                                >
                                  💰 View Payment
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Room Assignment Modal */}
          {showRoomModal && selectedAdmission && (
            <div style={styles.modalOverlay} onClick={() => setShowRoomModal(false)}>
              <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h2 style={styles.modalTitle}>🛏️ Assign Room</h2>
                <p style={styles.modalSubtitle}>
                  Patient: <strong>{selectedAdmission.patient_name}</strong>
                </p>

                <div style={styles.modalContent}>
                  <label style={styles.label}>Select Room:</label>
                  <select
                    value={selectedRoom}
                    onChange={(e) => setSelectedRoom(e.target.value)}
                    style={styles.select}
                  >
                    <option value="">-- Select a room --</option>
                    {getAvailableRooms().map((room) => (
                      <option key={room.id} value={room.id}>
                        Room {room.room_number} - {room.room_type} ({room.bed_capacity - room.occupied_beds} beds available)
                      </option>
                    ))}
                  </select>

                  {getAvailableRooms().length === 0 && (
                    <p style={styles.warningText}>⚠️ No rooms available! All rooms are at full capacity.</p>
                  )}
                </div>

                <div style={styles.modalActions}>
                  <button
                    onClick={() => setShowRoomModal(false)}
                    style={styles.btnCancel}
                    disabled={modalLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveRoom}
                    style={styles.btnSave}
                    disabled={modalLoading || !selectedRoom}
                  >
                    {modalLoading ? "Assigning..." : "Assign Room"}
                  </button>
                </div>
              </div>
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
  filterContainer: {
    display: "flex",
    gap: "0.75rem",
    marginBottom: "1.5rem",
    flexWrap: "wrap",
  },
  filterButton: {
    backgroundColor: "white",
    color: "#475569",
    border: "2px solid #e2e8f0",
    padding: "0.65rem 1.25rem",
    borderRadius: "8px",
    fontSize: "0.95rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  activeFilterButton: {
    backgroundColor: "#2563eb",
    color: "white",
    borderColor: "#2563eb",
  },
  countBadge: {
    fontWeight: "600",
    marginLeft: "0.5rem",
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
    fontWeight: "600",
  },
  statusAdmitted: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  statusPending: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
  statusPendingDischarge: {
    backgroundColor: "#dbeafe",
    color: "#1e40af",
  },
  statusDischarged: {
    backgroundColor: "#f1f5f9",
    color: "#64748b",
  },
  statusCell: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  noData: {
    textAlign: "center",
    padding: "2rem",
    color: "#64748b",
  },
  roomDetails: {
    fontSize: "0.8rem",
    color: "#64748b",
    marginTop: "0.25rem",
  },
  badgeWarning: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
    padding: "0.25rem 0.75rem",
    borderRadius: "12px",
    fontSize: "0.8rem",
    fontWeight: "600",
  },
  badgeLight: {
    backgroundColor: "#f1f5f9",
    color: "#64748b",
    padding: "0.25rem 0.75rem",
    borderRadius: "12px",
    fontSize: "0.8rem",
    fontWeight: "500",
  },
  badgePayment: {
    backgroundColor: "#fecaca",
    color: "#991b1b",
    padding: "0.2rem 0.5rem",
    borderRadius: "8px",
    fontSize: "0.75rem",
    fontWeight: "600",
  },
  actionButtons: {
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap",
  },
  btnView: {
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    padding: "0.4rem 0.75rem",
    borderRadius: "6px",
    fontSize: "0.85rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  btnAssign: {
    backgroundColor: "#059669",
    color: "white",
    border: "none",
    padding: "0.4rem 0.75rem",
    borderRadius: "6px",
    fontSize: "0.85rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  btnPayment: {
    backgroundColor: "#f59e0b",
    color: "white",
    border: "none",
    padding: "0.4rem 0.75rem",
    borderRadius: "6px",
    fontSize: "0.85rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  // Modal Styles
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "2rem",
    maxWidth: "500px",
    width: "90%",
    maxHeight: "80vh",
    overflowY: "auto",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
  },
  modalTitle: {
    fontSize: "1.5rem",
    color: "#1e293b",
    margin: "0 0 0.5rem 0",
  },
  modalSubtitle: {
    fontSize: "0.95rem",
    color: "#64748b",
    marginBottom: "1.5rem",
  },
  modalContent: {
    marginBottom: "1.5rem",
  },
  label: {
    display: "block",
    fontSize: "0.95rem",
    color: "#334155",
    fontWeight: "500",
    marginBottom: "0.5rem",
  },
  select: {
    width: "100%",
    padding: "0.75rem",
    fontSize: "1rem",
    border: "2px solid #e2e8f0",
    borderRadius: "8px",
    backgroundColor: "white",
    cursor: "pointer",
  },
  warningText: {
    color: "#dc2626",
    fontSize: "0.9rem",
    marginTop: "0.5rem",
    fontWeight: "500",
  },
  modalActions: {
    display: "flex",
    gap: "1rem",
    justifyContent: "flex-end",
  },
  btnCancel: {
    backgroundColor: "#f1f5f9",
    color: "#475569",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  btnSave: {
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
  archiveToggle: {
    display: "flex",
    gap: "0.75rem",
    marginBottom: "1.5rem",
    marginTop: "-0.5rem",
  },
  archiveButton: {
    backgroundColor: "white",
    color: "#64748b",
    border: "2px solid #e2e8f0",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    fontSize: "0.9rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  activeArchiveButton: {
    backgroundColor: "#059669",
    color: "white",
    borderColor: "#059669",
  },
};

export default Admissions;
