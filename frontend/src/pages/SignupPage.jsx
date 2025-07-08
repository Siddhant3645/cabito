// /frontend/src/pages/SignupPage.jsx
import React from 'react';
import SignupForm from '../components/SignupForm';
import { Link } from 'react-router-dom';

function SignupPage() {
  return (
    <div className="App-container auth-page">
       <h2>Create Your Cabito Account</h2>
       <SignupForm /> {/* Render the actual form component */}
       <p className="auth-switch">
        Already have an account? <Link to="/login">Log In</Link>
      </p>
    </div>
  );
}
export default SignupPage;