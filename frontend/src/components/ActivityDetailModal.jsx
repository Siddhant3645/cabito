// /frontend/src/components/ActivityDetailModal.jsx
// v1.1 - Added display for AI Insight
// REFINEMENT: Cost Display v1.0

import React from 'react';
import '../App.css'; // Ensure CSS is imported

// Helper function for formatting duration
function formatDuration(hours) {
    if (hours === null || hours === undefined || hours <= 0) return '-';
    if (hours < (1/60)) return '< 1 min';
    if (hours < 1.0) {
        const minutes = Math.max(1, Math.round(hours * 60));
        return `${minutes} min`;
    }
    return `${hours.toFixed(1)} hrs`;
}

function ActivityDetailModal({ isOpen, onClose, activity }) {
  if (!isOpen || !activity) {
    return null;
  }

  const formatDetail = (label, value, isEmphasized = false, isMonospace = false) => {
      // If value is explicitly null or undefined, but we want to show it (e.g. for "Variable" cost)
      // this check might hide it. We'll handle "Variable" text before calling this.
      // Original check: if (!value && value !== 0 && typeof value !== 'boolean') return null;
      // Modified slightly to allow explicit strings like "Free" or "Variable" to pass through even if they evaluate to "falsy" in some contexts
      if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) return null;

      const valueStyle = isMonospace ? { fontFamily: 'monospace', fontSize: '0.9em' } : {};
      return (
        <p style={isEmphasized ? { fontWeight: 'bold', fontStyle: 'italic' } : {}}>
            <strong>{label}:</strong> <span style={valueStyle}>{value.toString()}</span>
        </p>
      );
  };

  let displayType = 'Activity';
  const currentMatchedPrefs = activity.matched_preferences || [];
  if (activity.food_type) {
      displayType = activity.food_type.charAt(0).toUpperCase() + activity.food_type.slice(1);
      if (activity.specific_amenity) {
          displayType += ` (${activity.specific_amenity.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())})`;
      }
  } else if (currentMatchedPrefs.length > 0) {
      displayType = currentMatchedPrefs.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' | ');
  }

  // +++ MODIFIED Cost Display Logic for Modal +++
  let costTextForModal;
  const cost = activity.estimated_cost_inr;
  // Assuming `activity.tags` might be passed in the future for a more direct shop check.
  // For now, `matched_preferences` is the primary way to identify shopping.
  const isShoppingActivity = currentMatchedPrefs.includes('shopping') || (activity.tags && activity.tags.shop);

  if (cost === null || cost === undefined) { // Handles variable costs (e.g., shopping)
      if (isShoppingActivity) {
          costTextForModal = 'Variable (User Choice)';
      } else {
          // If cost is null but not explicitly shopping, could be intentionally not applicable
          costTextForModal = 'Not Applicable / Free';
      }
  } else if (typeof cost === 'number' && cost === 0) { // Explicitly free
      costTextForModal = 'Free';
  } else if (typeof cost === 'number' && cost > 0) { // Has a numeric cost
      costTextForModal = `₹${cost.toFixed(2)}`;
  } else {
      // Fallback if cost is some other non-null/undefined, non-numeric value (should ideally not happen)
      costTextForModal = 'N/A';
  }
  // +++ END MODIFIED Cost Display Logic for Modal +++

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="modal-close-button" aria-label="Close details">&times;</button>

        <h3>{activity.activity || 'Activity Details'}</h3>

        {activity.ai_insight && (
            <p className="ai-insight-text">
                <strong>✨ Cabito Tip:</strong> <em>{activity.ai_insight}</em>
            </p>
        )}

        {activity.description && activity.description !== activity.ai_insight && activity.description !== 'Place of interest.' && activity.description.length > 10 && (
            <p><strong>Details:</strong> <em>{activity.description}</em></p>
        )}

        {formatDetail('Type', displayType)}
        {formatDetail('Est. Arrival', activity.estimated_arrival ? new Date(activity.estimated_arrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '-')}
        {formatDetail('Est. Departure', activity.estimated_departure ? new Date(activity.estimated_departure).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '-')}
        {formatDetail('Est. Duration', formatDuration(activity.estimated_duration_hrs))}
        
        {/* Use the processed costTextForModal */}
        {formatDetail('Est. Cost', costTextForModal)}

        {/* Optional: Uncomment to show OSM ID if needed for debugging or other purposes */}
        {/* activity.osm_id && formatDetail('OSM ID', activity.osm_id, false, true) */}

      </div>
    </div>
  );
}

export default ActivityDetailModal;