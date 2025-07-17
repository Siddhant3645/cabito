// /frontend/src/pages/LoginPage.jsx (Corrected Layout)

import React from 'react';
import LoginForm from '../components/LoginForm';
import { Link } from 'react-router-dom';
import styles from './AuthPage.module.css';

function LoginPage() {
  return (
    <div className="App-container">
      <div className={styles.authPage}>
        <h2>Login to Cabito</h2>
        <LoginForm />
        <p className={styles.authSwitch}>
            Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
export default LoginPage;