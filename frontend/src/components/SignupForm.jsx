// /frontend/src/components/SignupForm.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState(''); // For client-side validation errors only
  
  // Get authentication state and functions from the context
  const { signup, authError, isLoading, setAuthError } = useAuth();
  const navigate = useNavigate();

  // Clear authentication error when the component unmounts or form inputs change
  useEffect(() => {
    return () => {
      if (authError) {
        setAuthError(null);
      }
    };
  }, [authError, setAuthError]);


  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    setAuthError(null); // Clear previous backend errors on a new attempt

    // --- Client-side validation ---
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters long.");
      return;
    }

    // Call the signup function from AuthContext
    const success = await signup(email, password);
    
    if (success) {
      // The context will show a success toast. We just navigate.
      navigate('/login');
    }
    // If it fails, the authError state in the context will be set, and the message will be displayed.
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
       {/* Show client-side or backend errors */}
       {(formError || authError) && <p className="error-message">{formError || authError}</p>}
      
      <div className="form-group">
        <label htmlFor="signup-email">Email:</label>
        <input 
          type="email" 
          id="signup-email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
          autoComplete="email" 
          disabled={isLoading} 
        />
      </div>

      <div className="form-group">
        <label htmlFor="signup-password">Password (min 8 chars):</label>
        <input 
          type="password" 
          id="signup-password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
          minLength="8" 
          autoComplete="new-password" 
          disabled={isLoading}
        />
      </div>

       <div className="form-group">
        <label htmlFor="signup-confirm-password">Confirm Password:</label>
        <input 
          type="password" 
          id="signup-confirm-password" 
          value={confirmPassword} 
          onChange={(e) => setConfirmPassword(e.target.value)} 
          required 
          minLength="8" 
          autoComplete="new-password" 
          disabled={isLoading}
        />
      </div>

      <button type="submit" className="submit-button" disabled={isLoading}>
        {isLoading ? 'Signing Up...' : 'Sign Up'}
      </button>
    </form>
  );
}

export default SignupForm;