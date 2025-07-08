// /frontend/src/components/CartoonLoader.jsx

import React, { useState, useEffect } from 'react';
import '../App.css';

const travelTipsAndJokes = [
  "Cabi's Tip: Roll your clothes when packing. It saves space and prevents wrinkles!",
  "Cabi's Joke: What do you call a lazy kangaroo? Pouch potato!",
  "Cabi's Insight: The best souvenir is a new perspective.",
  "Cabi says: Always leave room in your luggage for the things you'll bring back.",
  "Cabi's Joke: Why did the plane get sent to its room? For its bad altitude!",
  "Cabi's Tip: Learn to say 'Hello' and 'Thank You' in the local language. It makes a world of difference!",
  "Cabi's Insight: Don't be afraid to get a little lost on purpose. That's where adventures begin.",
  "Cabi says: Keep digital copies of your important documents on your phone.",
  "Cabi's Joke: What's the best thing about Switzerland? I don't know, but the flag is a big plus!",
  "Cabi's Tip: Pack a portable charger. You'll thank me later!",
];

const CartoonLoader = () => {
  const [currentTip, setCurrentTip] = useState(travelTipsAndJokes[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      // Pick a new, random tip that isn't the same as the current one
      let newTip = currentTip;
      while (newTip === currentTip) {
        newTip = travelTipsAndJokes[Math.floor(Math.random() * travelTipsAndJokes.length)];
      }
      setCurrentTip(newTip);
    }, 3500);
    return () => clearInterval(interval);
  }, [currentTip]);

  return (
    <div className="loader-container cartoon-container">
      <div className="cabi-character">
        {/* +++ Cuter Cabi SVG inspired by Olaf and "Barry" +++ */}
        <svg viewBox="0 0 100 120">
          <g>
            {/* Body */}
            <path d="M 20,110 C 10,80 15,45 40,35 S 60,35 80,45 C 105,55 100,80 80,110 Z" fill="#FDD835" />
            
            {/* Tummy Patch */}
            <path d="M 35,105 C 30,90 40,75 50,75 S 70,90 65,105 Z" fill="#FFFDE7" />

            {/* Eyes */}
            <circle cx="35" cy="55" r="8" fill="white" />
            <circle cx="65"cy="55" r="8" fill="white" />
            <circle cx="37" cy="57" r="4" fill="#424242" />
            <circle cx="63" cy="57" r="4" fill="#424242" />

            {/* Smile */}
            <path d="M 40 70 Q 50 80 60 70" stroke="#C62828" strokeWidth="2.5" fill="none" strokeLinecap="round" />

            {/* Leaf on head */}
            <path d="M 50 35 C 40 20, 60 20, 50 5 Z" fill="#8BC34A" />
            <line x1="50" y1="35" x2="50" y2="20" stroke="#689F38" strokeWidth="2" />
          </g>
        </svg>
      </div>
      <div className="speech-bubble">
        {currentTip}
      </div>
    </div>
  );
};

export default CartoonLoader;