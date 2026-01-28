import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { shiftSwapAPI, scheduleAPI } from "../api/api";
import { useAuth } from "../context/AuthContext";

const ShiftSwapRequests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [mySchedules, setMySchedules] = useState([]);
  const [allSchedules, setAllSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    requester_shift: "",
    recipient: "",
    recipient_shift: "",
    reason: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Get future dates (next 30 days)
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + 30);

      const [requestsData, schedulesData, allSchedulesData] = await Promise.all([
        shiftSwapAPI.getAll(),
        scheduleAPI.getByUser(user.id),
        scheduleAPI.getByDateRange(
          today.toISOString().split("T")[0],
          futureDate.toISOString().split("T")[0]
        ),
      ]);

      setRequests(Array.isArray(requestsData) ? requestsData : []);
      setMySchedules(Array.isArray(schedulesData) ? schedulesData : []);
      setAllSchedules(Array.isArray(allSchedulesData) ? allSchedulesData : []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setRequests([]);
      setMySchedules([]);
      setAllSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setFormData({
      requester_shift: "",
      recipient: "",
      recipient_shift: "",
      reason: "",
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const requestData = {
        requester: user.id,
        requester_shift: parseInt(formData.requester_shift),
        reason: formData.reason,
      };

      // Only add recipient data if a specific shift was selected
      if (formData.recipient_shift) {
        const recipientSchedule = allSchedules.find(
          (s) => s.id === parseInt(formData.recipient_shift)
        );
        if (recipientSchedule) {
          requestData.recipient = recipientSchedule.user;
          requestData.recipient_shift = parseInt(formData.recipient_shift);
        }
      }

      await shiftSwapAPI.create(requestData);
      alert("Shift swap request submitted successfully!");
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error("Error creating swap request:", error);
      alert(error.error || "Failed to create swap request");
    }
  };

  const handleApprove = async (id) => {
    if (window.confirm("Are you sure you want to approve this shift swap?")) {
      try {
        await shiftSwapAPI.approve(id);
        alert("Shift swap approved successfully!");
        fetchData();
      } catch (error) {
        console.error("Error approving swap:", error);
        alert("Failed to approve swap");
      }
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt("Reason for rejection:");
    if (reason !== null) {
      try {
        await shiftSwapAPI.reject(id, reason);
        alert("Shift swap rejected");
        fetchData();
      } catch (error) {
        console.error("Error rejecting swap:", error);
        alert("Failed to reject swap");
      }
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm("Are you sure you want to cancel this request?")) {
      try {
        await shiftSwapAPI.delete(id);
        alert("Swap request cancelled");
        fetchData();
      } catch (error) {
        console.error("Error cancelling swap:", error);
        alert("Failed to cancel swap");
      }
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: { bg: "#fef3c7", color: "#92400e" },
      approved: { bg: "#dcfce7", color: "#166534" },
      rejected: { bg: "#fee2e2", color: "#dc2626" },
      cancelled: { bg: "#e2e8f0", color: "#475569" },
    };

    const style = colors[status] || colors.pending;

    return (
      <span
        style={{
          ...styles.statusBadge,
          backgroundColor: style.bg,
          color: style.color,
        }}
      >
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={styles.layout}>
          <Sidebar />
          <main style={styles.content}>
            <div style={styles.loading}>Loading shift swap requests...</div>
          </main>
        </div>
      </>
    );
  }

  // Filter requests based on user role
  const filteredRequests =
    user.role === "admin"
      ? requests
      : requests.filter(
          (r) => r.requester === user.id || r.recipient === user.id
        );

  return (
    <>
      <Navbar />
      <div style={styles.layout}>
        <Sidebar />
        <main style={styles.content}>
          <div style={styles.header}>
            <h1 style={styles.pageTitle}>🔄 Shift Swap Requests</h1>
            {user.role !== "admin" && (
              <button onClick={handleOpenModal} style={styles.addButton}>
                + Request Shift Swap
              </button>
            )}
          </div>

          {/* Statistics */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>📊</div>
              <div style={styles.statValue}>{filteredRequests.length}</div>
              <div style={styles.statLabel}>Total Requests</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>⏳</div>
              <div style={styles.statValue}>
                {filteredRequests.filter((r) => r.status === "pending").length}
              </div>
              <div style={styles.statLabel}>Pending</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>✅</div>
              <div style={styles.statValue}>
                {
                  filteredRequests.filter((r) => r.status === "approved")
                    .length
                }
              </div>
              <div style={styles.statLabel}>Approved</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>❌</div>
              <div style={styles.statValue}>
                {filteredRequests.filter((r) => r.status === "rejected").length}
              </div>
              <div style={styles.statLabel}>Rejected</div>
            </div>
          </div>

          {/* Requests Table */}
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>Requester</th>
                  <th style={styles.th}>Requester Shift</th>
                  <th style={styles.th}>Recipient</th>
                  <th style={styles.th}>Recipient Shift</th>
                  <th style={styles.th}>Reason</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Created</th>
                  {user.role === "admin" && <th style={styles.th}>Actions</th>}
                  {user.role !== "admin" && <th style={styles.th}>Action</th>}
                </tr>
              </thead>
              <tbody>
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={user.role === "admin" ? "8" : "8"}
                      style={styles.noData}
                    >
                      No shift swap requests
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request) => (
                    <tr key={request.id} style={styles.tableRow}>
                      <td style={styles.td}>{request.requester_full_name}</td>
                      <td style={styles.td}>
                        {request.requester_shift_details ? (
                          <>
                            <div>{request.requester_shift_details.date}</div>
                            <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                              {request.requester_shift_details.shift} (
                              {request.requester_shift_details.start_time} -{" "}
                              {request.requester_shift_details.end_time})
                            </div>
                          </>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td style={styles.td}>
                        {request.recipient_full_name || "Not assigned"}
                      </td>
                      <td style={styles.td}>
                        {request.recipient_shift_details ? (
                          <>
                            <div>{request.recipient_shift_details.date}</div>
                            <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                              {request.recipient_shift_details.shift} (
                              {request.recipient_shift_details.start_time} -{" "}
                              {request.recipient_shift_details.end_time})
                            </div>
                          </>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td style={styles.td}>{request.reason}</td>
                      <td style={styles.td}>{getStatusBadge(request.status)}</td>
                      <td style={styles.td}>
                        {new Date(request.created_at).toLocaleDateString()}
                      </td>
                      <td style={styles.td}>
                        {user.role === "admin" && request.status === "pending" && (
                          <div style={styles.actionButtons}>
                            <button
                              onClick={() => handleApprove(request.id)}
                              style={styles.approveButton}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(request.id)}
                              style={styles.rejectButton}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {user.role !== "admin" &&
                          request.requester === user.id &&
                          request.status === "pending" && (
                            <button
                              onClick={() => handleCancel(request.id)}
                              style={styles.cancelButton}
                            >
                              Cancel
                            </button>
                          )}
                        {request.status !== "pending" && <span>-</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Request Modal */}
          {showModal && (
            <div style={styles.modalOverlay} onClick={handleCloseModal}>
              <div
                style={styles.modalContent}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 style={styles.modalTitle}>Request Shift Swap</h2>
                <form onSubmit={handleSubmit}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Your Shift to Give Away *</label>
                    <select
                      value={formData.requester_shift}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          requester_shift: e.target.value,
                        })
                      }
                      style={styles.input}
                      required
                    >
                      <option value="">Select your shift to give away</option>
                      {mySchedules
                        .filter((s) => new Date(s.date) >= new Date())
                        .map((schedule) => (
                          <option key={schedule.id} value={schedule.id}>
                            {new Date(schedule.date).toLocaleDateString()} -{" "}
                            {schedule.shift.charAt(0).toUpperCase() +
                              schedule.shift.slice(1)}{" "}
                            ({schedule.start_time} - {schedule.end_time})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>
                      Swap With (Optional - leave blank if you just need coverage)
                    </label>
                    <select
                      value={formData.recipient_shift}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          recipient_shift: e.target.value,
                        })
                      }
                      style={styles.input}
                    >
                      <option value="">Select a shift to swap with (or leave blank)</option>
                      {allSchedules
                        .filter(
                          (s) =>
                            s.user !== user.id && // Not my shift
                            new Date(s.date) >= new Date() && // Future shift
                            s.is_available && // Only available shifts
                            s.user_role === user.role // Same role (doctor with doctor, nurse with nurse)
                        )
                        .map((schedule) => (
                          <option key={schedule.id} value={schedule.id}>
                            {schedule.user_full_name} -{" "}
                            {new Date(schedule.date).toLocaleDateString()} -{" "}
                            {schedule.shift.charAt(0).toUpperCase() +
                              schedule.shift.slice(1)}{" "}
                            ({schedule.start_time} - {schedule.end_time})
                          </option>
                        ))}
                    </select>
                    <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.5rem" }}>
                      💡 If you select a specific shift, you're proposing a direct swap. If left blank, admin will find coverage.
                    </div>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Reason *</label>
                    <textarea
                      value={formData.reason}
                      onChange={(e) =>
                        setFormData({ ...formData, reason: e.target.value })
                      }
                      style={{ ...styles.input, minHeight: "100px" }}
                      placeholder="Explain why you need this swap..."
                      required
                    />
                  </div>

                  <div style={styles.modalActions}>
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      style={styles.modalCancelButton}
                    >
                      Cancel
                    </button>
                    <button type="submit" style={styles.submitButton}>
                      Submit Request
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
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
  statIcon: { fontSize: "2.5rem", marginBottom: "0.5rem" },
  statValue: {
    fontSize: "2rem",
    fontWeight: "bold",
    color: "#1e293b",
    margin: "0.5rem 0",
  },
  statLabel: { color: "#64748b", fontSize: "0.9rem" },
  tableContainer: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "1.5rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    overflowX: "auto",
  },
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
  noData: {
    padding: "2rem",
    textAlign: "center",
    color: "#64748b",
    fontStyle: "italic",
  },
  statusBadge: {
    padding: "0.25rem 0.75rem",
    borderRadius: "12px",
    fontSize: "0.85rem",
    fontWeight: "500",
    textTransform: "capitalize",
  },
  actionButtons: { display: "flex", gap: "0.5rem", flexWrap: "wrap" },
  approveButton: {
    backgroundColor: "#10b981",
    color: "white",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  rejectButton: {
    backgroundColor: "#dc2626",
    color: "white",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  cancelButton: {
    backgroundColor: "#f59e0b",
    color: "white",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "2rem",
    width: "90%",
    maxWidth: "600px",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  modalTitle: {
    fontSize: "1.5rem",
    color: "#1e293b",
    marginTop: 0,
    marginBottom: "1.5rem",
  },
  formGroup: { marginBottom: "1.5rem" },
  label: {
    display: "block",
    marginBottom: "0.5rem",
    color: "#475569",
    fontWeight: "500",
  },
  input: {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "1rem",
    color: "#1e293b",
    boxSizing: "border-box",
  },
  modalActions: {
    display: "flex",
    gap: "1rem",
    justifyContent: "flex-end",
    marginTop: "2rem",
  },
  modalCancelButton: {
    backgroundColor: "#64748b",
    color: "white",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1rem",
  },
  submitButton: {
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "600",
  },
};

export default ShiftSwapRequests;
