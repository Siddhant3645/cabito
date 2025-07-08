// /frontend/src/pages/MyTripsPage.jsx (Updated with Pagination)

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiListUserTrips, apiGenerateMemorySnapshot } from '../services/api';
import { toast } from 'react-toastify';
import ItineraryDisplay from '../components/ItineraryDisplay';
import ActivityDetailModal from '../components/ActivityDetailModal';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import '../App.css';

const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    try {
        return new Date(isoString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    } catch (e) {
        return 'Invalid Date';
    }
};

const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    return (
        <div className="pagination-controls">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1}>
                &larr; Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages}>
                Next &rarr;
            </button>
        </div>
    );
};


function MyTripsPage() {
    const [trips, setTrips] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedTripForItinerary, setSelectedTripForItinerary] = useState(null);
    const [isItineraryModalOpen, setIsItineraryModalOpen] = useState(false);
    const [selectedTripForMemory, setSelectedTripForMemory] = useState(null);
    const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
    const [activityDetailModalOpen, setActivityDetailModalOpen] = useState(false);
    const [selectedActivityForDetail, setSelectedActivityForDetail] = useState(null);
    const [isGeneratingMemory, setIsGeneratingMemory] = useState(false);
    const [memorySnapshotText, setMemorySnapshotText] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const tripsPerPage = 10;

    useBodyScrollLock(isItineraryModalOpen || isMemoryModalOpen || activityDetailModalOpen);

    const fetchTrips = useCallback(async (page) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await apiListUserTrips(page, tripsPerPage);
            const validTrips = (response.trips || []).filter(trip =>
                trip.generated_itinerary_response &&
                Array.isArray(trip.generated_itinerary_response.itinerary) &&
                trip.generated_itinerary_response.itinerary.length > 0
            );
            setTrips(validTrips);
            setTotalPages(Math.ceil(response.total_trips / tripsPerPage));
            setCurrentPage(response.page);
        } catch (err) {
            console.error("Failed to fetch trips:", err);
            const errorMessage = err.message || "Could not load your trips. Please try again later.";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTrips(currentPage);
    }, [fetchTrips, currentPage]);

    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handleViewItinerary = (trip) => {
        setSelectedTripForItinerary(trip);
        setIsItineraryModalOpen(true);
    };

    const handleOpenActivityDetail = (activity) => {
        setSelectedActivityForDetail(activity);
        setActivityDetailModalOpen(true);
    };

    const handleGenerateMemory = async (trip) => {
        if (!trip?.trip_uuid) return;
        
        setSelectedTripForMemory(trip);
        setMemorySnapshotText(trip.memory_snapshot_text || '');
        setIsMemoryModalOpen(true);
        
        if (trip.memory_snapshot_text) {
             setIsGeneratingMemory(false);
             return;
        }

        setIsGeneratingMemory(true);
        try {
            const response = await apiGenerateMemorySnapshot(trip.trip_uuid);
            if (response?.memory_snapshot_text) {
                setMemorySnapshotText(response.memory_snapshot_text);
                setTrips(prevTrips => prevTrips.map(t =>
                    t.trip_uuid === trip.trip_uuid
                        ? { ...t, memory_snapshot_text: response.memory_snapshot_text }
                        : t
                ));
            } else {
                 toast.info(response.message || "Could not generate a new memory snapshot at this time.");
            }
        } catch (err) {
            toast.error(err.message || "Failed to generate memory snapshot.");
        } finally {
            setIsGeneratingMemory(false);
        }
    };
    
    const handleCopyMemory = () => {
        if (!memorySnapshotText) return;
        navigator.clipboard.writeText(memorySnapshotText)
            .then(() => {
                toast.success("Memory copied to clipboard!");
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
                toast.error("Could not copy memory text.");
            });
    };
    
    if (isLoading && trips.length === 0) {
        return <div className="App-container" style={{textAlign: 'center', marginTop: '50px'}}>Loading your trips...</div>;
    }

    if (error) {
        return <div className="App-container error-message" style={{maxWidth: '600px', margin: '50px auto'}}>Error: {error}</div>;
    }

    return (
        <div className="App-container my-trips-page">
            <h1 style={{ textAlign: 'center', color: 'var(--color-dark-blue)', fontFamily: 'var(--font-heading)', marginBottom: '30px' }}>
              My Trips
            </h1>

            {trips.length > 0 ? (
                <>
                    <div className="trips-grid">
                        {trips.map(trip => (
                            <div key={trip.trip_uuid} className="trip-card">
                                <h3 className="trip-card-title">{trip.trip_title || trip.location_display_name || 'My Trip'}</h3>
                                <p className="trip-card-dates">
                                    {formatDate(trip.trip_start_datetime_utc)}
                                </p>
                                <div className={`trip-card-status status-${trip.status}`}>
                                    Status: <span>{trip.status}</span>
                                </div>
                                <div className="trip-card-actions">
                                    <button onClick={() => handleViewItinerary(trip)} className="trip-action-button">
                                        View Itinerary
                                    </button>
                                    <button onClick={() => handleGenerateMemory(trip)} className="trip-action-button memory" disabled={isGeneratingMemory && selectedTripForMemory?.trip_uuid === trip.trip_uuid}>
                                        {isGeneratingMemory && selectedTripForMemory?.trip_uuid === trip.trip_uuid ? 'Creating...' : (trip.memory_snapshot_text ? 'View Memory' : '✨ Create Memory')}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                </>
            ) : (
                <div className="itinerary-display placeholder">
                    <p>You haven't generated any trips yet!</p>
                    <Link to="/planner" className="cta-button" style={{marginTop: '15px'}}>Plan Your First Trip</Link>
                </div>
            )}

            {isItineraryModalOpen && selectedTripForItinerary && (
                <div className="modal-overlay" onClick={() => setIsItineraryModalOpen(false)}>
                    <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setIsItineraryModalOpen(false)} className="modal-close-button">&times;</button>
                        <div className="modal-inner-content">
                             <ItineraryDisplay 
                                itineraryData={selectedTripForItinerary.generated_itinerary_response}
                                isViewOnly={true} 
                                onOpenActivityDetail={handleOpenActivityDetail}
                             />
                        </div>
                    </div>
                </div>
            )}
            
            {isMemoryModalOpen && selectedTripForMemory && (
                <div className="modal-overlay" onClick={() => setIsMemoryModalOpen(false)}>
                    <div className="modal-content" style={{maxWidth: '700px'}} onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setIsMemoryModalOpen(false)} className="modal-close-button">&times;</button>
                        <div className="modal-header-with-action">
                             <h3>Memory Snapshot: {selectedTripForMemory.trip_title || selectedTripForMemory.location_display_name}</h3>
                             {memorySnapshotText && (
                                <button onClick={handleCopyMemory} className="copy-button" title="Copy to Clipboard">📋</button>
                             )}
                        </div>
                        {isGeneratingMemory && !memorySnapshotText && <p>💭 Our AI Storyteller is weaving your tale...</p>}
                        {memorySnapshotText ? (
                            <div className="memory-snapshot-text">{memorySnapshotText}</div>
                        ) : !isGeneratingMemory && (
                            <p>Could not retrieve a memory for this trip.</p>
                        )}
                    </div>
                </div>
            )}

            <ActivityDetailModal
                isOpen={activityDetailModalOpen}
                onClose={() => setActivityDetailModalOpen(false)}
                activity={selectedActivityForDetail}
            />
        </div>
    );
}

export default MyTripsPage;