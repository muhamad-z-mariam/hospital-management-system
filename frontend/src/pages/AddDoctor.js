import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { userAPI, doctorAPI } from "../api/api";

const AddDoctor = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    email: "",
    specialty: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Create both User and Doctor in one atomic transaction
      await doctorAPI.create({
        username: formData.username,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        specialty: formData.specialty,
      });

      alert("Doctor added successfully!");
      navigate("/doctors");
    } catch (err) {
      console.error("Error adding doctor:", err);

      // Display detailed error message
      if (err.username) {
        setError(`Username: ${Array.isArray(err.username) ? err.username[0] : err.username}`);
      } else if (err.email) {
        setError(`Email: ${Array.isArray(err.email) ? err.email[0] : err.email}`);
      } else if (err.error) {
        setError(err.error);
      } else if (typeof err === 'string') {
        setError(err);
      } else {
        setError("Failed to add doctor. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div style={styles.layout}>
        <Sidebar />
        <main style={styles.content}>
          <div style={styles.header}>
            <h1 style={styles.pageTitle}>Add New Doctor</h1>
            <button
              onClick={() => navigate("/doctors")}
              style={styles.backButton}
            >
              ← Back to Doctors
            </button>
          </div>

          <div style={styles.formContainer}>
            <form onSubmit={handleSubmit} style={styles.form}>
              {error && <div style={styles.error}>{error}</div>}

              <h3 style={styles.sectionTitle}>User Information</h3>

              <div style={styles.row}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Username *</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Password *</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    style={styles.input}
                    required
                  />
                </div>
              </div>

              <div style={styles.row}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>First Name *</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Last Name *</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    style={styles.input}
                    required
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>

              <h3 style={styles.sectionTitle}>Doctor Information</h3>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Specialty *</label>
                <input
                  type="text"
                  name="specialty"
                  value={formData.specialty}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="e.g., Cardiology, Neurology"
                  required
                />
              </div>

              <button
                type="submit"
                style={styles.submitButton}
                disabled={loading}
              >
                {loading ? "Adding Doctor..." : "Add Doctor"}
              </button>
            </form>
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
    maxWidth: "800px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  sectionTitle: {
    color: "#1e293b",
    fontSize: "1.25rem",
    marginTop: "1rem",
    marginBottom: "0.5rem",
    borderBottom: "2px solid #e2e8f0",
    paddingBottom: "0.5rem",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1.5rem",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  label: {
    color: "#334155",
    fontSize: "0.95rem",
    fontWeight: "500",
  },
  input: {
    padding: "0.75rem",
    border: "2px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "1rem",
  },
  submitButton: {
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    padding: "0.875rem",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "1rem",
  },
  error: {
    backgroundColor: "#fee2e2",
    color: "#dc2626",
    padding: "0.75rem",
    borderRadius: "6px",
  },
};

export default AddDoctor;
