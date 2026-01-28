import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const PendingDischarge = () => {
  const navigate = useNavigate();
  const [pendingAdmissions, setPendingAdmissions] = useState([]);
  const [payments, setPayments] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingDischarge();
  }, []);

  const fetchPendingDischarge = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/admissions/");
      const allAdmissions = await response.json();

      // Filter only pending_discharge status
      const pending = allAdmissions.filter(
        (a) => a.status === "pending_discharge"
      );
      setPendingAdmissions(pending);

      // Fetch payments for each admission
      const paymentsResponse = await fetch("http://127.0.0.1:8000/api/payments/");
      const allPayments = await paymentsResponse.json();

      // Create a map of admission_id -> payment
      const paymentsMap = {};
      allPayments.forEach((payment) => {
        paymentsMap[payment.admission] = payment;
      });
      setPayments(paymentsMap);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (admissionId) => {
    if (!window.confirm("Approve payment and discharge patient?")) {
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/admissions/${admissionId}/`
      );
      const admission = await response.json();

      const updateData = {
        ...admission,
        status: "discharged",
        discharge_date: new Date().toISOString(),
      };

      const updateResponse = await fetch(
        `http://127.0.0.1:8000/api/admissions/${admissionId}/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        }
      );

      if (updateResponse.ok) {
        alert("Patient discharged successfully!");
        fetchPendingDischarge(); // Refresh list
      } else {
        alert("Failed to discharge patient");
      }
    } catch (error) {
      console.error("Error discharging patient:", error);
      alert("Error occurred");
    }
  };

  const handleReject = async (admissionId) => {
    const reason = window.prompt(
      "Reason for rejecting discharge (optional):"
    );
    if (reason === null) return; // User cancelled

    alert(
      `Discharge rejected. Patient remains in 'pending_discharge' status.${
        reason ? ` Reason: ${reason}` : ""
      }`
    );
    // Keep status as pending_discharge - no action needed
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
              <h1 style={styles.pageTitle}>⏳ Pending Discharge</h1>
              <p style={styles.subtitle}>
                Patients ready to leave - process payment & discharge
              </p>
            </div>
          </div>

          {loading ? (
            <div style={styles.loading}>Loading...</div>
          ) : pendingAdmissions.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>✅</div>
              <h2 style={styles.emptyTitle}>No Pending Discharges</h2>
              <p style={styles.emptyText}>All patients have been processed!</p>
            </div>
          ) : (
            <div style={styles.cardsContainer}>
              {pendingAdmissions.map((admission) => {
                const payment = payments[admission.id];
                const paymentAmount = payment
                  ? parseFloat(payment.final_amount || 0)
                  : 0;

                return (
                  <div key={admission.id} style={styles.card}>
                    <div style={styles.cardHeader}>
                      <div style={styles.headerTop}>
                        <h3 style={styles.patientName}>
                          👤{" "}
                          {admission.patient_name ||
                            `Patient #${admission.patient}`}
                        </h3>
                        <div style={styles.actionButtons}>
                          <button
                            onClick={() => handleApprove(admission.id)}
                            style={styles.approveButton}
                            title="Approve & Discharge"
                          >
                            ✅
                          </button>
                          <button
                            onClick={() => handleReject(admission.id)}
                            style={styles.rejectButton}
                            title="Reject Discharge"
                          >
                            ❌
                          </button>
                        </div>
                      </div>
                      <span style={styles.admissionId}>
                        Admission #{admission.id}
                      </span>
                    </div>

                    <div style={styles.cardBody}>
                      {/* Payment Amount Display */}
                      <div style={styles.paymentInfo}>
                        <span style={styles.paymentLabel}>💰 Payment Amount:</span>
                        <span style={styles.paymentAmount}>
                          ${paymentAmount.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>

                      <div style={styles.infoRow}>
                        <span style={styles.label}>Doctor:</span>
                        <span style={styles.value}>
                          {admission.doctor_name || "N/A"}
                        </span>
                      </div>
                      <div style={styles.infoRow}>
                        <span style={styles.label}>Nurse:</span>
                        <span style={styles.value}>
                          {admission.nurse_name || "N/A"}
                        </span>
                      </div>
                      <div style={styles.infoRow}>
                        <span style={styles.label}>Room:</span>
                        <span style={styles.value}>
                          Room {admission.room_number || "N/A"}
                        </span>
                      </div>
                      <div style={styles.infoRow}>
                        <span style={styles.label}>Admitted:</span>
                        <span style={styles.value}>
                          {formatDate(admission.admission_date)}
                        </span>
                      </div>
                      <div style={styles.infoRow}>
                        <span style={styles.label}>Length of Stay:</span>
                        <span style={styles.value}>
                          {Math.ceil(
                            (new Date() - new Date(admission.admission_date)) /
                              (1000 * 60 * 60 * 24)
                          )}{" "}
                          days
                        </span>
                      </div>
                      {admission.doctor_notes && (
                        <div style={styles.notesBox}>
                          <strong>Doctor's Notes:</strong>
                          <p style={styles.notes}>{admission.doctor_notes}</p>
                        </div>
                      )}
                    </div>

                    {payment && (
                      <div style={styles.cardFooter}>
                        <button
                          onClick={() =>
                            navigate(`/payments/view/${payment.id}`)
                          }
                          style={styles.viewPaymentButton}
                        >
                          📄 View Payment Details
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
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
  header: { marginBottom: "2rem" },
  pageTitle: { fontSize: "2rem", color: "#1e293b", margin: "0 0 0.5rem 0" },
  subtitle: { color: "#64748b", margin: 0 },
  loading: {
    textAlign: "center",
    padding: "3rem",
    fontSize: "1.1rem",
    color: "#64748b",
  },

  emptyState: {
    textAlign: "center",
    padding: "4rem 2rem",
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  emptyIcon: { fontSize: "4rem", marginBottom: "1rem" },
  emptyTitle: { color: "#1e293b", margin: "0 0 0.5rem 0" },
  emptyText: { color: "#64748b", margin: 0 },

  cardsContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
    gap: "1.5rem",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    overflow: "hidden",
    border: "2px solid #fbbf24",
  },

  cardHeader: {
    backgroundColor: "#fef3c7",
    padding: "1.5rem",
    borderBottom: "2px solid #fbbf24",
  },
  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.5rem",
  },
  patientName: {
    color: "#1e293b",
    margin: 0,
    fontSize: "1.25rem",
  },
  admissionId: { color: "#64748b", fontSize: "0.9rem", fontWeight: "500" },
  actionButtons: {
    display: "flex",
    gap: "0.75rem",
  },
  approveButton: {
    backgroundColor: "#10b981",
    color: "white",
    border: "none",
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    fontSize: "1.5rem",
    cursor: "pointer",
    transition: "all 0.2s",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  rejectButton: {
    backgroundColor: "#ef4444",
    color: "white",
    border: "none",
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    fontSize: "1.5rem",
    cursor: "pointer",
    transition: "all 0.2s",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },

  cardBody: { padding: "1.5rem" },
  paymentInfo: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem",
    backgroundColor: "#dcfce7",
    borderRadius: "8px",
    marginBottom: "1rem",
    border: "2px solid #10b981",
  },
  paymentLabel: {
    color: "#166534",
    fontWeight: "600",
    fontSize: "1rem",
  },
  paymentAmount: {
    color: "#166534",
    fontWeight: "700",
    fontSize: "1.5rem",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "0.75rem 0",
    borderBottom: "1px solid #e2e8f0",
  },
  label: { color: "#64748b", fontWeight: "500" },
  value: { color: "#1e293b", fontWeight: "600" },

  notesBox: {
    marginTop: "1rem",
    padding: "1rem",
    backgroundColor: "#f1f5f9",
    borderRadius: "6px",
    borderLeft: "4px solid #2563eb",
  },
  notes: { color: "#334155", margin: "0.5rem 0 0 0", fontSize: "0.95rem" },

  cardFooter: {
    padding: "1.5rem",
    backgroundColor: "#f8fafc",
    display: "flex",
    justifyContent: "center",
  },
  viewPaymentButton: {
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    padding: "0.875rem 1.5rem",
    borderRadius: "6px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
  },
};

export default PendingDischarge;
