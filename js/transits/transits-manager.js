/**
 * Transits Manager Module
 * Handles loading, editing, and saving CTA transit routes
 */

import { fetchGitHubFile, saveGitHubFile } from '../core/api.js';
import { parseCSV } from '../core/utils.js';
import { getTrainLines, getTrainStops, getBusRoutes, getLineColor, CTA_TRAIN_LINES } from './cta-stops-db.js';
import { lookupBusStop } from './cta-bus-stops.js';
import { updateCSVVersion } from '../config/config-manager.js';

// CTA Line Color Mapping
const CTA_LINE_COLORS = {
	'Red': '#C60C30',
	'Blue': '#00A1DE',
	'Brn': '#62361B',
	'Brown': '#62361B',
	'G': '#009B3A',
	'Green': '#009B3A',
	'Org': '#F9461C',
	'Orange': '#F9461C',
	'P': '#522398',
	'Pexp': '#522398',
	'Purple': '#522398',
	'Pink': '#E27EA6',
	'Y': '#F9E300',
	'Yellow': '#F9E300'
};

// CTA Code to Full Name Mapping
const CTA_LINE_NAMES = {
	'Red': 'Red',
	'Blue': 'Blue',
	'Brn': 'Brown',
	'Brown': 'Brown',
	'G': 'Green',
	'Green': 'Green',
	'Org': 'Orange',
	'Orange': 'Orange',
	'P': 'Purple',
	'Pexp': 'Purple Express',
	'Purple': 'Purple',
	'Pink': 'Pink',
	'Y': 'Yellow',
	'Yellow': 'Yellow'
};

// Day code to name mapping
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

let transitsData = [];
let transitsSha = null;
let editingTransitIndex = null;

/**
 * Initialize the transits manager
 */
export function init() {
	console.log('Initializing Transits Manager...');
	loadTransits();
	setupEventListeners();
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
	// Form submit
	const form = document.getElementById('transit-form');
	if (form) {
		form.addEventListener('submit', handleTransitFormSubmit);
	}
}

/**
 * Load transits from GitHub
 */
async function loadTransits() {
	const loadingEl = document.getElementById('transits-loading');
	const errorEl = document.getElementById('transits-error');
	const listEl = document.getElementById('transits-list');

	try {
		if (loadingEl) loadingEl.classList.remove('hidden');
		if (errorEl) errorEl.classList.add('hidden');

		const response = await fetchGitHubFile('transits.csv');

		if (!response || !response.content) {
			throw new Error('Transits file not found');
		}

		transitsSha = response.sha;
		transitsData = parseTransitsCSV(response.content);

		renderTransitsList();

		if (loadingEl) loadingEl.classList.add('hidden');

	} catch (error) {
		console.error('Error loading transits:', error);
		if (loadingEl) loadingEl.classList.add('hidden');
		if (errorEl) {
			errorEl.textContent = `Error: ${error.message}`;
			errorEl.classList.remove('hidden');
		}
		if (listEl) listEl.innerHTML = '';
	}
}

/**
 * Parse transits CSV content
 * New format: type,route,display_label,stop_number,min_time,commute_hours,days
 * @param {string} content - CSV content
 * @returns {Array} Array of transit objects
 */
function parseTransitsCSV(content) {
	const lines = parseCSV(content);

	return lines.map((line, index) => {
		const parts = line.split(',').map(p => p.trim());

		if (parts.length < 5) return null;

		return {
			type: parts[0] || '',
			route: parts[1] || '',
			displayLabel: parts[2] || '',
			stopNumber: parts[3] || '',
			minTime: parseInt(parts[4]) || 0,
			commuteHours: parts.length >= 6 ? parts[5] : '',
			days: parts.length >= 7 ? parts[6] : '',
			index: index
		};
	}).filter(transit => transit !== null);
}

/**
 * Build CSV content from transits data
 * New format: type,route,display_label,stop_number,min_time,commute_hours,days
 * @returns {string} CSV content
 */
