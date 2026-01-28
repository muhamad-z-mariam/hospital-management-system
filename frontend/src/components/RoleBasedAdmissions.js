import React from "react";
import { useAuth } from "../context/AuthContext";
import DoctorAdmissions from "../pages/DoctorAdmissions";
import NurseAdmissions from "../pages/NurseAdmissions";

const RoleBasedAdmissions = () => {
  const { user } = useAuth();

  if (user?.role === "doctor") {
    return <DoctorAdmissions />;
  } else if (user?.role === "nurse") {
    return <NurseAdmissions />;
  } else {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h2>Access Denied</h2>
        <p>This page is only available for doctors and nurses.</p>
      </div>
    );
  }
};

export default RoleBasedAdmissions;
