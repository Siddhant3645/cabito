// /frontend/src/context/GoogleMapsContext.jsx (Corrected to load geometry library)

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

const GoogleMapsContext = createContext(null);

export const useGoogleMaps = () => useContext(GoogleMapsContext);

export const GoogleMapsProvider = ({ children }) => {
    const [google, setGoogle] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const apiKey = import.meta.env.VITE_Maps_API_KEY_FRONTEND;
        if (!apiKey) {
            console.error("Google Maps API Key is missing.");
            return;
        }

        const loader = new Loader({
            apiKey: apiKey,
            version: 'weekly',
            // +++ ADDED 'geometry' LIBRARY HERE +++
            libraries: ['places', 'marker', 'maps', 'geometry'],
        });

        loader.load()
            .then((loadedGoogle) => {
                setGoogle(loadedGoogle);
                setIsLoaded(true);
            })
            .catch(e => {
                console.error("Failed to load Google Maps API", e);
            });
    }, []); // Empty dependency array ensures this runs only once

    const value = { google, isLoaded };

    return (
        <GoogleMapsContext.Provider value={value}>
            {children}
        </GoogleMapsContext.Provider>
    );
};