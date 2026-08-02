// Centralized API configuration
// The base URL of the backend API. Set via REACT_APP_API_URL in .env
// Falls back to http://localhost:5000 for local development.
// In production, always set REACT_APP_API_URL in the .env file.
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default API_BASE_URL;
