import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { admissionAPI, appointmentAPI, patientAPI, procedureAPI, paymentAPI, medicineAPI, prescriptionAPI, doctorAPI } from "../api/api";

const ExaminePatient = () => {
  const { id } = useParams(); // Can be admission ID or appointment ID
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isFromAppointment = location.pathname.includes('/examine-appointment/');

  const [admission, setAdmission] = useState(null);
  const [appointment, setAppointment] = useState(null);
  const [patient, setPatient] = useState(null);
  const [procedures, setProcedures] = useState([]);
  const [selectedProcedures, setSelectedProcedures] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [doctorId, setDoctorId] = useState(null);
  const [formData, setFormData] = useState({
    requires_inpatient: false,
    doctor_notes: "",
    status: "pending",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      let patientId;

      if (isFromAppointment) {
        // Fetch appointment data
        const appointmentData = await appointmentAPI.getById(id);
        setAppointment(appointmentData);
        patientId = appointmentData.patient;

        // Check if there's an existing admission for this patient
        const admissions = await admissionAPI.getAll();
        const existingAdmission = admissions.find(
          adm => adm.patient === patientId && (adm.status === 'pending' || adm.status === 'admitted')
        );
        if (existingAdmission) {
          setAdmission(existingAdmission);
          setFormData({
            requires_inpatient: existingAdmission.requires_inpatient || false,
            doctor_notes: existingAdmission.doctor_notes || "",
            status: existingAdmission.status || "pending",
          });
        } else {
          // No existing admission - this is a new outpatient appointment
          setFormData({
            requires_inpatient: false,
            doctor_notes: appointmentData.reason || "",
            status: "pending",
          });
        }
      } else {
        // Fetch admission data (existing flow)
        const admissionData = await admissionAPI.getById(id);
        setAdmission(admissionData);
        patientId = admissionData.patient;

        setFormData({
          requires_inpatient: admissionData.requires_inpatient || false,
          doctor_notes: admissionData.doctor_notes || "",
          status: admissionData.status || "pending",
        });
      }

      // Fetch patient
      const patientData = await patientAPI.getById(patientId);
      setPatient(patientData);

      // Fetch procedures
      const proceduresData = await procedureAPI.getAll();
      setProcedures(Array.isArray(proceduresData) ? proceduresData : []);

      // Fetch medicines
      const medicinesData = await medicineAPI.getActive();
      setMedicines(Array.isArray(medicinesData) ? medicinesData : []);

      // Fetch doctor ID
      const doctors = await doctorAPI.getAll();
      const myDoctor = Array.isArray(doctors)
        ? doctors.find((d) => d.user?.id === user.id)
        : null;
      if (myDoctor) {
        setDoctorId(myDoctor.id);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load patient data");
      setProcedures([]);
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProcedureToggle = (procedureId) => {
    if (selectedProcedures.includes(procedureId)) {
      setSelectedProcedures(
        selectedProcedures.filter((id) => id !== procedureId)
      );
    } else {
      setSelectedProcedures([...selectedProcedures, procedureId]);
    }
  };

  const handleMedicineToggle = (medicine) => {
    const isSelected = selectedMedicines.find((m) => m.medicine_id === medicine.id);
    if (isSelected) {
      setSelectedMedicines(
        selectedMedicines.filter((m) => m.medicine_id !== medicine.id)
      );
    } else {
      setSelectedMedicines([
        ...selectedMedicines,
        {
          medicine_id: medicine.id,
          medicine_name: medicine.name,
          quantity: 1,
          dosage_instructions: "1 tablet twice daily after meals",
          duration_days: 7,
        },
      ]);
    }
  };

  const updateMedicineDetails = (medicineId, field, value) => {
    setSelectedMedicines(
      selectedMedicines.map((m) =>
        m.medicine_id === medicineId ? { ...m, [field]: value } : m
      )
    );
  };

  const handleSaveExamination = async () => {
    setSaving(true);
    setError("");

    try {
      let admissionId;
      let patientId = patient.id;

      // Step 1: Create or update admission (ALWAYS create for tracking)
      if (isFromAppointment) {
        if (admission) {
          // Update existing admission
          const existingProcedures = admission.procedures || [];
          const allProcedures = [...new Set([...existingProcedures, ...selectedProcedures])];

          const updateData = {
            ...admission,
            requires_inpatient: formData.requires_inpatient,
            doctor_notes: formData.doctor_notes,
            status: formData.requires_inpatient ? "admitted" : "pending_discharge",
            procedures: allProcedures,
            doctor: doctorId,
          };

          await admissionAPI.update(admission.id, updateData);
          admissionId = admission.id;
        } else {
          // ALWAYS create admission record to track encounter (outpatient or inpatient)
          const newAdmissionData = {
            patient: patientId,
            doctor: doctorId,
            requires_inpatient: formData.requires_inpatient,
            doctor_notes: formData.doctor_notes,
            // Outpatient: status = "pending_discharge" (awaiting payment at counter)
            // Inpatient: status = "admitted" (needs room, multi-day stay)
            status: formData.requires_inpatient ? "admitted" : "pending_discharge",
            procedures: selectedProcedures,
            // No room for outpatients (room assigned later for inpatients)
          };

          const createdAdmission = await admissionAPI.create(newAdmissionData);
          admissionId = createdAdmission.id;
        }
      } else {
        // Update existing admission (from admission flow)
        const existingProcedures = admission.procedures || [];
        const allProcedures = [...new Set([...existingProcedures, ...selectedProcedures])];

        const updateData = {
          ...admission,
          requires_inpatient: formData.requires_inpatient,
          doctor_notes: formData.doctor_notes,
          status: formData.requires_inpatient ? "admitted" : "pending_discharge",
          procedures: allProcedures,
        };

        await admissionAPI.update(id, updateData);
        admissionId = id;
      }

      // Step 2: Create prescription if medicines are selected
      if (selectedMedicines.length > 0 && doctorId) {
        try {
          const prescriptionPayload = {
            patient_id: parseInt(patientId),
            doctor_id: doctorId,
            admission_id: parseInt(admissionId),
            notes: formData.doctor_notes,
            medicines: selectedMedicines.map((m) => ({
              medicine_id: m.medicine_id.toString(),
              quantity: m.quantity.toString(),
              dosage_instructions: m.dosage_instructions,
              duration_days: m.duration_days.toString(),
            })),
          };

          const presData = await prescriptionAPI.create(prescriptionPayload);
          if (!presData.success) {
            console.error("Error creating prescription:", presData.error);
            alert("Warning: Prescription could not be created. " + (presData.error || ""));
          }
        } catch (presErr) {
          console.error("Error creating prescription:", presErr);
          alert("Warning: Prescription could not be created.");
        }
      }

      // Step 3: Create payment for outpatients (inpatients pay at discharge)
      if (!formData.requires_inpatient && admissionId) {
        try {
          // Determine payment method based on patient status
          let paymentMethod = "Cash"; // Default
          if (patient.handicapped) {
            paymentMethod = "Government Assistance";
          } else if (patient.insurance_status) {
            paymentMethod = "Insurance";
          }

          const paymentData = {
            patient_id: patientId,
            admission_id: parseInt(admissionId),
            // Backend will fetch procedures from admission
            method: paymentMethod,
          };
          await paymentAPI.createWithCalculation(paymentData);
          console.log("Payment created successfully with method:", paymentMethod);
        } catch (paymentErr) {
          console.error("Error creating payment:", paymentErr);
          alert("Warning: Payment could not be created. Please create it manually from Payments page.");
        }
      }

      const message = isFromAppointment
        ? formData.requires_inpatient
          ? "Examination complete! Patient admitted as inpatient. Admin will assign room."
          : "Examination complete! Outpatient payment created. Patient goes to payment counter (Payments page)."
        : formData.requires_inpatient
        ? "Patient admitted as inpatient! Admin will assign room."
        : "Patient ready for discharge. Payment created. Send to payment counter.";

      alert(message);

      // Ask if doctor wants to schedule a follow-up appointment
      const scheduleAppointment = window.confirm(
        "Would you like to schedule a follow-up appointment for this patient?"
      );

      if (scheduleAppointment) {
        // Navigate to appointment scheduling with patient and doctor pre-filled
        navigate(`/schedule-appointment?patientId=${patientId}&doctorId=${doctorId}&from=examination`);
      } else {
        navigate(isFromAppointment ? "/my-appointments" : "/my-patients");
      }
    } catch (err) {
      console.error("Error saving examination:", err);
      setError("Failed to save examination: " + (err.message || err.error || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={styles.layout}>
          <Sidebar />
          <main style={styles.content}>
            <div style={styles.loading}>Loading patient data...</div>
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
            <h1 style={styles.pageTitle}>
              {isFromAppointment ? "Appointment Examination" : "Patient Examination"}
            </h1>
            <button
              onClick={() => navigate(isFromAppointment ? "/my-appointments" : "/my-patients")}
              style={styles.backButton}
            >
              ← Back
            </button>
          </div>

          {isFromAppointment && !admission && (
            <div style={styles.infoBox}>
              ℹ️ This is an appointment examination. An admission record will be created to track this encounter.
            </div>
          )}

          {error && <div style={styles.error}>{error}</div>}

          {/* Patient Info Card */}
          <div style={styles.patientCard}>
            <h2 style={styles.cardTitle}>👤 Patient Information</h2>
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <strong>Name:</strong> {patient?.name}
              </div>
              <div style={styles.infoItem}>
                <strong>Age:</strong> {patient?.age}
              </div>
              <div style={styles.infoItem}>
                <strong>Gender:</strong> {patient?.gender}
              </div>
              <div style={styles.infoItem}>
                <strong>Contact:</strong> {patient?.contact}
              </div>
              <div style={styles.infoItem}>
                <strong>Insurance:</strong>{" "}
                {patient?.insurance_status ? "✅ Insured" : "❌ No Insurance"}
              </div>
              <div style={styles.infoItem}>
                <strong>Handicapped:</strong>{" "}
                {patient?.handicapped ? "✅ Yes" : "❌ No"}
              </div>
            </div>
          </div>

          {/* Medical Parameters Summary */}
          <div style={styles.medicalCard}>
            <h2 style={styles.cardTitle}>🩺 Medical Parameters</h2>
            <div style={styles.parametersGrid}>
              {patient?.cholesterol && (
                <div style={styles.paramItem}>
                  <strong>Cholesterol:</strong> {patient.cholesterol}
                </div>
              )}
              {patient?.platelet && (
                <div style={styles.paramItem}>
                  <strong>Platelet:</strong> {patient.platelet}
                </div>
              )}
              {patient?.red_blood_cell && (
                <div style={styles.paramItem}>
                  <strong>RBC:</strong> {patient.red_blood_cell}
                </div>
              )}
              {patient?.brain_natriuretic_peptide && (
                <div style={styles.paramItem}>
                  <strong>BNP:</strong> {patient.brain_natriuretic_peptide}
                </div>
              )}
              {patient?.high_sensitivity_troponin && (
                <div style={styles.paramItem}>
                  <strong>Troponin:</strong> {patient.high_sensitivity_troponin}
                </div>
              )}
              {!patient?.cholesterol &&
                !patient?.platelet &&
                !patient?.red_blood_cell && (
                  <p style={styles.noData}>
                    No medical parameters recorded yet. Ask nurse to fill them.
                  </p>
                )}
            </div>
            <button
              onClick={() => navigate(`/edit-patient-medical/${patient.id}`)}
              style={styles.editMedicalBtn}
            >
              📝 View/Edit All Medical Data
            </button>
          </div>

          {/* Procedures Selection */}
          <div style={styles.proceduresCard}>
            <h2 style={styles.cardTitle}>
              💊 Select Required Procedures/Operations
            </h2>

            {/* Surgical Procedures */}
            <div style={styles.categorySection}>
              <h3 style={styles.categoryTitle}>🔪 Surgical Operations</h3>
              <div style={styles.proceduresGrid}>
                {procedures
                  .filter((proc) => proc.procedure_type === "surgical")
                  .map((proc) => (
                    <div
                      key={proc.id}
                      onClick={() => handleProcedureToggle(proc.id)}
                      style={{
                        ...styles.procedureCard,
                        ...(selectedProcedures.includes(proc.id)
                          ? styles.procedureCardSelected
                          : {}),
                      }}
                    >
                      <div style={styles.procedureCheck}>
                        {selectedProcedures.includes(proc.id) ? "✅" : "⬜"}
                      </div>
                      <div style={styles.procedureInfo}>
                        <strong>{proc.name}</strong>
                        <div style={styles.procedureCost}>
                          ${parseFloat(proc.cost).toLocaleString()}
                        </div>
                        <small style={styles.procedureType}>🔪 Surgery</small>
                      </div>
                    </div>
                  ))}
              </div>
              {procedures.filter((proc) => proc.procedure_type === "surgical")
                .length === 0 && (
                <p style={styles.noProcedures}>No surgical procedures available</p>
              )}
            </div>

            {/* Non-Surgical Procedures */}
            <div style={styles.categorySection}>
              <h3 style={styles.categoryTitle}>💊 Non-Surgical Treatments</h3>
              <div style={styles.proceduresGrid}>
                {procedures
                  .filter((proc) => proc.procedure_type === "non_surgical")
                  .map((proc) => (
                    <div
                      key={proc.id}
                      onClick={() => handleProcedureToggle(proc.id)}
                      style={{
                        ...styles.procedureCard,
                        ...(selectedProcedures.includes(proc.id)
                          ? styles.procedureCardSelected
                          : {}),
                      }}
                    >
                      <div style={styles.procedureCheck}>
                        {selectedProcedures.includes(proc.id) ? "✅" : "⬜"}
                      </div>
                      <div style={styles.procedureInfo}>
                        <strong>{proc.name}</strong>
                        <div style={styles.procedureCost}>
                          ${parseFloat(proc.cost).toLocaleString()}
                        </div>
                        <small style={styles.procedureType}>💊 Treatment</small>
                      </div>
                    </div>
                  ))}
              </div>
              {procedures.filter((proc) => proc.procedure_type === "non_surgical")
                .length === 0 && (
                <p style={styles.noProcedures}>No non-surgical treatments available</p>
              )}
            </div>

            <p style={styles.selectedCount}>
              Selected: {selectedProcedures.length} procedure(s)
            </p>
          </div>

          {/* Medicines Selection */}
          <div style={styles.proceduresCard}>
            <h2 style={styles.cardTitle}>💊 Prescribe Medicines</h2>

            <div style={styles.medicinesGrid}>
              {medicines.map((medicine) => {
                const isSelected = selectedMedicines.find(
                  (m) => m.medicine_id === medicine.id
                );
                return (
                  <div
                    key={medicine.id}
                    style={{
                      ...styles.medicineCard,
                      ...(isSelected ? styles.medicineCardSelected : {}),
                    }}
                  >
                    <div
                      onClick={() => handleMedicineToggle(medicine)}
                      style={styles.medicineClickable}
                    >
                      <div style={styles.procedureCheck}>
                        {isSelected ? "✅" : "⬜"}
                      </div>
                      <div style={styles.medicineInfo}>
                        <strong>{medicine.name}</strong>
                        <div style={styles.medicineGeneric}>
                          {medicine.generic_name}
                        </div>
                        <div style={styles.medicineDetails}>
                          {medicine.dosage_form} - {medicine.strength}
                        </div>
                        <div style={styles.medicineCategory}>
                          {medicine.category}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <div style={styles.medicineDosageForm}>
                        <div style={styles.dosageInputGroup}>
                          <label style={styles.dosageLabel}>Quantity:</label>
                          <input
                            type="number"
                            min="1"
                            value={isSelected.quantity}
                            onChange={(e) =>
                              updateMedicineDetails(
                                medicine.id,
                                "quantity",
                                parseInt(e.target.value)
                              )
                            }
                            style={styles.dosageInput}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div style={styles.dosageInputGroup}>
                          <label style={styles.dosageLabel}>Instructions:</label>
                          <input
                            type="text"
                            value={isSelected.dosage_instructions}
                            onChange={(e) =>
                              updateMedicineDetails(
                                medicine.id,
                                "dosage_instructions",
                                e.target.value
                              )
                            }
                            style={styles.dosageInput}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="e.g., 1 tablet twice daily"
                          />
                        </div>
                        <div style={styles.dosageInputGroup}>
                          <label style={styles.dosageLabel}>Duration (days):</label>
                          <input
                            type="number"
                            min="1"
                            value={isSelected.duration_days}
                            onChange={(e) =>
                              updateMedicineDetails(
                                medicine.id,
                                "duration_days",
                                parseInt(e.target.value)
                              )
                            }
                            style={styles.dosageInput}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <p style={styles.selectedCount}>
              Selected: {selectedMedicines.length} medicine(s)
            </p>
          </div>

          {/* Doctor's Decision */}
          <div style={styles.decisionCard}>
            <h2 style={styles.cardTitle}>⚕️ Doctor's Decision</h2>

            <div style={styles.radioGroup}>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="patientType"
                  checked={!formData.requires_inpatient}
                  onChange={() =>
                    setFormData({ ...formData, requires_inpatient: false })
                  }
                  style={styles.radio}
                />
                <div>
                  <strong>🚶 Outpatient (Same-Day Discharge)</strong>
                  <p style={styles.radioDescription}>
                    Patient goes home today. Payment created immediately with status "Pending Discharge".
                    Patient pays at counter, admin approves in Payments page (✅ button).
                  </p>
                </div>
              </label>

              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="patientType"
                  checked={formData.requires_inpatient}
                  onChange={() =>
                    setFormData({ ...formData, requires_inpatient: true })
                  }
                  style={styles.radio}
                />
                <div>
                  <strong>🏥 Inpatient (Hospital Stay Required)</strong>
                  <p style={styles.radioDescription}>
                    Patient needs multi-day hospital care. Admission record created with status "admitted".
                    Admin will assign room. Payment created after discharge.
                  </p>
                </div>
              </label>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Doctor's Notes</label>
              <textarea
                value={formData.doctor_notes}
                onChange={(e) =>
                  setFormData({ ...formData, doctor_notes: e.target.value })
                }
                style={styles.textarea}
                rows="4"
                placeholder="Enter examination findings, diagnosis, treatment plan..."
              />
            </div>

            <button
              onClick={handleSaveExamination}
              style={styles.saveButton}
              disabled={saving}
            >
              {saving
                ? "Saving Examination..."
                : formData.requires_inpatient
                ? "✅ Save & Admit as Inpatient"
                : "✅ Save & Discharge (Outpatient)"}
            </button>
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
  error: {
    backgroundColor: "#fee2e2",
    color: "#dc2626",
    padding: "0.75rem",
    borderRadius: "6px",
    marginBottom: "1rem",
  },
  infoBox: {
    backgroundColor: "#dbeafe",
    color: "#1e40af",
    padding: "1rem",
    borderRadius: "8px",
    marginBottom: "1rem",
    fontSize: "0.95rem",
    fontWeight: "500",
    border: "1px solid #93c5fd",
  },

  patientCard: {
    backgroundColor: "white",
    padding: "1.5rem",
    borderRadius: "12px",
    marginBottom: "1.5rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  medicalCard: {
    backgroundColor: "white",
    padding: "1.5rem",
    borderRadius: "12px",
    marginBottom: "1.5rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  proceduresCard: {
    backgroundColor: "white",
    padding: "1.5rem",
    borderRadius: "12px",
    marginBottom: "1.5rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  decisionCard: {
    backgroundColor: "white",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },

  cardTitle: { color: "#1e293b", margin: "0 0 1rem 0", fontSize: "1.25rem" },
  categorySection: {
    marginBottom: "2rem",
    paddingBottom: "1.5rem",
    borderBottom: "2px solid #e2e8f0",
  },
  categoryTitle: {
    color: "#475569",
    fontSize: "1.1rem",
    fontWeight: "600",
    margin: "0 0 1rem 0",
    paddingLeft: "0.5rem",
    borderLeft: "4px solid #2563eb",
  },
  noProcedures: {
    color: "#94a3b8",
    fontStyle: "italic",
    textAlign: "center",
    padding: "2rem",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1rem",
  },
  infoItem: { color: "#334155", fontSize: "0.95rem" },

  parametersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1rem",
    marginBottom: "1rem",
  },
  paramItem: {
    color: "#334155",
    fontSize: "0.95rem",
    padding: "0.5rem",
    backgroundColor: "#f8fafc",
    borderRadius: "6px",
  },
  noData: { color: "#64748b", fontStyle: "italic" },
  editMedicalBtn: {
    backgroundColor: "#059669",
    color: "white",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.95rem",
  },

  proceduresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "1rem",
    marginBottom: "1rem",
  },
  procedureCard: {
    border: "2px solid #e2e8f0",
    borderRadius: "8px",
    padding: "1rem",
    cursor: "pointer",
    transition: "all 0.2s",
    display: "flex",
    gap: "0.75rem",
  },
  procedureCardSelected: { borderColor: "#2563eb", backgroundColor: "#eff6ff" },
  procedureCheck: { fontSize: "1.5rem" },
  procedureInfo: { flex: 1 },
  procedureCost: {
    color: "#059669",
    fontWeight: "600",
    fontSize: "1.1rem",
    margin: "0.25rem 0",
  },
  procedureType: { color: "#64748b", fontSize: "0.85rem" },
  selectedCount: {
    color: "#2563eb",
    fontWeight: "600",
    margin: "0.5rem 0 0 0",
  },

  radioGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    marginBottom: "1.5rem",
  },
  radioLabel: {
    display: "flex",
    alignItems: "flex-start",
    gap: "1rem",
    padding: "1rem",
    border: "2px solid #e2e8f0",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  radio: {
    marginTop: "0.25rem",
    width: "20px",
    height: "20px",
    cursor: "pointer",
  },
  radioDescription: {
    color: "#64748b",
    fontSize: "0.9rem",
    margin: "0.25rem 0 0 0",
  },

  inputGroup: { marginBottom: "1.5rem" },
  label: {
    display: "block",
    color: "#334155",
    fontSize: "0.95rem",
    fontWeight: "500",
    marginBottom: "0.5rem",
  },
  textarea: {
    width: "100%",
    padding: "0.75rem",
    border: "2px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "1rem",
    fontFamily: "inherit",
    resize: "vertical",
  },

  saveButton: {
    width: "100%",
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    padding: "1rem",
    borderRadius: "8px",
    fontSize: "1.1rem",
    fontWeight: "600",
    cursor: "pointer",
  },
  warning: {
    color: "#dc2626",
    fontSize: "0.9rem",
    margin: "1rem 0 0 0",
    textAlign: "center",
  },

  // Medicine styles
  medicinesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "1rem",
    marginBottom: "1rem",
  },
  medicineCard: {
    border: "2px solid #e2e8f0",
    borderRadius: "8px",
    padding: "1rem",
    transition: "all 0.2s",
  },
  medicineCardSelected: {
    borderColor: "#8b5cf6",
    backgroundColor: "#f5f3ff",
  },
  medicineClickable: {
    cursor: "pointer",
    display: "flex",
    gap: "0.75rem",
  },
  medicineInfo: {
    flex: 1,
  },
  medicineGeneric: {
    color: "#64748b",
    fontSize: "0.85rem",
    marginTop: "0.25rem",
  },
  medicineDetails: {
    color: "#64748b",
    fontSize: "0.85rem",
    marginTop: "0.25rem",
  },
  medicineCategory: {
    display: "inline-block",
    backgroundColor: "#dbeafe",
    color: "#1e40af",
    padding: "0.25rem 0.5rem",
    borderRadius: "4px",
    fontSize: "0.75rem",
    marginTop: "0.5rem",
  },
  medicineDosageForm: {
    marginTop: "1rem",
    paddingTop: "1rem",
    borderTop: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  dosageInputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  dosageLabel: {
    fontSize: "0.85rem",
    color: "#64748b",
    fontWeight: "500",
  },
  dosageInput: {
    padding: "0.5rem",
    border: "1px solid #cbd5e1",
    borderRadius: "4px",
    fontSize: "0.9rem",
  },
};

export default ExaminePatient;
