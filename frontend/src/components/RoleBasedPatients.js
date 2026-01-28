import React from "react";
import { useAuth } from "../context/AuthContext";
import DoctorPatients from "../pages/DoctorPatients";
import NursePatients from "../pages/NursePatients";

const RoleBasedPatients = () => {
  const { user } = useAuth();

  if (user?.role === "doctor") {
    return <DoctorPatients />;
  } else if (user?.role === "nurse") {
    return <NursePatients />;
  }

  return <div>Unauthorized</div>;
};

export default RoleBasedPatients;
