// /frontend/src/components/ItineraryForm.jsx (Complete File)

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
// import { useGoogleMaps } from '../context/GoogleMapsContext'; // <<< COMMENTED OUT
import { useDebounce } from '../hooks/useDebounce';
import { apiNominatimSearch, apiReverseGeocode } from '../services/api';

const calculateDurationString = (startStr, endStr) => {
    if (!startStr || !endStr) return "";
    try {
        const start = new Date(startStr);
        const end = new Date(endStr);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return "Invalid date format";
        if (end <= start) return "End time must be after start time";
        const diffMillis = end.getTime() - start.getTime();
        if (diffMillis <= 0) return "Invalid range";
        const totalMinutes = Math.floor(diffMillis / 60000);
        const totalHours = totalMinutes / 60;
        const days = Math.floor(totalHours / 24);
        const hours = Math.floor(totalHours) % 24;
        const minutes = totalMinutes % 60;
        let duration = "";
        if (days > 0) duration += `${days}d `;
        if (hours > 0) duration += `${hours}h `;
        if (minutes > 0 && totalHours < 1) duration += `${minutes}m `;
        else if (minutes > 0 && days === 0 && hours >= 0) duration += `${minutes}m`;
        return duration.trim() || "< 1m";
    } catch (e) {
        console.error("Error calculating duration:", e);
        return "Error";
    }
};

