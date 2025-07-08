// /frontend/src/components/MapView.jsx (Updated with Filled Arrows)

import React, { useEffect, useRef, useState } from 'react';
import { useGoogleMaps } from '../context/GoogleMapsContext';

const MapView = ({ itineraryItems, startCoords, onMapClick }) => {
    const mapRef = useRef(null);
    const { google, isLoaded } = useGoogleMaps();

    const [mouseDownPos, setMouseDownPos] = useState(null);

    const handleMouseDown = (e) => {
        setMouseDownPos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = (e) => {
        if (!mouseDownPos) return;

        const deltaX = Math.abs(e.clientX - mouseDownPos.x);
        const deltaY = Math.abs(e.clientY - mouseDownPos.y);

        if (deltaX < 5 && deltaY < 5) {
            if (onMapClick) {
                onMapClick();
            }
        }
        setMouseDownPos(null);
    };


    useEffect(() => {
        if (!isLoaded || !google || !mapRef.current) {
            return;
        }

        const activityItems = itineraryItems.filter(item => item.leg_type === 'ACTIVITY' && item.lat && item.lon);
        
        if (activityItems.length === 0 && !startCoords) {
            mapRef.current.innerHTML = '<p style="text-align: center; padding: 20px;">No activities with coordinates to display on the map.</p>';
            return;
        }

        const { Map, Polyline, SymbolPath } = google.maps;
        const { AdvancedMarkerElement, PinElement } = google.maps.marker;
        const bounds = new google.maps.LatLngBounds();

        const map = new Map(mapRef.current, {
            center: { lat: startCoords?.lat || activityItems[0].lat, lng: startCoords?.lon || activityItems[0].lon },
            zoom: 12,
            mapId: 'CABITO_ITINERARY_MAP',
            fullscreenControl: false,
            streetViewControl: false,
        });

        // --- MODIFIED SECTION ---
        // The arrowIcon configuration is updated to be filled.
        itineraryItems.forEach(item => {
            if (item.leg_type === 'TRAVEL' && item.overview_polyline) {
                const arrowIcon = {
                    path: SymbolPath.FORWARD_CLOSED_ARROW,
                    scale: 3,
                    fillColor: '#1A2B45', // Dark blue fill for high contrast
                    fillOpacity: 1,
                    strokeWeight: 0, // No border for a solid look
                };

                const routePath = new Polyline({
                    path: google.maps.geometry.encoding.decodePath(item.overview_polyline),
                    geodesic: true,
                    strokeColor: '#4299E1',
                    strokeOpacity: 0.9,
                    strokeWeight: 4,
                    icons: [{
                        icon: arrowIcon,
                        offset: '50%',
                        repeat: '100px'
                    }],
                });
                routePath.setMap(map);
            }
        });

        // This part remains the same (Start Point Pin).
        if (startCoords && startCoords.lat && startCoords.lon) {
            const startPosition = { lat: startCoords.lat, lng: startCoords.lon };
            const startPin = new PinElement({
                background: '#4CAF50',
                borderColor: '#2E7D32',
                glyphColor: '#FFFFFF',
                scale: 1.2,
            });

            new AdvancedMarkerElement({
                map: map,
                position: startPosition,
                title: 'Start Point',
                content: startPin.element,
                zIndex: 10
            });
            bounds.extend(startPosition);
        }

        // Using your preferred styling for the activity dots.
        activityItems.forEach((item, index) => {
            const position = { lat: item.lat, lng: item.lon };
            const dot = document.createElement('div');
            dot.style.width = '20px';
            dot.style.height = '20px';
            dot.style.backgroundColor = '#EA4335';
            dot.style.borderRadius = '50%';
            dot.style.border = '2px solid white';
            dot.style.boxShadow = '0 0 5px rgba(0,0,0,0.5)';
            dot.style.cursor = 'pointer';

            new AdvancedMarkerElement({
                map: map,
                position: position,
                title: `${index + 1}. ${item.activity}`,
                content: dot,
            });
            bounds.extend(position);
        });
        
        if (activityItems.length > 0 || startCoords) {
            map.fitBounds(bounds);
            
            google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
                const MIN_ZOOM_LEVEL = 13;
                if (map.getZoom() < MIN_ZOOM_LEVEL) {
                    map.setZoom(MIN_ZOOM_LEVEL);
                }
            });
        }

    }, [isLoaded, google, itineraryItems, startCoords]);

    return (
        <div 
            ref={mapRef} 
            className="MapView-container" 
            style={{ width: '100%', height: '100%', borderRadius: 'inherit', backgroundColor: 'var(--color-light-blue-gray)' }}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
        />
    );
};

export default MapView;