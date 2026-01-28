import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../api/api";

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    old_password: "",
    new_password: "",
    new_password_confirm: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate passwords match
    if (formData.new_password !== formData.new_password_confirm) {
      setError("New passwords don't match");
      return;
    }

    setLoading(true);

    try {
      await authAPI.changePassword(formData);
      setSuccess("Password changed successfully!");
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (err) {
      if (typeof err === "object" && err.old_password) {
        setError(err.old_password[0]);
      } else if (typeof err === "object" && err.new_password) {
        setError(err.new_password.join(", "));
      } else {
        setError("Failed to change password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <div style={styles.header}>
          <h1 style={styles.title}>Change Password</h1>
          <p style={styles.subtitle}>Update your account password</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div style={styles.error}>{error}</div>}
          {success && <div style={styles.success}>{success}</div>}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Current Password *</label>
            <input
              type="password"
              name="old_password"
              value={formData.old_password}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>New Password *</label>
            <input
              type="password"
              name="new_password"
              value={formData.new_password}
              onChange={handleChange}
              style={styles.input}
              required
            />
            <small style={styles.hint}>
              Must be at least 8 characters and not entirely numeric
            </small>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Confirm New Password *</label>
            <input
              type="password"
              name="new_password_confirm"
              value={formData.new_password_confirm}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Changing Password..." : "Change Password"}
          </button>

          <button
            type="button"
            onClick={() => navigate(-1)}
            style={styles.cancelButton}
          >
            Cancel
          </button>
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
  box: {
    backgroundColor: "white",
    padding: "3rem",
    borderRadius: "12px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    width: "100%",
    maxWidth: "500px",
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
  cancelButton: {
    backgroundColor: "#e2e8f0",
    color: "#334155",
    padding: "0.875rem",
    border: "none",
    borderRadius: "6px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
  },
  error: {
    backgroundColor: "#fee2e2",
    color: "#dc2626",
    padding: "0.75rem",
    borderRadius: "6px",
    fontSize: "0.9rem",
  },
  success: {
    backgroundColor: "#d1fae5",
    color: "#065f46",
    padding: "0.75rem",
    borderRadius: "6px",
    fontSize: "0.9rem",
  },
};

export default ChangePassword;
