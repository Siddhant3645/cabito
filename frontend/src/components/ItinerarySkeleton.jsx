// /frontend/src/components/ItinerarySkeleton.jsx
import React from 'react';
import '../App.css'; // Ensure your App.css (or a shared CSS file) has the skeleton styles

const SkeletonRow = () => (
    <tr className="skeleton-row">
        <td><div className="skeleton skeleton-checkbox"></div></td>
        <td><div className="skeleton skeleton-text-long"></div><div className="skeleton skeleton-text-medium" style={{ marginTop: '5px', width: '60%' }}></div></td>
        <td><div className="skeleton skeleton-text-short" style={{ margin: '0 auto' }}></div></td> {/* Centered emoji placeholder */}
        <td><div className="skeleton skeleton-text-medium"></div></td>
        <td><div className="skeleton skeleton-text-medium"></div></td>
        <td><div className="skeleton skeleton-text-short" style={{ float: 'right' }}></div></td> {/* Aligned right for duration */}
        <td><div className="skeleton skeleton-text-short" style={{ float: 'right' }}></div></td> {/* Aligned right for cost */}
        <td><div className="skeleton skeleton-button-small" style={{ margin: '0 auto' }}></div></td> {/* Centered button placeholder */}
    </tr>
);

// Accept message prop, provide default
const ItinerarySkeleton = ({ rows = 4, message = "Crafting your Itinerary..." }) => {
  return (
    <div className="itinerary-display loading skeleton-loading">
        {/* Use the message prop for the title */}
        <h2>{message}</h2>
        {/* Optional: Keep or modify the subtitle */}
        <p className="skeleton-subtitle" style={{ textAlign: 'center', marginBottom: '20px', color: 'var(--color-mid-blue)' }}>
            Please wait a moment while we curate the perfect micro-adventure for you!
        </p>
        <table className="itinerary-table is-skeleton">
            <thead>
                <tr>
                    {/* Using specific widths from your ItineraryDisplay table for consistency */}
                    <th style={{ width: '5%' }}><div className="skeleton skeleton-header" style={{height: '16px'}}></div></th>
                    <th style={{ width: '32%' }}><div className="skeleton skeleton-header" style={{height: '16px'}}></div></th>
                    <th className="prefs-header"><div className="skeleton skeleton-header" style={{height: '16px'}}></div></th>
                    <th style={{ width: '11%' }}><div className="skeleton skeleton-header" style={{height: '16px'}}></div></th>
                    <th style={{ width: '11%' }}><div className="skeleton skeleton-header" style={{height: '16px'}}></div></th>
                    <th style={{ width: '10%' }}><div className="skeleton skeleton-header" style={{height: '16px'}}></div></th>
                    <th style={{ width: '11%' }}><div className="skeleton skeleton-header" style={{height: '16px'}}></div></th>
                    <th style={{ width: '8%' }}><div className="skeleton skeleton-header" style={{height: '16px'}}></div></th>
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