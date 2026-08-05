// Centralized API configuration
// The base URL of the backend API. Prefer REACT_APP_API_URL in environment.
// In the browser (production) fall back to the current origin so API calls target the same host.
let API_BASE_URL = process.env.REACT_APP_API_URL;

if (!API_BASE_URL) {
	if (typeof window !== "undefined" && window.location && window.location.origin) {
		API_BASE_URL = window.location.origin
	} else {
		// When building or running locally without env, fall back to localhost:5000
		API_BASE_URL = "http://localhost:5000"
	}
}

export default API_BASE_URL;
