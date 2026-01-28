import React, { useState } from "react";
import { Link } from "react-router-dom";
import { authAPI } from "../api/api";

const PasswordReset = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetData, setResetData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const data = await authAPI.requestPasswordReset(email);
      setSuccess(data.message);
      // In development, we get the token back (NOT for production)
      if (data.token && data.user_id) {
        setResetData({ token: data.token, user_id: data.user_id });
      }
    } catch (err) {
      setError("Failed to send reset instructions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <div style={styles.header}>
          <h1 style={styles.title}>Reset Password</h1>
          <p style={styles.subtitle}>
            Enter your email to receive reset instructions
          </p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div style={styles.error}>{error}</div>}
          {success && (
            <div style={styles.success}>
              {success}
              {resetData && (
                <div style={{ marginTop: "1rem", fontSize: "0.85rem" }}>
                  <strong>Dev Mode:</strong> User ID: {resetData.user_id}, Token:{" "}
                  {resetData.token.substring(0, 20)}...
                  <br />
                  <Link
                    to={`/password-reset-confirm?user_id=${resetData.user_id}&token=${resetData.token}`}
                    style={styles.link}
                  >
                    Click here to reset password
                  </Link>
                </div>
              )}
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Sending..." : "Send Reset Instructions"}
          </button>

          <div style={styles.links}>
            <Link to="/login" style={styles.link}>
              Back to Login
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
  success: {
    backgroundColor: "#d1fae5",
    color: "#065f46",
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

export default PasswordReset;
