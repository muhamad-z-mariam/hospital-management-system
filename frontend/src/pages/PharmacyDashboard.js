import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { pharmacyStaffAPI, prescriptionAPI, medicineAPI } from "../api/api";

const PharmacyDashboard = () => {
  const { user } = useAuth();
  const [pendingPrescriptions, setPendingPrescriptions] = useState([]);
  const [recentlyDispensed, setRecentlyDispensed] = useState([]);
  const [lowStockMedicines, setLowStockMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [pharmacyStaffId, setPharmacyStaffId] = useState(null);

  useEffect(() => {
    fetchPharmacyStaffId();
    fetchPendingPrescriptions();
    fetchRecentlyDispensed();
    fetchLowStockMedicines();
  }, []);

  const fetchPharmacyStaffId = async () => {
    try {
      const data = await pharmacyStaffAPI.getAll();
      const myStaff = Array.isArray(data)
        ? data.find((s) => s.user?.id === user.id)
        : null;
      if (myStaff) {
        setPharmacyStaffId(myStaff.id);
      }
    } catch (error) {
      console.error("Error fetching pharmacy staff:", error);
    }
  };

  const fetchPendingPrescriptions = async () => {
    try {
      const data = await prescriptionAPI.getPending();
      if (data.success) {
        setPendingPrescriptions(data.prescriptions);
      }
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentlyDispensed = async () => {
    try {
      const data = await prescriptionAPI.getDispensed();
      const dispensedArray = Array.isArray(data) ? data : [];
      // Sort by dispensed_date descending and take last 10
      const sorted = dispensedArray
        .sort((a, b) => new Date(b.dispensed_date) - new Date(a.dispensed_date))
        .slice(0, 10);
      setRecentlyDispensed(sorted);
    } catch (error) {
      console.error("Error fetching recently dispensed:", error);
      setRecentlyDispensed([]);
    }
  };

  const fetchLowStockMedicines = async () => {
    try {
      const data = await medicineAPI.getLowStock();
      const medicinesArray = Array.isArray(data) ? data : [];
      setLowStockMedicines(medicinesArray);
    } catch (error) {
      console.error("Error fetching low stock medicines:", error);
      setLowStockMedicines([]);
    }
  };

  const handleDispenseItem = async (itemId) => {
    if (!pharmacyStaffId) {
      alert("Pharmacy staff profile not found");
      return;
    }

    try {
      const data = await prescriptionAPI.dispenseItem(itemId, pharmacyStaffId);
      if (data.success) {
        alert("✓ Medicine dispensed successfully!");
        fetchPendingPrescriptions();
        fetchRecentlyDispensed(); // Refresh recently dispensed list
        fetchLowStockMedicines(); // Refresh low stock (in case stock changed)
        setSelectedPrescription(null);
      } else {
        alert(data.error || "Failed to dispense medicine");
      }
    } catch (error) {
      console.error("Error dispensing medicine:", error);
      alert("Failed to dispense medicine");
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: { backgroundColor: "#fef3c7", color: "#92400e" },
      partially_dispensed: { backgroundColor: "#dbeafe", color: "#1e40af" },
      dispensed: { backgroundColor: "#d1fae5", color: "#065f46" },
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
            <div style={styles.loading}>Loading dashboard...</div>
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
            <h1 style={styles.title}>
              💊 Pharmacy Dashboard
            </h1>
            <p style={styles.subtitle}>Manage prescriptions and dispense medicines efficiently</p>
          </div>

          <div style={styles.statsContainer}>
            <div style={{ ...styles.statCard, borderTop: "4px solid #8b5cf6" }}>
              <div style={styles.statValue}>📋 {pendingPrescriptions.length}</div>
              <div style={styles.statLabel}>Pending Prescriptions</div>
            </div>
            <div style={{ ...styles.statCard, borderTop: "4px solid #3b82f6" }}>
              <div style={styles.statValue}>
                ⏳ {pendingPrescriptions.filter(
                  (p) => p.status === "partially_dispensed"
                ).length}
              </div>
              <div style={styles.statLabel}>Partially Dispensed</div>
            </div>
            <div style={{ ...styles.statCard, borderTop: "4px solid #ef4444" }}>
              <div style={styles.statValue}>⚠️ {lowStockMedicines.length}</div>
              <div style={styles.statLabel}>Low Stock Alerts</div>
            </div>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>📝 Pending Prescriptions</h2>
            {pendingPrescriptions.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>📭</div>
                <h3 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "0.5rem", color: "#334155" }}>
                  All Clear!
                </h3>
                <p style={{ fontSize: "1rem", color: "#64748b" }}>
                  No pending prescriptions at the moment
                </p>
              </div>
            ) : (
              <div style={styles.prescriptionList}>
                {pendingPrescriptions.map((prescription) => (
                  <div key={prescription.id} style={styles.prescriptionCard}>
                    <div style={styles.prescriptionHeader}>
                      <div>
                        <h3 style={styles.patientName}>
                          👤 {prescription.patient_name}
                        </h3>
                        <p style={styles.doctorInfo}>
                          🩺 Dr. {prescription.doctor_name} - {prescription.doctor_specialty}
                        </p>
                        <p style={styles.date}>
                          📅 Prescribed: {new Date(prescription.prescribed_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div>{getStatusBadge(prescription.status)}</div>
                    </div>

                    {prescription.notes && (
                      <div style={styles.notes}>
                        <strong>📝 Doctor's Notes:</strong> {prescription.notes}
                      </div>
                    )}

                    <div style={styles.medicinesList}>
                      <h4 style={styles.medicinesTitle}>💊 Medicines:</h4>
                      {prescription.items.map((item) => (
                        <div key={item.id} style={styles.medicineItem}>
                          <div style={styles.medicineInfo}>
                            <div style={styles.medicineName}>
                              💊 {item.medicine_name}
                            </div>
                            <div style={styles.medicineDetails}>
                              📦 Quantity: {item.quantity} | 📋 {item.dosage_instructions}
                            </div>
                            <div style={styles.medicinePrice}>
                              💰 ${parseFloat(item.total_price).toFixed(2)}
                            </div>
                          </div>
                          <div>
                            {item.status === "pending" ? (
                              <button
                                style={styles.dispenseButton}
                                onClick={() => handleDispenseItem(item.id)}
                                onMouseEnter={(e) => {
                                  e.target.style.transform = "translateY(-2px)";
                                  e.target.style.boxShadow = "0 6px 12px rgba(102, 126, 234, 0.4)";
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.transform = "translateY(0)";
                                  e.target.style.boxShadow = "0 4px 6px rgba(102, 126, 234, 0.3)";
                                }}
                              >
                                ✓ Dispense
                              </button>
                            ) : (
                              <span style={styles.dispensedBadge}>✓ Dispensed</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={styles.totalCost}>
                      💵 Total: ${parseFloat(prescription.total_cost).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recently Dispensed Section */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>✅ Recently Dispensed</h2>
            {recentlyDispensed.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📦</div>
                <p style={{ fontSize: "1rem", color: "#64748b" }}>
                  No recently dispensed prescriptions
                </p>
              </div>
            ) : (
              <div style={styles.recentlyDispensedList}>
                {recentlyDispensed.map((prescription) => (
                  <div key={prescription.id} style={styles.recentCard}>
                    <div style={styles.recentInfo}>
                      <div style={styles.recentPatient}>
                        👤 <strong>{prescription.patient_name}</strong>
                      </div>
                      <div style={styles.recentDoctor}>
                        🩺 Dr. {prescription.doctor_name}
                      </div>
                      {prescription.admission && (
                        <div style={styles.recentAdmission}>
                          🏥 Admission #{prescription.admission}
                        </div>
                      )}
                    </div>
                    <div style={styles.recentDate}>
                      {new Date(prescription.dispensed_date).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Low Stock Alerts Section */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>⚠️ Low Stock Alerts</h2>
            {lowStockMedicines.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✔️</div>
                <h3 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "0.5rem", color: "#334155" }}>
                  All Stock Levels Good!
                </h3>
                <p style={{ fontSize: "1rem", color: "#64748b" }}>
                  No medicines need reordering at the moment
                </p>
              </div>
            ) : (
              <div style={styles.lowStockGrid}>
                {lowStockMedicines.map((medicine) => (
                  <div key={medicine.id} style={styles.lowStockCard}>
                    <div style={styles.lowStockHeader}>
                      <div style={styles.medicineName}>💊 {medicine.name}</div>
                      <div style={styles.urgentBadge}>
                        {medicine.stock_quantity === 0 ? 'OUT OF STOCK' : 'LOW STOCK'}
                      </div>
                    </div>
                    <div style={styles.lowStockInfo}>
                      <div style={styles.lowStockDetail}>
                        <strong>Current Stock:</strong>{' '}
                        <span style={{ color: medicine.stock_quantity === 0 ? '#ef4444' : '#f59e0b' }}>
                          {medicine.stock_quantity} units
                        </span>
                      </div>
                      <div style={styles.lowStockDetail}>
                        <strong>Reorder Level:</strong> {medicine.reorder_level} units
                      </div>
                      <div style={styles.lowStockDetail}>
                        <strong>Category:</strong> {medicine.category}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

const styles = {
  layout: {
    display: "flex",
    minHeight: "100vh",
  },
  content: {
    marginLeft: "250px",
    flex: 1,
    padding: "2rem",
    backgroundColor: "#f8fafc",
    minHeight: "calc(100vh - 73px)",
  },
  header: {
    marginBottom: "2rem",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "2rem",
    borderRadius: "16px",
    color: "white",
    boxShadow: "0 10px 25px rgba(102, 126, 234, 0.3)",
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: "700",
    margin: "0 0 0.5rem 0",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  subtitle: {
    fontSize: "1.1rem",
    opacity: "0.95",
    margin: 0,
  },
  statsContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "1.5rem",
    marginBottom: "2rem",
  },
  statCard: {
    backgroundColor: "#ffffff",
    padding: "1.75rem",
    borderRadius: "16px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.07)",
    transition: "all 0.3s ease",
    cursor: "pointer",
    position: "relative",
    overflow: "hidden",
  },
  statValue: {
    fontSize: "3rem",
    fontWeight: "800",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    marginBottom: "0.5rem",
  },
  statLabel: {
    fontSize: "0.95rem",
    color: "#64748b",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  section: {
    marginBottom: "2rem",
  },
  sectionTitle: {
    fontSize: "1.5rem",
    fontWeight: "700",
    marginBottom: "1.5rem",
    color: "#1e293b",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  prescriptionList: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  prescriptionCard: {
    backgroundColor: "#ffffff",
    padding: "1.75rem",
    borderRadius: "16px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)",
    border: "1px solid #e2e8f0",
    transition: "all 0.3s ease",
    position: "relative",
  },
  prescriptionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "1.25rem",
    paddingBottom: "1.25rem",
    borderBottom: "2px solid #f1f5f9",
  },
  patientName: {
    fontSize: "1.35rem",
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: "0.5rem",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  doctorInfo: {
    fontSize: "0.95rem",
    color: "#475569",
    marginBottom: "0.35rem",
    fontWeight: "500",
  },
  date: {
    fontSize: "0.85rem",
    color: "#94a3b8",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  badge: {
    padding: "6px 16px",
    borderRadius: "20px",
    fontSize: "0.75rem",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  notes: {
    backgroundColor: "#fef9c3",
    padding: "1rem",
    borderRadius: "12px",
    fontSize: "0.95rem",
    marginBottom: "1.25rem",
    borderLeft: "4px solid #facc15",
    lineHeight: "1.6",
  },
  medicinesList: {
    marginTop: "1.25rem",
    backgroundColor: "#f8fafc",
    padding: "1rem",
    borderRadius: "12px",
  },
  medicinesTitle: {
    fontSize: "1.1rem",
    fontWeight: "700",
    marginBottom: "1rem",
    color: "#334155",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  medicineItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    marginBottom: "0.75rem",
    border: "1px solid #e2e8f0",
    transition: "all 0.2s ease",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  medicineInfo: {
    flex: 1,
  },
  medicineName: {
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: "0.5rem",
    fontSize: "1.05rem",
  },
  medicineDetails: {
    fontSize: "0.9rem",
    color: "#64748b",
    marginBottom: "0.35rem",
    lineHeight: "1.5",
  },
  medicinePrice: {
    fontSize: "0.95rem",
    color: "#10b981",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  dispenseButton: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#ffffff",
    padding: "10px 20px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: "600",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 6px rgba(102, 126, 234, 0.3)",
  },
  dispensedBadge: {
    backgroundColor: "#d1fae5",
    color: "#065f46",
    padding: "8px 16px",
    borderRadius: "20px",
    fontSize: "0.8rem",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  totalCost: {
    marginTop: "1.5rem",
    paddingTop: "1.5rem",
    borderTop: "3px solid #e2e8f0",
    textAlign: "right",
    fontSize: "1.5rem",
    fontWeight: "800",
    color: "#0f172a",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  loading: {
    textAlign: "center",
    padding: "3rem",
    fontSize: "1.2rem",
    color: "#64748b",
  },
  emptyState: {
    textAlign: "center",
    padding: "4rem 2rem",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    color: "#64748b",
    boxShadow: "0 4px 6px rgba(0,0,0,0.07)",
  },
  recentlyDispensedList: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "1rem",
    boxShadow: "0 4px 6px rgba(0,0,0,0.07)",
  },
  recentCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem",
    borderBottom: "1px solid #e2e8f0",
    transition: "background-color 0.2s",
  },
  recentInfo: {
    flex: 1,
  },
  recentPatient: {
    fontSize: "1rem",
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: "0.25rem",
  },
  recentDoctor: {
    fontSize: "0.9rem",
    color: "#64748b",
    marginBottom: "0.25rem",
  },
  recentAdmission: {
    fontSize: "0.85rem",
    color: "#94a3b8",
  },
  recentDate: {
    fontSize: "0.85rem",
    color: "#64748b",
    fontWeight: "500",
  },
  lowStockGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "1.5rem",
  },
  lowStockCard: {
    backgroundColor: "#ffffff",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.07)",
    border: "2px solid #fee2e2",
    transition: "all 0.3s ease",
  },
  lowStockHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
    paddingBottom: "1rem",
    borderBottom: "1px solid #f1f5f9",
  },
  urgentBadge: {
    backgroundColor: "#fee2e2",
    color: "#dc2626",
    padding: "4px 12px",
    borderRadius: "12px",
    fontSize: "0.7rem",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  lowStockInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  lowStockDetail: {
    fontSize: "0.9rem",
    color: "#475569",
  },
};

export default PharmacyDashboard;
