// /frontend/src/components/EngagingLoader.jsx (Updated)

import React, { useState, useEffect } from 'react';
import TextCycleLoader from './TextCycleLoader'; // Import the new text loader
import '../App.css';

// Updated array with only the approved loaders
const loaderComponents = [TextCycleLoader];

function EngagingLoader() {
  const [SelectedLoader, setSelectedLoader] = useState(null);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * loaderComponents.length);
    setSelectedLoader(() => loaderComponents[randomIndex]);
  }, []);

  return (
    <div className="engaging-loader-wrapper">
      {SelectedLoader && <SelectedLoader />}
    </div>
  );
}

export default EngagingLoader;