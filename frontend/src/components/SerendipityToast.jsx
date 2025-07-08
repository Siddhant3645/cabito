// /frontend/src/components/SerendipityToast.jsx
// v1.2 - Displays time extension information.

import React from 'react';
import { toast } from 'react-toastify';
import '../App.css';

const CustomSerendipityToast = ({
  closeToast,
  suggestion,
  onAccept,
  onRejectAndTryNext,
  onCancelAISuggestions
}) => {
  if (!suggestion || !suggestion.suggested_activity) {
    if(closeToast) closeToast();
    return null;
  }

  // +++ NEW: Logic to create the time extension message +++
  let timeExtensionMessage = null;
  if (suggestion.time_extension_minutes && suggestion.time_extension_minutes > 0) {
    const minutes = Math.round(suggestion.time_extension_minutes);
    timeExtensionMessage = `Note: This will extend your trip by ~${minutes} minute${minutes > 1 ? 's' : ''}.`;
  }

  return (
    <div className="serendipity-toast-content">
      <h4>{suggestion.actionable_text || "✨ Here's a quick idea!"}</h4>
      <div className="suggested-activity-details">
        <p>
          <strong>Consider:</strong> {suggestion.suggested_activity.activity}
          {suggestion.suggested_activity.ai_insight && (
            <span
              className="ai-insight-badge"
              title={`Cabito Tip: ${suggestion.suggested_activity.ai_insight}`}
            > ✨</span>
          )}
        </p>
        <p style={{fontSize: '0.85em', fontStyle: 'italic', color: 'var(--color-text-secondary)'}}>
            Around {suggestion.suggested_activity.estimated_duration_hrs.toFixed(1)} hrs
            {suggestion.suggested_activity.estimated_cost_inr > 0 && `, approx. ₹${suggestion.suggested_activity.estimated_cost_inr.toFixed(0)}`}
        </p>
      </div>

      {/* +++ NEW: Display the time extension message if it exists +++ */}
      {timeExtensionMessage && (
        <p className="serendipity-toast-note">{timeExtensionMessage}</p>
      )}

      <div className="serendipity-toast-actions">
        <button
          onClick={() => {
            onAccept(suggestion);
            if(closeToast) closeToast();
          }}
          className="toast-button accept"
        >
          Accept Idea
        </button>
        <button
          onClick={() => {
            onRejectAndTryNext(suggestion);
          }}
          className="toast-button next"
        >
          Next Idea 💡
        </button>
        <button
          onClick={() => {
            onCancelAISuggestions();
            if(closeToast) closeToast();
          }}
          className="toast-button cancel-ai"
        >
          Turn Off
        </button>
      </div>
    </div>
  );
};

export const showSerendipitySuggestionToast = (
    suggestion,
    onAccept,
    onRejectAndTryNext,
    onCancelAISuggestions
) => {
  if (!suggestion || !suggestion.actionable_text || !suggestion.suggested_activity) {
    console.warn("Skipping serendipity toast due to incomplete suggestion data:", suggestion);
    return null;
  }

  const toastId = `serendipity-toast`;
  toast.dismiss(toastId);

  toast(
    ({ closeToast }) => (
      <CustomSerendipityToast
        closeToast={closeToast}
        suggestion={suggestion}
        onAccept={onAccept}
        onRejectAndTryNext={onRejectAndTryNext}
        onCancelAISuggestions={onCancelAISuggestions}
      />
    ),
    {
      toastId: toastId,
      position: "top-right",
      autoClose: 20000, // Increased time to allow user to read the new info
      hideProgressBar: false,
      closeOnClick: false,
      pauseOnFocusLoss: true,
      pauseOnHover: true,
      draggable: true,
      className: 'serendipity-custom-toast',
    }
  );
  return toastId;
};