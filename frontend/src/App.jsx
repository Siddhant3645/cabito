// /frontend/src/App.jsx
// v1.2 - Adjusted nav links to be left-aligned next to the brand.

import React from 'react';
import { Routes, Route, Link, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

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
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) {
        return (
            <div className='loading-screen' style={{padding: '50px', textAlign: 'center', fontSize: '1.2em', color: 'var(--color-dark-blue)'}}>
                <img src="/cabito-logo.png" alt="Loading Cabito" style={{height: '50px', marginRight: '10px', verticalAlign: 'middle'}} />
                Checking authentication...
            </div>
        );
    }
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

function App() {
  const { isAuthenticated, user, logout, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
      logout();
      navigate('/');
  }

  return (
    <div className="App">
        <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
        />

        <nav className="main-nav">
            {/* Group logo/brand and main navigation links together on the left */}
            <div className="nav-group-left"> {/* +++ New wrapper div +++ */}
                <div className="nav-left">
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                        <img src="/cabito-logo.png" alt="Cabito Logo" className="nav-logo" />
                        <span className="nav-brand">Cabito</span>
                    </Link>
                </div>
                <div className="nav-links">
                    {isAuthenticated && <Link to="/planner">Planner</Link>}
                    {isAuthenticated && <Link to="/my-trips">My Trips</Link>}
                    {isAuthenticated && <Link to="/account">Account</Link>}
                </div>
            </div>

            {/* Authentication links remain on the far right */}
            <div className="nav-auth">
                {isAuthLoading && !isAuthenticated ? ( <span>Loading...</span>
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
        </nav>

        <Routes>
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