const CalendarContainerWithDoneButton = ({ children, pickerRef }) => {
  return (
    <div>
      {children}
      <div
        style={{
          width: '100%',
          padding: '8px',
          boxSizing: 'border-box',
          borderTop: '1px solid var(--color-input-border)',
          backgroundColor: 'var(--color-background-card)',
          textAlign: 'center',
          borderBottomLeftRadius: 'inherit',
          borderBottomRightRadius: 'inherit',
        }}
      >
        <button
          type="button"
          className="datepicker-done-button"
          onClick={() => {
            if (pickerRef.current) {
              pickerRef.current.setOpen(false);
            }
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
};


function ItineraryForm({ onSubmit, activeLoader }) {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(new Date().getTime() + 4 * 60 * 60 * 1000));
  const [locationInputText, setLocationInputText] = useState('Lucknow');
  const [selectedLocationName, setSelectedLocationName] = useState('Lucknow'); 
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [budget, setBudget] = useState(5000);
  const [currency, setCurrency] = useState('INR');
  const [preferences, setPreferences] = useState({
    foodie: false, history: false, sights: false,
    shopping: false, nightlife: false, park: false, religious: false
  });
  const [customTripDescription, setCustomTripDescription] = useState('');
  const [durationDisplay, setDurationDisplay] = useState('');

  const [searchResults, setSearchResults] = useState([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const debouncedSearchTerm = useDebounce(locationInputText, 500);
  const searchWrapperRef = useRef(null);
  const locationInputRef = useRef(null); 

  const startDatePickerRef = useRef(null);
  const endDatePickerRef = useRef(null);
  
  const isFormDisabled = !!activeLoader || isLocating;

  useEffect(() => {
    if (debouncedSearchTerm && !latitude && !locationInputText.startsWith('[')) {
        setIsSearchLoading(true);
        apiNominatimSearch(debouncedSearchTerm).then(results => {
            setSearchResults(results || []);
            setIsSearchLoading(false);
        });
    } else {
        setSearchResults([]);
    }
  }, [debouncedSearchTerm, latitude, locationInputText]);

  useEffect(() => {
    function handleClickOutside(event) {
        if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) {
            setSearchResults([]);
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchWrapperRef]);

  /*
  // --- OLD GOOGLE AUTOCOMPLETE EFFECT (COMMENTED OUT) ---
  const { google, isLoaded } = useGoogleMaps();
  const autocompleteRef = useRef(null);
  useEffect(() => {
    if (!isLoaded || !google || !locationInputRef.current || autocompleteRef.current) {
      return;
    }
    
    const service = new google.maps.places.Autocomplete(locationInputRef.current, {
        fields: ["name", "formatted_address", "geometry.location", "place_id"],
        types: ['geocode', 'establishment']
    });
    autocompleteRef.current = service;

    service.addListener('place_changed', () => {
        const place = service.getPlace();
        if (place.geometry && place.geometry.location) {
            setLocationInputText(place.name || place.formatted_address || '');
            setSelectedLocationName(place.name || place.formatted_address);
            setLatitude(place.geometry.location.lat());
            setLongitude(place.geometry.location.lng());
            setFormErrors(prev => ({ ...prev, location: undefined }));
        } else {
            setSelectedLocationName(locationInputRef.current.value);
            setLatitude(null); setLongitude(null);
        }
    });
  }, [isLoaded, google]);
  */

  const validateDates = useCallback(() => {
    setFormErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        if (!startDate || !endDate) {
            newErrors.dateTime = "Start and end dates are required.";
        } else if (endDate <= startDate) {
            newErrors.dateTime = "End time must be after start time.";
        } else {
            delete newErrors.dateTime;
        }
        return newErrors;
    });
    if (startDate && endDate) {
        setDurationDisplay(calculateDurationString(startDate.toISOString(), endDate.toISOString()));
    } else {
        setDurationDisplay("");
    }
  }, [startDate, endDate]);

  useEffect(() => { validateDates(); }, [validateDates]);

  const handlePreferenceChange = (event) => {
    const { name, checked } = event.target;
    setPreferences(prev => ({ ...prev, [name]: checked }));
  };

  const handleSetStartNow = () => {
    const now = new Date();
    setStartDate(now);
    setEndDate(new Date(now.getTime() + 4 * 60 * 60 * 1000));
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported.");
      return;
    }
    setIsLocating(true);
    setLatitude(null);
    setLongitude(null);
    setLocationInputText('Locating...');
    setSelectedLocationName('');
    setFormErrors(prev => ({...prev, location: undefined }));

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            setLatitude(lat);
            setLongitude(lon);
            try {
                const geoData = await apiReverseGeocode(lat, lon);
                const address = geoData.address;
                const displayName = geoData.display_name;
                const locationName = address?.road || address?.neighbourhood || address?.suburb || address?.city_district || address?.city || address?.state || displayName;
                setLocationInputText(locationName);
                setSelectedLocationName(locationName);
            } catch (error) {
                toast.error("Could not fetch address. Using coordinates.");
                const coordText = `[Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}]`;
                setLocationInputText(coordText);
                setSelectedLocationName(coordText);
            } finally {
                setIsLocating(false);
            }
        },
        (error) => {
            let message = "Could not get location.";
            if (error.code === 1) message = "Location access denied by browser.";
            toast.error(message);
            setFormErrors(prev => ({...prev, location: message}));
            setLocationInputText('');
            setIsLocating(false);
        }, { timeout: 10000, enableHighAccuracy: true }
    );
  };
  
  const handleLocationInputChange = (event) => {
      setLocationInputText(event.target.value);
      if (latitude || longitude) {
          setLatitude(null);
          setLongitude(null);
      }
      setSelectedLocationName(event.target.value);
      setFormErrors(prev => ({...prev, location: undefined }));
  };
  
  const handleLocationSelect = (result) => {
    const locationName = result.name || result.display_name;
    setLocationInputText(locationName);
    setSelectedLocationName(locationName);
    setLatitude(parseFloat(result.lat));
    setLongitude(parseFloat(result.lon));
    setSearchResults([]);
    setFormErrors(prev => ({ ...prev, location: undefined }));
  };

  const handleBudgetChange = (event) => {
    const value = Number(event.target.value);
    setBudget(value);
  };

  const commonSubmitLogic = (isSurprise = false) => {
    let currentSubmitErrors = {};
    let finalLocationData = {};

    if (latitude && longitude) {
        finalLocationData = { start_lat: latitude, start_lon: longitude, location: selectedLocationName };
    } else if (locationInputText && locationInputText.trim() && !locationInputText.startsWith('[')) {
        finalLocationData = { location: locationInputText.trim() };
    } else {
        currentSubmitErrors.location = "Please enter a location or use 'Here'.";
    }

    let roundedStartDtForPayload = startDate;
    if (startDate) {
        const currentMinutes = startDate.getMinutes();
        const remainder = currentMinutes % 5;
        let tempStartDate = new Date(startDate);
        if (remainder !== 0) {
            const minutesToAdd = 5 - remainder;
            tempStartDate = new Date(tempStartDate.getTime() + minutesToAdd * 60000);
        }
        tempStartDate.setSeconds(0,0);
        roundedStartDtForPayload = tempStartDate;
    }

     if (!startDate || !endDate || endDate <= startDate) {
       currentSubmitErrors.dateTime = "Valid start and end times are required, with end time after start.";
     }

    const finalFormErrors = {...formErrors, ...currentSubmitErrors};
    setFormErrors(finalFormErrors);

    if (Object.keys(finalFormErrors).some(key => finalFormErrors[key])) {
      toast.error("Please fix the errors in the form.");
      return null;
    }

    const selectedPreferencesArray = isSurprise ? [] : Object.keys(preferences).filter(key => preferences[key]);

    return {
        ...finalLocationData,
        budget: parseFloat(budget),
        currency: currency,
        selected_preferences: selectedPreferencesArray,
        custom_trip_description: customTripDescription.trim() || null,
        start_datetime: roundedStartDtForPayload.toISOString(),
        end_datetime: endDate.toISOString(),
        surprise_me: isSurprise
    };
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = commonSubmitLogic(false);
    if (formData) {
        onSubmit(formData, 'generate');
    }
  };

  const handleSurpriseMe = () => {
    setPreferences({ foodie: false, history: false, sights: false, shopping: false, nightlife: false, park: false, religious: false });
    const formData = commonSubmitLogic(true);
    if (formData) {
        onSubmit(formData, 'surprise');
    }
  };

  const formattedBudget = new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: currency, minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(budget || 0);

  return (
    <form onSubmit={handleSubmit} className="itinerary-form">
        <div className="form-columns">
            <div className="form-column form-column-left">
                <div className={`form-group ${formErrors.location ? 'has-error' : ''}`} ref={searchWrapperRef}>
                    <label htmlFor="location-input">Where is your adventure? 📍</label>
                    <div className="location-input-group" style={{ position: 'relative' }}>
                        <input
                            type="text" id="location-input" name="location"
                            ref={locationInputRef} value={locationInputText}
                            onChange={handleLocationInputChange}
                            placeholder="Type city, address, or use 'Here'"
                            disabled={isFormDisabled} autoComplete="off"
                        />
                        <button type="button" onClick={handleGetCurrentLocation} className="here-button" disabled={isFormDisabled || isLocating} title="Use current GPS location">
                            {isLocating ? 'Locating...' : '📍 Here'}
                        </button>
                        {searchResults.length > 0 && (
                            <ul style={{position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '4px', zIndex: 100, listStyle: 'none', padding: 0, margin: '5px 0 0 0', maxHeight: '200px', overflowY: 'auto' }}>
                                {isSearchLoading ? (
                                    <li style={{padding: '10px', color: '#888'}}>Searching...</li>
                                ) : (
                                    searchResults.map(result => (
                                        <li key={result.place_id} onClick={() => handleLocationSelect(result)} style={{padding: '10px', cursor: 'pointer', borderBottom: '1px solid #eee'}}>
                                            {result.display_name}
                                        </li>
                                    ))
                                )}
                            </ul>
                        )}
                    </div>
                    {formErrors.location && <p className="inline-error-message">{formErrors.location}</p>}
                </div>

                <div className={`form-group ${formErrors.dateTime ? 'has-error' : ''}`}>
                    <label htmlFor="startDateTime">When does your adventure begin? 🚀</label>
                    <div className="datetime-input-group">
                        <DatePicker
                            ref={startDatePickerRef}
                            selected={startDate}
                            onChange={(date) => {
                                setStartDate(date);
                                const newEndDate = new Date(date.getTime() + 4 * 60 * 60 * 1000);
                                setEndDate(newEndDate);
                            }}
                            selectsStart
                            shouldCloseOnSelect={false}
                            startDate={startDate}
                            endDate={endDate}
                            showTimeSelect
                            timeFormat="HH:mm"
                            timeIntervals={5}
                            timeCaption="Time"
                            dateFormat="MMM d, yyyy h:mm aa"
                            className="date-picker-input"
                            wrapperClassName="date-picker-wrapper"
                            placeholderText="Select start date and time"
                            minDate={new Date()}
                            filterDate={(date) => date >= new Date().setHours(0,0,0,0)}
                            required
                            autoComplete="off"
                            disabled={isFormDisabled}
                            popperPlacement="bottom-start"
                            calendarContainer={(props) => (
                                <CalendarContainerWithDoneButton {...props} pickerRef={startDatePickerRef} />
                            )}
                        />
                        <button type="button" onClick={handleSetStartNow} className="now-button" title="Set start time to now" disabled={isFormDisabled}>Now</button>
                    </div>
                </div>
                <div className={`form-group ${formErrors.dateTime ? 'has-error' : ''}`}>
                    <label htmlFor="endDateTime">And when must it conclude? ⏳</label>
                     <div className="datetime-input-group">
                        <DatePicker
                            ref={endDatePickerRef}
                            selected={endDate}
                            onChange={(date) => setEndDate(date)}
                            selectsEnd
                            shouldCloseOnSelect={false}
                            startDate={startDate}
                            endDate={endDate}
                            minDate={startDate || new Date()}
                            filterDate={(date) => startDate ? date >= startDate : date >= new Date().setHours(0,0,0,0)}
                            showTimeSelect
                            timeFormat="HH:mm"
                            timeIntervals={5}
                            timeCaption="Time"
                            dateFormat="MMM d, yyyy h:mm aa"
                            className="date-picker-input"
                            wrapperClassName="date-picker-wrapper"
                            placeholderText="Select end date and time"
                            required
                            autoComplete="off"
                            disabled={isFormDisabled || !startDate}
                            popperPlacement="bottom-start"
                            calendarContainer={(props) => (
                                <CalendarContainerWithDoneButton {...props} pickerRef={endDatePickerRef} />
                            )}
                        />
                    </div>
                </div>
                {formErrors.dateTime && <p className="inline-error-message date-time-error">{formErrors.dateTime}</p>}
                {(durationDisplay && !durationDisplay.toLowerCase().includes("invalid") && !durationDisplay.toLowerCase().includes("error")) && (
                    <div className="duration-display-text"> Available Time: {durationDisplay} </div>
                )}

                <div className={`form-group`}>
                    <label htmlFor="budget">Budget:</label>
                    <div className="budget-group-vertical">
                        <div className="budget-group">
                            <input type="number" id="budget" value={budget} onChange={handleBudgetChange} min="0" step="100" placeholder="e.g., 5000" required className="budget-input" disabled={isFormDisabled}/>
                            <select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} className="currency-select" title="Select currency" disabled={isFormDisabled}>
                                <option value="INR">INR ₹</option>
                            </select>
                        </div>
                        <div className="budget-slider-container">
                            <input type="range" id="budgetSlider" name="budgetSlider" min="0" max="50000" step="500" value={budget} onChange={handleBudgetChange} className="budget-slider" disabled={isFormDisabled}/>
                            <span className="budget-display">{formattedBudget}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="form-column form-column-right">
                <div className="preferences-wrapper">
                    <label className="preferences-title-label">What kind of experiences interest you?</label>
                    <fieldset className="preferences-group" style={{marginTop:'8px'}}>
                        <div className="checkbox-option">
                            <input type="checkbox" id="pref-foodie" name="foodie" checked={preferences.foodie} onChange={handlePreferenceChange} disabled={isFormDisabled}/>
                            <label htmlFor="pref-foodie">🍲 Taste Explorer (Food & Drinks)</label>
                        </div>
                        <div className="checkbox-option">
                            <input type="checkbox" id="pref-history" name="history" checked={preferences.history} onChange={handlePreferenceChange} disabled={isFormDisabled}/>
                            <label htmlFor="pref-history">🏛️ History Buff (Museums & Heritage)</label>
                        </div>
                        <div className="checkbox-option">
                            <input type="checkbox" id="pref-sights" name="sights" checked={preferences.sights} onChange={handlePreferenceChange} disabled={isFormDisabled}/>
                            <label htmlFor="pref-sights">📸 Iconic Views (Sightseeing & Vistas)</label>
                        </div>
                        <div className="checkbox-option">
                            <input type="checkbox" id="pref-shopping" name="shopping" checked={preferences.shopping} onChange={handlePreferenceChange} disabled={isFormDisabled}/>
                            <label htmlFor="pref-shopping">🛍️ Retail Therapy (Shopping)</label>
                        </div>
                        <div className="checkbox-option">
                            <input type="checkbox" id="pref-nightlife" name="nightlife" checked={preferences.nightlife} onChange={handlePreferenceChange} disabled={isFormDisabled}/>
                            <label htmlFor="pref-nightlife">🎉 After Dark (Nightlife & Vibes)</label>
                        </div>
                        <div className="checkbox-option">
                            <input type="checkbox" id="pref-park" name="park" checked={preferences.park} onChange={handlePreferenceChange} disabled={isFormDisabled}/>
                            <label htmlFor="pref-park">🌳 Nature Escape (Parks & Outdoors)</label>
                        </div>
                        <div className="checkbox-option">
                            <input type="checkbox" id="pref-religious" name="religious" checked={preferences.religious} onChange={handlePreferenceChange} disabled={isFormDisabled}/>
                            <label htmlFor="pref-religious">🛐 Spiritual Sites (Places of Worship)</label>
                        </div>
                    </fieldset>
                </div>

                <div className="form-group" style={{ marginTop: '2px', marginBottom: '15px' }}>
                    <label htmlFor="customTripDescription" style={{
                        textAlign: 'left', width: '100%', fontWeight: 700,
                        color: 'var(--color-mid-blue)', fontSize: '1rem',
                        fontFamily: 'var(--font-heading)', paddingLeft: '2px', marginBottom: '2px', display: 'block'
                    }}>
                        Or, describe your ideal trip / specific interests:
                    </label>
                    <div className="input-wrapper" style={{marginTop: '-5px'}}>
                        <textarea
                            id="customTripDescription"
                            name="customTripDescription"
                            rows="4"
                            value={customTripDescription}
                            onChange={(e) => setCustomTripDescription(e.target.value)}
                            placeholder="e.g., 'I want a relaxed afternoon visiting historical temples and enjoying some local street food.' or 'Looking for quirky shops and a cool cafe.'"
                            style={{
                                width: '100%', padding: '10px 12px',
                                border: 'none', borderRadius: '6px',
                                fontSize: '1rem', fontFamily: 'var(--font-body)',
                                backgroundColor: 'transparent', resize: 'vertical', minHeight: '80px'
                            }}
                            disabled={isFormDisabled}
                        />
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '-5px', paddingLeft: '2px', textAlign: 'left' }}>
                        AI will analyze this to help select preferences if provided. You can still use the checkboxes above.
                    </p>
                </div>
            </div> 
        </div>

        <div style={{
            marginTop: '-15px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            alignItems: 'center'
        }}>
            <button 
                type="submit" 
                className="submit-button" 
                disabled={isFormDisabled}
            >
                {activeLoader === 'generate' ? ( <> Generating... <span className="spinner-icon"></span> </> ) : ( 'Generate Itinerary' )}
            </button>
            <button 
                type="button" 
                onClick={handleSurpriseMe} 
                className="surprise-me-button" 
                disabled={isFormDisabled}
            >
                 {activeLoader === 'surprise' ? ( <> Generating... <span className="spinner-icon"></span> </> ) : ( '🎉 Surprise Me!' )}
            </button>
        </div>
    </form>
  );
}

export default ItineraryForm;