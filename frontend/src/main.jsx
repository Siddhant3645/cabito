// /frontend/src/main.jsx (Complete File)

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';
// import { GoogleMapsProvider } from './context/GoogleMapsContext'; // <<< COMMENT OUT
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        {/* <GoogleMapsProvider> <<< COMMENT OUT */}
          <App />
        {/* </GoogleMapsProvider> <<< COMMENT OUT */}
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);