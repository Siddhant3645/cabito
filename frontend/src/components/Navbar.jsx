// /frontend/src/components/Navbar.jsx (Corrected for ReferenceError)

import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom'; // <<< FIX: Import useLocation
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import styles from './Navbar.module.css';

function Navbar({ isAuthenticated, user, isAuthLoading, onLogout }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  useBodyScrollLock(isMobileMenuOpen);

  const location = useLocation(); // <<< FIX: Get the current location object
  const isHomePage = location.pathname === '/'; // <<< FIX: Define the isHomePage variable

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
            {isAuthenticated && <NavLink to="/account">Account</NavLink>}
          </div>
        </div>

        {/* --- Desktop Auth Buttons --- */}
        <div className={styles.navAuthDesktop}>
          {isAuthLoading ? (
            <span>Loading...</span>
          ) : isAuthenticated ? (
            <>
              <span className={styles.navUser}>Hi, {user?.email}!</span>
              <button onClick={handleLogout} className={styles.navButton}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className={styles.navButton}>Login</Link>
              <Link to="/signup" className={`${styles.navButton} ${styles.navButtonPrimary}`}>Sign Up</Link>
            </>
          )}
        </div>

        {/* --- Mobile-Only Auth Buttons (for logged-out state) --- */}
        <div className={styles.navAuthMobile}>
            {!isAuthLoading && !isAuthenticated && !isHomePage && (
                <>
                    <Link to="/login" className={styles.navButton}>Login</Link>
                    <Link to="/signup" className={`${styles.navButton} ${styles.navButtonPrimary}`}>Sign Up</Link>
                </>
            )}
        </div>

        {/* --- Hamburger menu (for logged-in state) --- */}
        {!isAuthLoading && isAuthenticated && (
            <button className={styles.hamburgerButton} onClick={() => setIsMobileMenuOpen(true)} aria-label="Open menu">
            &#9776;
            </button>
        )}
      </nav>

      {/* Side-drawer menu */}
      {isMobileMenuOpen && (
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
                          <NavLink to="/account" className={styles.menuLink} onClick={closeMobileMenu}>Account</NavLink>
                      </div>
                      <div className={styles.menuFooter}>
                          <button onClick={handleLogout} className={`${styles.menuLink} ${styles.logoutButton}`}>Logout</button>
                      </div>
                  </>
              ) : null}
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;