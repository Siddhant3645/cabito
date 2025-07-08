// /frontend/src/services/api.js (Corrected for Cookie Credentials)

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

// --- In-memory token management ---
let inMemoryToken = null;
let refreshTokenPromise = null;

const handleResponse = async (response) => {
    if (response.ok) {
        if (response.status === 204) return null;
        const text = await response.text();
        return text ? JSON.parse(text) : null;
    }
    let errorData;
    try {
        errorData = await response.json();
    } catch (e) {
        errorData = { detail: `HTTP error ${response.status}: ${response.statusText || 'An unknown error occurred.'}` };
    }
    throw new Error(errorData.detail || 'An unknown API error occurred.');
};

const customFetch = async (url, options = {}) => {
  let finalOptions = {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${inMemoryToken}`,
      },
  };

  let response = await fetch(url, finalOptions);

  if (response.status !== 401) {
    return response;
  }

  // Handle 401 Unauthorized - Token needs refresh
  if (!refreshTokenPromise) {
    refreshTokenPromise = apiRefreshToken().then(session => {
      inMemoryToken = session.access_token;
      return inMemoryToken;
    }).finally(() => {
      refreshTokenPromise = null;
    });
  }

  try {
    const newAccessToken = await refreshTokenPromise;
    finalOptions.headers['Authorization'] = `Bearer ${newAccessToken}`;
    return fetch(url, finalOptions);
  } catch(err) {
      inMemoryToken = null;
      // Use replace to prevent user from navigating back to a broken state
      window.location.replace('/login'); 
      return Promise.reject(err);
  }
};


// --- Authentication API Functions ---

export const apiRegister = async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
};

export const apiLogin = async (email, password) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await fetch(`${API_BASE_URL}/api/token`, {
        method: 'POST',
        body: formData,
    });
    const data = await handleResponse(response);
    if (data.access_token) {
        inMemoryToken = data.access_token;
    }
    return data;
};

export const apiLogout = async () => {
    const response = await fetch(`${API_BASE_URL}/api/logout`, { 
        method: 'POST',
        // +++ ADD THIS LINE +++
        credentials: 'include' 
    });
    inMemoryToken = null;
    return handleResponse(response);
};

export const apiRefreshToken = async () => {
    const response = await fetch(`${API_BASE_URL}/api/refresh-token`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        // +++ ADD THIS LINE +++
        credentials: 'include' 
    });
    return handleResponse(response);
};


// --- All other API calls now use customFetch ---
// (No changes needed in the functions below as customFetch handles the Authorization header)

export const apiGetCurrentUser = async () => {
    const response = await customFetch(`${API_BASE_URL}/api/users/me`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(response);
};

export const apiChangePassword = async (currentPassword, newPassword) => {
    const response = await customFetch(`${API_BASE_URL}/api/users/me/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
    return handleResponse(response);
};

export const apiDeleteAccount = async (password) => {
    const response = await customFetch(`${API_BASE_URL}/api/users/me/delete-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password }),
    });
    return handleResponse(response);
};

export const apiGenerateItinerary = async (payload) => {
    const response = await customFetch(`${API_BASE_URL}/api/itinerary/generate-itinerary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return handleResponse(response);
};

export const apiGetSerendipitySuggestion = async (payload) => {
    const response = await customFetch(`${API_BASE_URL}/api/itinerary/serendipity-suggestion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return handleResponse(response);
};

export const apiInsertActivityIntoItinerary = async (currentItinerary, newActivity, originalRequest, currentHeading, currentWeather) => {
    const payload = {
        current_itinerary: currentItinerary,
        new_activity: newActivity,
        original_request: originalRequest,
        current_heading: currentHeading,
        current_weather: currentWeather,
    };
    const response = await customFetch(`${API_BASE_URL}/api/itinerary/insert-activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return handleResponse(response);
};

export const apiListUserTrips = async (page = 1, pageSize = 10) => {
    const response = await customFetch(`${API_BASE_URL}/api/trips/?page=${page}&page_size=${pageSize}`);
    return handleResponse(response);
};

export const apiGetTripDetails = async (tripUuid) => {
    const response = await customFetch(`${API_BASE_URL}/api/trips/${tripUuid}`);
    return handleResponse(response);
};

export const apiMarkTripComplete = async (tripUuid) => {
    const response = await customFetch(`${API_BASE_URL}/api/trips/${tripUuid}/complete`, {
        method: 'POST',
    });
    return handleResponse(response);
};

export const apiGenerateMemorySnapshot = async (tripUuid) => {
    const response = await customFetch(`${API_BASE_URL}/api/trips/${tripUuid}/generate-memory-snapshot`, {
        method: 'POST',
    });
    return handleResponse(response);
}; 