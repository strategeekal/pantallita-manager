/**
 * Transits Manager Module
 * Handles loading, editing, and saving CTA transit routes
 */

import { fetchGitHubFile, saveGitHubFile } from '../core/api.js';
import { parseCSV } from '../core/utils.js';
import { getTrainLines, getTrainStops, getBusRoutes, getLineColor } from './cta-stops-db.js';
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
	// Add transit button
	// Modal-based, no inline button needed
	if (addBtn) {
		// openAddTransitDialog called via onclick
	}

	// Form submit
	const form = document.getElementById('transit-form');
	if (form) {
		form.addEventListener('submit', handleTransitFormSubmit);
	}

	// Cancel button
	// Modal close via onclick
	if (cancelBtn) {
		// closeTransitEditor called via onclick
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

		// Format the filters text
		let filtersText = '';
		if (transit.commuteHours || transit.days) {
			const timeText = transit.commuteHours ? formatCommuteHours(transit.commuteHours) : '';
			const daysText = transit.days ? formatDays(transit.days) : '';

			if (timeText && daysText) {
				filtersText = `Showing arrival times from ${timeText} on ${daysText}`;
			} else if (timeText) {
				filtersText = `Showing arrival times from ${timeText}`;
			} else if (daysText) {
				filtersText = `Showing on ${daysText}`;
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
					<div class="transit-details">
						<span>Stop: ${transit.stopNumber}</span>
						<span>Arrival times &gt; ${transit.minTime} minutes</span>
					</div>
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
	document.getElementById('transit-form').reset();

	// Set default values
	document.getElementById('transit-type').value = '';
	document.getElementById('transit-line').value = '';
	document.getElementById('transit-line').disabled = true;
	document.getElementById('transit-min-time').value = '10';
	document.getElementById('transit-commute-hours').value = '';

	// Hide conditional fields
	document.getElementById('transit-stop-group').style.display = 'none';
	document.getElementById('transit-direction-group').style.display = 'none';
	document.getElementById('transit-stop-number-group').style.display = 'none';

	// Uncheck all day checkboxes
	const dayCheckboxes = document.querySelectorAll('.day-checkbox');
	dayCheckboxes.forEach(cb => cb.checked = false);
}

/**
 * Handle transit type change (train/bus)
 */
export function handleTypeChange() {
	const type = document.getElementById('transit-type').value;
	const lineSelect = document.getElementById('transit-line');
	const stopGroup = document.getElementById('transit-stop-group');
	const stopNumberGroup = document.getElementById('transit-stop-number-group');
	const busStopCodeGroup = document.getElementById('transit-bus-stop-code-group');
	const directionGroup = document.getElementById('transit-direction-group');

	// Clear previous selections
	lineSelect.innerHTML = '<option value="">Select...</option>';
	document.getElementById('transit-stop').innerHTML = '<option value="">Select a line first...</option>';
	document.getElementById('transit-stop-number').value = '';
	if (busStopCodeGroup) {
		document.getElementById('transit-bus-stop-code').value = '';
		document.getElementById('bus-stop-lookup-result').innerHTML = '';
	}

	if (!type) {
		lineSelect.disabled = true;
		stopGroup.style.display = 'none';
		stopNumberGroup.style.display = 'none';
		if (busStopCodeGroup) busStopCodeGroup.style.display = 'none';
		if (directionGroup) directionGroup.style.display = 'none';
		return;
	}

	lineSelect.disabled = false;

	if (type === 'train') {
		// Populate train lines
		const lines = getTrainLines();
		lines.forEach(line => {
			const option = document.createElement('option');
			option.value = line.route;
			option.textContent = `${line.route} Line`;
			const color = CTA_LINE_COLORS[line.route] || '#999';
			option.style.color = color;
			lineSelect.appendChild(option);
		});
		stopGroup.style.display = 'block';
		stopNumberGroup.style.display = 'block';
		if (busStopCodeGroup) busStopCodeGroup.style.display = 'none';
		if (directionGroup) directionGroup.style.display = 'none';
	} else if (type === 'bus') {
		// Populate bus routes
		const routes = getBusRoutes();
		routes.forEach(route => {
			const option = document.createElement('option');
			option.value = route.route;
			option.textContent = `${route.route} - ${route.name}`;
			lineSelect.appendChild(option);
		});
		stopGroup.style.display = 'none';
		stopNumberGroup.style.display = 'block';
		if (busStopCodeGroup) busStopCodeGroup.style.display = 'block';
		if (directionGroup) directionGroup.style.display = 'none';

		// For buses, display label must be entered manually
		document.getElementById('transit-display-label-group').style.display = 'block';
	}
}

/**
 * Handle line/route change
 */
export function handleLineChange() {
	const type = document.getElementById('transit-type').value;
	const line = document.getElementById('transit-line').value;
	const stopSelect = document.getElementById('transit-stop');
	const directionSelect = document.getElementById('transit-direction');
	const directionGroup = document.getElementById('transit-direction-group');

	if (!line) return;

	// Clear direction dropdown
	directionSelect.innerHTML = '<option value="">Select a station first...</option>';
	directionGroup.style.display = 'none';
	document.getElementById('transit-stop-number').value = '';

	if (type === 'train') {
		// Populate stations for this line
		stopSelect.innerHTML = '<option value="">Select station...</option>';
		const stops = getTrainStops(line);

		stops.forEach(stop => {
			const option = document.createElement('option');
			option.value = stop.name; // Use name as value
			option.textContent = stop.name;
			option.dataset.stopData = JSON.stringify(stop); // Store full stop data
			stopSelect.appendChild(option);
		});
	}
}

/**
 * Handle stop/station change - populates direction dropdown
 */
export function handleStopChange() {
	const stopSelect = document.getElementById('transit-stop');
	const selectedStationName = stopSelect.value;
	const directionSelect = document.getElementById('transit-direction');
	const directionGroup = document.getElementById('transit-direction-group');

	if (!selectedStationName) {
		directionGroup.style.display = 'none';
		return;
	}

	// Get the stop data from the selected option
	const selectedOption = stopSelect.options[stopSelect.selectedIndex];
	const stopData = JSON.parse(selectedOption.dataset.stopData || '{}');

	if (stopData.directions && stopData.directions.length > 0) {
		// Populate direction dropdown
		directionSelect.innerHTML = '<option value="">Select direction...</option>';

		stopData.directions.forEach(dir => {
			const option = document.createElement('option');
			option.value = dir.id;
			option.textContent = dir.label;
			option.dataset.label = dir.label;
			directionSelect.appendChild(option);
		});

		directionGroup.style.display = 'block';

		// If only one direction, auto-select it
		if (stopData.directions.length === 1) {
			directionSelect.value = stopData.directions[0].id;
			handleDirectionChange();
		}
	}
}

/**
 * Handle direction change - auto-fills stop ID
 */
export function handleDirectionChange() {
	const directionSelect = document.getElementById('transit-direction');
	const stopNumber = directionSelect.value;
	const directionLabel = directionSelect.options[directionSelect.selectedIndex]?.dataset.label;

	if (stopNumber) {
		document.getElementById('transit-stop-number').value = stopNumber;

		// Optionally pre-fill display label from direction label (e.g., "to Howard" -> "Howard")
		const labelInput = document.getElementById('transit-display-label');
		if ((!labelInput.value || labelInput.value === '') && directionLabel) {
			const match = directionLabel.match(/to (.+)/);
			if (match) {
				labelInput.value = match[1];
			}
		}
	}
}

/**
 * Handle bus stop code input - validates and looks up stop
 */
export function handleBusStopCodeInput() {
	const stopCodeInput = document.getElementById('transit-bus-stop-code');
	const stopNumberInput = document.getElementById('transit-stop-number');
	const resultDiv = document.getElementById('bus-stop-lookup-result');

	const stopCode = stopCodeInput.value.trim();

	if (!stopCode) {
		resultDiv.innerHTML = '';
		stopNumberInput.value = '';
		return;
	}

	// Look up the stop
	const stop = lookupBusStop(stopCode);

	if (stop) {
		// Valid stop found
		resultDiv.innerHTML = `<span style="color: #4caf50;">✓ Found: ${stop.name}</span>`;
		stopNumberInput.value = stop.id;

		// Auto-suggest display label from stop name (extract main street/location)
		const labelInput = document.getElementById('transit-display-label');
		if (!labelInput.value) {
			// Try to extract a meaningful label from stop name
			const nameParts = stop.name.split(',')[0]; // Take first part before comma
			labelInput.value = nameParts.trim();
		}
	} else {
		// Invalid stop code
		resultDiv.innerHTML = `<span style="color: #f44336;">✗ Stop code not found</span>`;
		stopNumberInput.value = '';
	}
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

	// Populate type first
	document.getElementById('transit-type').value = transit.type;

	// Trigger type change to populate line dropdown
	handleTypeChange();

	// Then set the line/route
	document.getElementById('transit-line').value = transit.route;

	// If train, trigger line change to populate stops
	if (transit.type === 'train') {
		handleLineChange();

		// Then set the stop if we have a stop number
		if (transit.stopNumber) {
			document.getElementById('transit-stop').value = transit.stopNumber;
			handleStopChange();
		}
	} else {
		// For buses, manually fill stop number field (if visible)
		const stopNumberInput = document.getElementById('transit-stop-number');
		if (stopNumberInput) {
			stopNumberInput.value = transit.stopNumber;
		}
	}

	// Populate other fields
	document.getElementById('transit-display-label').value = transit.displayLabel;
	document.getElementById('transit-min-time').value = transit.minTime;
	document.getElementById('transit-commute-hours').value = transit.commuteHours || '';

	// Handle day filter
	const dayFilter = transit.days;
	const dayCheckboxes = document.querySelectorAll('.day-checkbox');

	// Uncheck all first
	dayCheckboxes.forEach(cb => cb.checked = false);

	if (dayFilter) {
		// Check based on day filter value
		if (dayFilter === 'weekday') {
			// Check Mon-Fri (0-4)
			for (let i = 0; i <= 4; i++) {
				const cb = document.querySelector(`.day-checkbox[value="${i}"]`);
				if (cb) cb.checked = true;
			}
		} else if (dayFilter === 'weekend') {
			// Check Sat-Sun (5-6)
			for (let i = 5; i <= 6; i++) {
				const cb = document.querySelector(`.day-checkbox[value="${i}"]`);
				if (cb) cb.checked = true;
			}
		} else {
			// Parse day codes (e.g., "012456")
			for (let char of dayFilter) {
				const day = parseInt(char);
				if (!isNaN(day) && day >= 0 && day <= 6) {
					const cb = document.querySelector(`.day-checkbox[value="${day}"]`);
					if (cb) cb.checked = true;
				}
			}
		}
	}
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

	const type = document.getElementById('transit-type').value;
	const route = document.getElementById('transit-line').value.trim();
	const displayLabel = document.getElementById('transit-display-label').value.trim();
	const stopNumberField = document.getElementById('transit-stop-number');
	const stopNumber = stopNumberField && stopNumberField.value ? stopNumberField.value.trim() : '';
	const minTime = parseInt(document.getElementById('transit-min-time').value) || 0;
	const commuteHours = document.getElementById('transit-commute-hours').value.trim();

	// Get checked days
	const dayCheckboxes = document.querySelectorAll('.day-checkbox:checked');
	const checkedDays = Array.from(dayCheckboxes).map(cb => parseInt(cb.value)).sort();

	// Convert to day filter string (optional)
	let days = '';
	if (checkedDays.length > 0) {
		if (checkedDays.length === 5 && checkedDays.every((d, i) => d === i)) {
			days = 'weekday';
		} else if (checkedDays.length === 2 && checkedDays[0] === 5 && checkedDays[1] === 6) {
			days = 'weekend';
		} else {
			days = checkedDays.join('');
		}
	}

	// Validate required fields
	if (!type || !route || !displayLabel) {
		alert('Please fill in all required fields (Type, Route, Display Label)');
		return;
	}

	// For trains, stop number is required
	if (type === 'train' && !stopNumber) {
		alert('Please select a stop for train routes');
		return;
	}

	const transitData = {
		type,
		route,
		displayLabel,
		stopNumber: stopNumber || '',
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
		reloadTransits,
		handleTypeChange,
		handleLineChange,
		handleStopChange,
		handleDirectionChange,
		handleBusStopCodeInput
	};
}
