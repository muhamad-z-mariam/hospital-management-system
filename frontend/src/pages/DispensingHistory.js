import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { prescriptionAPI } from "../api/api";

const DispensingHistory = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    fetchDispensedPrescriptions();
  }, []);

  useEffect(() => {
    filterPrescriptions();
  }, [searchTerm, dateFilter, prescriptions]);

  const fetchDispensedPrescriptions = async () => {
    try {
      const data = await prescriptionAPI.getDispensed();
      const prescriptionsArray = Array.isArray(data) ? data : [];
      setPrescriptions(prescriptionsArray);
      setFilteredPrescriptions(prescriptionsArray);
    } catch (error) {
      console.error("Error fetching dispensed prescriptions:", error);
      setPrescriptions([]);
      setFilteredPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const filterPrescriptions = () => {
    let filtered = [...prescriptions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter((p) => {
        const prescDate = new Date(p.dispensed_date).toISOString().split("T")[0];
        return prescDate === dateFilter;
      });
    }

    setFilteredPrescriptions(filtered);
  };

  const handleViewDetails = (prescription) => {
    setSelectedPrescription(prescription);
  };

  const closeModal = () => {
    setSelectedPrescription(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={styles.layout}>
          <Sidebar />
          <main style={styles.content}>
            <div style={styles.loading}>Loading dispensing history...</div>
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
            <h1 style={styles.title}>=� Dispensing History</h1>
            <p style={styles.subtitle}>
              Complete audit trail of all dispensed prescriptions
            </p>
          </div>

          {/* Filters */}
          <div style={styles.filterContainer}>
            <input
              type="text"
              placeholder="= Search by patient or doctor name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={styles.dateInput}
            />
            {(searchTerm || dateFilter) && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setDateFilter("");
                }}
                style={styles.clearButton}
              >
                 Clear Filters
              </button>
            )}
          </div>

          {/* Stats */}
          <div style={styles.statsBar}>
            <div style={styles.statItem}>
              <span style={styles.statValue}>{prescriptions.length}</span>
              <span style={styles.statLabel}>Total Dispensed</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statValue}>{filteredPrescriptions.length}</span>
              <span style={styles.statLabel}>Showing</span>
            </div>
          </div>

          {/* Prescriptions List */}
          {filteredPrescriptions.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>=�</div>
              <h3 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "0.5rem", color: "#334155" }}>
                No Prescriptions Found
              </h3>
              <p style={{ fontSize: "1rem", color: "#64748b" }}>
                {searchTerm || dateFilter
                  ? "Try adjusting your filters"
                  : "No dispensed prescriptions yet"}
              </p>
            </div>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Patient</th>
                    <th style={styles.th}>Doctor</th>
                    <th style={styles.th}>Dispensed Date</th>
                    <th style={styles.th}>Items</th>
                    <th style={styles.th}>Total Cost</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPrescriptions.map((prescription) => (
                    <tr key={prescription.id} style={styles.tableRow}>
                      <td style={styles.td}>#{prescription.id}</td>
                      <td style={styles.td}>
                        <div style={styles.patientCell}>
                          <div style={styles.patientName}>
                            {prescription.patient_name}
                          </div>
                          {prescription.admission && (
                            <div style={styles.admissionTag}>
                              🏥 Admission #{prescription.admission}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={styles.td}>
                        Dr. {prescription.doctor_name}
                        {prescription.doctor_specialty && (
                          <div style={styles.specialty}>
                            {prescription.doctor_specialty}
                          </div>
                        )}
                      </td>
                      <td style={styles.td}>{formatDate(prescription.dispensed_date)}</td>
                      <td style={styles.td}>
                        <span style={styles.itemsBadge}>
                          {prescription.items?.length || 0} items
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.costText}>
                          ${parseFloat(prescription.total_cost || 0).toFixed(2)}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <button
                          onClick={() => handleViewDetails(prescription)}
                          style={styles.viewButton}
                        >
                          =A View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {/* Detail Modal */}
      {selectedPrescription && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                Prescription Details #{selectedPrescription.id}
              </h2>
              <button onClick={closeModal} style={styles.closeButton}>
                
              </button>
            </div>

            <div style={styles.modalBody}>
              {/* Patient Info */}
              <div style={styles.infoSection}>
                <h3 style={styles.sectionTitle}>Patient Information</h3>
                <div style={styles.infoGrid}>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Name:</span>
                    <span style={styles.infoValue}>
                      {selectedPrescription.patient_name}
                    </span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Contact:</span>
                    <span style={styles.infoValue}>
                      {selectedPrescription.patient_contact}
                    </span>
                  </div>
                  {selectedPrescription.admission && (
                    <div style={styles.infoItem}>
                      <span style={styles.infoLabel}>Admission:</span>
                      <span style={styles.infoValue}>
                        #{selectedPrescription.admission}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Doctor Info */}
              <div style={styles.infoSection}>
                <h3 style={styles.sectionTitle}>Prescribing Doctor</h3>
                <div style={styles.infoGrid}>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Doctor:</span>
                    <span style={styles.infoValue}>
                      Dr. {selectedPrescription.doctor_name}
                    </span>
                  </div>
                  {selectedPrescription.doctor_specialty && (
                    <div style={styles.infoItem}>
                      <span style={styles.infoLabel}>Specialty:</span>
                      <span style={styles.infoValue}>
                        {selectedPrescription.doctor_specialty}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Medicines */}
              <div style={styles.infoSection}>
                <h3 style={styles.sectionTitle}>Medicines Dispensed</h3>
                <div style={styles.medicinesList}>
                  {selectedPrescription.items?.map((item) => (
                    <div key={item.id} style={styles.medicineCard}>
                      <div style={styles.medicineHeader}>
                        <span style={styles.medicineName}>
                          =� {item.medicine_name}
                        </span>
                        <span style={styles.medicinePrice}>
                          ${parseFloat(item.total_price).toFixed(2)}
                        </span>
                      </div>
                      <div style={styles.medicineDetails}>
                        <div>
                          <strong>Quantity:</strong> {item.quantity}
                        </div>
                        <div>
                          <strong>Dosage:</strong> {item.dosage_instructions}
                        </div>
                        <div>
                          <strong>Duration:</strong> {item.duration_days} days
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dispensing Info */}
              <div style={styles.infoSection}>
                <h3 style={styles.sectionTitle}>Dispensing Information</h3>
                <div style={styles.infoGrid}>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Dispensed By:</span>
                    <span style={styles.infoValue}>
                      {selectedPrescription.dispensed_by_name || "N/A"}
                    </span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Dispensed Date:</span>
                    <span style={styles.infoValue}>
                      {formatDate(selectedPrescription.dispensed_date)}
                    </span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Prescribed Date:</span>
                    <span style={styles.infoValue}>
                      {formatDate(selectedPrescription.prescribed_date)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedPrescription.notes && (
                <div style={styles.infoSection}>
                  <h3 style={styles.sectionTitle}>Doctor's Notes</h3>
                  <div style={styles.notesBox}>{selectedPrescription.notes}</div>
                </div>
              )}

              {/* Total */}
              <div style={styles.totalSection}>
                <span style={styles.totalLabel}>Total Cost:</span>
                <span style={styles.totalValue}>
                  ${parseFloat(selectedPrescription.total_cost).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
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
  },
  title: {
    fontSize: "2rem",
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: "0.5rem",
  },
  subtitle: {
    fontSize: "1rem",
    color: "#64748b",
  },
  filterContainer: {
    display: "flex",
    gap: "1rem",
    marginBottom: "1.5rem",
    flexWrap: "wrap",
  },
  searchInput: {
    flex: 1,
    minWidth: "250px",
    padding: "0.75rem 1rem",
    fontSize: "1rem",
    border: "2px solid #e2e8f0",
    borderRadius: "8px",
    outline: "none",
    transition: "border-color 0.2s",
  },
  dateInput: {
    padding: "0.75rem 1rem",
    fontSize: "1rem",
    border: "2px solid #e2e8f0",
    borderRadius: "8px",
    outline: "none",
  },
  clearButton: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "0.9rem",
    fontWeight: "600",
    cursor: "pointer",
  },
  statsBar: {
    display: "flex",
    gap: "1rem",
    marginBottom: "1.5rem",
  },
  statItem: {
    backgroundColor: "#ffffff",
    padding: "1rem 1.5rem",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  statValue: {
    fontSize: "1.5rem",
    fontWeight: "700",
    color: "#7c3aed",
  },
  statLabel: {
    fontSize: "0.85rem",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  tableContainer: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.07)",
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
    fontSize: "0.9rem",
  },
  tableRow: {
    borderBottom: "1px solid #e2e8f0",
    transition: "background-color 0.2s",
  },
  td: {
    padding: "1rem",
    color: "#334155",
    fontSize: "0.9rem",
  },
  patientCell: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  patientName: {
    fontWeight: "600",
    color: "#0f172a",
  },
  admissionTag: {
    fontSize: "0.75rem",
    color: "#64748b",
  },
  specialty: {
    fontSize: "0.8rem",
    color: "#64748b",
    marginTop: "0.25rem",
  },
  itemsBadge: {
    backgroundColor: "#dbeafe",
    color: "#1e40af",
    padding: "0.25rem 0.75rem",
    borderRadius: "12px",
    fontSize: "0.8rem",
    fontWeight: "600",
  },
  costText: {
    fontWeight: "700",
    color: "#10b981",
    fontSize: "1rem",
  },
  viewButton: {
    backgroundColor: "#7c3aed",
    color: "white",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    fontSize: "0.85rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  emptyState: {
    textAlign: "center",
    padding: "4rem 2rem",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.07)",
  },
  loading: {
    textAlign: "center",
    padding: "3rem",
    fontSize: "1.2rem",
    color: "#64748b",
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
  modal: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    maxWidth: "800px",
    width: "90%",
    maxHeight: "90vh",
    overflow: "auto",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1.5rem",
    borderBottom: "2px solid #e2e8f0",
    position: "sticky",
    top: 0,
    backgroundColor: "#ffffff",
    zIndex: 1,
  },
  modalTitle: {
    fontSize: "1.5rem",
    fontWeight: "700",
    color: "#1e293b",
  },
  closeButton: {
    backgroundColor: "transparent",
    border: "none",
    fontSize: "1.5rem",
    color: "#64748b",
    cursor: "pointer",
    padding: "0.5rem",
  },
  modalBody: {
    padding: "1.5rem",
  },
  infoSection: {
    marginBottom: "1.5rem",
  },
  sectionTitle: {
    fontSize: "1.1rem",
    fontWeight: "600",
    color: "#334155",
    marginBottom: "1rem",
    borderBottom: "2px solid #e2e8f0",
    paddingBottom: "0.5rem",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1rem",
  },
  infoItem: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  infoLabel: {
    fontSize: "0.85rem",
    color: "#64748b",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: "1rem",
    color: "#0f172a",
    fontWeight: "600",
  },
  medicinesList: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  medicineCard: {
    backgroundColor: "#f8fafc",
    padding: "1rem",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
  },
  medicineHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.75rem",
  },
  medicineName: {
    fontSize: "1rem",
    fontWeight: "700",
    color: "#0f172a",
  },
  medicinePrice: {
    fontSize: "1rem",
    fontWeight: "700",
    color: "#10b981",
  },
  medicineDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    fontSize: "0.9rem",
    color: "#475569",
  },
  notesBox: {
    backgroundColor: "#fef3c7",
    padding: "1rem",
    borderRadius: "8px",
    borderLeft: "4px solid #f59e0b",
    fontSize: "0.95rem",
    color: "#78350f",
    lineHeight: "1.6",
  },
  totalSection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1.5rem",
    backgroundColor: "#f1f5f9",
    borderRadius: "8px",
    marginTop: "1rem",
  },
  totalLabel: {
    fontSize: "1.25rem",
    fontWeight: "600",
    color: "#334155",
  },
  totalValue: {
    fontSize: "1.75rem",
    fontWeight: "800",
    color: "#7c3aed",
  },
};

export default DispensingHistory;
