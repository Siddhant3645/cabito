// /frontend/src/components/ItinerarySkeleton.jsx (Complete with responsive classes)

import React from 'react';
import '../App.css'; 

const SkeletonRow = () => (
    <tr className="skeleton-row">
        <td className="mobile-hidden"><div className="skeleton skeleton-checkbox"></div></td>
        <td><div className="skeleton skeleton-text-long"></div><div className="skeleton skeleton-text-medium" style={{ marginTop: '5px', width: '60%' }}></div></td>
        <td className="mobile-hidden"><div className="skeleton skeleton-text-short" style={{ margin: '0 auto' }}></div></td>
        <td className="mobile-hidden"><div className="skeleton skeleton-text-medium"></div></td>
        <td><div className="skeleton skeleton-text-medium"></div></td>
        <td><div className="skeleton skeleton-text-short" style={{ float: 'right' }}></div></td>
        <td><div className="skeleton skeleton-text-short" style={{ float: 'right' }}></div></td>
        <td><div className="skeleton skeleton-button-small" style={{ margin: '0 auto' }}></div></td>
    </tr>
);

const ItinerarySkeleton = ({ rows = 4, message = "Crafting your Itinerary..." }) => {
  return (
    <div className="itinerary-display loading skeleton-loading">
        <h2>{message}</h2>
        <p className="skeleton-subtitle" style={{ textAlign: 'center', marginBottom: '20px', color: 'var(--color-mid-blue)' }}>
            Please wait a moment while we curate the perfect micro-adventure for you!
        </p>
        <table className="itinerary-table is-skeleton">
            <thead>
                <tr>
                    <th style={{ width: '5%' }} className="mobile-hidden"><div className="skeleton skeleton-header"></div></th>
                    <th style={{ width: '32%' }}><div className="skeleton skeleton-header"></div></th>
                    <th className="prefs-header mobile-hidden"><div className="skeleton skeleton-header"></div></th>
                    <th style={{ width: '11%' }} className="mobile-hidden"><div className="skeleton skeleton-header"></div></th>
                    <th style={{ width: '11%' }}><div className="skeleton skeleton-header"></div></th>
                    <th style={{ width: '10%' }}><div className="skeleton skeleton-header"></div></th>
                    <th style={{ width: '11%' }}><div className="skeleton skeleton-header"></div></th>
                    <th style={{ width: '8%' }}><div className="skeleton skeleton-header"></div></th>
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