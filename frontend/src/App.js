import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleBasedDashboard from "./components/RoleBasedDashboard";
import RoleBasedPatients from "./components/RoleBasedPatients";
import RoleBasedAdmissions from "./components/RoleBasedAdmissions";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ChangePassword from "./pages/ChangePassword";
import PasswordReset from "./pages/PasswordReset";
import PasswordResetConfirm from "./pages/PasswordResetConfirm";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import AddPatient from "./pages/AddPatient";
import PatientDetail from "./pages/PatientDetail";
import Doctors from "./pages/Doctors";
import AddDoctor from "./pages/AddDoctor";
import Nurses from "./pages/Nurses";
import AddNurse from "./pages/AddNurse";
import Appointments from "./pages/Appointments";
import AddAppointment from "./pages/AddAppointment";
import ScheduleAppointment from "./pages/ScheduleAppointment";
import Admissions from "./pages/Admissions";
import AddAdmission from "./pages/AddAdmission";
import Payments from "./pages/Payments";
import AddPayment from "./pages/AddPayment";
import Prediction from "./pages/Prediction";
import EditPatientMedical from "./pages/EditPatientMedical";
import PatientArchive from "./pages/PatientArchive";

// Doctor Pages
import DoctorDashboard from "./pages/DoctorDashboard";
import DoctorPatients from "./pages/DoctorPatients";
import DoctorAppointments from "./pages/DoctorAppointments";
import DoctorAdmissions from "./pages/DoctorAdmissions";
import RunPrediction from "./pages/RunPrediction";
import ExaminePatient from "./pages/ExaminePatient";
import DoctorProfile from "./pages/DoctorProfile";

// Nurse Pages
import NurseDashboard from "./pages/NurseDashboard";
import NursePatients from "./pages/NursePatients";
import NurseAdmissions from "./pages/NurseAdmissions";
import NurseProfile from "./pages/NurseProfile";

// Schedule Pages
import ManageSchedules from "./pages/ManageSchedules";
import MySchedule from "./pages/MySchedule";
import ShiftSwapRequests from "./pages/ShiftSwapRequests";
import UnavailabilityRequests from "./pages/UnavailabilityRequests";

// Pharmacy Pages
import PharmacyDashboard from "./pages/PharmacyDashboard";
import CreatePrescription from "./pages/CreatePrescription";
import PrescriptionHistory from "./pages/PrescriptionHistory";
import DispensingHistory from "./pages/DispensingHistory";
import PharmacyStaff from "./pages/PharmacyStaff";
import AddPharmacyStaff from "./pages/AddPharmacyStaff";
import PharmacyStaffProfile from "./pages/PharmacyStaffProfile";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/password-reset" element={<PasswordReset />} />
          <Route
            path="/password-reset-confirm"
            element={<PasswordResetConfirm />}
          />

          {/* Role-Based Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <RoleBasedDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes - Patients */}
          <Route
            path="/patients"
            element={
              <ProtectedRoute>
                <Patients />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients/add"
            element={
              <ProtectedRoute>
                <AddPatient />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients/:id"
            element={
              <ProtectedRoute>
                <PatientDetail />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes - Doctors */}
          <Route
            path="/doctors"
            element={
              <ProtectedRoute>
                <Doctors />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctors/add"
            element={
              <ProtectedRoute>
                <AddDoctor />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes - Nurses */}
          <Route
            path="/nurses"
            element={
              <ProtectedRoute>
                <Nurses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/nurses/add"
            element={
              <ProtectedRoute>
                <AddNurse />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes - Appointments */}
          <Route
            path="/appointments"
            element={
              <ProtectedRoute>
                <Appointments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/appointments/add"
            element={
              <ProtectedRoute>
                <AddAppointment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/schedule-appointment"
            element={
              <ProtectedRoute>
                <ScheduleAppointment />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes - Admissions */}
          <Route
            path="/admissions"
            element={
              <ProtectedRoute>
                <Admissions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admissions/add"
            element={
              <ProtectedRoute>
                <AddAdmission />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes - Payments */}
          <Route
            path="/payments"
            element={
              <ProtectedRoute>
                <Payments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments/add"
            element={
              <ProtectedRoute>
                <AddPayment />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes - Prediction */}
          <Route
            path="/prediction"
            element={
              <ProtectedRoute>
                <Prediction />
              </ProtectedRoute>
            }
          />

          {/* Doctor & Nurse Shared Routes */}
          <Route
            path="/my-patients"
            element={
              <ProtectedRoute>
                <RoleBasedPatients />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-appointments"
            element={
              <ProtectedRoute>
                <DoctorAppointments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-admissions"
            element={
              <ProtectedRoute>
                <RoleBasedAdmissions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/run-prediction"
            element={
              <ProtectedRoute>
                <RunPrediction />
              </ProtectedRoute>
            }
          />

          {/* Edit Patient Medical Data (Nurse/Doctor) */}
          <Route
            path="/edit-patient-medical/:id"
            element={
              <ProtectedRoute>
                <EditPatientMedical />
              </ProtectedRoute>
            }
          />

          <Route
            path="/examine-patient/:id"
            element={
              <ProtectedRoute>
                <ExaminePatient />
              </ProtectedRoute>
            }
          />
          <Route
            path="/examine-appointment/:id"
            element={
              <ProtectedRoute>
                <ExaminePatient />
              </ProtectedRoute>
            }
          />

          <Route
            path="/patients/:id/archive"
            element={
              <ProtectedRoute>
                <PatientArchive />
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctors/:id/profile"
            element={
              <ProtectedRoute>
                <DoctorProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/nurses/:id/profile"
            element={
              <ProtectedRoute>
                <NurseProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/pharmacy-staff/:id/profile"
            element={
              <ProtectedRoute>
                <PharmacyStaffProfile />
              </ProtectedRoute>
            }
          />

          {/* Schedule Routes */}
          <Route
            path="/manage-schedules"
            element={
              <ProtectedRoute>
                <ManageSchedules />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-schedule"
            element={
              <ProtectedRoute>
                <MySchedule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shift-swap-requests"
            element={
              <ProtectedRoute>
                <ShiftSwapRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/unavailability-requests"
            element={
              <ProtectedRoute>
                <UnavailabilityRequests />
              </ProtectedRoute>
            }
          />

          {/* Password Change (Protected) */}
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />

          {/* Pharmacy Routes */}
          <Route
            path="/pharmacy"
            element={
              <ProtectedRoute>
                <PharmacyDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pharmacy-staff"
            element={
              <ProtectedRoute>
                <PharmacyStaff />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pharmacy-staff/add"
            element={
              <ProtectedRoute>
                <AddPharmacyStaff />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dispensing-history"
            element={
              <ProtectedRoute>
                <DispensingHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/prescriptions/create/:patientId"
            element={
              <ProtectedRoute>
                <CreatePrescription />
              </ProtectedRoute>
            }
          />
          <Route
            path="/prescriptions/create/:patientId/:admissionId"
            element={
              <ProtectedRoute>
                <CreatePrescription />
              </ProtectedRoute>
            }
          />
          <Route
            path="/prescriptions/history/:patientId"
            element={
              <ProtectedRoute>
                <PrescriptionHistory />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
