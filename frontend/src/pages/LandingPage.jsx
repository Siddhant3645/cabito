// /frontend/src/pages/LandingPage.jsx (Complete & Refactored)

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import styles from './LandingPage.module.css';

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

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

const FeatureItem = ({ icon, title, children }) => (
    <motion.div className={styles.featureItem} variants={itemVariants}>
        <div className={styles.featureIcon}>{icon}</div>
        <h3>{title}</h3>
        <p>{children}</p>
    </motion.div>
);

const StepItem = ({ number, title, children }) => (
    <motion.div className={styles.stepItem} variants={itemVariants}>
        <div className={styles.stepNumberVisual}>{number}</div>
        <h3>{title}</h3>
        <p>{children}</p>
    </motion.div>
);

const ValuePointItem = ({ icon, title, children }) => (
    <motion.div className={styles.valuePoint} variants={itemVariants}>
        <div className={styles.valueIcon}>{icon}</div>
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
    <div className={styles.landingPageWrapper}>

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <motion.h1 
            className={styles.heroBrandTitle}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Cabito
          </motion.h1>
          <motion.p 
            className={styles.heroSubtitle}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Your Smart Micro-Trip Planner
          </motion.p>
          <motion.button 
            onClick={handlePlanClick} 
            className={`${styles.ctaButton} ${styles.largeCta}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5, type: 'spring', stiffness: 120 }}
          >
            {isAuthenticated ? 'Go to Planner' : 'Plan Your Adventure Now'}
          </motion.button>
        </div>
      </section>

      <motion.section 
        className={`${styles.infoSection} ${styles.featuresSection}`}
        variants={sectionVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className={styles.sectionContainer}>
          <h2>Stop Searching, Start Exploring</h2>
          <p className={styles.sectionIntro}>
            Cabito is for busy travelers and spontaneous explorers. Have a long layover or a free afternoon? Discover the city's best, effortlessly.
          </p>
          <div className={styles.featuresGrid}>
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
        className={`${styles.infoSection} ${styles.howItWorksSection}`}
        variants={sectionVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
      >
         <div className={styles.sectionContainer}>
            <h2>Get Your Custom Plan in 3 Simple Steps</h2>
            <div className={styles.stepsGrid}>
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
        className={`${styles.infoSection} ${styles.valuePropSection}`}
        variants={sectionVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className={styles.sectionContainer}>
          <h2>Why Choose Cabito?</h2>
          <div className={styles.valuePointsGrid}>
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

      <section className={`${styles.infoSection} ${styles.finalCtaSection}`}>
        <div className={styles.sectionContainer}>
          <motion.h3 
            className={styles.finalCtaHeading}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5 }}
          >
            Ready to Make the Most of Your Time?
          </motion.h3>
          <motion.button 
            onClick={handlePlanClick} 
            className={`${styles.ctaButton} ${styles.largeCta}`}
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