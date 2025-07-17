// /frontend/src/components/LoginForm.jsx

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import formStyles from './AuthForm.module.css'; // <<< Import the form styles

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, authError, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const success = await login(email, password);
    if (success) {
      navigate('/planner');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={formStyles.authForm}> {/* <<< Apply scoped classes */}
      {authError && <p className={formStyles.errorMessage}>{authError}</p>}

      <div className={formStyles.formGroup}>
        <label htmlFor="login-email">Email:</label>
        <input
          type="email"
          id="login-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          disabled={isLoading}
        />
      </div>
      <div className={formStyles.formGroup}>
        <label htmlFor="login-password">Password:</label>
        <input
          type="password"
          id="login-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          disabled={isLoading}
        />
      </div>
      <button type="submit" className={formStyles.submitButton} disabled={isLoading}>
        {isLoading ? 'Logging In...' : 'Log In'}
      </button>
    </form>
  );
}
export default LoginForm;