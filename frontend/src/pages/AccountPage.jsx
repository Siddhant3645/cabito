// /frontend/src/pages/AccountPage.jsx (Updated with Delete Modal)

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiChangePassword, apiDeleteAccount } from '../services/api';
import { toast } from 'react-toastify';
import styles from './AccountPage.module.css';
import formStyles from '../components/AuthForm.module.css';

function AccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState('');

  const [deletePassword, setDeletePassword] = useState('');
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // <<< NEW: State for modal

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
      const response = await apiChangePassword(currentPassword, newPassword);
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
      const response = await apiDeleteAccount(deletePassword);
      toast.success(response.message || "Account deleted successfully. You will be logged out.");
      logout();
      navigate('/');
    } catch (err) {
      console.error("Delete account error:", err);
      const errorMessage = err.message || "Failed to delete account. Please check your password.";
      setDeleteAccountError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setDeleteAccountLoading(false);
      setDeletePassword('');
      setIsDeleteModalOpen(false);
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
    <div className="App-container" style={{ maxWidth: '800px', margin: '20px auto', padding: '0 20px' }}>
      <h1 style={{ textAlign: 'center', color: 'var(--color-dark-blue)', fontFamily: 'var(--font-heading)', marginBottom: '40px' }}>
        Account Management
      </h1>

      {/* Profile & Change Password Sections are unchanged */}
      <section className={styles.cardStyle}>
        <h2>Profile Details</h2>
        <div className={styles.profileDetail}>
          <strong>Email:</strong> <span>{user.email}</span>
        </div>
        <div className={styles.profileDetail}>
          <strong>User ID:</strong> <span>{user.id}</span>
        </div>
      </section>

      <section className={styles.cardStyle}>
        <h2>Change Password</h2>
        <form onSubmit={handleChangePasswordSubmit} className={`${formStyles.authForm} ${styles.compactForm}`}>
          {changePasswordError && <p className={formStyles.errorMessage}>{changePasswordError}</p>}
          <div className={formStyles.formGroup}>
            <label htmlFor="currentPassword">Current Password:</label>
            <input type="password" id="currentPassword" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required disabled={changePasswordLoading} autoComplete="current-password"/>
          </div>
          <div className={formStyles.formGroup}>
            <label htmlFor="newPassword">New Password (min. 8 characters):</label>
            <input type="password" id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength="8" disabled={changePasswordLoading} autoComplete="new-password"/>
          </div>
          <div className={formStyles.formGroup}>
            <label htmlFor="confirmNewPassword">Confirm New Password:</label>
            <input type="password" id="confirmNewPassword" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required minLength="8" disabled={changePasswordLoading} autoComplete="new-password"/>
          </div>
          <button type="submit" className={formStyles.submitButton} disabled={changePasswordLoading}>
            {changePasswordLoading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </section>
      
      <section className={styles.cardStyle}>
        <h2>Contact Us</h2>
        <p>If you have any questions or need support, please reach out to us:</p>
        <a href="mailto:support@cabito.co.in" className={styles.contactButton}>
          Contact Support
        </a>
      </section>

      {/* <<< FIX: Delete Account section is now smaller and triggers a modal >>> */}
      <section className={`${styles.cardStyle} ${styles.dangerZone}`}>
        <h2>Delete Account</h2>
        <p>
          Warning: This action is irreversible and will permanently remove your account and all associated trip data.
        </p>
        <button onClick={() => setIsDeleteModalOpen(true)} className={styles.deleteButtonInitiate}>
            Delete My Account
        </button>
      </section>

      {/* <<< NEW: Delete confirmation modal >>> */}
      {isDeleteModalOpen && (
        <div className="modal-overlay">
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setIsDeleteModalOpen(false)} className="modal-close-button" aria-label="Close modal">&times;</button>
                <h3>Confirm Account Deletion</h3>
                <p style={{fontWeight:'bold'}}>This action cannot be undone.</p>
                <form onSubmit={handleDeleteAccountSubmit} className={`${formStyles.authForm} ${styles.compactForm}`} style={{marginTop: '15px'}}>
                    <p>To confirm deletion, please enter your current password.</p>
                    {deleteAccountError && <p className={formStyles.errorMessage}>{deleteAccountError}</p>}
                    <div className={formStyles.formGroup}>
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
                        <button type="submit" className={styles.deleteButtonConfirm} disabled={deleteAccountLoading}>
                            {deleteAccountLoading ? 'Deleting...' : 'Confirm & Delete Account'}
                        </button>
                        <button type="button" onClick={() => setIsDeleteModalOpen(false)} className={styles.cancelButton} disabled={deleteAccountLoading}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}

export default AccountPage;