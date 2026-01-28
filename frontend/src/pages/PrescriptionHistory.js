import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const API_BASE_URL = "http://localhost:8000/api";

const PrescriptionHistory = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [patientId]);

  const fetchData = async () => {
    try {
      // Fetch patient
      const patientRes = await fetch(`${API_BASE_URL}/patients/${patientId}/`);
      const patientData = await patientRes.json();
      setPatient(patientData);

      // Fetch prescriptions
      const presRes = await fetch(
        `${API_BASE_URL}/patients/${patientId}/prescriptions/`
      );
      const presData = await presRes.json();
      if (presData.success) {
        setPrescriptions(presData.prescriptions);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: { backgroundColor: "#fef3c7", color: "#92400e" },
      partially_dispensed: { backgroundColor: "#dbeafe", color: "#1e40af" },
      dispensed: { backgroundColor: "#d1fae5", color: "#065f46" },
      cancelled: { backgroundColor: "#fee2e2", color: "#991b1b" },
    };

    return (
      <span style={{ ...styles.badge, ...statusStyles[status] }}>
        {status.replace("_", " ").toUpperCase()}
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
            <div style={styles.loading}>Loading...</div>
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
            <button onClick={() => navigate(-1)} style={styles.backButton}>
              ← Back
            </button>
            <h1 style={styles.title}>Prescription History</h1>
            {patient && (
              <p style={styles.subtitle}>
                Patient: {patient.name} | Age: {patient.age} | Contact:{" "}
                {patient.contact}
              </p>
            )}
          </div>

          {prescriptions.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📋</div>
              <h2 style={styles.emptyTitle}>No Prescriptions Found</h2>
              <p style={styles.emptyText}>
                This patient has no prescription records.
              </p>
            </div>
          ) : (
            <div style={styles.prescriptionList}>
              {prescriptions.map((prescription) => (
                <div key={prescription.id} style={styles.prescriptionCard}>
                  <div style={styles.prescriptionHeader}>
                    <div>
                      <div style={styles.prescriptionId}>
                        Prescription #{prescription.id}
                      </div>
                      <div style={styles.doctorInfo}>
                        Prescribed by: Dr. {prescription.doctor_name} (
                        {prescription.doctor_specialty})
                      </div>
                      <div style={styles.date}>
                        Date:{" "}
                        {new Date(
                          prescription.prescribed_date
                        ).toLocaleDateString()}
                      </div>
                    </div>
                    <div>{getStatusBadge(prescription.status)}</div>
                  </div>

                  {prescription.notes && (
                    <div style={styles.notes}>
                      <strong>Notes:</strong> {prescription.notes}
                    </div>
                  )}

                  <div style={styles.medicinesList}>
                    <h4 style={styles.medicinesTitle}>Medicines:</h4>
                    <div style={styles.medicinesGrid}>
                      {prescription.items.map((item) => (
                        <div key={item.id} style={styles.medicineItem}>
                          <div style={styles.medicineName}>
                            {item.medicine_name}
                          </div>
                          <div style={styles.medicineDetails}>
                            <div>
                              <strong>Quantity:</strong> {item.quantity}
                            </div>
                            <div>
                              <strong>Duration:</strong> {item.duration_days}{" "}
                              days
                            </div>
                            <div>
                              <strong>Instructions:</strong>{" "}
                              {item.dosage_instructions}
                            </div>
                            <div style={styles.medicinePrice}>
                              Cost: ${parseFloat(item.total_price).toFixed(2)}
                            </div>
                          </div>
                          <div style={styles.itemStatus}>
                            {item.status === "dispensed" ? (
                              <span style={styles.dispensedBadge}>
                                Dispensed
                              </span>
                            ) : (
                              <span style={styles.pendingBadge}>Pending</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={styles.footer}>
                    <div style={styles.totalCost}>
                      Total Cost: $
                      {parseFloat(prescription.total_cost).toFixed(2)}
                    </div>
                    {prescription.dispensed_by_name && (
                      <div style={styles.dispensedInfo}>
                        Dispensed by: {prescription.dispensed_by_name}
                        {prescription.dispensed_date && (
                          <> on{" "}
                            {new Date(
                              prescription.dispensed_date
                            ).toLocaleDateString()}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
};

const styles = {
  layout: { display: "flex", height: "calc(100vh - 70px)" },
  content: {
    flex: 1,
    overflowY: "auto",
    padding: "30px",
    backgroundColor: "#f9fafb",
  },
  header: { marginBottom: "30px" },
  backButton: {
    padding: "8px 16px",
    backgroundColor: "#6b7280",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    marginBottom: "16px",
    fontSize: "14px",
  },
  title: {
    fontSize: "32px",
    fontWeight: "bold",
    color: "#111827",
    marginBottom: "8px",
  },
  subtitle: { fontSize: "16px", color: "#6b7280" },
  prescriptionList: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  prescriptionCard: {
    backgroundColor: "#ffffff",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  prescriptionHeader: {
    display: "flex",
    justifyContent: "space-between",
    paddingBottom: "16px",
    borderBottom: "2px solid #e5e7eb",
    marginBottom: "16px",
  },
  prescriptionId: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#111827",
    marginBottom: "4px",
  },
  doctorInfo: { fontSize: "14px", color: "#6b7280", marginBottom: "4px" },
  date: { fontSize: "13px", color: "#9ca3af" },
  badge: {
    padding: "6px 12px",
    borderRadius: "9999px",
    fontSize: "12px",
    fontWeight: "600",
  },
  notes: {
    backgroundColor: "#fef3c7",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "14px",
    marginBottom: "16px",
  },
  medicinesList: { marginTop: "16px" },
  medicinesTitle: {
    fontSize: "16px",
    fontWeight: "600",
    marginBottom: "12px",
    color: "#111827",
  },
  medicinesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "12px",
  },
  medicineItem: {
    padding: "16px",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
  },
  medicineName: {
    fontWeight: "600",
    fontSize: "16px",
    color: "#111827",
    marginBottom: "8px",
  },
  medicineDetails: { fontSize: "14px", color: "#6b7280", marginBottom: "8px" },
  medicinePrice: {
    color: "#059669",
    fontWeight: "600",
    marginTop: "8px",
  },
  itemStatus: { marginTop: "8px" },
  dispensedBadge: {
    backgroundColor: "#d1fae5",
    color: "#065f46",
    padding: "4px 8px",
    borderRadius: "9999px",
    fontSize: "11px",
    fontWeight: "600",
  },
  pendingBadge: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
    padding: "4px 8px",
    borderRadius: "9999px",
    fontSize: "11px",
    fontWeight: "600",
  },
  footer: {
    marginTop: "16px",
    paddingTop: "16px",
    borderTop: "2px solid #e5e7eb",
  },
  totalCost: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#111827",
    marginBottom: "8px",
  },
  dispensedInfo: { fontSize: "13px", color: "#6b7280" },
  loading: {
    textAlign: "center",
    padding: "40px",
    fontSize: "18px",
    color: "#6b7280",
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
  },
  emptyIcon: { fontSize: "64px", marginBottom: "16px" },
  emptyTitle: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#111827",
    marginBottom: "8px",
  },
  emptyText: { fontSize: "16px", color: "#6b7280" },
};

export default PrescriptionHistory;
