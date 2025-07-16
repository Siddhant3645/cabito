// /frontend/src/pages/NotFoundPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div className="App-container" style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>404 - Page Not Found</h2>
      <p>Sorry, the page you were looking for does not exist.</p>
      <Link to="/">Go to Homepage</Link>
    </div>
  );
}
export default NotFoundPage;