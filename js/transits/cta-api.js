/**
 * CTA API Integration
 * Handles queries to CTA Bus Tracker API
 */

const BUS_API_BASE = 'http://www.ctabustracker.com/bustime/api/v2';

// API key will be stored in config
let apiKey = null;

/**
 * Set the CTA API key
 */
export function setCTAApiKey(key) {
	apiKey = key;
}

/**
 * Get the CTA API key from localStorage
 */
export function getCTAApiKey() {
	if (!apiKey) {
		apiKey = localStorage.getItem('cta_api_key');
	}
	return apiKey;
}

/**
 * Save the CTA API key to localStorage
 */
export function saveCTAApiKey(key) {
	apiKey = key;
	localStorage.setItem('cta_api_key', key);
}

/**
 * Check if API key is configured
 */
export function hasAPIKey() {
	return !!getCTAApiKey();
}

/**
 * Get all bus routes
 * @returns {Promise<Array>} Array of route objects
 */
export async function getBusRoutes() {
	const key = getCTAApiKey();
	if (!key) {
		throw new Error('CTA API key not configured');
	}

	try {
		const url = `${BUS_API_BASE}/getroutes?key=${key}&format=json`;
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`API request failed: ${response.status}`);
		}

		const data = await response.json();

		if (data['bustime-response']?.routes) {
			return data['bustime-response'].routes;
		} else if (data['bustime-response']?.error) {
			throw new Error(data['bustime-response'].error[0].msg);
		}

		throw new Error('Unexpected API response format');
	} catch (error) {
		console.error('Error fetching bus routes:', error);
		throw error;
	}
}

/**
 * Get directions for a specific bus route
 * @param {string} routeNumber - Route number (e.g., "66")
 * @returns {Promise<Array>} Array of direction objects
 */
export async function getBusDirections(routeNumber) {
	const key = getCTAApiKey();
	if (!key) {
		throw new Error('CTA API key not configured');
	}

	try {
		const url = `${BUS_API_BASE}/getdirections?key=${key}&rt=${routeNumber}&format=json`;
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`API request failed: ${response.status}`);
		}

		const data = await response.json();

		if (data['bustime-response']?.directions) {
			return data['bustime-response'].directions;
		} else if (data['bustime-response']?.error) {
			throw new Error(data['bustime-response'].error[0].msg);
		}

		throw new Error('Unexpected API response format');
	} catch (error) {
		console.error('Error fetching bus directions:', error);
		throw error;
	}
}

/**
 * Get stops for a specific bus route and direction
 * @param {string} routeNumber - Route number (e.g., "66")
 * @param {string} direction - Direction (e.g., "Northbound")
 * @returns {Promise<Array>} Array of stop objects
 */
export async function getBusStops(routeNumber, direction) {
	const key = getCTAApiKey();
	if (!key) {
		throw new Error('CTA API key not configured');
	}

	try {
		const url = `${BUS_API_BASE}/getstops?key=${key}&rt=${routeNumber}&dir=${direction}&format=json`;
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`API request failed: ${response.status}`);
		}

		const data = await response.json();

		if (data['bustime-response']?.stops) {
			return data['bustime-response'].stops;
		} else if (data['bustime-response']?.error) {
			throw new Error(data['bustime-response'].error[0].msg);
		}

		throw new Error('Unexpected API response format');
	} catch (error) {
		console.error('Error fetching bus stops:', error);
		throw error;
	}
}
