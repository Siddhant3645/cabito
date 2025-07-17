// /frontend/src/components/ItineraryDisplay.jsx (Complete)

import React, { useState, useEffect, useLayoutEffect } from 'react';
import Confetti from 'react-confetti';
import ActivityDetailModal from './ActivityDetailModal';
import MapView from './MapView';
import styles from './ItineraryDisplay.module.css';

function useWindowSize() {
  const [size, setSize] = useState([window.innerWidth, window.innerHeight]);
  useLayoutEffect(() => {
    function updateSize() {
      setSize([window.innerWidth, window.innerHeight]);
    }
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  return size;
}

const PREFERENCE_DESCRIPTIONS = {
    foodie: 'Food / Drink', history: 'Historic Site / Museum', sights: 'Sightseeing / Viewpoint',
    shopping: 'Shopping', nightlife: 'Nightlife Venue', park: 'Park / Garden', religious: 'Place of Worship',
    restaurant: 'Restaurant', cafe: 'Cafe', bar: 'Bar / Pub', pub: 'Bar / Pub', museum: 'Museum',
    attraction: 'Attraction', viewpoint: 'Viewpoint', park_garden: 'Park / Garden',
    place_of_worship: 'Place of Worship', ice_cream: 'Ice Cream Shop',
    juice_bar: 'Juice Bar', tea_house: 'Tea House', biergarten: 'Biergarten', nightclub: 'Nightclub',
};
const GENERAL_PREFERENCE_EMOJIS = {
    history: '🏛️', sights: '📸', shopping: '🛍️', nightlife: '🎉', park: '🌳', religious: '🛐'
};
const AMENITY_EMOJIS = {'museum':'🏛️','theatre':'🎭','cinema':'🎬','nightclub':'🎉','bar':'🍺','pub':'🍺','biergarten':'🍺','cafe':'☕','tea_house':'🍵','ice_cream_parlor':'🍦','juice_bar':'🥤',};
const DEFAULT_ACTIVITY_EMOJI = '📍';

function formatDuration(hours) {
    if (hours === null || hours === undefined || hours <= 0) return '-';
    if (hours < (1/60)) return '< 1 min';
    if (hours < 1.0) {
        const minutes = Math.max(1, Math.round(hours * 60));
        return `${minutes} min`;
    }
    return `${hours.toFixed(1)} hrs`;
}

const formatActivityEmojis = (preferences, foodType, specificAmenity) => {
    const emojiSet = new Set();
    const prefsArray = Array.isArray(preferences) ? preferences : [];
    if (specificAmenity && AMENITY_EMOJIS[specificAmenity]) { emojiSet.add(AMENITY_EMOJIS[specificAmenity]); }
    if (foodType === 'meal') emojiSet.add('🍽️'); else if (foodType === 'snack') emojiSet.add('🍿');
    prefsArray.forEach(prefKey => { if (GENERAL_PREFERENCE_EMOJIS[prefKey]) emojiSet.add(GENERAL_PREFERENCE_EMOJIS[prefKey]); });
    if (emojiSet.size === 0) return DEFAULT_ACTIVITY_EMOJI;
    return Array.from(emojiSet).join(' ');
};

const getActivityDescriptionTooltip = (preferences, foodType, specificAmenity) => {
    const descriptions = new Set();
    (Array.isArray(preferences) ? preferences : []).forEach(p => { if(PREFERENCE_DESCRIPTIONS[p]) descriptions.add(PREFERENCE_DESCRIPTIONS[p]); });
    if(specificAmenity && PREFERENCE_DESCRIPTIONS[specificAmenity]) descriptions.add(PREFERENCE_DESCRIPTIONS[specificAmenity]);
    if(foodType) descriptions.add(foodType.charAt(0).toUpperCase() + foodType.slice(1));
    if (descriptions.size === 0) return "Activity";
    return Array.from(descriptions).join(' | ');
};

const formatTimeToLocalAMPM = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleTimeString(navigator.language, { hour: '2-digit', minute: '2-digit', hour12: true });
};

const getTimeOfDaySymbol = (descriptor, isDay) => {
    if (descriptor === "Morning") return "🌅"; if (descriptor === "Afternoon") return "☀️";
    if (descriptor === "Evening") return "🌇"; if (descriptor === "Night") return "🌙";
    return isDay ? "☀️" : "🌙";
};

const ItinerarySummary = ({ data }) => {
    if (!data) return null;
    const { start_datetime, end_datetime, budget, currency, location } = data.original_request_details || data;
    const startDate = new Date(start_datetime);
    const endDate = new Date(end_datetime);

    const formatSummaryDate = (date) => date.toLocaleDateString(undefined, {
        weekday: 'short', month: 'short', day: 'numeric'
    });
    
    const formatSummaryTime = (date) => date.toLocaleTimeString(undefined, {
        hour: '2-digit', minute: '2-digit', hour12: true
    });

    const calculateDuration = (start, end) => {
        const diffMillis = end.getTime() - start.getTime();
        const totalHours = diffMillis / (1000 * 60 * 60);
        const days = Math.floor(totalHours / 24);
        const hours = Math.floor(totalHours) % 24;
        const minutes = Math.round((totalHours * 60) % 60);
        let parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        return parts.join(' ') || '0m';
    };

    return (
        <div className={styles.itinerarySummaryBox}>
            <div className={styles.summaryItem}><span className={styles.summaryLabel}>📍 Location</span><span className={styles.summaryValue}>{location}</span></div>
            <div className={styles.summaryItem}><span className={styles.summaryLabel}>▶️ From</span><span className={styles.summaryValue}>{formatSummaryDate(startDate)}, {formatSummaryTime(startDate)}</span></div>
            <div className={styles.summaryItem}><span className={styles.summaryLabel}>⏹️ To</span><span className={styles.summaryValue}>{formatSummaryDate(endDate)}, {formatSummaryTime(endDate)}</span></div>
            <div className={styles.summaryItem}><span className={styles.summaryLabel}>⏳ Duration</span><span className={styles.summaryValue}>{calculateDuration(startDate, endDate)}</span></div>
            <div className={styles.summaryItem}><span className={styles.summaryLabel}>💰 Budget</span><span className={styles.summaryValue}>~ {new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency || 'INR' }).format(budget)}</span></div>
        </div>
    );
};

