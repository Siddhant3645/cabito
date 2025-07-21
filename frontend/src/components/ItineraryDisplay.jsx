// /frontend/src/components/ItineraryDisplay.jsx (Final Corrected Version)

import React, { useState, useEffect, useLayoutEffect } from 'react';
import Confetti from 'react-confetti';
import ActivityDetailModal from './ActivityDetailModal';
import MapView from './MapView';
import styles from './ItineraryDisplay.module.css';

// Helper functions (unchanged from original)
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
    restaurant: 'Restaurant', cafe: 'Cafe', bar: 'Bar / Pub', pub: 'Pub', museum: 'Museum',
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

// --- This is the new, more compact mobile header ---
const MobileHeader = ({ itineraryData, originalFormData }) => {
    const { custom_heading, weather_info } = itineraryData;
    const requestDetails = originalFormData?.original_request_details || originalFormData || {};
    const { budget, currency, location, start_datetime, end_datetime } = requestDetails;
    
    if (!start_datetime || !end_datetime) return null;
    
    const startDate = new Date(start_datetime);
    const endDate = new Date(end_datetime);
    
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
        <div className={styles.mobileHeader}>
            <div className={styles.mobileTitleBox}>
                <h3>{custom_heading || "Your Itinerary"}</h3>
            </div>
            <div className={styles.mobileSummary}>
                <span>📍 {location}</span>
                <span>⏳ {calculateDuration(startDate, endDate)}</span>
                <span>💰 ~{new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency || 'INR', minimumFractionDigits: 0 }).format(budget)}</span>
            </div>
            {weather_info && (
                <div className={styles.mobileWeather}>
                   <span className={styles.weatherIcon}>{weather_info.condition.icon_char}</span>
                   <span className={styles.weatherText}>{weather_info.ai_weather_sentence || `${Math.round(weather_info.temperature_celsius)}°C - ${weather_info.condition.description}`}</span>
                </div>
            )}
        </div>
    );
};


