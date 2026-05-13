import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.js';

import Login         from './pages/Login.jsx';
import Register      from './pages/Register.jsx';
import Dashboard     from './pages/Dashboard.jsx';
import Profile       from './pages/Profile.jsx';
import Relatives     from './pages/Relatives.jsx';
import MedicalRecords from './pages/MedicalRecords.jsx';
import FamilyTree    from './pages/FamilyTree.jsx';
import PatientsList      from './pages/doctor/PatientsList.jsx';
import PatientDetail     from './pages/doctor/PatientDetail.jsx';
import TreatmentCourses  from './pages/TreatmentCourses.jsx';
import Reminders         from './pages/Reminders.jsx';
import Documents         from './pages/Documents.jsx';

function PrivateRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { token, user } = useAuth();
  if (!token) return children;
  return <Navigate to={user?.role === 'doctor' ? '/doctor/patients' : '/dashboard'} replace />;
}

function DoctorRoute({ children }) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role !== 'doctor') return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Публичные */}
      <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Пациент */}
      <Route path="/dashboard"       element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/profile"         element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/relatives"       element={<PrivateRoute><Relatives /></PrivateRoute>} />
      <Route path="/medical-records" element={<PrivateRoute><MedicalRecords /></PrivateRoute>} />
      <Route path="/family-tree"       element={<PrivateRoute><FamilyTree /></PrivateRoute>} />
      <Route path="/treatment-courses" element={<PrivateRoute><TreatmentCourses /></PrivateRoute>} />
      <Route path="/reminders"         element={<PrivateRoute><Reminders /></PrivateRoute>} />
      <Route path="/documents"         element={<PrivateRoute><Documents /></PrivateRoute>} />

      {/* Врач */}
      <Route path="/doctor/patients"     element={<DoctorRoute><PatientsList /></DoctorRoute>} />
      <Route path="/doctor/patients/:id" element={<DoctorRoute><PatientDetail /></DoctorRoute>} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
