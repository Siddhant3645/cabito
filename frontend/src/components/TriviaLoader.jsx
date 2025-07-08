// /frontend/src/components/TriviaLoader.jsx

import React, { useState, useMemo } from 'react';
import '../App.css';

// +++ Expanded trivia question bank +++
const triviaQuestions = [
  { question: "What is the capital of Australia?", options: ["Sydney", "Melbourne", "Canberra", "Brisbane"], answer: "Canberra" },
  { question: "Which monument is located in Agra, India?", options: ["Eiffel Tower", "Statue of Liberty", "Colosseum", "Taj Mahal"], answer: "Taj Mahal" },
  { question: "Which country is known as the Land of the Rising Sun?", options: ["China", "Japan", "Thailand", "South Korea"], answer: "Japan" },
  { question: "In which city can you find the Spanish Steps?", options: ["Madrid", "Barcelona", "Rome", "Seville"], answer: "Rome" },
  { question: "The famous 'Christ the Redeemer' statue overlooks which city?", options: ["Buenos Aires", "Lima", "Santiago", "Rio de Janeiro"], answer: "Rio de Janeiro" },
  { question: "What is the world's largest coral reef system?", options: ["Belize Barrier Reef", "Great Barrier Reef", "Red Sea Coral Reef", "Maldives Atolls"], answer: "Great Barrier Reef" },
  { question: "Which ancient city is famous for its ruins at Machu Picchu?", options: ["Aztec", "Mayan", "Inca", "Olmec"], answer: "Inca" },
  { question: "The 'Louvre' is a world-renowned art museum located in which city?", options: ["London", "Paris", "New York", "Berlin"], answer: "Paris" },
  { question: "Which African country is home to the Serengeti National Park?", options: ["Kenya", "South Africa", "Tanzania", "Egypt"], answer: "Tanzania" },
  { question: "What is the official currency of the United Kingdom?", options: ["Euro", "Pound Sterling", "Dollar", "Franc"], answer: "Pound Sterling" },
];

const TriviaLoader = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const question = useMemo(() => triviaQuestions[currentQuestionIndex], [currentQuestionIndex]);

  const handleAnswer = (option) => {
    if (isAnswered) return;
    setSelectedOption(option);
    setIsAnswered(true);

    setTimeout(() => {
      setIsAnswered(false);
      setSelectedOption(null);
      setCurrentQuestionIndex((prevIndex) => (prevIndex + 1) % triviaQuestions.length);
    }, 1500);
  };

  return (
    <div className="loader-container trivia-container">
      <h4>Travel Trivia</h4>
      <p className="trivia-question">{question.question}</p>
      <div className="trivia-options">
        {question.options.map((option) => {
          let buttonClass = 'trivia-button';
          if (isAnswered) {
            if (option === question.answer) buttonClass += ' correct';
            else if (option === selectedOption) buttonClass += ' incorrect';
          }
          return (
            <button key={option} className={buttonClass} onClick={() => handleAnswer(option)}>
              {option}
            </button>
          );
        })}
      </div>
      <p className="loader-subtext">While we build your perfect trip...</p>
    </div>
  );
};

export default TriviaLoader;