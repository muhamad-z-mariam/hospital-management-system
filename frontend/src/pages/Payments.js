import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { paymentAPI, admissionAPI } from "../api/api";

const Payments = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [pendingAdmissions, setPendingAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all payments
      const paymentsData = await paymentAPI.getAll();
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);

      // Fetch admissions with pending_discharge status
      const allAdmissions = await admissionAPI.getAll();
      const admissionsArray = Array.isArray(allAdmissions) ? allAdmissions : [];
      const pending = admissionsArray.filter(
        (a) => a.status === "pending_discharge"
      );

      // Match payments to pending admissions
      const pendingWithPayments = pending.map((admission) => {
        const payment = paymentsData.find((p) => p.admission === admission.id);
        return { ...admission, payment };
      });

      setPendingAdmissions(pendingWithPayments);
    } catch (error) {
      console.error("Error fetching data:", error);
      setPayments([]);
      setPendingAdmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const handleApprove = async (admissionId) => {
    if (!window.confirm("Approve payment and discharge patient?")) {
      return;
    }

    try {
      const admission = await admissionAPI.getById(admissionId);

      const updateData = {
        ...admission,
        status: "discharged",
        discharge_date: new Date().toISOString(),
      };

      await admissionAPI.update(admissionId, updateData);
      alert("Payment approved! Patient discharged successfully!");
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Error discharging patient:", error);
      alert("Error occurred");
    }
  };


  const totalAmount = payments.reduce(
    (sum, payment) => sum + parseFloat(payment.final_amount || 0),
    0
  );

  return (
    <>
      <Navbar />
      <div style={styles.layout}>
        <Sidebar />
        <main style={styles.content}>
          <div style={styles.header}>
            <div>
              <h1 style={styles.pageTitle}>💰 Payments</h1>
              <p style={styles.subtitle}>Manage patient payments and billing</p>
            </div>
            <div style={styles.totalCard}>
              <span style={styles.totalLabel}>Total Revenue</span>
              <span style={styles.totalAmount}>
                ${totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {loading ? (
            <div style={styles.loading}>Loading payments...</div>
          ) : (
            <>
              {/* Pending Payments Section */}
              {pendingAdmissions.length > 0 && (
                <div style={styles.pendingSection}>
                  <h2 style={styles.sectionTitle}>
                    ⏳ Pending Payments ({pendingAdmissions.length})
                  </h2>
                  <p style={styles.sectionSubtitle}>
                    Patients ready for discharge - awaiting payment approval
                  </p>

                  <div style={styles.pendingCardsContainer}>
                    {pendingAdmissions.map((admission) => {
                      const paymentAmount = admission.payment
                        ? parseFloat(admission.payment.final_amount || 0)
                        : 0;

                      return (
                        <div key={admission.id} style={styles.pendingCard}>
                          <div style={styles.pendingCardHeader}>
                            <div>
                              <h3 style={styles.pendingPatientName}>
                                👤{" "}
                                {admission.patient_name ||
                                  `Patient #${admission.patient}`}
                              </h3>
                              <span style={styles.pendingAdmissionId}>
                                Admission #{admission.id}
                              </span>
                            </div>
                            <div style={styles.pendingActions}>
                              <button
                                onClick={() => handleApprove(admission.id)}
                                style={styles.approveBtn}
                                title="Approve & Discharge"
                              >
                                ✅
                              </button>
                            </div>
                          </div>

                          <div style={styles.pendingCardBody}>
                            <div style={styles.paymentAmountBox}>
                              <span style={styles.paymentAmountLabel}>
                                💰 Payment Due:
                              </span>
                              <span style={styles.paymentAmountValue}>
                                ${paymentAmount.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </div>

                            <div style={styles.pendingInfo}>
                              <div style={styles.pendingInfoRow}>
                                <span style={styles.pendingLabel}>Doctor:</span>
                                <span style={styles.pendingValue}>
                                  {admission.doctor_name || "N/A"}
                                </span>
                              </div>
                              <div style={styles.pendingInfoRow}>
                                <span style={styles.pendingLabel}>
                                  Length of Stay:
                                </span>
                                <span style={styles.pendingValue}>
                                  {Math.ceil(
                                    (new Date() - new Date(admission.admission_date)) /
                                      (1000 * 60 * 60 * 24)
                                  )}{" "}
                                  days
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* All Payments Table */}
              <div style={styles.allPaymentsSection}>
                <h2 style={styles.sectionTitle}>📋 All Payments</h2>
                <div style={styles.tableContainer}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.tableHeader}>
                        <th style={styles.th}>ID</th>
                        <th style={styles.th}>Patient</th>
                        <th style={styles.th}>Amount</th>
                        <th style={styles.th}>Method</th>
                        <th style={styles.th}>Payment Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={styles.noData}>
                            No payments recorded
                          </td>
                        </tr>
                      ) : (
                        payments.map((payment) => (
                          <tr key={payment.id} style={styles.tableRow}>
                            <td style={styles.td}>{payment.id}</td>
                            <td style={styles.td}>
                              {payment.patient_name ||
                                `Patient #${payment.patient}`}
                            </td>
                            <td style={styles.td}>
                              <span style={styles.amountText}>
                                ${parseFloat(payment.final_amount || 0).toFixed(2)}
                              </span>
                            </td>
                            <td style={styles.td}>
                              <span style={styles.methodBadge}>
                                {payment.method}
                              </span>
                            </td>
                            <td style={styles.td}>
                              {formatDate(payment.payment_date)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
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
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
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
  totalCard: {
    backgroundColor: "#059669",
    color: "white",
    padding: "1rem 1.5rem",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.25rem",
  },
  totalLabel: {
    fontSize: "0.85rem",
    opacity: 0.9,
  },
  totalAmount: {
    fontSize: "1.5rem",
    fontWeight: "bold",
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
  amountText: {
    color: "#059669",
    fontWeight: "600",
    fontSize: "1.1rem",
  },
  methodBadge: {
    backgroundColor: "#e0f2fe",
    color: "#0369a1",
    padding: "0.25rem 0.75rem",
    borderRadius: "12px",
    fontSize: "0.85rem",
    fontWeight: "500",
  },
  noData: {
    textAlign: "center",
    padding: "2rem",
    color: "#64748b",
  },

  // Pending Payments Section Styles
  pendingSection: {
    marginBottom: "3rem",
  },
  sectionTitle: {
    fontSize: "1.5rem",
    color: "#1e293b",
    margin: "0 0 0.5rem 0",
    fontWeight: "600",
  },
  sectionSubtitle: {
    color: "#64748b",
    margin: "0 0 1.5rem 0",
    fontSize: "0.95rem",
  },
  pendingCardsContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
    gap: "1.5rem",
  },
  pendingCard: {
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    border: "2px solid #fbbf24",
    overflow: "hidden",
  },
  pendingCardHeader: {
    backgroundColor: "#fef3c7",
    padding: "1.25rem",
    borderBottom: "2px solid #fbbf24",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pendingPatientName: {
    color: "#1e293b",
    margin: "0 0 0.25rem 0",
    fontSize: "1.1rem",
  },
  pendingAdmissionId: {
    color: "#64748b",
    fontSize: "0.85rem",
  },
  pendingActions: {
    display: "flex",
    gap: "0.75rem",
  },
  approveBtn: {
    backgroundColor: "#10b981",
    color: "white",
    border: "none",
    padding: "0.5rem 0.75rem",
    borderRadius: "8px",
    fontSize: "1.25rem",
    cursor: "pointer",
    transition: "all 0.2s",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  pendingCardBody: {
    padding: "1.25rem",
  },
  paymentAmountBox: {
    backgroundColor: "#dcfce7",
    border: "2px solid #10b981",
    borderRadius: "8px",
    padding: "1rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
  },
  paymentAmountLabel: {
    color: "#166534",
    fontWeight: "600",
    fontSize: "0.95rem",
  },
  paymentAmountValue: {
    color: "#166534",
    fontWeight: "700",
    fontSize: "1.5rem",
  },
  pendingInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  pendingInfoRow: {
    display: "flex",
    justifyContent: "space-between",
    paddingBottom: "0.5rem",
    borderBottom: "1px solid #e2e8f0",
  },
  pendingLabel: {
    color: "#64748b",
    fontSize: "0.9rem",
  },
  pendingValue: {
    color: "#1e293b",
    fontWeight: "600",
    fontSize: "0.9rem",
  },
  allPaymentsSection: {
    marginTop: "3rem",
  },
};

export default Payments;
