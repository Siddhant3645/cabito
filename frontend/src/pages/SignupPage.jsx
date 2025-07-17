// /frontend/src/pages/SignupPage.jsx (Corrected Layout)

import React from 'react';
import SignupForm from '../components/SignupForm';
import { Link } from 'react-router-dom';
import styles from './AuthPage.module.css';

function SignupPage() {
  return (
    <div className="App-container">
       <div className={styles.authPage}>
        <h2>Create Your Cabito Account</h2>
        <SignupForm />
        <p className={styles.authSwitch}>
            Already have an account? <Link to="/login">Log In</Link>
        </p>
      </div>
    </div>
  );
}
export default SignupPage;