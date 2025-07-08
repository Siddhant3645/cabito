// /frontend/src/pages/LoginPage.jsx
import React from 'react';
import LoginForm from '../components/LoginForm';
import { Link } from 'react-router-dom';
import '../App.css'; // Ensure CSS is imported if not done globally

function LoginPage() {
  return (
    // Use App-container for max-width and centering margin
    // Use auth-page for specific card styling
    <div className="App-container auth-page">
      <h2>Login to Cabito</h2>
      <LoginForm /> {/* Render the form component */}
      <p className="auth-switch">
        Don't have an account? <Link to="/signup">Sign Up</Link>
      </p>
    </div>
  );
}
export default LoginPage;