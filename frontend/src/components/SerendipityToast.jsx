// /frontend/src/components/SerendipityToast.jsx (Refactored)

import React from 'react';
import { toast } from 'react-toastify';
import styles from './SerendipityToast.module.css';

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

  let timeExtensionMessage = null;
  if (suggestion.time_extension_minutes && suggestion.time_extension_minutes > 0) {
    const minutes = Math.round(suggestion.time_extension_minutes);
    timeExtensionMessage = `Note: This will extend your trip by ~${minutes} minute${minutes > 1 ? 's' : ''}.`;
  }

  return (
    <div className={styles.toastContent}>
      <h4>{suggestion.actionable_text || "✨ Here's a quick idea!"}</h4>
      <div className={styles.suggestedActivityDetails}>
        <p>
          <strong>Consider:</strong> {suggestion.suggested_activity.activity}
          {suggestion.suggested_activity.ai_insight && (
            <span
              className={styles.aiInsightBadge}
              title={`Cabito Tip: ${suggestion.suggested_activity.ai_insight}`}
            > ✨</span>
          )}
        </p>
        <p style={{fontSize: '0.85em', fontStyle: 'italic', color: 'var(--color-text-secondary)'}}>
            Around {suggestion.suggested_activity.estimated_duration_hrs.toFixed(1)} hrs
            {suggestion.suggested_activity.estimated_cost_inr > 0 && `, approx. ₹${suggestion.suggested_activity.estimated_cost_inr.toFixed(0)}`}
        </p>
      </div>

      {timeExtensionMessage && (
        <p className={styles.toastNote}>{timeExtensionMessage}</p>
      )}

      <div className={styles.toastActions}>
        <button
          onClick={() => {
            onAccept(suggestion);
            if(closeToast) closeToast();
          }}
          className={`${styles.toastButton} ${styles.accept}`}
        >
          Accept Idea
        </button>
        <button
          onClick={() => {
            onRejectAndTryNext(suggestion);
          }}
          className={`${styles.toastButton} ${styles.next}`}
        >
          Next Idea 💡
        </button>
        <button
          onClick={() => {
            onCancelAISuggestions();
            if(closeToast) closeToast();
          }}
          className={`${styles.toastButton} ${styles.cancelAi}`}
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
      autoClose: 20000,
      hideProgressBar: false,
      closeOnClick: false,
      pauseOnFocusLoss: true,
      pauseOnHover: true,
      draggable: true,
      className: 'serendipity-custom-toast', // This global class is targeted by the module
    }
  );
  return toastId;
};