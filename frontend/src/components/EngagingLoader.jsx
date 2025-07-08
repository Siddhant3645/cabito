// /frontend/src/components/EngagingLoader.jsx (Updated to be a manager)

import React, { useState, useEffect } from 'react';
import AnimatedMapLoader from './AnimatedMapLoader';
import TriviaLoader from './TriviaLoader';
import CartoonLoader from './CartoonLoader';
import '../App.css';

const loaderComponents = [AnimatedMapLoader, TriviaLoader, CartoonLoader];

function EngagingLoader() {
  const [SelectedLoader, setSelectedLoader] = useState(null);

  useEffect(() => {
    // Select a random loader component when the loader is first displayed
    const randomIndex = Math.floor(Math.random() * loaderComponents.length);
    setSelectedLoader(() => loaderComponents[randomIndex]);
  }, []); // Empty array ensures this runs only once per render

  return (
    <div className="engaging-loader-wrapper">
      {/* Render the randomly selected loader component */}
      {SelectedLoader && <SelectedLoader />}
    </div>
  );
}

export default EngagingLoader;