// /frontend/src/components/TextCycleLoader.jsx (Refactored)

import React, { useState, useEffect } from 'react';
import styles from './TextCycleLoader.module.css';

const loadingMessages = [
  "Consulting ancient maps...",
  "Negotiating with the best food stalls...",
  "Aligning the stars for your trip...",
  "Decoding local secrets...",
  "Finding the most scenic routes...",
  "Polishing hidden gems...",
];

const TextCycleLoader = () => {
  const [message, setMessage] = useState(loadingMessages[0]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setMessage(prevMessage => {
        const currentIndex = loadingMessages.indexOf(prevMessage);
        const nextIndex = (currentIndex + 1) % loadingMessages.length;
        return loadingMessages[nextIndex];
      });
    }, 2500);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className={styles.loaderContainer}>
      <div key={message} className={styles.loaderText}>
        {message}
      </div>
    </div>
  );
};
export default TextCycleLoader;