function buildTransitsCSV() {
	const header = `# CTA Transit Routes
# Format: type,route,display_label,stop_number,min_time,commute_hours,days
# type: train or bus
# route: CTA route code(s) - Red, Blue, Brn, G, Org, P, Pink, Y (trains) or bus number
#        Multiple routes can be separated by pipes (e.g., "Brn|P")
# display_label: Custom label to show on display (e.g., "96St", "Loop")
# stop_number: CTA stop ID (can be multiple, pipe-separated)
# min_time: Minimum minutes to show arrival
# commute_hours: Optional time filter, hour range (e.g., "9-12" for 9am-12pm)
# days: Optional day filter - "weekday", "weekend", or day codes (0-6 for Mon-Sun)
#
# Examples:
# train,Red,96St,41220,10,9-12,weekday
# train,Brn|P,Loop,40530,10,9-12,weekday
# bus,8,79st,5768,3,,weekday

`;

	const lines = transitsData.map(transit =>
		`${transit.type},${transit.route},${transit.displayLabel},${transit.stopNumber},${transit.minTime},${transit.commuteHours || ''},${transit.days || ''}`
	);

	return header + lines.join('\n');
}

/**
 * Format commute hours (e.g., "9-12" -> "9am to 12pm")
 */
function formatCommuteHours(hours) {
	if (!hours) return '';

	const parts = hours.split('-');
	if (parts.length !== 2) return hours;

	const start = parseInt(parts[0]);
	const end = parseInt(parts[1]);

	const formatHour = (h) => {
		if (h === 0) return '12am';
		if (h < 12) return `${h}am`;
		if (h === 12) return '12pm';
		return `${h - 12}pm`;
	};

	return `${formatHour(start)} to ${formatHour(end)}`;
}

/**
 * Format days filter for readable display
 * Examples: "weekday" -> "Weekdays", "weekend" -> "Weekends",
 *           "01234" -> "Mon - Fri", "0124" -> "Mon, Tue, Fri"
 */
function formatDays(days) {
	if (!days) return '';

	if (days === 'weekday') {
		return 'Weekdays';
	} else if (days === 'weekend') {
		return 'Weekends';
	} else {
		// Parse day codes into array of numbers
		const dayNums = [];
		for (let char of days) {
			const dayNum = parseInt(char);
			if (!isNaN(dayNum) && dayNum >= 0 && dayNum <= 6) {
				dayNums.push(dayNum);
			}
		}

		if (dayNums.length === 0) return '';
		if (dayNums.length === 1) return DAY_NAMES[dayNums[0]];

		// Check if days are consecutive (for range format like "Mon - Fri")
		const isConsecutive = dayNums.every((day, i) =>
			i === 0 || day === dayNums[i - 1] + 1
		);

		if (isConsecutive && dayNums.length >= 3) {
			// Use range format for 3+ consecutive days
			return `${DAY_NAMES[dayNums[0]]} - ${DAY_NAMES[dayNums[dayNums.length - 1]]}`;
		} else {
			// List individual days for non-consecutive selections
			return dayNums.map(d => DAY_NAMES[d]).join(', ');
		}
	}
}

/**
 * Get stop name from database
 * @param {string} stopNumber - Stop ID (can be pipe-separated)
 * @param {string} type - 'train' or 'bus'
 * @returns {string} Stop name or empty string if not found
 */
function getStopName(stopNumber, type) {
	if (!stopNumber) return '';

	// Handle multiple stops - use the first one
	const firstStopId = stopNumber.split('|')[0].trim();

	if (type === 'train') {
		// Search through all train lines for this stop ID
		for (const lineData of Object.values(CTA_TRAIN_LINES)) {
			for (const stop of lineData.stops) {
				// Check if this stop has the ID in any of its directions
				if (stop.directions) {
					for (const direction of stop.directions) {
						if (direction.id === firstStopId) {
							return stop.name;
						}
					}
				} else if (stop.id === firstStopId) {
					// Some stops might just have an id field directly
					return stop.name;
				}
			}
		}
		return ''; // Not found
	} else if (type === 'bus') {
		// Look up bus stop
		const busStop = lookupBusStop(firstStopId);
		return busStop ? busStop.name : '';
	}

	return '';
}

/**
 * Render transits list
 */
