// /frontend/src/hooks/useItinerary.js (Corrected)

import { useState, useCallback } from 'react';
import { apiGenerateItinerary } from '../services/api';
import { toast } from 'react-toastify';

/**
 * A custom hook to manage the state and logic for fetching and handling a travel itinerary.
 */
export const useItinerary = () => {
  // State encapsulated within the hook
  const [itineraryData, setItineraryData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Generates a new itinerary by calling the API.
   * Handles setting loading states and processing success or error responses.
   * @param {object} formData - The payload for the itinerary request.
   */
  const generateItinerary = useCallback(async (formData) => {
    // MODIFICATION: No longer need to check for the token here. 
    // The customFetch wrapper in api.js will handle unauthorized states.

    setIsLoading(true);
    setError(null);
    setItineraryData(null);

    try {
      // MODIFICATION: The 'token' argument is no longer passed to the API function.
      const data = await apiGenerateItinerary(formData);
      
      setItineraryData(data);

      if (data?.itinerary?.length > 0) {
        toast.success("Itinerary generated successfully!");
      } else {
        toast.info(data?.notes || "No suitable activities found for your request.");
      }
      return data;
    } catch (err) {
      const errorMessage = err.message || 'Failed to generate itinerary.';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []); // MODIFICATION: Removed 'token' from the dependency array.

  /**
   * Resets the itinerary state back to its initial values.
   */
  const resetItinerary = useCallback(() => {
    setItineraryData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  // Expose the state and functions to the component that uses the hook
  return { itineraryData, isLoading, error, generateItinerary, resetItinerary, setItineraryData };
};