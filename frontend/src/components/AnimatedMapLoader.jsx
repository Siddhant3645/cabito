// /frontend/src/components/AnimatedMapLoader.jsx

import React from 'react';
import '../App.css'; // Make sure CSS is imported

const AnimatedMapLoader = () => {
  return (
    <div className="loader-container">
      <svg className="animated-map-svg" viewBox="0 0 400 200">
        {/* Simplified world map path */}
        <path d="M20,100 C40,40 80,40 100,100 S140,160 160,100 S200,40 220,100 S260,160 280,100 S320,40 340,100 S360,160 380,100" stroke="#D0D8E0" strokeWidth="2" fill="none" />
        <path className="animated-travel-path" d="M20,100 C40,40 80,40 100,100 S140,160 160,100 S200,40 220,100 S260,160 280,100" stroke="#4299E1" strokeWidth="3" fill="none" strokeDasharray="5 5" />
        {/* The traveling pin */}
        <circle className="traveling-pin" cx="0" cy="0" r="5" fill="#EA4335" stroke="white" strokeWidth="2" />
      </svg>
      <p className="loader-subtext">Mapping your adventure...</p>
    </div>
  );
};

export default AnimatedMapLoader;