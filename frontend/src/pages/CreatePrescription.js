import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = "http://localhost:8000/api";

const CreatePrescription = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { patientId, admissionId } = useParams();

  const [patient, setPatient] = useState(null);
  const [admission, setAdmission] = useState(null);
  const [doctorId, setDoctorId] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [notes, setNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [patientId, admissionId]);

  const fetchData = async () => {
    try {
      // Fetch patient
      const patientRes = await fetch(`${API_BASE_URL}/patients/${patientId}/`);
      const patientData = await patientRes.json();
      setPatient(patientData);

      // Fetch admission if admissionId provided
      if (admissionId) {
        const admissionRes = await fetch(`${API_BASE_URL}/admissions/${admissionId}/`);
        const admissionData = await admissionRes.json();
        setAdmission(admissionData);
      }

      // Fetch doctor ID
      const doctorsRes = await fetch(`${API_BASE_URL}/doctors/`);
      const doctors = await doctorsRes.json();
      const myDoctor = Array.isArray(doctors)
        ? doctors.find((d) => d.user?.id === user.id)
        : null;
      if (myDoctor) {
        setDoctorId(myDoctor.id);
      }

      // Fetch medicines
      const medicinesRes = await fetch(`${API_BASE_URL}/medicines/?is_active=true`);
      const medicinesData = await medicinesRes.json();
      setMedicines(Array.isArray(medicinesData) ? medicinesData : []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const addMedicine = (medicine) => {
    if (selectedMedicines.find((m) => m.medicine_id === medicine.id)) {
      alert("Medicine already added");
      return;
    }

    setSelectedMedicines([
      ...selectedMedicines,
      {
        medicine_id: medicine.id,
        medicine_name: medicine.name,
        medicine_price: medicine.price_per_unit,
        quantity: 1,
        dosage_instructions: "1 tablet twice daily after meals",
        duration_days: 7,
      },
    ]);
  };

  const removeMedicine = (medicineId) => {
    setSelectedMedicines(
      selectedMedicines.filter((m) => m.medicine_id !== medicineId)
    );
  };

  const updateMedicine = (medicineId, field, value) => {
    setSelectedMedicines(
      selectedMedicines.map((m) =>
        m.medicine_id === medicineId ? { ...m, [field]: value } : m
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!doctorId) {
      alert("Doctor profile not found");
      return;
    }

    if (selectedMedicines.length === 0) {
      alert("Please add at least one medicine");
      return;
    }

    try {
      const payload = {
        patient_id: parseInt(patientId),
        doctor_id: doctorId,
        admission_id: admissionId ? parseInt(admissionId) : null,
        notes: notes,
        medicines: selectedMedicines.map((m) => ({
          medicine_id: m.medicine_id.toString(),
          quantity: m.quantity.toString(),
          dosage_instructions: m.dosage_instructions,
          duration_days: m.duration_days.toString(),
        })),
      };

      const response = await fetch(`${API_BASE_URL}/prescriptions/create/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        alert("Prescription created successfully!");
        navigate(-1);
      } else {
        alert(data.error || "Failed to create prescription");
      }
    } catch (error) {
      console.error("Error creating prescription:", error);
      alert("Failed to create prescription");
    }
  };

  const filteredMedicines = medicines.filter((medicine) => {
    const matchesSearch = medicine.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || medicine.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    ...new Set(medicines.map((m) => m.category)),
  ];

  const getTotalCost = () => {
    return selectedMedicines.reduce(
      (sum, m) => sum + m.medicine_price * m.quantity,
      0
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
            <h1 style={styles.title}>Create Prescription</h1>
            {patient && (
              <p style={styles.subtitle}>
                Patient: {patient.name} | Age: {patient.age} | Contact:{" "}
                {patient.contact}
              </p>
            )}
          </div>

          <div style={styles.container}>
            <div style={styles.leftPanel}>
              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Select Medicines</h2>

                <div style={styles.filters}>
                  <input
                    type="text"
                    placeholder="Search medicines..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={styles.searchInput}
                  />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    style={styles.filterSelect}
                  >
                    <option value="all">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.medicineGrid}>
                  {filteredMedicines.map((medicine) => (
                    <div key={medicine.id} style={styles.medicineCard}>
                      <div style={styles.medicineHeader}>
                        <div>
                          <div style={styles.medicineName}>{medicine.name}</div>
                          <div style={styles.medicineGeneric}>
                            {medicine.generic_name}
                          </div>
                        </div>
                        <div style={styles.medicineCategory}>
                          {medicine.category}
                        </div>
                      </div>
                      <div style={styles.medicineDetails}>
                        <div>{medicine.dosage_form} - {medicine.strength}</div>
                        <div style={styles.medicinePrice}>
                          ${parseFloat(medicine.price_per_unit).toFixed(2)}
                        </div>
                      </div>
                      <div style={styles.medicineStock}>
                        Stock: {medicine.stock_quantity}
                      </div>
                      <button
                        style={styles.addButton}
                        onClick={() => addMedicine(medicine)}
                      >
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={styles.rightPanel}>
              <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.section}>
                  <h2 style={styles.sectionTitle}>
                    Selected Medicines ({selectedMedicines.length})
                  </h2>

                  {selectedMedicines.length === 0 ? (
                    <div style={styles.emptyState}>
                      No medicines selected. Add medicines from the left panel.
                    </div>
                  ) : (
                    <div style={styles.selectedList}>
                      {selectedMedicines.map((med) => (
                        <div key={med.medicine_id} style={styles.selectedItem}>
                          <div style={styles.selectedHeader}>
                            <strong>{med.medicine_name}</strong>
                            <button
                              type="button"
                              onClick={() => removeMedicine(med.medicine_id)}
                              style={styles.removeButton}
                            >
                              ×
                            </button>
                          </div>

                          <div style={styles.inputGroup}>
                            <label style={styles.label}>Quantity:</label>
                            <input
                              type="number"
                              min="1"
                              value={med.quantity}
                              onChange={(e) =>
                                updateMedicine(
                                  med.medicine_id,
                                  "quantity",
                                  parseInt(e.target.value)
                                )
                              }
                              style={styles.input}
                            />
                          </div>

                          <div style={styles.inputGroup}>
                            <label style={styles.label}>Dosage Instructions:</label>
                            <textarea
                              value={med.dosage_instructions}
                              onChange={(e) =>
                                updateMedicine(
                                  med.medicine_id,
                                  "dosage_instructions",
                                  e.target.value
                                )
                              }
                              style={styles.textarea}
                              rows="2"
                            />
                          </div>

                          <div style={styles.inputGroup}>
                            <label style={styles.label}>Duration (days):</label>
                            <input
                              type="number"
                              min="1"
                              value={med.duration_days}
                              onChange={(e) =>
                                updateMedicine(
                                  med.medicine_id,
                                  "duration_days",
                                  parseInt(e.target.value)
                                )
                              }
                              style={styles.input}
                            />
                          </div>

                          <div style={styles.itemCost}>
                            Cost: ${(med.medicine_price * med.quantity).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Prescription Notes:</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      style={styles.textarea}
                      rows="3"
                      placeholder="Any special instructions or notes..."
                    />
                  </div>

                  <div style={styles.totalCost}>
                    Total Estimated Cost: ${getTotalCost().toFixed(2)}
                  </div>

                  <div style={styles.actions}>
                    <button
                      type="button"
                      onClick={() => navigate(-1)}
                      style={styles.cancelButton}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={styles.submitButton}
                      disabled={selectedMedicines.length === 0}
                    >
                      Create Prescription
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

const styles = {
  layout: { display: "flex", height: "calc(100vh - 70px)" },
  content: { flex: 1, overflowY: "auto", padding: "30px", backgroundColor: "#f9fafb" },
  header: { marginBottom: "30px" },
  title: { fontSize: "32px", fontWeight: "bold", color: "#111827", marginBottom: "8px" },
  subtitle: { fontSize: "16px", color: "#6b7280" },
  container: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },
  leftPanel: {},
  rightPanel: {},
  section: { backgroundColor: "#ffffff", padding: "24px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", marginBottom: "20px" },
  sectionTitle: { fontSize: "20px", fontWeight: "600", marginBottom: "16px", color: "#111827" },
  filters: { display: "flex", gap: "12px", marginBottom: "20px" },
  searchInput: { flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px" },
  filterSelect: { padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", minWidth: "150px" },
  medicineGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px", maxHeight: "600px", overflowY: "auto" },
  medicineCard: { padding: "16px", border: "1px solid #e5e7eb", borderRadius: "8px", cursor: "pointer", transition: "all 0.2s" },
  medicineHeader: { display: "flex", justifyContent: "space-between", marginBottom: "8px" },
  medicineName: { fontWeight: "600", fontSize: "14px", color: "#111827" },
  medicineGeneric: { fontSize: "12px", color: "#6b7280" },
  medicineCategory: { fontSize: "10px", backgroundColor: "#dbeafe", color: "#1e40af", padding: "2px 8px", borderRadius: "12px", fontWeight: "500" },
  medicineDetails: { fontSize: "12px", color: "#6b7280", marginBottom: "8px" },
  medicinePrice: { color: "#059669", fontWeight: "600", marginTop: "4px" },
  medicineStock: { fontSize: "11px", color: "#9ca3af", marginBottom: "8px" },
  addButton: { width: "100%", padding: "8px", backgroundColor: "#8b5cf6", color: "#ffffff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "500" },
  form: {},
  selectedList: { display: "flex", flexDirection: "column", gap: "16px", marginBottom: "20px", maxHeight: "400px", overflowY: "auto" },
  selectedItem: { padding: "16px", backgroundColor: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb" },
  selectedHeader: { display: "flex", justifyContent: "space-between", marginBottom: "12px" },
  removeButton: { backgroundColor: "#ef4444", color: "#ffffff", border: "none", borderRadius: "50%", width: "24px", height: "24px", cursor: "pointer", fontSize: "16px" },
  inputGroup: { marginBottom: "12px" },
  label: { display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" },
  input: { width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px" },
  textarea: { width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px", fontFamily: "inherit" },
  itemCost: { marginTop: "8px", textAlign: "right", fontWeight: "600", color: "#059669" },
  totalCost: { fontSize: "20px", fontWeight: "bold", textAlign: "right", padding: "16px", backgroundColor: "#f0fdf4", borderRadius: "8px", marginBottom: "20px", color: "#059669" },
  actions: { display: "flex", gap: "12px", justifyContent: "flex-end" },
  cancelButton: { padding: "12px 24px", backgroundColor: "#6b7280", color: "#ffffff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "16px", fontWeight: "500" },
  submitButton: { padding: "12px 24px", backgroundColor: "#8b5cf6", color: "#ffffff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "16px", fontWeight: "500" },
  emptyState: { textAlign: "center", padding: "40px", color: "#9ca3af", backgroundColor: "#f9fafb", borderRadius: "8px" },
  loading: { textAlign: "center", padding: "40px", fontSize: "18px", color: "#6b7280" },
};

export default CreatePrescription;
