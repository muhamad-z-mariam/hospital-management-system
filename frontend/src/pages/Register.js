import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    password_confirm: "",
    first_name: "",
    last_name: "",
    role: "staff",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (formData.password !== formData.password_confirm) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);

    try {
      const result = await register(formData);

      if (result.success) {
        navigate("/dashboard");
      } else {
        // Format error messages from backend
        if (typeof result.error === "object") {
          const errorMessages = Object.entries(result.error)
            .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
            .join("\n");
          setError(errorMessages);
        } else {
          setError(result.error || "Registration failed");
        }
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.registerBox}>
        <div style={styles.header}>
          <h1 style={styles.title}>Create Account</h1>
          <p style={styles.subtitle}>Register to access the HMS</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && (
            <div style={styles.error}>
              {error.split("\n").map((msg, idx) => (
                <div key={idx}>{msg}</div>
              ))}
            </div>
          )}

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
            <label style={styles.label}>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Role *</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              style={styles.input}
              required
            >
              <option value="staff">Staff</option>
              <option value="nurse">Nurse</option>
              <option value="doctor">Doctor</option>
              <option value="admin">Admin</option>
            </select>
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
            <small style={styles.hint}>
              Must be at least 8 characters and not entirely numeric
            </small>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Confirm Password *</label>
            <input
              type="password"
              name="password_confirm"
              value={formData.password_confirm}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Creating Account..." : "Register"}
          </button>

          <div style={styles.links}>
            <Link to="/login" style={styles.link}>
              Already have an account? Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f5f9",
    padding: "2rem",
  },
  registerBox: {
    backgroundColor: "white",
    padding: "3rem",
    borderRadius: "12px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    width: "100%",
    maxWidth: "600px",
  },
  header: {
    textAlign: "center",
    marginBottom: "2rem",
  },
  title: {
    color: "#2563eb",
    margin: "0 0 0.5rem 0",
    fontSize: "1.75rem",
  },
  subtitle: {
    color: "#64748b",
    margin: 0,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem",
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
    transition: "border-color 0.2s",
  },
  hint: {
    color: "#64748b",
    fontSize: "0.8rem",
  },
  button: {
    backgroundColor: "#2563eb",
    color: "white",
    padding: "0.875rem",
    border: "none",
    borderRadius: "6px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "0.5rem",
  },
  error: {
    backgroundColor: "#fee2e2",
    color: "#dc2626",
    padding: "0.75rem",
    borderRadius: "6px",
    fontSize: "0.9rem",
  },
  links: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    textAlign: "center",
  },
  link: {
    color: "#2563eb",
    textDecoration: "none",
    fontSize: "0.9rem",
  },
};

export default Register;