function renderTransitsList() {
	const listEl = document.getElementById('transits-list');
	const emptyEl = document.getElementById('transits-empty');

	if (!listEl) return;

	if (transitsData.length === 0) {
		listEl.innerHTML = '';
		if (emptyEl) emptyEl.classList.remove('hidden');
		return;
	}

	if (emptyEl) emptyEl.classList.add('hidden');

	let html = '<div class="transits-grid">';

	transitsData.forEach((transit, index) => {
		const typeIcon = transit.type === 'train' ? '🚇' : '🚌';

		// Get colors and names for route(s) - handle multiple routes separated by pipes
		const routes = transit.route.split('|');
		const routeColors = routes.map(r => CTA_LINE_COLORS[r.trim()] || (transit.type === 'bus' ? '#FFFFFF' : '#999999'));
		const routeNames = routes.map(r => CTA_LINE_NAMES[r.trim()] || r.trim());

		// Create route display with color badges and full names
		let routeDisplay = '';
		if (transit.type === 'bus') {
			routeDisplay = `<span style="color: #FFFFFF;">Bus ${transit.route}</span>`;
		} else {
			routes.forEach((route, i) => {
				const color = routeColors[i];
				const name = routeNames[i];
				routeDisplay += `<span class="route-badge" style="background-color: ${color}; color: white; padding: 2px 6px; border-radius: 3px; margin-right: 4px;">${name}</span>`;
			});
		}

		// Get the actual stop name from database
		const stopName = getStopName(transit.stopNumber, transit.type);

		// Format the filters text
		let filtersText = '';
		if (transit.commuteHours || transit.days) {
			const timeText = transit.commuteHours ? formatCommuteHours(transit.commuteHours) : '';
			const daysText = transit.days ? formatDays(transit.days) : '';

			if (timeText && daysText) {
				filtersText = `Active: ${timeText} on ${daysText}`;
			} else if (timeText) {
				filtersText = `Active: ${timeText}`;
			} else if (daysText) {
				filtersText = `Active on ${daysText}`;
			}
		}

		html += `
			<div class="transit-card" data-index="${index}" draggable="true">
				<div class="transit-header">
					<span class="transit-type">${typeIcon} ${transit.type.toUpperCase()}</span>
					<div class="transit-actions">
						<button class="btn-icon" onclick="window.transitsManager.editTransit(${index})" title="Edit">✏️</button>
						<button class="btn-icon" onclick="window.transitsManager.deleteTransit(${index})" title="Delete">🗑️</button>
					</div>
				</div>
				<div class="transit-info">
					<div class="transit-route">
						${routeDisplay}
					</div>
					<div class="transit-destination">→ ${transit.displayLabel}</div>
					<div class="transit-detail-line">Stop: ${transit.stopNumber}${stopName ? ` (${stopName})` : ''}</div>
					<div class="transit-detail-line">Arrival times &gt; ${transit.minTime} minutes</div>
					${filtersText ? `<div class="transit-filters-text" style="margin-top: 8px; font-size: 0.85em; color: #888;">${filtersText}</div>` : ''}
				</div>
			</div>
		`;
	});

	html += '</div>';
	listEl.innerHTML = html;

	// Setup drag and drop
	setupDragAndDrop();
}

/**
 * Setup drag and drop functionality
 */
function setupDragAndDrop() {
	const cards = document.querySelectorAll('.transit-card');

	cards.forEach(card => {
		card.addEventListener('dragstart', handleDragStart);
		card.addEventListener('dragover', handleDragOver);
		card.addEventListener('drop', handleDrop);
		card.addEventListener('dragenter', handleDragEnter);
		card.addEventListener('dragleave', handleDragLeave);
		card.addEventListener('dragend', handleDragEnd);
	});
}

let draggedElement = null;

