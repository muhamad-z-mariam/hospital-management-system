import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const AddPayment = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [filteredAdmissions, setFilteredAdmissions] = useState([]);

  const [formData, setFormData] = useState({
    patient: "",
    admission: "",
    selectedProcedures: [],
    method: "Cash",
  });

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [calculation, setCalculation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPatients();
    fetchAdmissions();
    fetchProcedures();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/patients/");
      const data = await response.json();
      setPatients(data);
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  };

  const fetchAdmissions = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/admissions/");
      const data = await response.json();
      setAdmissions(data);
    } catch (error) {
      console.error("Error fetching admissions:", error);
    }
  };

  const fetchProcedures = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/procedures/");
      const data = await response.json();
      setProcedures(data);
    } catch (error) {
      console.error("Error fetching procedures:", error);
    }
  };

  const handlePatientChange = (e) => {
    const patientId = e.target.value;
    setFormData({ ...formData, patient: patientId, admission: "" });

    // Find patient
    const patient = patients.find((p) => p.id === parseInt(patientId));
    setSelectedPatient(patient);

    // Filter admissions
    const filtered = admissions.filter(
      (a) => a.patient === parseInt(patientId)
    );
    setFilteredAdmissions(filtered);

    // Reset calculation
    setCalculation(null);
  };

  const handleProcedureToggle = (procedureId) => {
    const current = formData.selectedProcedures;
    if (current.includes(procedureId)) {
      setFormData({
        ...formData,
        selectedProcedures: current.filter((id) => id !== procedureId),
      });
    } else {
      setFormData({
        ...formData,
        selectedProcedures: [...current, procedureId],
      });
    }
    setCalculation(null); // Reset calculation when procedures change
  };

  const handleCalculate = async () => {
    if (!formData.patient || !formData.admission) {
      alert("Please select patient and admission first");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/create-payment/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patient_id: formData.patient,
            admission_id: formData.admission,
            procedure_ids: formData.selectedProcedures,
            method: formData.method,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setCalculation(data.calculation);
        alert("Payment recorded successfully! See breakdown below.");
        // Optionally navigate after a delay
        setTimeout(() => navigate("/payments"), 2000);
      } else {
        setError(data.error || "Payment failed");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const getPatientStatusBadge = () => {
    if (!selectedPatient) return null;

    if (selectedPatient.handicapped) {
      return (
        <span style={styles.handicappedBadge}>
          🦽 Handicapped (Special Discount)
        </span>
      );
    } else if (selectedPatient.insurance_status) {
      return <span style={styles.insuranceBadge}>✅ Insured (20% Copay)</span>;
    } else {
      return <span style={styles.uninsuredBadge}>❌ Uninsured (70% Cost)</span>;
    }
  };

  return (
    <>
      <Navbar />
      <div style={styles.layout}>
        <Sidebar />
        <main style={styles.content}>
          <div style={styles.header}>
            <h1 style={styles.pageTitle}>Record New Payment</h1>
            <button
              onClick={() => navigate("/payments")}
              style={styles.backButton}
            >
              ← Back to Payments
            </button>
          </div>

          <div style={styles.formContainer}>
            {error && <div style={styles.error}>{error}</div>}

            {/* Patient Selection */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Patient *</label>
              <select
                value={formData.patient}
                onChange={handlePatientChange}
                style={styles.input}
                required
              >
                <option value="">-- Select Patient --</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name} (Contact: {patient.contact})
                  </option>
                ))}
              </select>
              {selectedPatient && (
                <div style={styles.patientInfo}>{getPatientStatusBadge()}</div>
              )}
            </div>

            {/* Admission Selection */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Admission *</label>
              <select
                value={formData.admission}
                onChange={(e) =>
                  setFormData({ ...formData, admission: e.target.value })
                }
                style={styles.input}
                required
                disabled={!formData.patient}
              >
                <option value="">-- Select Admission --</option>
                {filteredAdmissions.map((admission) => (
                  <option key={admission.id} value={admission.id}>
                    Admission #{admission.id} - {admission.status} (
                    {new Date(admission.admission_date).toLocaleDateString()})
                  </option>
                ))}
              </select>
              {!formData.patient && (
                <small style={styles.hint}>Please select a patient first</small>
              )}
            </div>

            {/* Procedures Selection */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Select Procedures</label>
              <div style={styles.proceduresGrid}>
                {procedures.map((proc) => (
                  <div
                    key={proc.id}
                    onClick={() => handleProcedureToggle(proc.id)}
                    style={{
                      ...styles.procedureCard,
                      ...(formData.selectedProcedures.includes(proc.id)
                        ? styles.procedureCardSelected
                        : {}),
                    }}
                  >
                    <div style={styles.procedureCheck}>
                      {formData.selectedProcedures.includes(proc.id)
                        ? "✅"
                        : "⬜"}
                    </div>
                    <div style={styles.procedureInfo}>
                      <strong>{proc.name}</strong>
                      <div style={styles.procedureCost}>
                        ${parseFloat(proc.cost).toLocaleString()}
                      </div>
                      <small style={styles.procedureType}>
                        {proc.procedure_type === "surgical"
                          ? "🔪 Surgery"
                          : "💊 Treatment"}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Payment Method *</label>
              <select
                value={formData.method}
                onChange={(e) =>
                  setFormData({ ...formData, method: e.target.value })
                }
                style={styles.input}
                required
              >
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Insurance">Insurance</option>
              </select>
            </div>

            {/* Calculate Button */}
            <button
              onClick={handleCalculate}
              style={styles.calculateButton}
              disabled={loading || !formData.patient || !formData.admission}
            >
              {loading ? "Processing..." : "💰 Calculate & Record Payment"}
            </button>

            {/* Payment Breakdown */}
            {calculation && (
              <div style={styles.breakdown}>
                <h3 style={styles.breakdownTitle}>💵 Payment Breakdown</h3>
                <div style={styles.breakdownItem}>
                  <span>Procedures Cost:</span>
                  <span>
                    ${parseFloat(calculation.procedure_cost).toFixed(2)}
                  </span>
                </div>
                <div style={styles.breakdownItem}>
                  <span>
                    Daily Care ({calculation.length_of_stay} days × $30):
                  </span>
                  <span>
                    ${parseFloat(calculation.daily_care_cost).toFixed(2)}
                  </span>
                </div>
                <div style={styles.breakdownItem}>
                  <span>
                    <strong>Subtotal:</strong>
                  </span>
                  <span>
                    <strong>
                      $
                      {parseFloat(calculation.total_before_discount).toFixed(2)}
                    </strong>
                  </span>
                </div>
                <div style={styles.breakdownItem}>
                  <span>Discount ({calculation.discount_percent}%):</span>
                  <span style={{ color: "#059669" }}>
                    -$
                    {(
                      parseFloat(calculation.total_before_discount) -
                      parseFloat(calculation.final_amount)
                    ).toFixed(2)}
                  </span>
                </div>
                <div
                  style={{ ...styles.breakdownItem, ...styles.breakdownTotal }}
                >
                  <span>
                    <strong>FINAL AMOUNT:</strong>
                  </span>
                  <span>
                    <strong>
                      ${parseFloat(calculation.final_amount).toFixed(2)}
                    </strong>
                  </span>
                </div>
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
  pageTitle: {
    fontSize: "2rem",
    color: "#1e293b",
    margin: 0,
  },
  backButton: {
    backgroundColor: "#64748b",
    color: "white",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.95rem",
  },
  formContainer: {
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    maxWidth: "1000px",
  },
  inputGroup: {
    marginBottom: "1.5rem",
  },
  label: {
    display: "block",
    color: "#334155",
    fontSize: "0.95rem",
    fontWeight: "500",
    marginBottom: "0.5rem",
  },
  input: {
    width: "100%",
    padding: "0.75rem",
    border: "2px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "1rem",
  },
  hint: {
    color: "#64748b",
    fontSize: "0.85rem",
    fontStyle: "italic",
    display: "block",
    marginTop: "0.25rem",
  },
  patientInfo: {
    marginTop: "0.75rem",
  },
  insuranceBadge: {
    backgroundColor: "#dcfce7",
    color: "#166534",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    fontSize: "0.9rem",
    fontWeight: "600",
    display: "inline-block",
  },
  uninsuredBadge: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    fontSize: "0.9rem",
    fontWeight: "600",
    display: "inline-block",
  },
  handicappedBadge: {
    backgroundColor: "#dbeafe",
    color: "#1e40af",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    fontSize: "0.9rem",
    fontWeight: "600",
    display: "inline-block",
  },
  proceduresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "1rem",
    marginTop: "0.5rem",
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
  procedureCardSelected: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  procedureCheck: {
    fontSize: "1.5rem",
  },
  procedureInfo: {
    flex: 1,
  },
  procedureCost: {
    color: "#059669",
    fontWeight: "600",
    fontSize: "1.1rem",
    margin: "0.25rem 0",
  },
  procedureType: {
    color: "#64748b",
    fontSize: "0.85rem",
  },
  calculateButton: {
    width: "100%",
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    padding: "1rem",
    borderRadius: "8px",
    fontSize: "1.1rem",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "1rem",
  },
  breakdown: {
    marginTop: "2rem",
    padding: "1.5rem",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    border: "2px solid #e2e8f0",
  },
  breakdownTitle: {
    color: "#1e293b",
    marginTop: 0,
    marginBottom: "1rem",
  },
  breakdownItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "0.75rem 0",
    borderBottom: "1px solid #e2e8f0",
  },
  breakdownTotal: {
    fontSize: "1.25rem",
    color: "#2563eb",
    borderBottom: "none",
    marginTop: "0.5rem",
  },
  error: {
    backgroundColor: "#fee2e2",
    color: "#dc2626",
    padding: "0.75rem",
    borderRadius: "6px",
    marginBottom: "1rem",
  },
};

export default AddPayment;
