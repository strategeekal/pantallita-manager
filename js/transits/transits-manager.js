/**
 * Transits Manager Module
 * Handles loading, editing, and saving CTA transit routes
 */

import { fetchGitHubFile, saveGitHubFile } from '../core/api.js';
import { parseCSV } from '../core/utils.js';
import { getTrainLines, getTrainStops, getBusRoutes, getLineColor } from './cta-stops-db.js';

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
 * @param {string} content - CSV content
 * @returns {Array} Array of transit objects
 */
function parseTransitsCSV(content) {
	const lines = parseCSV(content);

	return lines.map((line, index) => {
		const parts = line.split(',').map(p => p.trim());

		if (parts.length < 8) return null;

		return {
			type: parts[0] || '',
			route: parts[1] || '',
			destination: parts[2] || '',
			stopId: parts[3] || '',
			minThreshold: parseInt(parts[4]) || 0,
			color: parts[5] || '',
			timeFilter: parts[6] || '',
			dayFilter: parts[7] || '',
			altColor: parts.length >= 9 ? parts[8] : '',
			index: index
		};
	}).filter(transit => transit !== null);
}

/**
 * Build CSV content from transits data
 * @returns {string} CSV content
 */
function buildTransitsCSV() {
	const header = `# CTA Transit Routes
# Format: type,route,destination,stop_id,min_threshold,color,time_filter,day_filter,alt_color
# type: train or bus
# min_threshold: minimum minutes to show arrival
# time_filter: hour range (e.g., "6-10" for 6am-10am)
# day_filter: weekday, weekend, or day codes (0-6 for Mon-Sun)
# alt_color: optional alternative color for multi-line routes

`;

	const lines = transitsData.map(transit =>
		`${transit.type},${transit.route},${transit.destination},${transit.stopId},${transit.minThreshold},${transit.color},${transit.timeFilter},${transit.dayFilter},${transit.altColor || ''}`
	);

	return header + lines.join('\n');
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
		const altColorBadge = transit.altColor ? `<span class="alt-color-badge" style="background-color: ${transit.altColor};">${transit.altColor}</span>` : '';

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
					<div class="transit-route" style="color: ${transit.color};">
						${transit.route}
						${altColorBadge}
					</div>
					<div class="transit-destination">→ ${transit.destination}</div>
					<div class="transit-details">
						<span>Stop: ${transit.stopId}</span>
						<span>Min: ${transit.minThreshold}m</span>
					</div>
					<div class="transit-filters">
						<span class="filter-badge">${transit.timeFilter}</span>
						<span class="filter-badge">${transit.dayFilter}</span>
					</div>
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
	document.getElementById('transit-min-threshold').value = '10';
	document.getElementById('transit-time-filter').value = '0-23';

	// Hide conditional fields
	document.getElementById('transit-stop-group').style.display = 'none';
	document.getElementById('transit-stop-id-group').style.display = 'none';

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
	const stopIdGroup = document.getElementById('transit-stop-id-group');

	// Clear previous selections
	lineSelect.innerHTML = '<option value="">Select...</option>';
	document.getElementById('transit-stop').innerHTML = '<option value="">Select a line first...</option>';
	document.getElementById('transit-color').value = '';
	document.getElementById('transit-stop-id').value = '';

	if (!type) {
		lineSelect.disabled = true;
		stopGroup.style.display = 'none';
		stopIdGroup.style.display = 'none';
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
			option.style.color = line.color;
			lineSelect.appendChild(option);
		});
		stopGroup.style.display = 'block';
		stopIdGroup.style.display = 'block';
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
		stopIdGroup.style.display = 'none';

		// For buses, stop ID must be entered manually
		document.getElementById('transit-destination-group').style.display = 'block';
	}
}

/**
 * Handle line/route change
 */
export function handleLineChange() {
	const type = document.getElementById('transit-type').value;
	const line = document.getElementById('transit-line').value;
	const stopSelect = document.getElementById('transit-stop');
	const colorInput = document.getElementById('transit-color');

	if (!line) return;

	// Auto-fill color based on line
	const color = getLineColor(line, type);
	if (color) {
		// Convert hex to color name approximation
		colorInput.value = line.toUpperCase();
	}

	if (type === 'train') {
		// Populate stops for this line
		stopSelect.innerHTML = '<option value="">Select stop...</option>';
		const stops = getTrainStops(line);

		stops.forEach(stop => {
			const option = document.createElement('option');
			option.value = stop.id;
			option.textContent = stop.name;
			option.dataset.name = stop.name;
			stopSelect.appendChild(option);
		});
	}
}

/**
 * Handle stop change
 */
export function handleStopChange() {
	const stopSelect = document.getElementById('transit-stop');
	const stopId = stopSelect.value;
	const stopName = stopSelect.options[stopSelect.selectedIndex]?.dataset.name;

	if (stopId) {
		document.getElementById('transit-stop-id').value = stopId;

		// Optionally pre-fill destination with stop name
		const destInput = document.getElementById('transit-destination');
		if (!destInput.value || destInput.value === '') {
			destInput.value = stopName || '';
		}
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

		// Then set the stop if we have a stop ID
		if (transit.stopId) {
			document.getElementById('transit-stop').value = transit.stopId;
			handleStopChange();
		}
	} else {
		// For buses, manually fill stop ID field (if visible)
		const stopIdInput = document.getElementById('transit-stop-id');
		if (stopIdInput) {
			stopIdInput.value = transit.stopId;
		}
	}

	// Populate other fields
	document.getElementById('transit-destination').value = transit.destination;
	document.getElementById('transit-min-threshold').value = transit.minThreshold;
	document.getElementById('transit-color').value = transit.color;
	document.getElementById('transit-time-filter').value = transit.timeFilter;
	document.getElementById('transit-alt-color').value = transit.altColor || '';

	// Handle day filter
	const dayFilter = transit.dayFilter;
	const dayCheckboxes = document.querySelectorAll('.day-checkbox');

	// Uncheck all first
	dayCheckboxes.forEach(cb => cb.checked = false);

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
	const destination = document.getElementById('transit-destination').value.trim();
	const stopIdField = document.getElementById('transit-stop-id');
	const stopId = stopIdField && stopIdField.value ? stopIdField.value.trim() : '';
	const minThreshold = parseInt(document.getElementById('transit-min-threshold').value) || 0;
	const color = document.getElementById('transit-color').value.trim().toUpperCase();
	const timeFilter = document.getElementById('transit-time-filter').value.trim();
	const altColor = document.getElementById('transit-alt-color').value.trim().toUpperCase();

	// Get checked days
	const dayCheckboxes = document.querySelectorAll('.day-checkbox:checked');
	const checkedDays = Array.from(dayCheckboxes).map(cb => parseInt(cb.value)).sort();

	// Convert to day filter string
	let dayFilter;
	if (checkedDays.length === 5 && checkedDays.every((d, i) => d === i)) {
		dayFilter = 'weekday';
	} else if (checkedDays.length === 2 && checkedDays[0] === 5 && checkedDays[1] === 6) {
		dayFilter = 'weekend';
	} else {
		dayFilter = checkedDays.join('');
	}

	// Validate required fields
	if (!type || !route || !destination || !color || !timeFilter || !dayFilter) {
		alert('Please fill in all required fields');
		return;
	}

	// For trains, stop ID is required
	if (type === 'train' && !stopId) {
		alert('Please select a stop for train routes');
		return;
	}

	const transitData = {
		type,
		route,
		destination,
		stopId: stopId || '',
		minThreshold,
		color,
		timeFilter,
		dayFilter,
		altColor
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
		handleStopChange
	};
}
