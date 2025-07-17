// /frontend/src/components/EngagingLoader.jsx (Refactored)

import React, { useState, useEffect } from 'react';
import TextCycleLoader from './TextCycleLoader';
import styles from './EngagingLoader.module.css';

const loaderComponents = [TextCycleLoader];

function EngagingLoader() {
  const [SelectedLoader, setSelectedLoader] = useState(null);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * loaderComponents.length);
    setSelectedLoader(() => loaderComponents[randomIndex]);
  }, []);

  return (
    <div className={styles.engagingLoaderWrapper}>
      {SelectedLoader && <SelectedLoader />}
    </div>
  );
}
export default EngagingLoader;