import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageDepartments from './pages/admin/ManageDepartments';
import CitizenDashboard from './pages/citizen/CitizenDashboard';
import SubmitComplaint from './pages/citizen/SubmitComplaint';
import DepartmentDashboard from './pages/department/DepartmentDashboard';
import UpdateComplaint from './pages/department/UpdateComplaint';

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('citizenSyncCurrentUser');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error('Failed to restore saved user:', error);
      localStorage.removeItem('citizenSyncCurrentUser');
      return null;
    }
  });

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('citizenSyncCurrentUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('citizenSyncCurrentUser');
  };

  return (
    <Router>
      <Layout currentUser={currentUser} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={currentUser ? <Navigate to={`/${currentUser.role === 'admin' ? 'admin' : currentUser.role}/dashboard`} /> : <Login onLogin={handleLogin} />} />
          <Route path="/register" element={<Register />} />
          
          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={currentUser?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />} />
          <Route path="/admin/departments" element={currentUser?.role === 'admin' ? <ManageDepartments /> : <Navigate to="/login" />} />

          {/* Citizen Routes */}
          <Route path="/citizen/dashboard" element={currentUser?.role === 'citizen' ? <CitizenDashboard currentUser={currentUser} /> : <Navigate to="/login" />} />
          <Route path="/citizen/submit-complaint" element={currentUser?.role === 'citizen' ? <SubmitComplaint currentUser={currentUser} /> : <Navigate to="/login" />} />

          {/* Department Routes */}
          <Route path="/department/dashboard" element={currentUser?.role === 'department' ? <DepartmentDashboard currentUser={currentUser} /> : <Navigate to="/login" />} />
          <Route path="/department/update-complaint/:id" element={currentUser?.role === 'department' ? <UpdateComplaint /> : <Navigate to="/login" />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
