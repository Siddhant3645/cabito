// /frontend/src/App.jsx (Updated with Hamburger Menu)

import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useBodyScrollLock } from './hooks/useBodyScrollLock';

// --- React Toastify Imports ---
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

// --- Import Page Components ---
import LandingPage from './pages/LandingPage';
import PlannerPage from './pages/PlannerPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import MyTripsPage from './pages/MyTripsPage';
import AccountPage from './pages/AccountPage';
import NotFoundPage from './pages/NotFoundPage';

// --- Protected Route Component ---
const ProtectedRoute = () => {
    // ... (This component is unchanged)
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) {
        return <div className='loading-screen'>Checking authentication...</div>;
    }
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

function App() {
  const { isAuthenticated, user, logout, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  
  // +++ State for mobile navigation menu +++
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // +++ Lock body scroll when mobile menu is open +++
  useBodyScrollLock(isMobileMenuOpen);

  const handleLogout = () => {
      logout();
      setIsMobileMenuOpen(false); // Close menu on logout
      navigate('/');
  }

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="App">
        <ToastContainer position="top-right" autoClose={5000} theme="light" />

        <nav className="main-nav">
            <div className="nav-group-left">
                <Link to="/" className="nav-brand-link" onClick={closeMobileMenu}>
                    <img src="/cabito-logo.png" alt="Cabito Logo" className="nav-logo" />
                    <span className="nav-brand">Cabito</span>
                </Link>
                {/* Desktop Navigation Links */}
                <div className="nav-links-desktop">
                    {isAuthenticated && <NavLink to="/planner">Planner</NavLink>}
                    {isAuthenticated && <NavLink to="/my-trips">My Trips</NavLink>}
                    {isAuthenticated && <NavLink to="/account">Account</NavLink>}
                </div>
            </div>

            {/* Desktop Auth Buttons */}
            <div className="nav-auth-desktop">
                {isAuthLoading ? ( <span>Loading...</span>
                ) : isAuthenticated ? ( <>
                        <span className='nav-user'>Hi, {user?.email}!</span>
                        <button onClick={handleLogout} className='nav-button'>Logout</button>
                    </>
                ) : ( <>
                        <Link to="/login" className='nav-button'>Login</Link>
                        <Link to="/signup" className='nav-button nav-button-primary'>Sign Up</Link>
                    </>
                )}
            </div>

            {/* +++ Hamburger Menu Button for Mobile +++ */}
            <button className="hamburger-button" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Open menu">
                &#9776; {/* This is the hamburger icon character */}
            </button>
        </nav>

        {/* +++ Mobile Menu Overlay +++ */}
        {isMobileMenuOpen && (
            <div className="mobile-menu-overlay">
                <button className="mobile-menu-close" onClick={closeMobileMenu}>&times;</button>
                <div className="mobile-menu-links">
                    {isAuthenticated ? (
                        <>
                            <NavLink to="/planner" onClick={closeMobileMenu}>Planner</NavLink>
                            <NavLink to="/my-trips" onClick={closeMobileMenu}>My Trips</NavLink>
                            <NavLink to="/account" onClick={closeMobileMenu}>Account</NavLink>
                            <hr />
                            <div className="mobile-menu-auth">
                                <span className='nav-user'>Hi, {user?.email}!</span>
                                <button onClick={handleLogout} className='nav-button'>Logout</button>
                            </div>
                        </>
                    ) : (
                        <div className="mobile-menu-auth">
                           <Link to="/login" className='nav-button' onClick={closeMobileMenu}>Login</Link>
                           <Link to="/signup" className='nav-button nav-button-primary' onClick={closeMobileMenu}>Sign Up</Link>
                        </div>
                    )}
                </div>
            </div>
        )}

        <Routes>
            {/* ... (Routes are unchanged) ... */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={isAuthenticated ? <Navigate to="/planner" replace /> : <LoginPage />} />
            <Route path="/signup" element={isAuthenticated ? <Navigate to="/planner" replace /> : <SignupPage />} />

            <Route element={<ProtectedRoute />}>
                <Route path="/planner" element={<PlannerPage />} />
                <Route path="/my-trips" element={<MyTripsPage />} />
                <Route path="/account" element={<AccountPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
        </Routes>

        <footer>
            <p>Cabito - Your personalized travel assistant</p>
        </footer>
    </div>
  );
}
export default App;