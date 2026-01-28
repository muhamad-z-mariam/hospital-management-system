import React from "react";
import { useAuth } from "../context/AuthContext";
import Dashboard from "../pages/Dashboard";
import DoctorDashboard from "../pages/DoctorDashboard";
import NurseDashboard from "../pages/NurseDashboard";
import PharmacyDashboard from "../pages/PharmacyDashboard";

const RoleBasedDashboard = () => {
  const { user } = useAuth();

  // Show dashboard based on user role
  if (user?.role === "admin") {
    return <Dashboard />;
  } else if (user?.role === "doctor") {
    return <DoctorDashboard />;
  } else if (user?.role === "nurse") {
    return <NurseDashboard />;
  } else if (user?.role === "pharmacy_staff") {
    return <PharmacyDashboard />;
  } else {
    return <Dashboard />; // Default fallback
  }
};

export default RoleBasedDashboard;