function handleDragStart(e) {
	draggedElement = this;
	this.classList.add('dragging');
	e.dataTransfer.effectAllowed = 'move';
	e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragOver(e) {
	if (e.preventDefault) {
		e.preventDefault();
	}
	e.dataTransfer.dropEffect = 'move';
	return false;
}

function handleDragEnter(e) {
	if (this !== draggedElement) {
		this.classList.add('drag-over');
	}
}

function handleDragLeave(e) {
	this.classList.remove('drag-over');
}

function handleDrop(e) {
	if (e.stopPropagation) {
		e.stopPropagation();
	}

	if (draggedElement !== this) {
		const fromIndex = parseInt(draggedElement.dataset.index);
		const toIndex = parseInt(this.dataset.index);

		// Reorder the array
		const item = transitsData.splice(fromIndex, 1)[0];
		transitsData.splice(toIndex, 0, item);

		// Re-render
		renderTransitsList();

		// Auto-save
		saveTransits();
	}

	return false;
}

function handleDragEnd(e) {
	const cards = document.querySelectorAll('.transit-card');
	cards.forEach(card => {
		card.classList.remove('dragging', 'drag-over');
	});
}

/**
 * Show add transit form
 */
export function openAddTransitDialog() {
	editingTransitIndex = null;
	document.getElementById('transit-editor-title').textContent = 'Add New Transit Route';
	document.getElementById('transit-editor-modal').classList.remove('hidden');

	// Reset form
	const form = document.getElementById('transit-form');
	if (form) form.reset();

	// Set default values
	document.getElementById('transit-type').value = '';
	document.getElementById('transit-route').value = '';
	document.getElementById('transit-display-label').value = '';
	document.getElementById('transit-stop-number').value = '';
	document.getElementById('transit-min-time').value = '10';
	document.getElementById('transit-commute-hours').value = '';
	document.getElementById('transit-days').value = '';
}


/**
 * Hide transit form
 */
export function closeTransitEditor() {
	document.getElementById('transit-editor-modal').classList.add('hidden');
	editingTransitIndex = null;
}

/**
 * Edit transit
 * @param {number} index - Transit index
 */
export function editTransit(index) {
	editingTransitIndex = index;
	const transit = transitsData[index];

	if (!transit) return;

	document.getElementById('transit-editor-title').textContent = 'Edit Transit Route';
	document.getElementById('transit-editor-modal').classList.remove('hidden');

	// Populate all 7 fields directly
	document.getElementById('transit-type').value = transit.type || '';
	document.getElementById('transit-route').value = transit.route || '';
	document.getElementById('transit-display-label').value = transit.displayLabel || '';
	document.getElementById('transit-stop-number').value = transit.stopNumber || '';
	document.getElementById('transit-min-time').value = transit.minTime || 10;
	document.getElementById('transit-commute-hours').value = transit.commuteHours || '';
	document.getElementById('transit-days').value = transit.days || '';
}

/**
 * Delete transit
 * @param {number} index - Transit index
 */
export function deleteTransit(index) {
	if (!confirm('Are you sure you want to delete this transit route?')) {
		return;
	}

	transitsData.splice(index, 1);
	renderTransitsList();
	saveTransits();
}

/**
 * Handle form submit
 * @param {Event} e - Submit event
 */
async function handleTransitFormSubmit(e) {
	e.preventDefault();

	// Read all 7 fields directly from the form
	const type = document.getElementById('transit-type').value.trim();
	const route = document.getElementById('transit-route').value.trim();
	const displayLabel = document.getElementById('transit-display-label').value.trim();
	const stopNumber = document.getElementById('transit-stop-number').value.trim();
	const minTime = parseInt(document.getElementById('transit-min-time').value) || 10;
	const commuteHours = document.getElementById('transit-commute-hours').value.trim();
	const days = document.getElementById('transit-days').value.trim();

	// Validate required fields
	if (!type || !route || !displayLabel || !stopNumber) {
		alert('Please fill in all required fields (Type, Route, Display Label, Stop Number)');
		return;
	}

	const transitData = {
		type,
		route,
		displayLabel,
		stopNumber,
		minTime,
		commuteHours: commuteHours || '',
		days: days || ''
	};

	if (editingTransitIndex !== null) {
		// Update existing
		transitsData[editingTransitIndex] = { ...transitData, index: editingTransitIndex };
	} else {
		// Add new
		transitData.index = transitsData.length;
		transitsData.push(transitData);
	}

	renderTransitsList();
	closeTransitEditor();
	await saveTransits();
}

/**
 * Save transits to GitHub
 */
async function saveTransits() {
	const statusEl = document.getElementById('transits-status');

	try {
		if (statusEl) {
			statusEl.textContent = 'Saving...';
			statusEl.classList.remove('hidden');
		}

		const csvContent = buildTransitsCSV();
		const result = await saveGitHubFile('transits.csv', csvContent, transitsSha);

		if (result && result.content && result.content.sha) {
			transitsSha = result.content.sha;
		}

		// Update CSV version timestamp in config
		await updateCSVVersion('transits');

		if (statusEl) {
			statusEl.textContent = '✓ Saved successfully';
			setTimeout(() => {
				statusEl.classList.add('hidden');
			}, 2000);
		}

		console.log('Transits saved successfully');

	} catch (error) {
		console.error('Error saving transits:', error);
		if (statusEl) {
			statusEl.textContent = `Error: ${error.message}`;
		}
		alert('Failed to save transits: ' + error.message);
	}
}

/**
 * Reload transits (discard unsaved changes)
 */
export function reloadTransits() {
	loadTransits();
}

// Expose functions to window for onclick handlers
if (typeof window !== 'undefined') {
	window.transitsManager = {
		init,
		openAddTransitDialog,
		closeTransitEditor,
		editTransit,
		deleteTransit,
		reloadTransits
	};
}
