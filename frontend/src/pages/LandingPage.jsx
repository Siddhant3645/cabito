// /frontend/src/pages/LandingPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import '../App.css'; 

// +++ Animation variants for container elements +++
const sectionVariants = {
    hidden: { opacity: 0, y: 30 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: "easeOut",
            when: "beforeChildren",
            staggerChildren: 0.15,
        },
    },
};

// +++ Animation variants for child grid/list items +++
const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

// Updated components to be animatable
const FeatureItem = ({ icon, title, children }) => (
    <motion.div className="feature-item" variants={itemVariants}>
        <div className="feature-icon">{icon}</div>
        <h3>{title}</h3>
        <p>{children}</p>
    </motion.div>
);

const StepItem = ({ number, title, children }) => (
    <motion.div className="step-item" variants={itemVariants}>
        <div className="step-number-visual">{number}</div>
        <h3>{title}</h3>
        <p>{children}</p>
    </motion.div>
);

const ValuePointItem = ({ icon, title, children }) => (
    <motion.div className="value-point" variants={itemVariants}>
        <div className="value-icon">{icon}</div>
        <h3>{title}</h3>
        <p>{children}</p>
    </motion.div>
);


function LandingPage() {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const handlePlanClick = () => {
        navigate(isAuthenticated ? '/planner' : '/login');
    };

  return (
    <div className="landing-page-wrapper">

      <section className="App-hero">
        <div className="hero-content">
          <motion.h1 
            className="hero-brand-title"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Cabito
          </motion.h1>
          <motion.p 
            className="App-subtitle"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Your Smart Micro-Trip Planner
          </motion.p>
          <motion.button 
            onClick={handlePlanClick} 
            className="cta-button large-cta hero-cta"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5, type: 'spring', stiffness: 120 }}
          >
            {isAuthenticated ? 'Go to Planner' : 'Plan Your Adventure Now'}
          </motion.button>
        </div>
      </section>

      <motion.section 
        className="info-section features-section"
        variants={sectionVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="section-container">
          <h2>Stop Searching, Start Exploring</h2>
          <p className="section-intro">
            Cabito is for busy travelers and spontaneous explorers. Have a long layover or a free afternoon? Discover the city's best, effortlessly.
          </p>
          <div className="features-grid">
            <FeatureItem icon="🗺️" title="Instant Itineraries">
              Intelligent plans optimized for your specific time window, budget, and unique interests.
            </FeatureItem>
            <FeatureItem icon="🧭" title="Self-Guided Discovery">
              Explore confidently with a personalized route designed for your available hours.
            </FeatureItem>
            <FeatureItem icon="🚕" title="Seamless Travel (Future)">
              Future integration will offer cab booking timed perfectly for your itinerary stops.
            </FeatureItem>
            <FeatureItem icon="📸" title="Capture Memories (Future)">
              Save completed itineraries and (soon!) link photos directly to your travel moments.
            </FeatureItem>
          </div>
        </div>
      </motion.section>

      <motion.section 
        className="info-section how-it-works-section"
        variants={sectionVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
      >
         <div className="section-container">
            <h2>Get Your Custom Plan in 3 Simple Steps</h2>
            <div className="steps-grid">
                <StepItem number="1" title="Define Your Window">
                    Enter your destination, available date & time, start/end locations, and budget.
                </StepItem>
                <StepItem number="2" title="Select Preferences">
                    Choose what interests you most – from history and food to shopping or nightlife.
                </StepItem>
                <StepItem number="3" title="Receive & Explore!">
                    Get your optimized itinerary instantly. Adventure awaits!
                </StepItem>
            </div>
         </div>
      </motion.section>

      <motion.section 
        className="info-section value-prop-section"
        variants={sectionVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="section-container">
          <h2>Why Choose Cabito?</h2>
          <div className="value-points-grid">
            <ValuePointItem icon="⏳" title="Maximize Short Stays">
              Perfect for layovers, business trip gaps, or any few free hours. No more wasted time!
            </ValuePointItem>
            <ValuePointItem icon="🎯" title="Truly Personalized">
              Itineraries that genuinely match your interests, not just generic tourist routes.
            </ValuePointItem>
            <ValuePointItem icon="⚡" title="Instant & Effortless">
              Forget hours of research. Get a complete, optimized plan in seconds.
            </ValuePointItem>
          </div>
        </div>
      </motion.section>

      <section className="info-section final-cta-section">
        <div className="section-container">
          <motion.h3 
            className="final-cta-heading"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5 }}
          >
            Ready to Make the Most of Your Time?
          </motion.h3>
          <motion.button 
            onClick={handlePlanClick} 
            className="cta-button large-cta"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isAuthenticated ? 'Plan Your Next Micro-Adventure' : 'Get Started With Cabito'}
          </motion.button>
        </div>
      </section>

    </div>
  );
}
export default LandingPage;
