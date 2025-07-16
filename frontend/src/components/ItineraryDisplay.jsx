// /frontend/src/components/ItineraryDisplay.jsx (Complete File)

import React, { useState, useEffect, useLayoutEffect } from 'react';
import Confetti from 'react-confetti';
import ActivityDetailModal from './ActivityDetailModal';
import MapView from './MapView';
import '../App.css';

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
        <div className="itinerary-summary-box">
            <div className="summary-item"><span className="summary-label">📍 Location</span><span className="summary-value">{location}</span></div>
            <div className="summary-item"><span className="summary-label">▶️ From</span><span className="summary-value">{formatSummaryDate(startDate)}, {formatSummaryTime(startDate)}</span></div>
            <div className="summary-item"><span className="summary-label">⏹️ To</span><span className="summary-value">{formatSummaryDate(endDate)}, {formatSummaryTime(endDate)}</span></div>
            <div className="summary-item"><span className="summary-label">⏳ Duration</span><span className="summary-value">{calculateDuration(startDate, endDate)}</span></div>
            <div className="summary-item"><span className="summary-label">💰 Budget</span><span className="summary-value">~ {new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency || 'INR' }).format(budget)}</span></div>
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
    
    return (
        <div className={`itinerary-display ${isRegenerating ? 'is-regenerating' : ''}`}>
            {showConfetti && <Confetti width={width} height={height} recycle={false} onConfettiComplete={() => setShowConfetti(false)} />}
            
            <div className="itinerary-display-box">
                {itineraryData.custom_heading && (
                    <div className="custom-itinerary-heading"><h3>{itineraryData.custom_heading}</h3></div>
                )}
                
                {weather && ( 
                    <div className="weather-display-box-revised">
                         <div className="weather-col-primary">
                             <span className="weather-main-icon" title={weather.time_of_day_descriptor || weather.condition.description}>{getTimeOfDaySymbol(weather.time_of_day_descriptor, weather.is_day)}</span>
                             <div className="weather-primary-text">
                                 <span className="weather-temp">{Math.round(weather.temperature_celsius)}°C</span>
                                 <span className="weather-condition-text">
                                     {weather.condition.description}
                                     {weather.time_of_day_descriptor && (
                                         <span className="day-night-indicator">({weather.time_of_day_descriptor})</span>
                                     )}
                                 </span>
                                 <span className="weather-feels-like">(Feels like {Math.round(weather.feels_like_celsius)}°C)</span>
                             </div>
                         </div>
                         <div className="weather-col-aisentence">{weather.ai_weather_sentence && (<p className="ai-weather-sentence"><em>{weather.ai_weather_sentence}</em></p>)}</div>
                         <div className="weather-col-extras"><div className="weather-extras"><span>💧 {weather.precipitation_probability_percent}%</span><span>💨 {weather.wind_speed_kmh.toFixed(1)} km/h</span></div></div>
                    </div>
                )}
                
                {originalFormData && <ItinerarySummary data={originalFormData} />}
                
                <div className={`itinerary-map-and-table-grid ${isMapVisible ? 'map-is-visible' : ''}`}>
                    {hasActivities && (
                        <div 
                            className='map-toggle-button-top-center' 
                            onClick={(e) => { e.stopPropagation(); setIsMapVisible(prev => !prev); }} 
                            title={isMapVisible ? "Hide Map" : "Show Map"}
                        >
                            {isMapVisible ? '🔼' : '🔽'}
                        </div>
                    )}

                    <div className="map-peek-container-top">
                         {hasActivities && (
                            <MapView 
                                itineraryItems={itineraryData.itinerary} 
                                startCoords={{ lat: itineraryData.start_lat, lon: itineraryData.start_lon }}
                                onMapClick={() => setIsMapModalOpen(true)} 
                            />
                        )}
                    </div>
                    
                    <div className="itinerary-table-container">
                        <table className="itinerary-table">
                            <thead>
                                <tr>
                                    {!isViewOnly && <th className="col-status mobile-hidden">Status</th>}
                                    <th className="col-activity">Leg / Activity</th>
                                    <th className="col-type mobile-hidden">Type</th>
                                    <th className="col-start mobile-hidden">Start Time</th>
                                    <th className="col-end">End Time</th>
                                    <th className="col-duration">Duration</th>
                                    <th className="col-cost">Est. Cost</th>
                                    {!isViewOnly && <th className="col-action">Action</th>}
                                </tr>
                            </thead>
                        </table>
                        
                        <div className="itinerary-body-scroll-container">
                            <table className="itinerary-table">
                                <tbody>
                                    {hasActivities ? itineraryData.itinerary.map((item, index) => {
                                        const isCompleted = completedIndices?.has(index);
                                        const costText = (item.estimated_cost_inr === null || item.estimated_cost_inr === undefined) ? 'Variable' : (item.estimated_cost_inr > 0 ? `₹${item.estimated_cost_inr.toFixed(2)}` : 'Free');
                                        return (
                                            <tr key={item.osm_id || `${item.leg_type}-${index}`} className={`leg-type-${item.leg_type.toLowerCase()} ${isCompleted && !isViewOnly ? 'completed-item' : ''}`}
                                                onClick={() => item.leg_type === 'ACTIVITY' && handleOpenActivityDetailModal(item)}
                                            >
                                                {!isViewOnly && (
                                                    <td className="col-status mobile-hidden" onClick={(e) => e.stopPropagation()}>
                                                        {item.leg_type === 'ACTIVITY' && (
                                                            <input
                                                                type="checkbox"
                                                                checked={!!isCompleted}
                                                                onChange={() => onToggleComplete(index)}
                                                            />
                                                        )}
                                                    </td>
                                                )}
                                                
                                                <td className="col-activity">
                                                    <div className="activity-container">
                                                        <span className="activity-name">
                                                            {item.leg_type === 'TRAVEL' ? '🚗' : '📍'} {item.activity}
                                                        </span>
                                                        {item.ai_insight && (
                                                            <span className="custom-tooltip">
                                                                <strong>Cabito Tip:</strong> {item.ai_insight}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="col-type mobile-hidden"><span title={getActivityDescriptionTooltip(item.matched_preferences, item.food_type, item.specificAmenity)}>{formatActivityEmojis(item.matched_preferences, item.food_type, item.specificAmenity)}</span></td>
                                                <td className="col-start mobile-hidden">{formatTimeToLocalAMPM(item.leg_type === 'TRAVEL' ? item.estimated_departure : item.estimated_arrival)}</td>
                                                <td className="col-end">{formatTimeToLocalAMPM(item.leg_type === 'TRAVEL' ? item.estimated_arrival : item.estimated_departure)}</td>
                                                <td className="col-duration">{formatDuration(item.estimated_duration_hrs)}</td>
                                                <td className="col-cost">{costText}</td>
                                                {!isViewOnly && <td className="col-action" onClick={(e) => e.stopPropagation()}>{item.leg_type === 'ACTIVITY' && <button onClick={() => onRemove(item.osm_id)} className="remove-button" disabled={isCompleted}>❌</button>}</td>}
                                            </tr>
                                        );
                                    }) : (
                                        <tr><td colSpan={isViewOnly ? 7 : 8} style={{textAlign: 'center', padding: '30px'}}>No activities found for this plan.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    
                        {hasActivities && (
                           <table className="itinerary-table">
                                <tfoot>
                                    <tr>
                                        <td colSpan={isViewOnly ? 6 : 7} style={{textAlign: 'right', paddingRight: '12px'}}>Total Estimated Cost:</td>
                                        <td className="col-cost">₹{itineraryData.total_estimated_cost.toFixed(2)}</td>
                                        {!isViewOnly && <td></td>}
                                    </tr>
                                </tfoot>
                           </table>
                        )}
                    </div>
                </div>

                {progressPercentage > 0 && !isViewOnly && (
                    <div className="progress-bar-container" style={{ marginTop: '25px' }}>
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