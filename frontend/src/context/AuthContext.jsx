// /frontend/src/context/AuthContext.jsx (Corrected for Refresh Tokens)

import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { apiLogin, apiRegister, apiGetCurrentUser, apiRefreshToken, apiLogout } from '../services/api';

const AuthContext = createContext(null);

const GlobalLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.2em' }}>
    <p>Initializing Session...</p>
  </div>
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // On initial app load, try to refresh the token to see if a session exists.
  // This function determines if the user is already logged in.
  useEffect(() => {
    const checkLoggedInStatus = async () => {
      try {
        await apiRefreshToken(); // This will populate the in-memory token in api.js
        const currentUser = await apiGetCurrentUser();
        setUser(currentUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.log("No active session found.");
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkLoggedInStatus();
  }, []);

  const login = async (email, password) => {
    setAuthError(null);
    try {
      await apiLogin(email, password); // This sets the in-memory token in api.js
      const currentUser = await apiGetCurrentUser();
      setUser(currentUser);
      setIsAuthenticated(true);
      toast.success(`Welcome, ${currentUser.email}!`);
      return true;
    } catch (error) {
      console.error("AuthContext Login failed:", error);
      const errorMessage = error.message || 'Login failed. Please check your credentials.';
      setAuthError(errorMessage);
      toast.error(errorMessage);
      setUser(null);
      setIsAuthenticated(false);
      return false;
    }
  };

  const signup = async (email, password) => {
    setAuthError(null);
    try {
      await apiRegister(email, password);
      toast.success(`Signup successful! Please log in to continue.`);
      return true;
    } catch (error) {
      console.error("AuthContext Signup failed:", error);
      const errorMessage = error.message || 'Registration failed. Please try again.';
      setAuthError(errorMessage);
      return false;
    }
  };

  const logout = useCallback(async () => {
    try {
      await apiLogout(); // Calls the backend to clear the HttpOnly cookie
    } catch (error) {
      console.error("Server logout failed, clearing state regardless.", error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setAuthError(null);
      toast.info("You have been logged out.");
    }
  }, []);

  const contextValue = useMemo(() => ({
    user,
    isAuthenticated,
    isLoading,
    authError,
    setAuthError,
    login,
    signup,
    logout,
  }), [user, isAuthenticated, isLoading, authError, logout]);

  if (isLoading) {
    return <GlobalLoader />;
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};