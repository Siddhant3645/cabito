# Backend - Mini Travel Itinerary Generator API

This directory contains the FastAPI backend service.

## Description

This API service receives travel preferences (time, budget, places) and generates a simple dummy itinerary. It uses data from `places_data.json` to inform estimates for known locations.

## Tech Stack

* Python 3.8+
* FastAPI
* Uvicorn (ASGI Server)
* Pydantic (Data Validation)

## Project Structure

* `main.py`: The main FastAPI application file containing API endpoints, logic, and Pydantic models.
* `places_data.json`: Static file containing metadata (duration, cost, etc.) for sample places.
* `requirements.txt`: Python package dependencies.

## Setup Instructions

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```
2.  **Create and activate a virtual environment (Recommended):**
    ```bash
    python -m venv venv
    # On macOS/Linux:
    source venv/bin/activate
    # On Windows:
    .\venv\Scripts\activate
    ```
    *(Ensure you have Python 3.8 or newer installed and accessible)*
3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

## Running the Server

1.  **Start the FastAPI server using Uvicorn:**
    ```bash
    uvicorn main:app --reload --port 8000
    ```
    * `--reload`: Enables auto-reload on code changes (useful for development).
    * `--port 8000`: Specifies the port to run on (ensure this matches `API_URL` in the frontend).

2.  **Access the API:**
    * The API will be running at `http://127.0.0.1:8000`.
    * A health check endpoint is available at `http://127.0.0.1:8000/health`.
    * Interactive API documentation (Swagger UI) is available at `http://127.0.0.1:8000/docs`.

## API Endpoints

* **`POST /api/v1/generate-itinerary`**:
    * **Request Body:** Expects JSON matching the `ItineraryRequest` model (duration, unit, budget, preferred_places).
    * **Response Body:** Returns JSON matching the `ItineraryResponse` model (list of itinerary items, total cost, notes).
* **`GET /health`**: Returns `{"status": "ok"}` if the server is running.

## Data File

* `places_data.json`: Contains metadata for known places. The backend uses this to provide more consistent estimates for visit duration and entry fees. You can modify or extend this file with more places. If this file is missing or corrupt, the backend will log a warning and fall back to purely random estimates.