function ItineraryDisplay({ itineraryData, onRemove, completedIndices, onToggleComplete, progressPercentage, isRegenerating, tripStatus, isViewOnly = false, onOpenActivityDetail, originalFormData }) {
    const [isActivityDetailModalOpen, setIsActivityDetailModalOpen] = useState(false);
    const [selectedActivityForDetail, setSelectedActivityForDetail] = useState(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [width, height] = useWindowSize();
    const [isMapVisible, setIsMapVisible] = useState(false);
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [expandedIndex, setExpandedIndex] = useState(null);

    useEffect(() => {
        if (progressPercentage >= 100 && !isViewOnly) {
            setShowConfetti(true);
        }
    }, [progressPercentage, isViewOnly]);
    
    if (!itineraryData) return null;

    const hasActivities = itineraryData.itinerary && itineraryData.itinerary.length > 0;
    const weather = itineraryData.weather_info;

    const handleOpenActivityDetailModal = (activityItem) => {
        if (onOpenActivityDetail) { onOpenActivityDetail(activityItem); }
        else { setSelectedActivityForDetail(activityItem); setIsActivityDetailModalOpen(true); }
    };

    const handleCardClick = (index, item) => {
        if (item.leg_type !== 'ACTIVITY' || isViewOnly) return;

        if (expandedIndex === index) {
            setExpandedIndex(null);
        } else {
            setExpandedIndex(index);
        }
    };
    
    return (
        <div className={styles.itineraryDisplay}>
            {showConfetti && <Confetti width={width} height={height} recycle={false} onConfettiComplete={() => setShowConfetti(false)} />}
            
            <div className={styles.itineraryDisplayBox}>
                {itineraryData.custom_heading && (
                    <div className={styles.customHeading}><h3>{itineraryData.custom_heading}</h3></div>
                )}
                
                {weather && ( 
                    <div className={styles.weatherDisplayBox}>
                         <div className={styles.weatherColPrimary}>
                             <span className={styles.weatherMainIcon} title={weather.time_of_day_descriptor || weather.condition.description}>{getTimeOfDaySymbol(weather.time_of_day_descriptor, weather.is_day)}</span>
                             <div className={styles.weatherPrimaryText}>
                                 <span className={styles.weatherTemp}>{Math.round(weather.temperature_celsius)}°C</span>
                                 <span className={styles.weatherConditionText}>
                                     {weather.condition.description}
                                     {weather.time_of_day_descriptor && (
                                         <span className={styles.dayNightIndicator}>({weather.time_of_day_descriptor})</span>
                                     )}
                                 </span>
                                 <span className={styles.weatherFeelsLike}>(Feels like {Math.round(weather.feels_like_celsius)}°C)</span>
                             </div>
                         </div>
                         <div className={styles.weatherColAiSentence}>{weather.ai_weather_sentence && (<p className={styles.aiWeatherSentence}><em>{weather.ai_weather_sentence}</em></p>)}</div>
                         <div className={styles.weatherColExtras}><div className={styles.weatherExtras}><span>💧 {weather.precipitation_probability_percent}%</span><span>💨 {weather.wind_speed_kmh.toFixed(1)} km/h</span></div></div>
                    </div>
                )}
                
                {(originalFormData || (itineraryData.original_request_details && !isViewOnly)) && <ItinerarySummary data={originalFormData || {original_request_details: itineraryData.original_request_details}} />}
                
                <div className={`${styles.itineraryMapAndTableGrid} ${isMapVisible ? styles.mapIsVisible : ''}`}>
                    {hasActivities && (
                        <div 
                            className={styles.mapToggleButtonTopCenter} 
                            onClick={(e) => { e.stopPropagation(); setIsMapVisible(prev => !prev); }} 
                            title={isMapVisible ? "Hide Map" : "Show Map"}
                        >
                            {isMapVisible ? '🔼' : '🔽'}
                        </div>
                    )}

                    <div className={styles.mapPeekContainerTop}>
                         {hasActivities && (
                            <MapView 
                                itineraryItems={itineraryData.itinerary} 
                                startCoords={{ lat: itineraryData.start_lat, lon: itineraryData.start_lon }}
                                onMapClick={() => setIsMapModalOpen(true)} 
                            />
                        )}
                    </div>
                    
                    <div className={styles.itineraryTableContainer}>
                        <table className={styles.itineraryTable}>
                            <thead>
                                <tr>
                                    {!isViewOnly && <th className={`${styles.colStatus} ${styles.mobileHidden}`}>Status</th>}
                                    <th className={styles.colActivity}>Leg / Activity</th>
                                    <th className={`${styles.colType} ${styles.mobileHidden}`}>Type</th>
                                    <th className={`${styles.colStart} ${styles.mobileHidden}`}>Start Time</th>
                                    <th className={styles.colEnd}>End Time</th>
                                    <th className={styles.colDuration}>Duration</th>
                                    <th className={styles.colCost}>Est. Cost</th>
                                    {!isViewOnly && <th className={styles.colAction}>Action</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {hasActivities ? itineraryData.itinerary.map((item, index) => {
                                    const isCompleted = completedIndices?.has(index);
                                    const costText = (item.estimated_cost_inr === null || item.estimated_cost_inr === undefined) ? 'Variable' : (item.estimated_cost_inr > 0 ? `₹${item.estimated_cost_inr.toFixed(2)}` : 'Free');
                                    const rowClasses = [
                                        item.leg_type === 'ACTIVITY' ? styles.legTypeActivity : '',
                                        isCompleted && !isViewOnly ? styles.completedItem : ''
                                    ].join(' ').trim();

                                    return (
                                        <tr key={item.osm_id || `${item.leg_type}-${index}`} className={rowClasses}
                                            onClick={() => item.leg_type === 'ACTIVITY' && handleOpenActivityDetailModal(item)}
                                        >
                                            {!isViewOnly && (
                                                <td className={`${styles.statusCell} ${styles.mobileHidden}`} onClick={(e) => e.stopPropagation()}>
                                                    {item.leg_type === 'ACTIVITY' && (
                                                        <input type="checkbox" checked={!!isCompleted} onChange={() => onToggleComplete(index)}/>
                                                    )}
                                                </td>
                                            )}
                                            
                                            <td className={styles.colActivity}>
                                                <div className={styles.activityContainer}>
                                                    <span className={styles.activityName}>
                                                        {item.leg_type === 'TRAVEL' ? '🚗' : '📍'} {item.activity}
                                                    </span>
                                                    {item.ai_insight && (
                                                        <span className={styles.customTooltip}>
                                                            <strong>Cabito Tip:</strong> {item.ai_insight}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className={`${styles.colType} ${styles.mobileHidden}`}><span title={getActivityDescriptionTooltip(item.matched_preferences, item.food_type, item.specificAmenity)}>{formatActivityEmojis(item.matched_preferences, item.food_type, item.specificAmenity)}</span></td>
                                            <td className={`${styles.colStart} ${styles.timeCell} ${styles.mobileHidden}`}>{formatTimeToLocalAMPM(item.leg_type === 'TRAVEL' ? item.estimated_departure : item.estimated_arrival)}</td>
                                            <td className={`${styles.colEnd} ${styles.timeCell}`}>{formatTimeToLocalAMPM(item.leg_type === 'TRAVEL' ? item.estimated_arrival : item.estimated_departure)}</td>
                                            <td className={`${styles.colDuration} ${styles.durationCell}`}>{formatDuration(item.estimated_duration_hrs)}</td>
                                            <td className={styles.colCost}>{costText}</td>
                                            {!isViewOnly && <td className={styles.actionCell} onClick={(e) => e.stopPropagation()}>{item.leg_type === 'ACTIVITY' && <button onClick={() => onRemove(item.osm_id)} className={styles.removeButton} disabled={isCompleted}>❌</button>}</td>}
                                        </tr>
                                    );
                                }) : (
                                    <tr><td colSpan={isViewOnly ? 5 : 7}>No activities found for this plan.</td></tr>
                                )}
                            </tbody>
                             {hasActivities && (
                                <tfoot>
                                    <tr>
                                        <td colSpan={isViewOnly ? 4 : 6} style={{textAlign: 'right', paddingRight: '12px'}}>Total Estimated Cost:</td>
                                        <td className={styles.colCost}>₹{itineraryData.total_estimated_cost.toFixed(2)}</td>
                                        {!isViewOnly && <td></td>}
                                    </tr>
                                </tfoot>
                           )}
                        </table>
                    </div>
                </div>

                <div className={styles.mobileCardLayout}>
                    {hasActivities ? itineraryData.itinerary.map((item, index) => {
                        const isExpanded = expandedIndex === index;
                        return (
                            <div key={item.osm_id || `${item.leg_type}-${index}`}>
                                <div 
                                    className={`${styles.itineraryCard} ${item.leg_type === 'ACTIVITY' ? styles.activity : ''}`}
                                    onClick={() => handleCardClick(index, item)}
                                >
                                    <div className={styles.cardIcon}>
                                        {item.leg_type === 'TRAVEL' ? '🚗' : '🏛️'}
                                    </div>
                                    <div className={styles.cardContent}>
                                        <span className={styles.cardTitle}>{item.activity}</span>
                                        {item.leg_type === 'ACTIVITY' && item.description && (
                                            <p className={styles.cardDescription}>{item.description.substring(0, 50)}...</p>
                                        )}
                                    </div>
                                    <div className={styles.cardTiming}>
                                        <strong>{formatTimeToLocalAMPM(item.leg_type === 'TRAVEL' ? item.estimated_arrival : item.estimated_departure)}</strong>
                                        <span>{formatDuration(item.estimated_duration_hrs)}</span>
                                    </div>
                                </div>
                                {isExpanded && !isViewOnly && (
                                    <div className={styles.cardExpandedContent}>
                                        <button className={styles.cardActionButton}>Call Cab</button>
                                        <button className={`${styles.cardActionButton} ${styles.secondary}`}>Order Food</button>
                                        <button onClick={() => setExpandedIndex(null)} className={`${styles.cardActionButton} ${styles.secondary}`}>Exit</button>
                                    </div>
                                )}
                            </div>
                        );
                    }) : (
                        <p style={{textAlign: 'center', padding: '30px'}}>No activities found for this plan.</p>
                    )}
                </div>


                {progressPercentage > 0 && !isViewOnly && (
                    <div className={styles.progressBarContainer}>
                        <label htmlFor="itinerary-progress">Progress:</label>
                        <progress id="itinerary-progress" value={progressPercentage} max="100" />
                        <span>{Math.round(progressPercentage)}%</span>
                    </div>
                )}
            </div>
            
            {isMapModalOpen && hasActivities && (
                <div className="modal-overlay" onClick={() => setIsMapModalOpen(false)}>
                    <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setIsMapModalOpen(false)} className="modal-close-button">&times;</button>
                        <div className="modal-inner-content">
                             <h3>Trip Map View</h3>
                             <MapView itineraryItems={itineraryData.itinerary} startCoords={{ lat: itineraryData.start_lat, lon: itineraryData.start_lon }} />
                        </div>
                    </div>
                </div>
            )}

            {isActivityDetailModalOpen && ( <ActivityDetailModal isOpen={isActivityDetailModalOpen} onClose={() => setIsActivityDetailModalOpen(false)} activity={selectedActivityForDetail} /> )}
        </div>
    );
}

export default ItineraryDisplay;