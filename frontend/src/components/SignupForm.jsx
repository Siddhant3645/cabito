// /frontend/src/components/SignupForm.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import formStyles from './AuthForm.module.css'; // <<< Import the form styles

function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');
  
  const { signup, authError, isLoading, setAuthError } = useAuth();
  const navigate = useNavigate();

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
    setAuthError(null);

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters long.");
      return;
    }

    const success = await signup(email, password);
    
    if (success) {
      navigate('/login');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={formStyles.authForm}> {/* <<< Apply scoped classes */}
       {(formError || authError) && <p className={formStyles.errorMessage}>{formError || authError}</p>}
      
      <div className={formStyles.formGroup}>
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

      <div className={formStyles.formGroup}>
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

       <div className={formStyles.formGroup}>
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

      <button type="submit" className={formStyles.submitButton} disabled={isLoading}>
        {isLoading ? 'Signing Up...' : 'Sign Up'}
      </button>
    </form>
  );
}

export default SignupForm;