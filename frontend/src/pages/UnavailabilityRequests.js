import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { unavailabilityAPI } from "../api/api";
import { useAuth } from "../context/AuthContext";

const UnavailabilityRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    start_date: "",
    end_date: "",
    reason: "",
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await unavailabilityAPI.getAll();
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching requests:", error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setFormData({
      start_date: "",
      end_date: "",
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
      await unavailabilityAPI.create({
        user: user.id,
        start_date: formData.start_date,
        end_date: formData.end_date,
        reason: formData.reason,
      });
      alert("Unavailability request submitted successfully!");
      handleCloseModal();
      fetchRequests();
    } catch (error) {
      console.error("Error creating request:", error);
      alert(error.error || "Failed to create request");
    }
  };

  const handleApprove = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to approve this unavailability request? This will mark affected schedules as unavailable."
      )
    ) {
      try {
        await unavailabilityAPI.approve(id);
        alert("Unavailability request approved!");
        fetchRequests();
      } catch (error) {
        console.error("Error approving request:", error);
        alert("Failed to approve request");
      }
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt("Reason for rejection:");
    if (reason !== null) {
      try {
        await unavailabilityAPI.reject(id, reason);
        alert("Unavailability request rejected");
        fetchRequests();
      } catch (error) {
        console.error("Error rejecting request:", error);
        alert("Failed to reject request");
      }
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm("Are you sure you want to cancel this request?")) {
      try {
        await unavailabilityAPI.delete(id);
        alert("Request cancelled");
        fetchRequests();
      } catch (error) {
        console.error("Error cancelling request:", error);
        alert("Failed to cancel request");
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
            <div style={styles.loading}>Loading unavailability requests...</div>
          </main>
        </div>
      </>
    );
  }

  // Filter requests based on user role
  const filteredRequests =
    user.role === "admin"
      ? requests
      : requests.filter((r) => r.user === user.id);

  return (
    <>
      <Navbar />
      <div style={styles.layout}>
        <Sidebar />
        <main style={styles.content}>
          <div style={styles.header}>
            <h1 style={styles.pageTitle}>🏖️ Unavailability Requests</h1>
            {user.role !== "admin" && (
              <button onClick={handleOpenModal} style={styles.addButton}>
                + Request Time Off
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
                  {user.role === "admin" && <th style={styles.th}>Staff Member</th>}
                  {user.role === "admin" && <th style={styles.th}>Role</th>}
                  <th style={styles.th}>Start Date</th>
                  <th style={styles.th}>End Date</th>
                  <th style={styles.th}>Days</th>
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
                      colSpan={user.role === "admin" ? "9" : "7"}
                      style={styles.noData}
                    >
                      No unavailability requests
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request) => (
                    <tr key={request.id} style={styles.tableRow}>
                      {user.role === "admin" && (
                        <td style={styles.td}>{request.user_full_name}</td>
                      )}
                      {user.role === "admin" && (
                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.roleBadge,
                              backgroundColor:
                                request.user_role === "doctor"
                                  ? "#dbeafe"
                                  : "#fce7f3",
                              color:
                                request.user_role === "doctor"
                                  ? "#1e40af"
                                  : "#be185d",
                            }}
                          >
                            {request.user_role}
                          </span>
                        </td>
                      )}
                      <td style={styles.td}>
                        {new Date(request.start_date).toLocaleDateString()}
                      </td>
                      <td style={styles.td}>
                        {new Date(request.end_date).toLocaleDateString()}
                      </td>
                      <td style={styles.td}>{request.affected_days} days</td>
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
                          request.status === "pending" && (
                            <button
                              onClick={() => handleCancel(request.id)}
                              style={styles.cancelButton}
                            >
                              Cancel
                            </button>
                          )}
                        {request.status !== "pending" && (
                          <div>
                            {request.admin_notes && (
                              <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                                Note: {request.admin_notes}
                              </div>
                            )}
                            {!request.admin_notes && <span>-</span>}
                          </div>
                        )}
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
                <h2 style={styles.modalTitle}>Request Time Off</h2>
                <form onSubmit={handleSubmit}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Start Date *</label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) =>
                        setFormData({ ...formData, start_date: e.target.value })
                      }
                      style={styles.input}
                      required
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>End Date *</label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) =>
                        setFormData({ ...formData, end_date: e.target.value })
                      }
                      style={styles.input}
                      min={formData.start_date}
                      required
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Reason *</label>
                    <textarea
                      value={formData.reason}
                      onChange={(e) =>
                        setFormData({ ...formData, reason: e.target.value })
                      }
                      style={{ ...styles.input, minHeight: "100px" }}
                      placeholder="Explain why you need time off (e.g., sick leave, vacation, personal emergency)..."
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
  roleBadge: {
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

export default UnavailabilityRequests;
