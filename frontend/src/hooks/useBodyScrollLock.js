import { useEffect } from 'react';

/**
 * A custom React hook to lock and unlock body scrolling.
 * @param {boolean} isLocked - A boolean state indicating whether the scroll should be locked.
 */
export const useBodyScrollLock = (isLocked) => {
  useEffect(() => {
    // Get original body overflow style to restore it later
    const originalStyle = window.getComputedStyle(document.body).overflow;
    
    // If the modal is open (isLocked is true), hide the body's scrollbar
    if (isLocked) {
      document.body.style.overflow = 'hidden';
    }

    // On cleanup, restore the original style
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isLocked]); // This effect only runs when the 'isLocked' state changes
};