import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Define menu items based on role
  const getMenuItems = () => {
    if (user?.role === "admin") {
      return [
        { path: "/dashboard", label: "Dashboard", icon: "📊" },
        { path: "/patients", label: "Patients", icon: "👥" },
        { path: "/doctors", label: "Doctors", icon: "👨‍⚕️" },
        { path: "/nurses", label: "Nurses", icon: "👩‍⚕️" },
        { path: "/pharmacy-staff", label: "Pharmacy Staff", icon: "💊" },
        { path: "/appointments", label: "Appointments", icon: "📅" },
        { path: "/admissions", label: "Admissions", icon: "🏥" },
        { path: "/manage-schedules", label: "Manage Schedules", icon: "📆" },
        { path: "/shift-swap-requests", label: "Shift Swap Requests", icon: "🔄" },
        { path: "/unavailability-requests", label: "Time Off Requests", icon: "🏖️" },
        { path: "/payments", label: "Payments", icon: "💰" },
        { path: "/prediction", label: "High Risk Patients", icon: "⚠️" },
      ];
    } else if (user?.role === "doctor") {
      return [
        { path: "/dashboard", label: "Dashboard", icon: "📊" },
        { path: "/my-patients", label: "My Patients", icon: "👥" },
        { path: "/my-admissions", label: "My Admissions", icon: "🏥" },
        { path: "/my-appointments", label: "My Appointments", icon: "📅" },
        { path: "/my-schedule", label: "My Schedule", icon: "📆" },
        { path: "/shift-swap-requests", label: "Shift Swaps", icon: "🔄" },
        { path: "/unavailability-requests", label: "Request Time Off", icon: "🏖️" },
        { path: "/run-prediction", label: "Run Prediction", icon: "🔮" },
      ];
    } else if (user?.role === "nurse") {
      return [
        { path: "/dashboard", label: "Dashboard", icon: "📊" },
        { path: "/my-patients", label: "My Patients", icon: "👥" },
        { path: "/my-admissions", label: "My Admissions", icon: "🏥" },
        { path: "/my-schedule", label: "My Schedule", icon: "📆" },
        { path: "/shift-swap-requests", label: "Shift Swaps", icon: "🔄" },
        { path: "/unavailability-requests", label: "Request Time Off", icon: "🏖️" },
        { path: "/run-prediction", label: "Run Prediction", icon: "🔮" },
      ];
    } else if (user?.role === "pharmacy_staff") {
      return [
        { path: "/pharmacy", label: "Dashboard", icon: "💊" },
        { path: "/dispensing-history", label: "Dispensing History", icon: "📋" },
      ];
    }
    return [];
  };

  const menuItems = getMenuItems();

  return (
    <aside style={styles.sidebar}>
      <div style={styles.menu}>
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              ...styles.menuItem,
              ...(location.pathname === item.path ? styles.activeMenuItem : {}),
            }}
          >
            <span style={styles.icon}>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>
    </aside>
  );
};

const styles = {
  sidebar: {
    width: "250px",
    backgroundColor: "#1e293b",
    minHeight: "calc(100vh - 73px)",
    height: "calc(100vh - 73px)",
    padding: "1.5rem 0",
    position: "fixed",
    left: 0,
    top: "73px",
    overflowY: "auto",
  },
  menu: {
    display: "flex",
    flexDirection: "column",
  },
  menuItem: {
    color: "#cbd5e1",
    textDecoration: "none",
    padding: "1rem 1.5rem",
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    transition: "all 0.2s",
    borderLeft: "4px solid transparent",
  },
  activeMenuItem: {
    backgroundColor: "#334155",
    color: "white",
    borderLeftColor: "#2563eb",
  },
  icon: {
    fontSize: "1.25rem",
  },
};

export default Sidebar;
