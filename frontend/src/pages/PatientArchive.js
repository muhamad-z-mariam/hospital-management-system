import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { patientAPI, admissionAPI, paymentAPI, predictionAPI, procedureAPI, prescriptionAPI } from "../api/api";

const PatientArchive = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [admissions, setAdmissions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedPrescription, setExpandedPrescription] = useState(null);

  useEffect(() => {
    fetchPatientArchive();
  }, [id]);

  const fetchPatientArchive = async () => {
    try {
      // Fetch patient
      const patientData = await patientAPI.getById(id);
      setPatient(patientData);

      // Fetch all admissions for this patient
      const allAdmissions = await admissionAPI.getAll();
      const admissionsArray = Array.isArray(allAdmissions) ? allAdmissions : [];
      const patientAdmissions = admissionsArray.filter(
        (a) => a.patient === parseInt(id)
      );
      setAdmissions(patientAdmissions);

      // Fetch all payments for this patient
      const allPayments = await paymentAPI.getAll();
      const paymentsArray = Array.isArray(allPayments) ? allPayments : [];
      const patientPayments = paymentsArray.filter(
        (p) => p.patient === parseInt(id)
      );
      setPayments(patientPayments);

      // Fetch all predictions for this patient
      const allPredictions = await predictionAPI.getAll();
      const predictionsArray = Array.isArray(allPredictions) ? allPredictions : [];
      const patientPredictions = predictionsArray.filter(
        (p) => p.patient === parseInt(id)
      );
      setPredictions(patientPredictions);

      // Fetch procedures from patient's payments
      const patientProcedureIds = new Set();
      paymentsArray.forEach(payment => {
        if (payment.procedures && Array.isArray(payment.procedures)) {
          payment.procedures.forEach(procId => patientProcedureIds.add(procId));
        }
      });

      const allProcedures = await procedureAPI.getAll();
      const proceduresArray = Array.isArray(allProcedures) ? allProcedures : [];
      const patientProcedures = proceduresArray.filter(p => patientProcedureIds.has(p.id));
      setProcedures(patientProcedures);

      // Fetch prescriptions for this patient
      const allPrescriptions = await prescriptionAPI.getAll();
      const prescriptionsArray = Array.isArray(allPrescriptions) ? allPrescriptions : [];
      const patientPrescriptions = prescriptionsArray.filter(
        (p) => p.patient === parseInt(id)
      );
      setPrescriptions(patientPrescriptions);
    } catch (error) {
      console.error("Error fetching patient archive:", error);
      setAdmissions([]);
      setPayments([]);
      setPredictions([]);
      setProcedures([]);
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const formatDateOnly = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const calculateTotalSpent = () => {
    return payments.reduce(
      (sum, p) => sum + parseFloat(p.final_amount || 0),
      0
    );
  };

  const calculateTotalDays = () => {
    return admissions.reduce((sum, a) => {
      if (a.discharge_date) {
        const days = Math.ceil(
          (new Date(a.discharge_date) - new Date(a.admission_date)) /
            (1000 * 60 * 60 * 24)
        );
        return sum + days;
      }
      return sum;
    }, 0);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={styles.layout}>
          <Sidebar />
          <main style={styles.content}>
            <div style={styles.loading}>Loading patient archive...</div>
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
          <div style={styles.header}>
            <h1 style={styles.pageTitle}>📚 Patient Archive</h1>
            <button
              onClick={() => navigate("/patients")}
              style={styles.backButton}
            >
              ← Back to Patients
            </button>
          </div>

          {/* Patient Summary Card */}
          <div style={styles.summaryCard}>
            <div style={styles.summaryHeader}>
              <div>
                <h2 style={styles.patientName}>👤 {patient?.name}</h2>
                <p style={styles.patientInfo}>
                  {patient?.age} years old • {patient?.gender} •{" "}
                  {patient?.contact}
                </p>
              </div>
              <div style={styles.badges}>
                {patient?.insurance_status && (
                  <span style={styles.insuranceBadge}>✅ Insured</span>
                )}
                {patient?.handicapped && (
                  <span style={styles.handicappedBadge}>🦽 Handicapped</span>
                )}
              </div>
            </div>

            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statIcon}>🏥</div>
                <div style={styles.statValue}>{admissions.length}</div>
                <div style={styles.statLabel}>Total Admissions</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statIcon}>💰</div>
                <div style={styles.statValue}>
                  ${calculateTotalSpent().toFixed(2)}
                </div>
                <div style={styles.statLabel}>Total Spent</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statIcon}>📅</div>
                <div style={styles.statValue}>{calculateTotalDays()}</div>
                <div style={styles.statLabel}>Total Days</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statIcon}>💊</div>
                <div style={styles.statValue}>{prescriptions.length}</div>
                <div style={styles.statLabel}>Total Prescriptions</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={styles.tabs}>
            <button
              onClick={() => setActiveTab("overview")}
              style={{
                ...styles.tab,
                ...(activeTab === "overview" ? styles.activeTab : {}),
              }}
            >
              📋 Overview
            </button>
            <button
              onClick={() => setActiveTab("admissions")}
              style={{
                ...styles.tab,
                ...(activeTab === "admissions" ? styles.activeTab : {}),
              }}
            >
              🏥 Admissions ({admissions.length})
            </button>
            <button
              onClick={() => setActiveTab("payments")}
              style={{
                ...styles.tab,
                ...(activeTab === "payments" ? styles.activeTab : {}),
              }}
            >
              💰 Payments ({payments.length})
            </button>
            <button
              onClick={() => setActiveTab("predictions")}
              style={{
                ...styles.tab,
                ...(activeTab === "predictions" ? styles.activeTab : {}),
              }}
            >
              🔮 Predictions ({predictions.length})
            </button>
            <button
              onClick={() => setActiveTab("procedures")}
              style={{
                ...styles.tab,
                ...(activeTab === "procedures" ? styles.activeTab : {}),
              }}
            >
              ⚕️ Procedures ({procedures.length})
            </button>
            <button
              onClick={() => setActiveTab("prescriptions")}
              style={{
                ...styles.tab,
                ...(activeTab === "prescriptions" ? styles.activeTab : {}),
              }}
            >
              💊 Prescriptions ({prescriptions.length})
            </button>
          </div>

          {/* Tab Content */}
          <div style={styles.tabContent}>
            {activeTab === "overview" && (
              <div style={styles.timelineContainer}>
                <h3 style={styles.sectionTitle}>📅 Timeline</h3>
                {[...admissions, ...payments, ...predictions]
                  .sort(
                    (a, b) =>
                      new Date(
                        b.admission_date || b.payment_date || b.prediction_date
                      ) -
                      new Date(
                        a.admission_date || a.payment_date || a.prediction_date
                      )
                  )
                  .slice(0, 10)
                  .map((item, index) => (
                    <div key={index} style={styles.timelineItem}>
                      <div style={styles.timelineDot}></div>
                      <div style={styles.timelineContent}>
                        {item.admission_date && (
                          <>
                            <strong>🏥 Admission #{item.id}</strong>
                            <p>
                              {formatDate(item.admission_date)} - Status:{" "}
                              {item.status}
                            </p>
                          </>
                        )}
                        {item.payment_date && (
                          <>
                            <strong>
                              💰 Payment $
                              {parseFloat(item.final_amount).toFixed(2)}
                            </strong>
                            <p>
                              {formatDate(item.payment_date)} - {item.method}
                            </p>
                          </>
                        )}
                        {item.prediction_date && (
                          <>
                            <strong>🔮 Risk Prediction</strong>
                            <p>
                              {formatDate(item.prediction_date)} -{" "}
                              {item.risk_level === 1
                                ? "⚠️ HIGH RISK"
                                : "✅ LOW RISK"}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {activeTab === "admissions" && (
              <div>
                <h3 style={styles.sectionTitle}>🏥 Admission History</h3>
                {admissions.length === 0 ? (
                  <p style={styles.noData}>No admissions recorded</p>
                ) : (
                  <div style={styles.tableContainer}>
                    <table style={styles.table}>
                      <thead>
                        <tr style={styles.tableHeader}>
                          <th style={styles.th}>ID</th>
                          <th style={styles.th}>Doctor</th>
                          <th style={styles.th}>Nurse</th>
                          <th style={styles.th}>Room</th>
                          <th style={styles.th}>Admitted</th>
                          <th style={styles.th}>Discharged</th>
                          <th style={styles.th}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {admissions.map((admission) => (
                          <tr key={admission.id} style={styles.tableRow}>
                            <td style={styles.td}>{admission.id}</td>
                            <td style={styles.td}>
                              {admission.doctor_name || "N/A"}
                            </td>
                            <td style={styles.td}>
                              {admission.nurse_name || "N/A"}
                            </td>
                            <td style={styles.td}>
                              {admission.room_number || "N/A"}
                            </td>
                            <td style={styles.td}>
                              {formatDateOnly(admission.admission_date)}
                            </td>
                            <td style={styles.td}>
                              {formatDateOnly(admission.discharge_date)}
                            </td>
                            <td style={styles.td}>
                              <span
                                style={{
                                  ...styles.statusBadge,
                                  backgroundColor:
                                    admission.status === "discharged"
                                      ? "#f1f5f9"
                                      : "#dcfce7",
                                  color:
                                    admission.status === "discharged"
                                      ? "#64748b"
                                      : "#166534",
                                }}
                              >
                                {admission.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "payments" && (
              <div>
                <h3 style={styles.sectionTitle}>💰 Payment History</h3>
                {payments.length === 0 ? (
                  <p style={styles.noData}>No payments recorded</p>
                ) : (
                  <div style={styles.tableContainer}>
                    <table style={styles.table}>
                      <thead>
                        <tr style={styles.tableHeader}>
                          <th style={styles.th}>ID</th>
                          <th style={styles.th}>Date</th>
                          <th style={styles.th}>Procedures</th>
                          <th style={styles.th}>Daily Care</th>
                          <th style={styles.th}>Total</th>
                          <th style={styles.th}>Discount</th>
                          <th style={styles.th}>Final Amount</th>
                          <th style={styles.th}>Method</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((payment) => (
                          <tr key={payment.id} style={styles.tableRow}>
                            <td style={styles.td}>{payment.id}</td>
                            <td style={styles.td}>
                              {formatDateOnly(payment.payment_date)}
                            </td>
                            <td style={styles.td}>
                              $
                              {parseFloat(payment.procedure_cost || 0).toFixed(
                                2
                              )}
                            </td>
                            <td style={styles.td}>
                              $
                              {parseFloat(payment.daily_care_cost || 0).toFixed(
                                2
                              )}
                            </td>
                            <td style={styles.td}>
                              $
                              {parseFloat(
                                payment.total_before_discount || 0
                              ).toFixed(2)}
                            </td>
                            <td style={styles.td}>
                              {parseFloat(payment.discount_percent || 0)}%
                            </td>
                            <td style={styles.td}>
                              <strong style={{ color: "#059669" }}>
                                $
                                {parseFloat(payment.final_amount || 0).toFixed(
                                  2
                                )}
                              </strong>
                            </td>
                            <td style={styles.td}>{payment.method}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "predictions" && (
              <div>
                <h3 style={styles.sectionTitle}>🔮 Prediction History</h3>
                {predictions.length === 0 ? (
                  <p style={styles.noData}>No predictions recorded</p>
                ) : (
                  <div style={styles.predictionsGrid}>
                    {predictions.map((prediction) => (
                      <div
                        key={prediction.id}
                        style={{
                          ...styles.predictionCard,
                          borderColor:
                            prediction.risk_level === 1 ? "#dc2626" : "#059669",
                        }}
                      >
                        <div style={styles.predictionHeader}>
                          <span
                            style={{
                              ...styles.predictionBadge,
                              backgroundColor:
                                prediction.risk_level === 1
                                  ? "#fee2e2"
                                  : "#dcfce7",
                              color:
                                prediction.risk_level === 1
                                  ? "#dc2626"
                                  : "#059669",
                            }}
                          >
                            {prediction.risk_level === 1
                              ? "⚠️ HIGH RISK"
                              : "✅ LOW RISK"}
                          </span>
                        </div>
                        <div style={styles.predictionBody}>
                          <p>
                            <strong>Date:</strong>{" "}
                            {formatDate(prediction.prediction_date)}
                          </p>
                          <p>
                            <strong>Predicted by:</strong>{" "}
                            {prediction.predicted_by || "N/A"}
                          </p>
                          {prediction.notes && (
                            <p>
                              <strong>Notes:</strong> {prediction.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "procedures" && (
              <div>
                <h3 style={styles.sectionTitle}>⚕️ Medical Procedures</h3>
                {procedures.length === 0 ? (
                  <p style={styles.noData}>No procedures recorded</p>
                ) : (
                  <div style={styles.proceduresGrid}>
                    {procedures.map((procedure) => (
                      <div key={procedure.id} style={styles.procedureCard}>
                        <div style={styles.procedureHeader}>
                          <h4 style={styles.procedureName}>{procedure.name}</h4>
                          <span
                            style={{
                              ...styles.procedureTypeBadge,
                              backgroundColor:
                                procedure.procedure_type === "surgical"
                                  ? "#fee2e2"
                                  : "#dbeafe",
                              color:
                                procedure.procedure_type === "surgical"
                                  ? "#dc2626"
                                  : "#1e40af",
                            }}
                          >
                            {procedure.procedure_type === "surgical"
                              ? "🔪 Surgical"
                              : "💉 Non-Surgical"}
                          </span>
                        </div>
                        <p style={styles.procedureDescription}>
                          {procedure.description}
                        </p>
                        <div style={styles.procedureFooter}>
                          <strong style={{ color: "#059669", fontSize: "1.2rem" }}>
                            ${parseFloat(procedure.cost || 0).toFixed(2)}
                          </strong>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "prescriptions" && (
              <div>
                <h3 style={styles.sectionTitle}>💊 Prescription History</h3>
                {prescriptions.length === 0 ? (
                  <p style={styles.noData}>No prescriptions recorded</p>
                ) : (
                  <div>
                    {prescriptions.map((prescription) => (
                      <div key={prescription.id} style={styles.prescriptionCard}>
                        <div
                          style={styles.prescriptionHeader}
                          onClick={() => setExpandedPrescription(
                            expandedPrescription === prescription.id ? null : prescription.id
                          )}
                        >
                          <div style={styles.prescriptionMainInfo}>
                            <div style={styles.prescriptionId}>
                              <strong>Prescription #{prescription.id}</strong>
                              <span style={styles.expandIcon}>
                                {expandedPrescription === prescription.id ? "▼" : "▶"}
                              </span>
                            </div>
                            <div style={styles.prescriptionMeta}>
                              <span>👨‍⚕️ {prescription.doctor_name || "N/A"}</span>
                              <span>📅 {formatDateOnly(prescription.prescribed_date)}</span>
                              <span
                                style={{
                                  ...styles.statusBadge,
                                  backgroundColor:
                                    prescription.status === "dispensed"
                                      ? "#dcfce7"
                                      : prescription.status === "pending"
                                      ? "#fef3c7"
                                      : "#f1f5f9",
                                  color:
                                    prescription.status === "dispensed"
                                      ? "#166534"
                                      : prescription.status === "pending"
                                      ? "#92400e"
                                      : "#64748b",
                                }}
                              >
                                {prescription.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        {expandedPrescription === prescription.id && (
                          <div style={styles.prescriptionDetails}>
                            <div style={styles.prescriptionInfo}>
                              <p><strong>Dispensed By:</strong> {prescription.dispensed_by_name || "Not dispensed yet"}</p>
                              <p><strong>Dispensed Date:</strong> {formatDateOnly(prescription.dispensed_date)}</p>
                              {prescription.notes && <p><strong>Notes:</strong> {prescription.notes}</p>}
                            </div>

                            <h4 style={styles.medicinesTitle}>💊 Medicines:</h4>
                            {prescription.items && prescription.items.length > 0 ? (
                              <div style={styles.medicinesGrid}>
                                {prescription.items.map((item, index) => (
                                  <div key={index} style={styles.medicineCard}>
                                    <div style={styles.medicineName}>
                                      {item.medicine_name || `Medicine #${item.medicine}`}
                                    </div>
                                    <div style={styles.medicineDetails}>
                                      <p><strong>Quantity:</strong> {item.quantity}</p>
                                      <p><strong>Dosage:</strong> {item.dosage_instructions}</p>
                                      <p><strong>Duration:</strong> {item.duration_days} days</p>
                                      <span
                                        style={{
                                          ...styles.statusBadge,
                                          backgroundColor:
                                            item.status === "dispensed"
                                              ? "#dcfce7"
                                              : "#fef3c7",
                                          color:
                                            item.status === "dispensed"
                                              ? "#166534"
                                              : "#92400e",
                                        }}
                                      >
                                        {item.status}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p style={styles.noMedicines}>No medicines listed</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
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
  backButton: {
    backgroundColor: "#64748b",
    color: "white",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    cursor: "pointer",
  },
  loading: {
    textAlign: "center",
    padding: "3rem",
    fontSize: "1.1rem",
    color: "#64748b",
  },

  summaryCard: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "2rem",
    marginBottom: "2rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  summaryHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "2rem",
  },
  patientName: {
    color: "#1e293b",
    margin: "0 0 0.5rem 0",
    fontSize: "1.75rem",
  },
  patientInfo: { color: "#64748b", margin: 0 },
  badges: { display: "flex", gap: "0.5rem" },
  insuranceBadge: {
    backgroundColor: "#dcfce7",
    color: "#166534",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    fontSize: "0.9rem",
    fontWeight: "600",
  },
  handicappedBadge: {
    backgroundColor: "#dbeafe",
    color: "#1e40af",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    fontSize: "0.9rem",
    fontWeight: "600",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1.5rem",
  },
  statCard: {
    textAlign: "center",
    padding: "1.5rem",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    border: "2px solid #e2e8f0",
  },
  statIcon: { fontSize: "2.5rem", marginBottom: "0.5rem" },
  statValue: {
    fontSize: "2rem",
    fontWeight: "bold",
    color: "#1e293b",
    margin: "0.5rem 0",
  },
  statLabel: { color: "#64748b", fontSize: "0.9rem" },

  tabs: {
    display: "flex",
    gap: "0.5rem",
    marginBottom: "2rem",
    borderBottom: "2px solid #e2e8f0",
  },
  tab: {
    backgroundColor: "transparent",
    border: "none",
    padding: "1rem 1.5rem",
    cursor: "pointer",
    fontSize: "1rem",
    color: "#64748b",
    borderBottom: "3px solid transparent",
    transition: "all 0.2s",
  },
  activeTab: {
    color: "#2563eb",
    borderBottomColor: "#2563eb",
    fontWeight: "600",
  },

  tabContent: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "2rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  sectionTitle: {
    color: "#1e293b",
    marginTop: 0,
    marginBottom: "1.5rem",
    fontSize: "1.5rem",
  },
  noData: {
    color: "#64748b",
    fontStyle: "italic",
    textAlign: "center",
    padding: "2rem",
  },

  timelineContainer: { position: "relative", paddingLeft: "2rem" },
  timelineItem: {
    position: "relative",
    paddingBottom: "2rem",
    borderLeft: "2px solid #e2e8f0",
  },
  timelineDot: {
    position: "absolute",
    left: "-6px",
    top: "5px",
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    backgroundColor: "#2563eb",
  },
  timelineContent: { marginLeft: "1.5rem", color: "#334155" },

  tableContainer: { overflowX: "auto" },
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
  statusBadge: {
    padding: "0.25rem 0.75rem",
    borderRadius: "12px",
    fontSize: "0.85rem",
    fontWeight: "500",
  },

  predictionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "1.5rem",
  },
  predictionCard: {
    border: "3px solid",
    borderRadius: "12px",
    padding: "1.5rem",
    backgroundColor: "#f8fafc",
  },
  predictionHeader: { marginBottom: "1rem" },
  predictionBadge: {
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    fontSize: "1rem",
    fontWeight: "600",
    display: "inline-block",
  },
  predictionBody: { color: "#334155", fontSize: "0.95rem" },

  proceduresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "1.5rem",
  },
  procedureCard: {
    border: "2px solid #e2e8f0",
    borderRadius: "12px",
    padding: "1.5rem",
    backgroundColor: "#f8fafc",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  procedureHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "1rem",
    gap: "1rem",
  },
  procedureName: {
    color: "#1e293b",
    margin: 0,
    fontSize: "1.1rem",
    flex: 1,
  },
  procedureTypeBadge: {
    padding: "0.4rem 0.8rem",
    borderRadius: "6px",
    fontSize: "0.85rem",
    fontWeight: "600",
    whiteSpace: "nowrap",
  },
  procedureDescription: {
    color: "#64748b",
    fontSize: "0.95rem",
    marginBottom: "1rem",
  },
  procedureFooter: {
    paddingTop: "1rem",
    borderTop: "1px solid #e2e8f0",
  },

  prescriptionCard: {
    backgroundColor: "white",
    border: "2px solid #e2e8f0",
    borderRadius: "12px",
    marginBottom: "1rem",
    overflow: "hidden",
  },
  prescriptionHeader: {
    padding: "1.5rem",
    cursor: "pointer",
    transition: "background-color 0.2s",
    backgroundColor: "#f8fafc",
  },
  prescriptionMainInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  prescriptionId: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "1.1rem",
    color: "#1e293b",
  },
  expandIcon: {
    color: "#2563eb",
    fontSize: "1rem",
  },
  prescriptionMeta: {
    display: "flex",
    gap: "1.5rem",
    flexWrap: "wrap",
    fontSize: "0.95rem",
    color: "#64748b",
  },
  prescriptionDetails: {
    padding: "1.5rem",
    borderTop: "2px solid #e2e8f0",
    backgroundColor: "white",
  },
  prescriptionInfo: {
    color: "#334155",
    fontSize: "0.95rem",
    marginBottom: "1.5rem",
  },
  medicinesTitle: {
    color: "#1e293b",
    marginBottom: "1rem",
    fontSize: "1.1rem",
  },
  medicinesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "1rem",
  },
  medicineCard: {
    border: "2px solid #dbeafe",
    borderRadius: "8px",
    padding: "1rem",
    backgroundColor: "#f0f9ff",
  },
  medicineName: {
    fontSize: "1rem",
    fontWeight: "600",
    color: "#1e40af",
    marginBottom: "0.75rem",
  },
  medicineDetails: {
    fontSize: "0.9rem",
    color: "#334155",
  },
  noMedicines: {
    color: "#64748b",
    fontStyle: "italic",
    textAlign: "center",
    padding: "1rem",
  },
};

export default PatientArchive;
