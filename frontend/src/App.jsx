// /frontend/src/App.jsx (Corrected with missing imports)

import React from 'react';
import { Routes, Route, Navigate, Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import PlannerPage from './pages/PlannerPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import MyTripsPage from './pages/MyTripsPage';
import AccountPage from './pages/AccountPage';
import NotFoundPage from './pages/NotFoundPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';         // <<< FIX: Added this line
import SecurityPolicyPage from './pages/SecurityPolicyPage';       // <<< FIX: Added this line
import TermsAndConditionsPage from './pages/TermsAndConditionsPage'; // <<< FIX: Added this line
import styles from './App.module.css';

const ProtectedRoute = () => {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) {
        return <div className='loading-screen'>Checking authentication...</div>;
    }
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

function App() {
  const { isAuthenticated, user, logout, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
      logout();
      navigate('/');
  };

  return (
    <div className="App">
        <ToastContainer position="top-right" autoClose={5000} theme="light" />

        <Navbar 
          isAuthenticated={isAuthenticated}
          user={user}
          isAuthLoading={isAuthLoading}
          onLogout={handleLogout}
        />

        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={isAuthenticated ? <Navigate to="/planner" replace /> : <LoginPage />} />
            <Route path="/signup" element={isAuthenticated ? <Navigate to="/planner" replace /> : <SignupPage />} />

            <Route element={<ProtectedRoute />}>
                <Route path="/planner" element={<PlannerPage />} />
                <Route path="/my-trips" element={<MyTripsPage />} />
                <Route path="/account" element={<AccountPage />} />
            </Route>

            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/security-policy" element={<SecurityPolicyPage />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />

            <Route path="*" element={<NotFoundPage />} />
        </Routes>

        <footer className={styles.footer}>
          <div className={styles.copyright}>
              © {new Date().getFullYear()} Cabito. All rights reserved.
          </div>
          <div className={styles.footerLinks}>
              <Link to="/privacy-policy">Privacy Policy</Link>
              <Link to="/security-policy">Security Policy</Link>
              <Link to="/terms-and-conditions">Terms & Conditions</Link>
          </div>
        </footer>
    </div>
  );
}
export default App;