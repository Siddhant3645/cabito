// /frontend/src/components/TextCycleLoader.jsx

import React, { useState, useEffect } from 'react';
import '../App.css';

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
    <div className="loader-container">
      <div key={message} className="loader-text">
        {message}
      </div>
    </div>
  );
};

export default TextCycleLoader;