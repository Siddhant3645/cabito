// /frontend/src/pages/PlannerPage.jsx (Final with Button Fix)

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useItinerary } from '../hooks/useItinerary';
import ItineraryForm from '../components/ItineraryForm';
import ItineraryDisplay from '../components/ItineraryDisplay';
import ItinerarySkeleton from '../components/ItinerarySkeleton';
import ActivityDetailModal from '../components/ActivityDetailModal';
import EngagingLoader from '../components/EngagingLoader';
import {
    apiGetSerendipitySuggestion,
    apiMarkTripComplete,
    apiInsertActivityIntoItinerary
} from '../services/api';
import { showSerendipitySuggestionToast } from '../components/SerendipityToast';
import { toast } from 'react-toastify';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import styles from './PlannerPage.module.css';

const MAX_AUTOMATIC_SERENDIPITY_SUGGESTIONS = 2;
const SERENDIPITY_FETCH_INTERVAL_MS = 5 * 60 * 1000;

function PlannerPage() {
    const { user } = useAuth();
    const { itineraryData, isLoading, error, generateItinerary, resetItinerary, setItineraryData } = useItinerary();

    const [originalFormData, setOriginalFormData] = useState(null);
    const [currentTripUuid, setCurrentTripUuid] = useState(null);
    const [tripStatus, setTripStatus] = useState("generated");
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [completedIndices, setCompletedIndices] = useState(new Set());
    const [excludedIds, setExcludedIds] = useState(new Set());
    const [activityDetailModalOpen, setActivityDetailModalOpen] = useState(false);
    const [selectedActivityForDetail, setSelectedActivityForDetail] = useState(null);
    const [activeLoader, setActiveLoader] = useState(null);

    const [aiSuggestionsDisabled, setAiSuggestionsDisabled] = useState(false);
    const [isFetchingSerendipity, setIsFetchingSerendipity] = useState(false);
    const [noMoreSerendipitySuggestions, setNoMoreSerendipitySuggestions] = useState(false);
    const [processedSerendipityOsmIds, setProcessedSerendipityOsmIds] = useState(new Set());
    const [automaticSerendipityFetchCount, setAutomaticSerendipityFetchCount] = useState(0);
    const serendipityIntervalRef = useRef(null);
    
    useBodyScrollLock(activityDetailModalOpen);

    const isTripCompleted = useMemo(() => tripStatus === "completed", [tripStatus]);

    const handleGenerateItinerary = useCallback(async (formData, loaderType) => {
        setActiveLoader(loaderType);
        resetItinerary();
        if (serendipityIntervalRef.current) clearInterval(serendipityIntervalRef.current);
        toast.dismiss('serendipity-toast');
        
        setOriginalFormData(formData);
        setExcludedIds(new Set());
        setCompletedIndices(new Set());
        setCurrentTripUuid(null);
        setTripStatus("generated");
        setAiSuggestionsDisabled(false);
        setNoMoreSerendipitySuggestions(false);
        setProcessedSerendipityOsmIds(new Set());
        setAutomaticSerendipityFetchCount(0);

        const data = await generateItinerary(formData);

        if (data) {
            if (data.start_lat && data.start_lon) {
                setOriginalFormData(current => ({ ...current, start_lat: data.start_lat, start_lon: data.start_lon }));
            }
            if (data.trip_uuid) {
                setCurrentTripUuid(data.trip_uuid);
            }
        }
        setActiveLoader(null);
    }, [generateItinerary, resetItinerary]);

    const handleRemoveAndRegenerate = useCallback(async (osmIdToRemove) => {
        if (!originalFormData) {
            toast.warn("Cannot regenerate. Original plan details missing.");
            return;
        }
        if (isTripCompleted) {
            toast.info("Cannot modify a completed trip.");
            return;
        }
        if (serendipityIntervalRef.current) clearInterval(serendipityIntervalRef.current);
        
        const newExcludedIds = new Set(excludedIds).add(osmIdToRemove);
        setExcludedIds(newExcludedIds);
        
        const regenerationPayload = { ...originalFormData, exclude_osm_ids: Array.from(newExcludedIds) };
        
        setIsRegenerating(true);
        const removedActivityName = itineraryData?.itinerary?.find(item => item.osm_id === osmIdToRemove)?.activity || 'the selected item';
        toast.info(`Regenerating itinerary without "${removedActivityName}"...`);
        
        const data = await generateItinerary(regenerationPayload); 
        
        if (data && data.trip_uuid) {
            setCurrentTripUuid(data.trip_uuid);
        }
        setCompletedIndices(new Set());
        setTripStatus("generated");

        setIsRegenerating(false);
    }, [originalFormData, excludedIds, itineraryData, isTripCompleted, generateItinerary]);

    const handleToggleComplete = useCallback((index) => {
        if (isTripCompleted) {
            toast.info("This trip is already complete.");
            return;
        }
        setCompletedIndices(prevIndices => {
            const newIndices = new Set(prevIndices);
            if (newIndices.has(index)) newIndices.delete(index);
            else newIndices.add(index);
            return newIndices;
        });
    }, [isTripCompleted]);
  
    const markCurrentTripComplete = useCallback(async () => {
        if (!currentTripUuid || isTripCompleted) return;
        
        setTripStatus("completed"); 
        try {
            const response = await apiMarkTripComplete(currentTripUuid);
            toast.success(response.message || "Trip marked as completed!");
        } catch (err) {
            toast.error(err.message || "Could not mark trip as complete.");
            setTripStatus("generated");
        }
    }, [currentTripUuid, isTripCompleted]);

    const handleResetPlanner = useCallback(() => {
        resetItinerary();
        setOriginalFormData(null);
        setExcludedIds(new Set());
        setCompletedIndices(new Set());
        setCurrentTripUuid(null);
        setTripStatus("generated");
        setAiSuggestionsDisabled(false);
        setNoMoreSerendipitySuggestions(false);
        setProcessedSerendipityOsmIds(new Set());
        setAutomaticSerendipityFetchCount(0);
        if (serendipityIntervalRef.current) clearInterval(serendipityIntervalRef.current);
        toast.dismiss('serendipity-toast');
    }, [resetItinerary]);
    
    const handleAcceptSerendipity = useCallback((suggestion) => {
        toast.dismiss('serendipity-toast');
        if (serendipityIntervalRef.current) clearInterval(serendipityIntervalRef.current);

        setItineraryData(currentItineraryData => {
            if (!currentItineraryData || !originalFormData) {
                toast.error("Cannot add suggestion: current plan details are missing.");
                return currentItineraryData;
            }

            setIsRegenerating(true);
            toast.info(`Adding "${suggestion.suggested_activity.activity}" to your plan...`);
            
            apiInsertActivityIntoItinerary({
                current_itinerary: currentItineraryData.itinerary,
                new_activity: suggestion.suggested_activity,
                original_request: originalFormData,
                current_heading: currentItineraryData.custom_heading,
                current_weather: currentItineraryData.weather_info
            }).then(newItineraryData => {
                setItineraryData(newItineraryData);
                setCompletedIndices(new Set());
                setExcludedIds(prev => new Set(prev).add(suggestion.suggested_activity.osm_id));
                toast.success("Itinerary updated successfully!");
            }).catch(err => {
                console.error("Failed to insert activity:", err);
                toast.error(`Could not add suggestion: ${err.message}`);
            }).finally(() => {
                setIsRegenerating(false);
                setAiSuggestionsDisabled(true);
            });

            return currentItineraryData;
        });
    }, [originalFormData, setItineraryData]);

    const handleCancelAISuggestions = useCallback(() => {
        setAiSuggestionsDisabled(true); 
        if (serendipityIntervalRef.current) clearInterval(serendipityIntervalRef.current);
        toast.info("AI serendipity suggestions turned off for this plan."); 
        toast.dismiss('serendipity-toast');
    }, []);

    const fetchAndShowSuggestion = useCallback(async (isManualRequest = false) => {
        if (isFetchingSerendipity || noMoreSerendipitySuggestions || !originalFormData || !itineraryData || !user) return;
        if (!isManualRequest && automaticSerendipityFetchCount >= MAX_AUTOMATIC_SERENDIPITY_SUGGESTIONS) {
            if (serendipityIntervalRef.current) clearInterval(serendipityIntervalRef.current);
            return;
        }

        setIsFetchingSerendipity(true);
        if (!isManualRequest) {
            setAutomaticSerendipityFetchCount(count => count + 1);
        }
        
        const { currency, ...requestDetails } = originalFormData;
        const payload = {
            current_itinerary: itineraryData.itinerary,
            original_request_details: requestDetails,
            excluded_serendipity_ids: Array.from(processedSerendipityOsmIds).map(String),
        };

        try {
            const suggestion = await apiGetSerendipitySuggestion(payload);
            if (suggestion && suggestion.suggestion_id) {
                setProcessedSerendipityOsmIds(prev => new Set(prev).add(suggestion.suggested_activity.osm_id));
                showSerendipitySuggestionToast(suggestion, handleAcceptSerendipity, handleRejectAndTryNextSerendipity, handleCancelAISuggestions);
            } else {
                setNoMoreSerendipitySuggestions(true);
                toast.info("No more spontaneous suggestions found for this area!");
                if (serendipityIntervalRef.current) clearInterval(serendipityIntervalRef.current);
            }
        } catch (error) {
            console.error("Failed to fetch serendipity suggestion:", error);
            setNoMoreSerendipitySuggestions(true);
            if (serendipityIntervalRef.current) clearInterval(serendipityIntervalRef.current);
        } finally {
            setIsFetchingSerendipity(false);
        }
    }, [
        user, itineraryData, originalFormData, isFetchingSerendipity, noMoreSerendipitySuggestions,
        processedSerendipityOsmIds, automaticSerendipityFetchCount, handleAcceptSerendipity, handleCancelAISuggestions
    ]);

    const handleRejectAndTryNextSerendipity = useCallback(async (rejectedSuggestion) => {
        if (rejectedSuggestion && rejectedSuggestion.suggested_activity.osm_id) {
            setProcessedSerendipityOsmIds(prev => new Set(prev).add(rejectedSuggestion.suggested_activity.osm_id));
        }
        toast.dismiss('serendipity-toast');
        toast.info("Finding another suggestion...");
        await fetchAndShowSuggestion(true);
    }, [fetchAndShowSuggestion]);

    useEffect(() => {
        const canRunAutomaticSerendipity =
            itineraryData && itineraryData.itinerary?.length > 0 &&
            !isTripCompleted && !aiSuggestionsDisabled;

        if (canRunAutomaticSerendipity) {
            if (serendipityIntervalRef.current) clearInterval(serendipityIntervalRef.current);
            const initialTimeout = setTimeout(() => fetchAndShowSuggestion(false), 8000);
            serendipityIntervalRef.current = setInterval(() => fetchAndShowSuggestion(false), SERENDIPITY_FETCH_INTERVAL_MS);
            return () => { clearTimeout(initialTimeout); if (serendipityIntervalRef.current) clearInterval(serendipityIntervalRef.current); };
        } else {
            if (serendipityIntervalRef.current) clearInterval(serendipityIntervalRef.current);
        }
    }, [itineraryData, isTripCompleted, aiSuggestionsDisabled, fetchAndShowSuggestion]);
      
    const progressPercentage = useMemo(() => { 
        if(!itineraryData?.itinerary) return 0;
        const activityItems = itineraryData.itinerary.filter(i => i.leg_type === 'ACTIVITY');
        if (activityItems.length === 0) return isTripCompleted ? 100 : 0;
        const completedCount = activityItems.filter((item) => completedIndices.has(itineraryData.itinerary.indexOf(item))).length;
        return Math.round((completedCount / activityItems.length) * 100);
    }, [itineraryData, completedIndices, isTripCompleted]);

    useEffect(() => {
        if (progressPercentage >= 100 && !isTripCompleted && currentTripUuid) {
            toast.success("All activities completed! Marking trip as complete.");
            markCurrentTripComplete();
        }
    }, [progressPercentage, isTripCompleted, currentTripUuid, markCurrentTripComplete]);

    const loadingMessage = useMemo(() => {
        if (!isLoading) return '';
        if (originalFormData) {
            const loc = originalFormData.location || `your selected coordinates`;
            return `Finding places near ${loc}...`;
        }
        return 'Crafting your itinerary...';
    }, [isLoading, originalFormData]);
    
    return (
        <div className="App-container">
            <main className={styles.plannerContentCard}>
                
                {!isLoading && !itineraryData && (
                    <>
                        <h2>Let's Plan Your Getaway!</h2>
                        <ItineraryForm 
                            onSubmit={handleGenerateItinerary} 
                            activeLoader={activeLoader}
                        />
                    </>
                )}

                {isLoading && (
                    <div className={styles.displaySection}>
                        <EngagingLoader />
                        <ItinerarySkeleton rows={5} message={loadingMessage} />
                    </div>
                )}
                
                {itineraryData && (
                    <div className={styles.displaySection}>
                        <ItineraryDisplay
                           itineraryData={itineraryData}
                           onRemove={handleRemoveAndRegenerate}
                           completedIndices={completedIndices}
                           onToggleComplete={handleToggleComplete}
                           isViewOnly={isTripCompleted}
                           onOpenActivityDetail={(activity) => {
                             setSelectedActivityForDetail(activity);
                             setActivityDetailModalOpen(true);
                           }}
                           originalFormData={originalFormData}
                        >
                            <div className={styles.actionButtonContainer}>
                                {!isTripCompleted && (
                                    <button 
                                        onClick={markCurrentTripComplete} 
                                        className='cta-button'
                                        style={{backgroundColor: '#2c7a7b'}}
                                        disabled={isLoading || isRegenerating}
                                    >
                                        🏁 Mark Trip as Done
                                    </button>
                                )}
                                <button 
                                  onClick={handleResetPlanner} 
                                  className='cta-button'
                                  style={{backgroundColor: '#718096'}}
                                >
                                    Reset & Plan New
                                </button>
                            </div>
                        </ItineraryDisplay>
                    </div>
                )}

                {error && !isLoading && (
                   <div className={styles.displaySection}>
                       <div className={styles.errorDisplay}>
                         <p>⚠️ {error}</p>
                         <button onClick={handleResetPlanner} className={styles.resetButton}>Clear & Reset</button>
                       </div>
                   </div>
                )}
            </main>
            
            {activityDetailModalOpen && (
                <ActivityDetailModal
                    isOpen={activityDetailModalOpen}
                    onClose={() => setActivityDetailModalOpen(false)}
                    activity={selectedActivityForDetail}
                />
            )}
        </div>
    );
}

export default PlannerPage;