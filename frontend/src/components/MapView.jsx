// /frontend/src/components/MapView.jsx (Complete File with Fixes for Rendering and Path)

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// import polylineDecoder from 'polyline'; // <<< REMOVED: No longer needed on frontend

// --- Leaflet Icon Fix ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
});

// --- Custom Icons ---
const startIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const activityIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});


// --- Helper component to control map view and fix rendering bugs ---
const MapController = ({ bounds }) => {
    const map = useMap();
    useEffect(() => {
        // This effect runs when the 'bounds' prop changes.
        if (bounds.isValid()) {
            // A short delay helps ensure the map container has finished its CSS transitions
            const timer = setTimeout(() => {
                map.invalidateSize(); // Force map to re-check its size
                map.fitBounds(bounds, { padding: [50, 50] }); // Fit map to markers
            }, 100); 
            return () => clearTimeout(timer);
        }
    }, [map, bounds]);
    return null;
};

const MapView = ({ itineraryItems, startCoords, onMapClick }) => {
    const activityItems = itineraryItems.filter(item => item.leg_type === 'ACTIVITY' && item.lat && item.lon);
    
    if (activityItems.length === 0 && !startCoords) {
        return <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f0f0f0', height: '100%' }}>No activities with coordinates to display on the map.</div>;
    }

    const bounds = L.latLngBounds();
    if (startCoords?.lat && startCoords?.lon) {
        bounds.extend([startCoords.lat, startCoords.lon]);
    }
    activityItems.forEach(item => bounds.extend([item.lat, item.lon]));

    return (
        <MapContainer
            center={bounds.getCenter()}
            zoom={13}
            style={{ width: '100%', height: '100%', borderRadius: 'inherit' }}
            onClick={onMapClick}
            scrollWheelZoom={true}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {startCoords?.lat && startCoords?.lon && (
                <Marker position={[startCoords.lat, startCoords.lon]} icon={startIcon}>
                    <Popup>Start / End Point</Popup>
                </Marker>
            )}

            {activityItems.map((item, index) => (
                <Marker key={item.osm_id || index} position={[item.lat, item.lon]} icon={activityIcon}>
                    <Popup>{`${index + 1}. ${item.activity}`}</Popup>
                </Marker>
            ))}

            {itineraryItems.map((item, index) => {
                // --- MODIFIED: Expects an array of coordinates directly ---
                if (item.leg_type === 'TRAVEL' && item.overview_polyline && Array.isArray(item.overview_polyline)) {
                    return <Polyline key={`route-${index}`} positions={item.overview_polyline} color="#4299E1" weight={5} />;
                }
                return null;
            })}

            <MapController bounds={bounds} />
        </MapContainer>
    );
};

export default MapView;

/*
// --- OLD GOOGLE MAPS COMPONENT (COMMENTED OUT FOR REFERENCE) ---

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

        itineraryItems.forEach(item => {
            if (item.leg_type === 'TRAVEL' && item.overview_polyline) {
                const arrowIcon = {
                    path: SymbolPath.FORWARD_CLOSED_ARROW,
                    scale: 3,
                    fillColor: '#1A2B45',
                    fillOpacity: 1,
                    strokeWeight: 0,
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
*/