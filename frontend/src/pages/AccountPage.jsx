// /frontend/src/pages/AccountPage.jsx
// v1.1 - Fixed missing Link import

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // +++ Added Link import +++
import { useAuth } from '../context/AuthContext';
import { apiChangePassword, apiDeleteAccount } from '../services/api';
import { toast } from 'react-toastify';
import '../App.css'; // Assuming App.css contains .auth-form, .form-group, etc.

function AccountPage() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  // State for Change Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState('');

  // State for Delete Account
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);


  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setChangePasswordError('');
    if (newPassword !== confirmNewPassword) {
      setChangePasswordError("New passwords do not match.");
      toast.error("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setChangePasswordError("New password must be at least 8 characters long.");
      toast.error("New password must be at least 8 characters long.");
      return;
    }

    setChangePasswordLoading(true);
    try {
      const response = await apiChangePassword(token, currentPassword, newPassword);
      toast.success(response.message || "Password changed successfully!");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      console.error("Change password error:", err);
      const errorMessage = err.message || "Failed to change password. Please check your current password.";
      setChangePasswordError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const handleDeleteAccountSubmit = async (e) => {
    e.preventDefault();
    if (!deletePassword) {
        setDeleteAccountError("Please enter your password to confirm deletion.");
        toast.warn("Please enter your password to confirm deletion.");
        return;
    }
    setDeleteAccountError('');
    setDeleteAccountLoading(true);
    try {
      const response = await apiDeleteAccount(token, deletePassword);
      toast.success(response.message || "Account deleted successfully. You will be logged out.");
      logout(); // Log out the user from AuthContext
      navigate('/'); // Redirect to homepage
    } catch (err) {
      console.error("Delete account error:", err);
      const errorMessage = err.message || "Failed to delete account. Please check your password.";
      setDeleteAccountError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setDeleteAccountLoading(false);
      setDeletePassword('');
      setShowDeleteConfirm(false);
    }
  };

  if (!user) {
    return (
      <div className="App-container" style={{ textAlign: 'center', padding: '50px' }}>
        <p>Loading user information or not logged in...</p>
      </div>
    );
  }

  return (
    <div className="App-container account-page" style={{ maxWidth: '800px', margin: '20px auto', padding: '0 20px' }}>
      <h1 style={{ textAlign: 'center', color: 'var(--color-dark-blue)', fontFamily: 'var(--font-heading)', marginBottom: '40px' }}>
        Account Management
      </h1>

      {/* Profile Details Section */}
      <section className="account-section card-style">
        <h2>Profile Details</h2>
        <div className="profile-detail">
          <strong>Email:</strong> <span>{user.email}</span>
        </div>
        <div className="profile-detail">
          <strong>User ID:</strong> <span>{user.id}</span>
        </div>
        {/* Add more profile details here if they become available */}
      </section>

      {/* Change Password Section */}
      <section className="account-section card-style">
        <h2>Change Password</h2>
        <form onSubmit={handleChangePasswordSubmit} className="auth-form compact-form">
          {changePasswordError && <p className="error-message">{changePasswordError}</p>}
          <div className="form-group">
            <label htmlFor="currentPassword">Current Password:</label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              disabled={changePasswordLoading}
              autoComplete="current-password"
            />
          </div>
          <div className="form-group">
            <label htmlFor="newPassword">New Password (min. 8 characters):</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength="8"
              disabled={changePasswordLoading}
              autoComplete="new-password"
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmNewPassword">Confirm New Password:</label>
            <input
              type="password"
              id="confirmNewPassword"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
              minLength="8"
              disabled={changePasswordLoading}
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="submit-button" disabled={changePasswordLoading}>
            {changePasswordLoading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </section>

      {/* Contact Us Section (Placeholder) */}
      <section className="account-section card-style">
        <h2>Contact Us</h2>
        <p>If you have any questions or need support, please reach out to us at:</p>
        <p><a href="mailto:support@cabito.app" style={{color: 'var(--color-accent-focus)'}}>support@cabito.app</a> (Example email)</p>
        {/* You can add a contact form or more details here later */}
      </section>
      
      {/* Security Information Section (Placeholder) */}
      <section className="account-section card-style">
        <h2>Security & Privacy</h2>
        <p>
          At Cabito, we take your security and privacy seriously. Your password is encrypted and we never store your payment details directly.
          Our AI features process your inputs to generate itineraries but are designed with privacy in mind.
        </p>
        <ul style={{paddingLeft: '20px', fontSize: '0.9em'}}>
            <li>Use a strong, unique password for your Cabito account.</li>
            <li>Be mindful of the information you share in custom trip descriptions if you have privacy concerns.</li>
            <li>Log out of your account when using shared computers.</li>
        </ul>
        <p>For more details, please review our <Link to="/privacy-policy" style={{color: 'var(--color-accent-focus)'}}>Privacy Policy</Link> (link is a placeholder).</p>
      </section>

      {/* Delete Account Section */}
      <section className="account-section card-style danger-zone">
        <h2>Delete Account</h2>
        <p style={{color: 'var(--color-error-text)', fontWeight: 'bold'}}>
          Warning: This action is irreversible. Deleting your account will mark your data for removal as per our policies.
        </p>
        {!showDeleteConfirm && (
            <button onClick={() => setShowDeleteConfirm(true)} className="delete-button-initiate">
                Request Account Deletion
            </button>
        )}
        
        {showDeleteConfirm && (
            <form onSubmit={handleDeleteAccountSubmit} className="auth-form compact-form" style={{marginTop: '15px'}}>
                <p>To confirm deletion, please enter your current password.</p>
                {deleteAccountError && <p className="error-message">{deleteAccountError}</p>}
                <div className="form-group">
                <label htmlFor="deletePassword">Your Password:</label>
                <input
                    type="password"
                    id="deletePassword"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    required
                    disabled={deleteAccountLoading}
                    autoComplete="current-password"
                />
                </div>
                <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
                    <button type="submit" className="delete-button-confirm" disabled={deleteAccountLoading}>
                        {deleteAccountLoading ? 'Deleting...' : 'Confirm & Delete Account'}
                    </button>
                    <button type="button" onClick={() => {setShowDeleteConfirm(false); setDeleteAccountError(''); setDeletePassword('');}} className="cancel-button" disabled={deleteAccountLoading}>
                        Cancel
                    </button>
                </div>
            </form>
        )}
      </section>
    </div>
  );
}

export default AccountPage;
