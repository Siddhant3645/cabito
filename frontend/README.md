# Frontend - Mini Travel Itinerary Generator UI

This directory contains the React frontend application built using Vite.

## Description

This application provides a user interface to interact with the Mini Travel Itinerary Generator API. It allows users to input their preferences and displays the generated itinerary.

## Tech Stack

* React 18+
* Vite (Build Tool / Dev Server)
* JavaScript (ES6+)
* CSS (Basic styling in `App.css`)
* `Workspace` API (for backend communication)

## Project Structure

* `src/`: Contains the main application source code.
    * `main.jsx`: Application entry point.
    * `App.jsx`: Main application component managing state and layout.
    * `components/`: Reusable React components (`ItineraryForm.jsx`, `ItineraryDisplay.jsx`).
    * `App.css`: Basic application styles.
* `public/`: Static assets.
* `index.html`: Main HTML template.
* `package.json`: Project metadata and dependencies.
* `vite.config.js`: Vite configuration file.

## Setup Instructions

1.  **Prerequisites:** Ensure you have Node.js (v16 or newer recommended) and npm installed.
2.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```
3.  **Install dependencies:**
    ```bash
    npm install
    ```

## Running the Development Server

1.  **Start the Vite development server:**
    ```bash
    npm run dev
    ```
2.  **Access the application:** Open your web browser and navigate to the URL provided by Vite (usually `http://localhost:5173`).

## Connecting to the Backend

* This frontend application expects the backend API service to be running.
* The API endpoint URL is configured in `src/App.jsx` within the `API_URL` constant (default: `http://127.0.0.1:8000/api/v1/generate-itinerary`).
* **Ensure the backend service is running on the correct host and port** (`http://127.0.0.1:8000` by default) for the frontend to successfully fetch data. CORS is configured in the backend (`main.py`) to allow requests from common development ports like `5173`.