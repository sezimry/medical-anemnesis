import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.js';

import Login        from './pages/Login.jsx';
import Register     from './pages/Register.jsx';
import Dashboard    from './pages/Dashboard.jsx';
import Profile      from './pages/Profile.jsx';
import Relatives    from './pages/Relatives.jsx';
import MedicalRecords from './pages/MedicalRecords.jsx';
import FamilyTree   from './pages/FamilyTree.jsx';

// Обёртка для маршрутов, которые требуют авторизации
function PrivateRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

// Обёртка для маршрутов, недоступных авторизованным
function PublicRoute({ children }) {
  const { token } = useAuth();
  return token ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      {/* Публичные */}
      <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Защищённые */}
      <Route path="/dashboard"      element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/profile"        element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/relatives"      element={<PrivateRoute><Relatives /></PrivateRoute>} />
      <Route path="/medical-records"element={<PrivateRoute><MedicalRecords /></PrivateRoute>} />
      <Route path="/family-tree"    element={<PrivateRoute><FamilyTree /></PrivateRoute>} />

      {/* Редирект с корня */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
