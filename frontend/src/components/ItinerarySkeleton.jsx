// /frontend/src/components/ItinerarySkeleton.jsx (Refactored)

import React from 'react';
import styles from './ItinerarySkeleton.module.css';

const SkeletonRow = () => (
    <tr className={styles.row}>
        <td className="mobile-hidden"><div className={`${styles.skeleton} ${styles.checkbox}`}></div></td>
        <td><div className={`${styles.skeleton} ${styles.textLong}`}></div><div className={`${styles.skeleton} ${styles.textMedium}`} style={{ marginTop: '5px', width: '60%' }}></div></td>
        <td className="mobile-hidden"><div className={`${styles.skeleton} ${styles.textShort}`} style={{ margin: '0 auto' }}></div></td>
        <td className="mobile-hidden"><div className={`${styles.skeleton} ${styles.textMedium}`}></div></td>
        <td><div className={`${styles.skeleton} ${styles.textMedium}`}></div></td>
        <td><div className={`${styles.skeleton} ${styles.textShort}`} style={{ float: 'right' }}></div></td>
        <td><div className={`${styles.skeleton} ${styles.textShort}`} style={{ float: 'right' }}></div></td>
        <td><div className={`${styles.skeleton} ${styles.buttonSmall}`} style={{ margin: '0 auto' }}></div></td>
    </tr>
);

const ItinerarySkeleton = ({ rows = 4, message = "Crafting your Itinerary..." }) => {
  return (
    <div className={styles.skeletonLoading}>
        <h2>{message}</h2>
        <p className={styles.subtitle}>
            Please wait a moment while we curate the perfect micro-adventure for you!
        </p>
        <table className={styles.table}>
            <thead>
                <tr>
                    <th style={{ width: '5%' }} className="mobile-hidden"><div className={`${styles.skeleton} ${styles.header}`}></div></th>
                    <th style={{ width: '32%' }}><div className={`${styles.skeleton} ${styles.header}`}></div></th>
                    <th className="prefs-header mobile-hidden"><div className={`${styles.skeleton} ${styles.header}`}></div></th>
                    <th style={{ width: '11%' }} className="mobile-hidden"><div className={`${styles.skeleton} ${styles.header}`}></div></th>
                    <th style={{ width: '11%' }}><div className={`${styles.skeleton} ${styles.header}`}></div></th>
                    <th style={{ width: '10%' }}><div className={`${styles.skeleton} ${styles.header}`}></div></th>
                    <th style={{ width: '11%' }}><div className={`${styles.skeleton} ${styles.header}`}></div></th>
                    <th style={{ width: '8%' }}><div className={`${styles.skeleton} ${styles.header}`}></div></th>
                </tr>
            </thead>
            <tbody>
                {Array.from({ length: rows }).map((_, i) => <SkeletonRow key={i} />)}
            </tbody>
        </table>
    </div>
  );
};

export default ItinerarySkeleton;