import React from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav style={styles.navbar}>
      <div style={styles.navContent}>
        <h2 style={styles.title}>Hospital Management System</h2>
        <div style={styles.userInfo}>
          <span style={styles.username}>
            {user?.first_name || user?.username} ({user?.role})
          </span>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

const styles = {
  navbar: {
    backgroundColor: "#2563eb",
    color: "white",
    padding: "1rem 2rem",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  navContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    maxWidth: "1400px",
    margin: "0 auto",
  },
  title: {
    margin: 0,
    fontSize: "1.5rem",
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  username: {
    fontSize: "0.95rem",
  },
  logoutBtn: {
    backgroundColor: "#dc2626",
    color: "white",
    border: "none",
    padding: "0.5rem 1.5rem",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
};

export default Navbar;
