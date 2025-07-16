// /frontend/src/components/LoginForm.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, authError, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const success = await login(email, password);
    if (success) {
      navigate('/planner'); // Redirect after successful login
    }
    // Error is displayed below if login fails
  };

  return (
    // Use auth-form class for form container
    <form onSubmit={handleSubmit} className="auth-form">
      {/* Use error-message class */}
      {authError && <p className="error-message">{authError}</p>}

      {/* Use form-group class for label+input pairs */}
      <div className="form-group">
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
      <div className="form-group">
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
      {/* Use submit-button class */}
      <button type="submit" className="submit-button" disabled={isLoading}>
        {isLoading ? 'Logging In...' : 'Log In'}
      </button>
    </form>
  );
}
export default LoginForm;