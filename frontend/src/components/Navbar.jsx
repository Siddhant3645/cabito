// /frontend/src/components/Navbar.jsx (Final Version)

import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import styles from './Navbar.module.css';

function Navbar({ isAuthenticated, user, isAuthLoading, onLogout }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  useBodyScrollLock(isMobileMenuOpen);

  const handleLogout = () => {
    onLogout();
    setIsMobileMenuOpen(false);
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      <nav className={styles.mainNav}>
        <div className={styles.navGroupLeft}>
          <Link to="/" className={styles.navBrandLink}>
            <img src="/cabito-logo.png" alt="Cabito Logo" className={styles.navLogo} />
            <span className={styles.navBrand}>Cabito</span>
          </Link>
          <div className={styles.navLinksDesktop}>
            {isAuthenticated && <NavLink to="/planner">Planner</NavLink>}
            {isAuthenticated && <NavLink to="/my-trips">My Trips</NavLink>}
            {/* <<< FIX: "Account" link moved back here to be a text link >>> */}
            {isAuthenticated && <NavLink to="/account">Account</NavLink>}
          </div>
        </div>

        <div className={styles.navAuthDesktop}>
          {isAuthLoading ? (
            <span>Loading...</span>
          ) : isAuthenticated ? (
            <>
              <span className={styles.navUser}>Hi, {user?.email}!</span>
              {/* <<< "Account" link removed from this button group >>> */}
              <button onClick={handleLogout} className={styles.navButton}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className={styles.navButton}>Login</Link>
              <Link to="/signup" className={`${styles.navButton} ${styles.navButtonPrimary}`}>Sign Up</Link>
            </>
          )}
        </div>

        <button className={styles.hamburgerButton} onClick={() => setIsMobileMenuOpen(true)} aria-label="Open menu">
          &#9776;
        </button>
      </nav>

      <div className={`${styles.mobileMenuOverlay} ${isMobileMenuOpen ? styles.isOpen : ''}`} onClick={closeMobileMenu}>
        <div className={styles.mobileMenuDrawer} onClick={(e) => e.stopPropagation()}>
            {isAuthenticated ? (
                <>
                    <div className={styles.menuHeader}>
                        <div className={styles.profileIcon}>👤</div>
                        <span className={styles.userName}>Hello, {user?.email.split('@')[0]}</span>
                    </div>
                    <div className={styles.menuLinks}>
                        <NavLink to="/planner" className={styles.menuLink} onClick={closeMobileMenu}>Planner</NavLink>
                        <NavLink to="/my-trips" className={styles.menuLink} onClick={closeMobileMenu}>My Trips</NavLink>
                        {/* <<< FIX: Text changed from "Edit Profile" to "Account" >>> */}
                        <NavLink to="/account" className={styles.menuLink} onClick={closeMobileMenu}>Account</NavLink>
                        {/* <<< FIX: Disabled placeholder links removed >>> */}
                    </div>
                    <div className={styles.menuFooter}>
                        <button onClick={handleLogout} className={`${styles.menuLink} ${styles.logoutButton}`}>Logout</button>
                    </div>
                </>
            ) : (
                <div className={styles.authButtonsContainer}>
                    <Link to="/login" className={styles.navButton} onClick={closeMobileMenu}>Login</Link>
                    <Link to="/signup" className={`${styles.navButton} ${styles.navButtonPrimary}`} onClick={closeMobileMenu}>Sign Up</Link>
                </div>
            )}
        </div>
      </div>
    </>
  );
}

export default Navbar;