function ItineraryDisplay({ children, itineraryData, onRemove, completedIndices, onToggleComplete, isViewOnly = false, onOpenActivityDetail, originalFormData }) {
    const [isActivityDetailModalOpen, setIsActivityDetailModalOpen] = useState(false);
    const [selectedActivityForDetail, setSelectedActivityForDetail] = useState(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [width, height] = useWindowSize();
    const [isPanelOpen, setIsPanelOpen] = useState(true);
    const [isMapVisible, setIsMapVisible] = useState(false);
    const progressPercentage = 0;

    const requestDetails = originalFormData?.original_request_details || originalFormData;

    if (!itineraryData || !requestDetails) {
        return <div className={styles.itineraryDisplayBox}><p>Loading trip details...</p></div>;
    }

    const hasActivities = itineraryData.itinerary && itineraryData.itinerary.length > 0;
    const weather = itineraryData.weather_info;
    const { budget, currency, location, start_datetime, end_datetime } = requestDetails;

    const handleOpenActivityDetailModal = (activityItem) => {
        if (onOpenActivityDetail) { onOpenActivityDetail(activityItem); }
        else { setSelectedActivityForDetail(activityItem); setIsActivityDetailModalOpen(true); }
        setIsPanelOpen(false);
    };
    
    return (
        <div className={styles.itineraryDisplay}>
            {showConfetti && <Confetti width={width} height={height} recycle={false} onConfettiComplete={() => setShowConfetti(false)} />}
            
            <div className={styles.mobileView}>
                <MobileHeader itineraryData={itineraryData} originalFormData={originalFormData} />
                <div className={styles.mobileLayoutContainer}>
                    <div className={styles.mapBackground}>
                         {hasActivities && (
                            <MapView 
                                itineraryItems={itineraryData.itinerary} 
                                startCoords={{ lat: itineraryData.start_lat, lon: itineraryData.start_lon }}
                            />
                        )}
                    </div>
                    <div className={`${styles.slidingPanel} ${isPanelOpen ? styles.isOpen : ''}`}>
                        <div className={styles.panelHandle} onClick={() => setIsPanelOpen(!isPanelOpen)}>
                            <div className={styles.handleBar}></div>
                        </div>
                        <div className={styles.panelContent}>
                            {hasActivities ? itineraryData.itinerary.map((item, index) => {
                                const isCompleted = completedIndices?.has(index);
                                const cardClasses = `${styles.itineraryCard} ${item.leg_type === 'TRAVEL' ? styles.travel : styles.activity} ${isCompleted && !isViewOnly ? styles.completedItem : ''}`.trim();
                                const icon = item.leg_type === 'TRAVEL' ? '🚗' : formatActivityEmojis(item.matched_preferences, item.food_type, item.specificAmenity);
                                const costText = (item.estimated_cost_inr === null || item.estimated_cost_inr === undefined) ? 'Variable' : (item.estimated_cost_inr > 0 ? `~₹${item.estimated_cost_inr.toFixed(0)}` : 'Free');

                                return (
                                    <div 
                                        key={`mobile-${index}`} 
                                        className={cardClasses} 
                                        onClick={() => item.leg_type === 'ACTIVITY' && handleOpenActivityDetailModal(item)}
                                    >
                                        <div className={styles.cardLeft}>
                                            {item.leg_type === 'ACTIVITY' && !isViewOnly && (
                                                <div className={styles.cardCheckbox} onClick={(e) => e.stopPropagation()}>
                                                    <input type="checkbox" checked={!!isCompleted} onChange={() => onToggleComplete(index)} aria-label={`Mark ${item.activity} as complete`}/>
                                                </div>
                                            )}
                                            {item.leg_type === 'TRAVEL' && !isViewOnly && <div className={styles.cardCheckboxPlaceholder}></div>}
                                            <div className={styles.cardIcon}>{icon}</div>
                                            <div className={styles.cardContent}>
                                                <span className={styles.cardTitle}>{item.activity}</span>
                                                {item.leg_type === 'ACTIVITY' && item.description && (<p className={styles.cardDescription}>{item.description}</p>)}
                                            </div>
                                        </div>
                                        <div className={styles.cardTimingGrid}>
                                            <div><span>Start</span><strong>{formatTimeToLocalAMPM(item.estimated_departure)}</strong></div>
                                            <div><span>End</span><strong>{formatTimeToLocalAMPM(item.estimated_arrival)}</strong></div>
                                            <div><span>Duration</span><strong>{formatDuration(item.estimated_duration_hrs)}</strong></div>
                                            <div><span>Cost</span><strong>{costText}</strong></div>
                                        </div>
                                    </div>
                                );
                            }) : <p style={{textAlign: 'center', padding: '30px'}}>No activities found.</p>}
                        </div>
                    </div>
                </div>
                <div className={styles.mobileActionContainer}>
                    {children}
                </div>
            </div>

            <div className={styles.desktopView}>
                <div className={styles.itineraryDisplayBox}>
                    {itineraryData.custom_heading && (
                        <div className={styles.customHeading}><h3>{itineraryData.custom_heading}</h3></div>
                    )}
                    {weather && ( 
                         <div className={styles.weatherDisplayBox}>
                             <div className={styles.weatherColPrimary}>
                                 <span className={styles.weatherMainIcon}>{getTimeOfDaySymbol(weather.time_of_day_descriptor, weather.is_day)}</span>
                                 <div className={styles.weatherPrimaryText}>
                                     <span className={styles.weatherTemp}>{Math.round(weather.temperature_celsius)}°C</span>
                                     <span className={styles.weatherConditionText}>{weather.condition.description}</span>
                                     <span className={styles.weatherFeelsLike}>(Feels like {Math.round(weather.feels_like_celsius)}°C)</span>
                                 </div>
                             </div>
                             <div className={styles.weatherColAiSentence}>{weather.ai_weather_sentence && (<p className={styles.aiWeatherSentence}><em>{weather.ai_weather_sentence}</em></p>)}</div>
                             <div className={styles.weatherColExtras}><div className={styles.weatherExtras}><span>💧 {weather.precipitation_probability_percent}%</span><span>💨 {weather.wind_speed_kmh.toFixed(1)} km/h</span></div></div>
                        </div>
                    )}
                    <div className={styles.itinerarySummaryBox}>
                        <div className={styles.summaryItem}><span className={styles.summaryLabel}>📍 Location</span><span className={styles.summaryValue}>{location}</span></div>
                        <div className={styles.summaryItem}><span className={styles.summaryLabel}>▶️ From</span><span className={styles.summaryValue}>{new Date(start_datetime).toLocaleDateString()}, {formatTimeToLocalAMPM(start_datetime)}</span></div>
                        <div className={styles.summaryItem}><span className={styles.summaryLabel}>⏹️ To</span><span className={styles.summaryValue}>{new Date(end_datetime).toLocaleDateString()}, {formatTimeToLocalAMPM(end_datetime)}</span></div>
                        <div className={styles.summaryItem}><span className={styles.summaryLabel}>⏳ Duration</span><span className={styles.summaryValue}>{formatDuration((new Date(end_datetime) - new Date(start_datetime))/(1000*60*60))}</span></div>
                        <div className={styles.summaryItem}><span className={styles.summaryLabel}>💰 Budget</span><span className={styles.summaryValue}>~ {new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency || 'INR' }).format(budget)}</span></div>
                    </div>
                    <div className={`${styles.itineraryMapAndTableGrid} ${isMapVisible ? styles.mapIsVisible : ''}`}>
                        {hasActivities && (
                            <div className={styles.mapToggleButtonTopCenter} onClick={() => setIsMapVisible(prev => !prev)} title={isMapVisible ? "Hide Map" : "Show Map"}>
                                {isMapVisible ? '🔼' : '🔽'}
                            </div>
                        )}
                        <div className={styles.mapPeekContainerTop}>
                             {hasActivities && (<MapView itineraryItems={itineraryData.itinerary} startCoords={{ lat: itineraryData.start_lat, lon: itineraryData.start_lon }} />)}
                        </div>
                        <div className={styles.itineraryTableContainer}>
                             <table className={styles.itineraryTable}>
                                <thead>
                                    <tr>
                                        {!isViewOnly && <th className={styles.colStatus}>Status</th>}
                                        <th className={styles.colActivity}>Leg / Activity</th>
                                        <th className={styles.colType}>Type</th>
                                        <th className={styles.colStart}>Start Time</th>
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
                                        const isSeparator = item.leg_type === 'TRAVEL' && index > 0;
                                        const rowClasses = [ styles.legTypeActivity, isCompleted && !isViewOnly ? styles.completedItem : '', isSeparator ? styles.itineraryLegSeparator : '' ].filter(Boolean).join(' ');

                                        return (
                                            <tr key={`desktop-${index}`} className={rowClasses} onClick={() => item.leg_type === 'ACTIVITY' && handleOpenActivityDetailModal(item)}>
                                                {!isViewOnly && (<td className={styles.statusCell} onClick={(e) => e.stopPropagation()}>{item.leg_type === 'ACTIVITY' && (<input type="checkbox" checked={!!isCompleted} onChange={() => onToggleComplete(index)}/>)}</td>)}
                                                <td className={styles.colActivity}><div className={styles.activityContainer}><span className={styles.activityName}>{item.leg_type === 'TRAVEL' ? '🚗' : '📍'} {item.activity}</span></div></td>
                                                <td className={styles.colType}><span title={getActivityDescriptionTooltip(item.matched_preferences, item.food_type, item.specificAmenity)}>{formatActivityEmojis(item.matched_preferences, item.food_type, item.specificAmenity)}</span></td>
                                                <td className={`${styles.colStart} ${styles.timeCell}`}>{formatTimeToLocalAMPM(item.estimated_departure)}</td>
                                                <td className={`${styles.colEnd} ${styles.timeCell}`}>{formatTimeToLocalAMPM(item.estimated_arrival)}</td>
                                                <td className={`${styles.colDuration} ${styles.durationCell}`}>{formatDuration(item.estimated_duration_hrs)}</td>
                                                <td className={styles.colCost}>{costText}</td>
                                                {!isViewOnly && <td className={styles.actionCell} onClick={(e) => e.stopPropagation()}>{item.leg_type === 'ACTIVITY' && <button onClick={() => onRemove(item.osm_id)} className={styles.removeButton} disabled={isCompleted}>❌</button>}</td>}
                                            </tr>
                                        );
                                    }) : ( <tr><td colSpan={isViewOnly ? 6 : 8}>No activities found.</td></tr> )}
                                </tbody>
                                 {hasActivities && (
                                    <tfoot>
                                        <tr>
                                            {/* --- MODIFIED CODE START --- */}
                                            {/* The colSpan calculation is now corrected to properly align the final cost. */}
                                            <td colSpan={isViewOnly ? 5 : 6} style={{textAlign: 'right', paddingRight: '12px'}}>Total Estimated Cost:</td>
                                            {/* --- MODIFIED CODE END --- */}
                                            <td className={styles.colCost}>₹{itineraryData.total_estimated_cost.toFixed(2)}</td>
                                            {!isViewOnly && <td></td>}
                                        </tr>
                                    </tfoot>
                               )}
                            </table>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
            
            {isActivityDetailModalOpen && ( <ActivityDetailModal isOpen={isActivityDetailModalOpen} onClose={() => setIsActivityDetailModalOpen(false)} activity={selectedActivityForDetail} /> )}
        </div>
    );
}

export default ItineraryDisplay;