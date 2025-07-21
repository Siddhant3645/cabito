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
  "Plotting a course for adventure...",
  "Querying the travel oracle...",
  "Calculating the fun quotient...",
  "Waking up the city's spirit...",
  "Pinpointing the tastiest snacks...",
  "Warming up the travel engines...",
  "Shuffling the deck of possibilities...",
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