// Events Management Module
import { fetchGitHubFile, saveGitHubFile, deleteGitHubFile } from '../core/api.js';
import { showStatus, parseCSV, formatDate } from '../core/utils.js';
import { loadConfig } from '../core/config.js';
import { updateCSVVersion } from '../config/config-manager.js';
import {
	loadRecurringEvents,
	getCurrentRecurringEvents,
	setCurrentRecurringEvents,
	saveRecurringEventsToGitHub,
	getNextOccurrence,
	findRecurringEventByMonthDay,
	addRecurringEvent,
	updateRecurringEvent,
	deleteRecurringEventByIndex
} from './recurring-events-manager.js';

let currentEvents = [];
let editingEventIndex = null;
let editorMode = 'ephemeral'; // 'ephemeral' or 'recurring'
let editingRecurringIndex = null;

// Filter state
let eventFilters = {
	search: '',
	dateFilter: 'all',
	sort: 'date-asc',
	typeFilter: 'all' // 'all', 'recurring', 'ephemeral'
};

export async function initializeEvents() {
	await loadAllEvents();
	setupEventFormHandlers();
	// Initialize color preview on first load
	initializeColorPreview();
}

// Load both ephemeral and recurring events
export async function loadAllEvents() {
	const config = loadConfig();

	if (!config.token || !config.owner || !config.repo) {
		showEventsError('Please configure GitHub settings first');
		return;
	}

	showEventsLoading();

	try {
		// Load both types in parallel
		await Promise.all([
			loadEphemeralEvents(),
			loadRecurringEventsData()
		]);

		displayEvents();

		// Update validation badge after loading events
		if (window.updateValidationBadge) {
			window.updateValidationBadge();
		}
	} catch (error) {
		showEventsError('Failed to load events: ' + error.message);
	}
}

// Load ephemeral events only
async function loadEphemeralEvents() {
	try {
		const { content } = await fetchGitHubFile('ephemeral_events.csv');
		currentEvents = parseEventsCSV(content);
	} catch (error) {
		if (error.message.includes('404')) {
			currentEvents = [];
		} else {
			throw error;
		}
	}
}

// Load recurring events only
async function loadRecurringEventsData() {
	try {
		await loadRecurringEvents();
	} catch (error) {
		if (!error.message.includes('404')) {
			console.error('Failed to load recurring events:', error);
		}
	}
}

// Wrapper for backward compatibility - now loads all events
export async function loadEvents() {
	await loadAllEvents();
}

function parseEventsCSV(content) {
	const lines = parseCSV(content);

	return lines.map((line, index) => {
		const parts = line.split(',');

		// Format: YYYY-MM-DD,TopLine,BottomLine,Image,Color[,StartHour,EndHour]
		if (parts.length < 5) return null;

		return {
			index,
			date: parts[0].trim(),
			topLine: parts[1].trim(),
			bottomLine: parts[2].trim(),
			iconName: parts[3].trim(),
			colorName: parts[4].trim(),
			startHour: parts.length > 5 ? parseInt(parts[5].trim()) : 0,
			endHour: parts.length > 6 ? parseInt(parts[6].trim()) : 23,
			startMin: 0, // Not used in this format
			type: 'ephemeral' // Type identifier
		};
	}).filter(e => e !== null);
}

// Get merged list of recurring and ephemeral events sorted by date
function getMergedEventsList() {
	const recurringEvents = getCurrentRecurringEvents();

	// Convert recurring events to display format with computed next occurrence
	const displayableRecurring = recurringEvents.map(event => {
		const nextDate = getNextOccurrence(event.monthDay);
		return {
			...event,
			date: nextDate,
			displayDate: nextDate,
			isNextYear: nextDate.startsWith(String(new Date().getFullYear() + 1)),
			type: 'recurring'
		};
	});

	// Add type to ephemeral events if not already set
	const displayableEphemeral = currentEvents.map(event => ({
		...event,
		type: 'ephemeral'
	}));

	// Merge both lists
	return [...displayableRecurring, ...displayableEphemeral];
}

function displayEvents() {
	const listContainer = document.getElementById('events-list');

	hideEventsMessages();

	// Get merged events list
	const mergedEvents = getMergedEventsList();
	const totalCount = mergedEvents.length;

	if (totalCount === 0) {
		showEventsEmpty();
		updateFilterInfo(0, 0);
		return;
	}

	// Apply filters (including type filter)
	let filteredEvents = applyEventFilters([...mergedEvents]);

	// Apply sorting
	let sortedEvents = applySorting(filteredEvents);

	// Limit "upcoming" filter to next 5 events for better UX
	if (eventFilters.dateFilter === 'upcoming' && sortedEvents.length > 5) {
		sortedEvents = sortedEvents.slice(0, 5);
	}

	// Update filter count
	updateFilterInfo(sortedEvents.length, totalCount);

	// Check if filtered results are empty
	if (sortedEvents.length === 0) {
		listContainer.innerHTML = '<p class="empty-message">No events match the current filters.</p>';
		return;
	}

	const eventsHTML = sortedEvents.map((event) => {
		const eventDate = new Date(event.date + 'T00:00:00');

		// Get current date normalized to midnight
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		// For recurring events, they're never truly "past" - they repeat
		// For ephemeral events, check if date is before today
		let isPast = false;
		if (event.type === 'ephemeral') {
			isPast = eventDate < today;

			// If event is today and has specific time window, check if end hour has passed
			if (!isPast && eventDate.getTime() === today.getTime()) {
				const now = new Date();
				const currentHour = now.getHours();
				if (event.endHour !== undefined && event.endHour !== 23 && currentHour > event.endHour) {
					isPast = true;
				}
			}
		}

		const formattedDate = formatDate(event.date);

		// Type badge and styling
		const isRecurring = event.type === 'recurring';
		const typeBadge = isRecurring ? '<span class="event-type-badge recurring">🔄</span>' : '<span class="event-type-badge ephemeral">📅</span>';
		const typeLabel = isRecurring ? 'Every year' : eventDate.getFullYear().toString();

		// For recurring events, use the index from the recurring events array
		// For ephemeral events, use the index from the ephemeral events array
		const editAction = isRecurring
			? `window.eventsModule.editRecurringEvent(${event.index})`
			: `window.eventsModule.editEvent(${event.index})`;
		const deleteAction = isRecurring
			? `window.eventsModule.deleteRecurringEvent(${event.index})`
			: `window.eventsModule.deleteEvent(${event.index})`;

		return `
			<div class="event-card ${isPast ? 'past-event' : ''} ${isRecurring ? 'recurring-event' : 'ephemeral-event'}">
				<div class="event-date-badge">
					<span class="month">${eventDate.toLocaleString('en-US', { month: 'short' })}</span>
					<span class="day">${eventDate.getDate()}</span>
					${!isRecurring ? `<span class="year">${eventDate.getFullYear()}</span>` : ''}
				</div>
				<div class="event-info">
					<div class="event-title-row">
						${typeBadge}
						<h4>${event.topLine} / ${event.bottomLine}</h4>
					</div>
					<p class="event-type-label">${typeLabel}</p>
					<p class="event-time">${event.startHour !== 0 || event.endHour !== 23 ? `${String(event.startHour).padStart(2,'0')}:00 - ${String(event.endHour).padStart(2,'0')}:00` : 'All Day'}</p>
					<p class="event-meta"><span class="event-color">Color: ${event.colorName}</span><span class="event-separator"> | </span><span class="event-icon">Icon: ${event.iconName || 'None'}</span></p>
				</div>
				<div class="event-actions">
					<button class="btn-pixel btn-primary btn-sm" onclick="${editAction}">Edit</button>
					<button class="btn-pixel btn-secondary btn-sm" onclick="${deleteAction}">Delete</button>
				</div>
			</div>
		`;
	}).join('');

	listContainer.innerHTML = eventsHTML;
}

export async function saveEvent() {
	const date = document.getElementById('editor-event-date').value;
	const topLine = document.getElementById('editor-event-top').value;
	const bottomLine = document.getElementById('editor-event-bottom').value;
	const colorName = document.getElementById('editor-event-color').value;
	const iconName = document.getElementById('editor-event-image').value;

	// Get time fields - default to all day (0-23) if not specified
	const hasTime = document.getElementById('editor-event-has-time')?.checked || false;
	const startHour = hasTime ? parseInt(document.getElementById('editor-event-start-hour')?.value || '0') : 0;
	const endHour = hasTime ? parseInt(document.getElementById('editor-event-end-hour')?.value || '23') : 23;
	const startMin = 0; // Not used in this format

	if (!date || !topLine || !bottomLine) {
		showStatus('Please fill in all required fields', 'error');
		return;
	}

	const event = {
		date,
		topLine,
		bottomLine,
		iconName,
		colorName,
		startHour,
		endHour,
		startMin: 0
	};

	if (editingEventIndex !== null) {
		currentEvents[editingEventIndex] = { ...event, index: editingEventIndex };
		editingEventIndex = null;
	} else {
		currentEvents.push({ ...event, index: currentEvents.length });
	}

	try {
		await saveEventsToGitHub();
		showStatus('Event saved successfully!', 'success');
		await loadEvents();

		// Switch back to events tab after save
		closeEventEditor();
	} catch (error) {
		showStatus('Failed to save event: ' + error.message, 'error');
	}
}

export function createNewEvent() {
	// Set editor mode to ephemeral
	editorMode = 'ephemeral';
	editingEventIndex = null;
	editingRecurringIndex = null;
	clearEventForm();

	// Update form for ephemeral mode
	updateEditorForMode('ephemeral');

	// Update form title
	const formTitle = document.getElementById('editor-form-title');
	if (formTitle) formTitle.textContent = '📅 Add One-Time Event';

	// Switch to add-event tab using the tab system
	if (window.handleTabSwitch) {
		window.handleTabSwitch('add-event');
	}

	// Focus on the date input after a delay to ensure tab is switched
	setTimeout(() => {
		document.getElementById('editor-event-date')?.focus();
	}, 300);
}

export function editEvent(index) {
	// Set editor mode to ephemeral
	editorMode = 'ephemeral';
	editingEventIndex = index;
	editingRecurringIndex = null;

	// Update form title
	const formTitle = document.getElementById('editor-form-title');
	if (formTitle) formTitle.textContent = '📅 Edit One-Time Event';

	// Switch to add-event tab first, then populate form
	if (window.handleTabSwitch) {
		window.handleTabSwitch('add-event');
	}

	// Populate form after tab switch to ensure elements are accessible
	setTimeout(() => {
		// Update form for ephemeral mode
		updateEditorForMode('ephemeral');
		// Populate the form with event data
		populateEditForm();
		// Focus and update preview
		document.getElementById('editor-event-top')?.focus();
		updateEventPreview();
	}, 50);
}

export function closeEventEditor() {
	// Switch back to events tab
	if (window.handleTabSwitch) {
		window.handleTabSwitch('events');
	}
}

// Check if currently editing (either ephemeral or recurring)
export function isEditing() {
	return editingEventIndex !== null || editingRecurringIndex !== null;
}

function populateEditForm() {
	console.log('populateEditForm: editingEventIndex =', editingEventIndex);
	console.log('populateEditForm: currentEvents.length =', currentEvents.length);

	const event = currentEvents[editingEventIndex];

	if (!event) {
		console.error('populateEditForm: Event not found at index:', editingEventIndex);
		showStatus('Event not found', 'error');
		return;
	}

	console.log('populateEditForm: Loading event:', event);

	const dateField = document.getElementById('editor-event-date');
	const topField = document.getElementById('editor-event-top');
	const bottomField = document.getElementById('editor-event-bottom');
	const colorField = document.getElementById('editor-event-color');
	const imageField = document.getElementById('editor-event-image');

	if (dateField) dateField.value = event.date;
	if (topField) topField.value = event.topLine;
	if (bottomField) bottomField.value = event.bottomLine;
	if (colorField) colorField.value = event.colorName;
	if (imageField) imageField.value = event.iconName;

	// Set time fields if applicable (if not all-day event)
	// All-day event is 0-23, so if either startHour != 0 OR endHour != 23, it has specific time
	const hasTimeCheckbox = document.getElementById('editor-event-has-time');
	const hasSpecificTime = (event.startHour !== undefined && event.startHour !== 0) ||
	                         (event.endHour !== undefined && event.endHour !== 23);

	// Always reset the time checkbox and fields
	if (hasTimeCheckbox) {
		hasTimeCheckbox.checked = hasSpecificTime;
		const timeFields = document.getElementById('editor-event-time-fields');
		if (timeFields) {
			if (hasSpecificTime) {
				timeFields.classList.remove('hidden');
			} else {
				timeFields.classList.add('hidden');
			}
		}
	}

	const startHourField = document.getElementById('editor-event-start-hour');
	const endHourField = document.getElementById('editor-event-end-hour');
	if (startHourField) startHourField.value = event.startHour !== undefined ? event.startHour : 0;
	if (endHourField) endHourField.value = event.endHour !== undefined ? event.endHour : 23;

	// Update character counters
	const topCount = document.getElementById('editor-event-top-count');
	if (topCount) topCount.textContent = `${event.topLine.length}/12`;

	const bottomCount = document.getElementById('editor-event-bottom-count');
	if (bottomCount) bottomCount.textContent = `${event.bottomLine.length}/12`;

	// Update color preview square
	updateColorPreview();
}

export async function deleteEvent(index) {
	if (!confirm('Delete this event?')) return;

	try {
		currentEvents.splice(index, 1);
		currentEvents.forEach((e, i) => e.index = i);

		await saveEventsToGitHub();
		showStatus('Event deleted successfully!', 'success');
		await loadEvents();
	} catch (error) {
		showStatus('Failed to delete event: ' + error.message, 'error');
	}
}

export async function clearPastEvents() {
	if (!confirm('Delete all past events? This cannot be undone.')) return;

	try {
		// Get current date normalized to midnight - only delete events before today
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		currentEvents = currentEvents.filter(event => {
			const eventDate = new Date(event.date + 'T00:00:00');
			return eventDate >= today;
		});

		currentEvents.forEach((e, i) => e.index = i);

		await saveEventsToGitHub();
		showStatus('Past events cleared successfully!', 'success');
		await loadEvents();
	} catch (error) {
		showStatus('Failed to clear past events: ' + error.message, 'error');
	}
}

export function clearEventForm() {
	// Clear ephemeral date field
	const dateField = document.getElementById('editor-event-date');
	if (dateField) dateField.value = '';

	// Clear recurring date selectors
	const monthSelect = document.getElementById('editor-recurring-month');
	if (monthSelect) monthSelect.value = '';

	const daySelect = document.getElementById('editor-recurring-day');
	if (daySelect) daySelect.value = '';

	const topField = document.getElementById('editor-event-top');
	if (topField) topField.value = '';

	const bottomField = document.getElementById('editor-event-bottom');
	if (bottomField) bottomField.value = '';

	const colorField = document.getElementById('editor-event-color');
	if (colorField) colorField.value = 'MINT';

	const imageField = document.getElementById('editor-event-image');
	if (imageField) imageField.value = '';

	const hasTimeCheckbox = document.getElementById('editor-event-has-time');
	if (hasTimeCheckbox) hasTimeCheckbox.checked = false;

	const timeFields = document.getElementById('editor-event-time-fields');
	if (timeFields) timeFields.classList.add('hidden');

	const startHourField = document.getElementById('editor-event-start-hour');
	if (startHourField) startHourField.value = '0';

	const endHourField = document.getElementById('editor-event-end-hour');
	if (endHourField) endHourField.value = '23';

	const topCount = document.getElementById('editor-event-top-count');
	if (topCount) topCount.textContent = '0/12';

	const bottomCount = document.getElementById('editor-event-bottom-count');
	if (bottomCount) bottomCount.textContent = '0/12';

	const formTitle = document.getElementById('editor-form-title');
	if (formTitle) formTitle.textContent = 'Add New Event';

	// Reset both editing indices
	editingEventIndex = null;
	editingRecurringIndex = null;

	// Clear matrix if on desktop
	if (window.editorMatrix) {
		window.editorMatrix.clear();
		window.editorMatrix.render();
	}

	// Reset color preview square to MINT
	updateColorPreview();

	// Hide duplicate warning
	const duplicateWarning = document.getElementById('editor-duplicate-warning');
	if (duplicateWarning) duplicateWarning.classList.add('hidden');
}

async function saveEventsToGitHub() {
	const csvContent = generateEventsCSV();
	await saveGitHubFile('ephemeral_events.csv', csvContent);

	// Update CSV version timestamp in config
	try {
		console.log('Updating ephemeral_events CSV version timestamp...');
		await updateCSVVersion('ephemeral_events');
		console.log('CSV version timestamp updated successfully');
	} catch (error) {
		console.error('Failed to update CSV version timestamp:', error);
	}
}

function generateEventsCSV() {
	const header = `# Format: YYYY-MM-DD,TopLine,BottomLine,Image,Color[,StartHour,EndHour]
# TopLine = displays on TOP of screen
# BottomLine = displays on BOTTOM (usually the name)
# Times are optional (24-hour format, 0-23). If omitted, event shows all day.
`;
	const lines = currentEvents.map(e => {
		// Include start/end hour only if they're not default values (0 and 23)
		if (e.startHour !== 0 || e.endHour !== 23) {
			return `${e.date},${e.topLine},${e.bottomLine},${e.iconName},${e.colorName},${e.startHour},${e.endHour}`;
		} else {
			return `${e.date},${e.topLine},${e.bottomLine},${e.iconName},${e.colorName}`;
		}
	});
	return header + lines.join('\n');
}

let formHandlersInitialized = false;

export function initializeEventFormHandlers() {
	// Only set up handlers once
	if (formHandlersInitialized) return;

	setupEventFormHandlers();
	formHandlersInitialized = true;
}

function setupEventFormHandlers() {
	// Character counters
	const topInput = document.getElementById('editor-event-top');
	if (topInput) {
		topInput.addEventListener('input', () => {
			const count = topInput.value.length;
			const counter = document.getElementById('editor-event-top-count');
			if (counter) counter.textContent = `${count}/12`;
			updateEventPreview();
		});
	}

	const bottomInput = document.getElementById('editor-event-bottom');
	if (bottomInput) {
		bottomInput.addEventListener('input', () => {
			const count = bottomInput.value.length;
			const counter = document.getElementById('editor-event-bottom-count');
			if (counter) counter.textContent = `${count}/12`;
			updateEventPreview();
		});
	}

	// Color dropdown - update preview square and emulator
	const colorSelect = document.getElementById('editor-event-color');
	if (colorSelect) {
		colorSelect.addEventListener('change', () => {
			updateColorPreview();
			updateEventPreview();
		});
	}

	// Image dropdown - update emulator
	const imageSelect = document.getElementById('editor-event-image');
	if (imageSelect) {
		imageSelect.addEventListener('change', () => {
			updateEventPreview();
		});
	}

	// Date input - hide/show placeholder and check duplicate warning
	const dateInput = document.getElementById('editor-event-date');
	if (dateInput) {
		const updateDatePlaceholder = () => {
			const placeholder = dateInput.nextElementSibling;
			if (placeholder && placeholder.classList.contains('date-placeholder')) {
				placeholder.style.display = dateInput.value ? 'none' : 'block';
			}
		};
		dateInput.addEventListener('input', () => {
			updateDatePlaceholder();
			updateDuplicateWarning();
		});
		dateInput.addEventListener('change', () => {
			updateDatePlaceholder();
			updateDuplicateWarning();
		});
		// Initial check
		updateDatePlaceholder();
	}

	// Time checkbox toggle
	const hasTimeCheckbox = document.getElementById('editor-event-has-time');
	const timeFieldsContainer = document.getElementById('editor-event-time-fields');
	if (hasTimeCheckbox && timeFieldsContainer) {
		hasTimeCheckbox.addEventListener('change', () => {
			if (hasTimeCheckbox.checked) {
				timeFieldsContainer.classList.remove('hidden');
			} else {
				timeFieldsContainer.classList.add('hidden');
			}
		});
	}
}

// Update color preview square
function updateColorPreview() {
	const colorSelect = document.getElementById('editor-event-color');
	const colorPreview = document.getElementById('editor-event-color-preview');

	if (colorSelect && colorPreview && window.COLOR_MAP) {
		const colorName = colorSelect.value;
		const colorHex = window.COLOR_MAP[colorName] || '#00FFAA';
		colorPreview.style.background = colorHex;
	}
}

// Initialize color preview to default (MINT)
export function initializeColorPreview() {
	setTimeout(() => {
		updateColorPreview();
	}, 100);
}

// Update event preview on emulator
async function updateEventPreview() {
	const topLine = document.getElementById('editor-event-top')?.value || '';
	const bottomLine = document.getElementById('editor-event-bottom')?.value || '';
	const colorName = document.getElementById('editor-event-color')?.value || 'MINT';
	const iconName = document.getElementById('editor-event-image')?.value || '';

	// Check if mobile
	const isMobile = window.innerWidth <= 768;

	if (isMobile) {
		// Mobile: Render on canvas
		await renderMobileEventPreview(topLine, bottomLine, colorName, iconName);
	} else {
		// Desktop: Update matrix emulator if available
		if (window.editorMatrix && window.renderEventOnMatrix) {
			await window.renderEventOnMatrix(window.editorMatrix, topLine, bottomLine, colorName, iconName);
		}
	}
}

// Render mobile event preview with canvas (256x128, 4x scale)
async function renderMobileEventPreview(topLine, bottomLine, colorName, iconName) {
	const previewSquare = document.querySelector('.mobile-event-preview-square');
	if (!previewSquare) return;

	// Create canvas if it doesn't exist
	let canvas = previewSquare.querySelector('canvas');
	if (!canvas) {
		canvas = document.createElement('canvas');
		canvas.width = 256;
		canvas.height = 128;
		canvas.style.width = '256px';
		canvas.style.height = '128px';
		canvas.style.imageRendering = 'pixelated';
		previewSquare.appendChild(canvas);
	}

	const ctx = canvas.getContext('2d');
	ctx.fillStyle = '#000000';
	ctx.fillRect(0, 0, 256, 128);

	// Scale factor from desktop (64x32) to mobile (256x128)
	const SCALE = 4;

	// Desktop positions
	const TEXT_MARGIN = 2;
	const EVENT_IMAGE_X = 37;
	const EVENT_IMAGE_Y = 2;

	// Get colors from COLOR_MAP
	if (!window.COLOR_MAP) return;

	const bottomColor = window.COLOR_MAP[colorName] || window.COLOR_MAP['MINT'];
	const topColor = window.COLOR_MAP['WHITE'];

	// Calculate bottom-aligned text positions
	const positions = calculateBottomAlignedPositionsMobile(topLine || '', bottomLine || '', 32);

	// Draw top line text at scaled position
	if (topLine) {
		drawTextMobile(ctx, topLine, TEXT_MARGIN * SCALE, positions.line1Y * SCALE, topColor, SCALE);
	}

	// Draw bottom line text in selected color at scaled position
	if (bottomLine) {
		drawTextMobile(ctx, bottomLine, TEXT_MARGIN * SCALE, positions.line2Y * SCALE, bottomColor, SCALE);
	}

	// Load and draw event image
	if (iconName && iconName.endsWith('.bmp') && window.loadBMPImage) {
		try {
			const imageData = await window.loadBMPImage(iconName);
			if (imageData && imageData.pixels) {
				drawBMPMobile(ctx, imageData.pixels, EVENT_IMAGE_X * SCALE, EVENT_IMAGE_Y * SCALE, SCALE);
			}
		} catch (error) {
			console.error('Error loading event image:', error);
		}
	}
}

// Calculate bottom-aligned text positions for mobile
function calculateBottomAlignedPositionsMobile(line1Text, line2Text, displayHeight = 32) {
	const BOTTOM_MARGIN = 2;
	const LINE_SPACING = 1;
	const DESCENDER_EXTRA_MARGIN = 3;
	const DESCENDER_CHARS = ['g', 'j', 'p', 'q', 'y'];
	const fontHeight = 6; // TINYBIT_FONT height

	const bottomLineHasDescenders = line2Text.toLowerCase().split('').some(char =>
		DESCENDER_CHARS.includes(char)
	);
	const topLineHasDescenders = line1Text.toLowerCase().split('').some(char =>
		DESCENDER_CHARS.includes(char)
	);

	const adjustedBottomMargin = BOTTOM_MARGIN + (bottomLineHasDescenders ? DESCENDER_EXTRA_MARGIN : 0);
	const adjustedLineSpacing = LINE_SPACING + (topLineHasDescenders ? DESCENDER_EXTRA_MARGIN : 0);

	const bottomEdge = displayHeight - adjustedBottomMargin;
	const line2Y = bottomEdge - fontHeight;
	const line1Y = line2Y - fontHeight - adjustedLineSpacing;

	return {
		line1Y: Math.round(line1Y),
		line2Y: Math.round(line2Y)
	};
}

// Draw text using TINYBIT_FONT on mobile canvas
function drawTextMobile(ctx, text, x, y, color, scale) {
	if (!window.TINYBIT_FONT || !window.TINYBIT_FONT.glyphs) return;

	let currentX = x;

	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		const glyph = window.TINYBIT_FONT.glyphs[char];

		if (!glyph) {
			currentX += 3 * scale;
			continue;
		}

		const { width, height, bitmap, xoffset, yoffset } = glyph;
		const xOffset = (xoffset || 0) * scale;
		const yOffset = (yoffset || 0) * scale;

		// Draw character bitmap with proper offsets for alignment
		for (let row = 0; row < height; row++) {
			const byte = bitmap[row];
			for (let col = 0; col < width; col++) {
				const bitMask = 0x80 >> col;
				if (byte & bitMask) {
					ctx.fillStyle = color;
					ctx.fillRect(
						currentX + xOffset + (col * scale),
						y + yOffset + (row * scale),
						scale,
						scale
					);
				}
			}
		}

		currentX += (width + 1) * scale;
	}
}

// Draw BMP image data on mobile canvas
function drawBMPMobile(ctx, pixels, x, y, scale) {
	for (let row = 0; row < pixels.length; row++) {
		for (let col = 0; col < pixels[row].length; col++) {
			const color = pixels[row][col];
			if (color && color !== 'transparent') {
				ctx.fillStyle = color;
				ctx.fillRect(x + (col * scale), y + (row * scale), scale, scale);
			}
		}
	}
}

// Public function to trigger preview update
export function triggerPreviewUpdate() {
	updateEventPreview();
}

function showEventsLoading() {
	const loading = document.getElementById('events-loading');
	if (loading) loading.classList.remove('hidden');
	hideEventsError();
	hideEventsEmpty();
}

function showEventsError(message) {
	const errorEl = document.getElementById('events-error');
	if (errorEl) {
		errorEl.textContent = message;
		errorEl.classList.remove('hidden');
	}
	hideEventsLoading();
	hideEventsEmpty();
}

function showEventsEmpty() {
	const empty = document.getElementById('events-empty');
	if (empty) empty.classList.remove('hidden');
	hideEventsLoading();
	hideEventsError();
}

function hideEventsLoading() {
	const loading = document.getElementById('events-loading');
	if (loading) loading.classList.add('hidden');
}

function hideEventsError() {
	const errorEl = document.getElementById('events-error');
	if (errorEl) errorEl.classList.add('hidden');
}

function hideEventsEmpty() {
	const empty = document.getElementById('events-empty');
	if (empty) empty.classList.add('hidden');
}

function hideEventsMessages() {
	hideEventsLoading();
	hideEventsError();
	hideEventsEmpty();
}

// Filter and sorting functions
export function applyFilters() {
	// Get filter values from UI
	eventFilters.search = document.getElementById('event-search')?.value.toLowerCase() || '';
	eventFilters.dateFilter = document.getElementById('event-date-filter')?.value || 'all';
	eventFilters.sort = document.getElementById('event-sort')?.value || 'date-asc';
	eventFilters.typeFilter = document.getElementById('event-type-filter')?.value || 'all';

	// Redisplay events with filters
	displayEvents();

	// Show/hide clear filters button
	updateClearFiltersButton();
}

export function clearFilters() {
	// Reset filter values
	document.getElementById('event-search').value = '';
	document.getElementById('event-date-filter').value = 'all';
	document.getElementById('event-sort').value = 'date-asc';
	const typeFilter = document.getElementById('event-type-filter');
	if (typeFilter) typeFilter.value = 'all';

	// Apply filters
	applyFilters();
}

function applyEventFilters(events) {
	let filtered = events;

	// Type filter
	if (eventFilters.typeFilter && eventFilters.typeFilter !== 'all') {
		filtered = filtered.filter(event => event.type === eventFilters.typeFilter);
	}

	// Text search filter (searches event text AND dates)
	if (eventFilters.search) {
		filtered = filtered.filter(event => {
			const searchLower = eventFilters.search;

			// Search in event text
			const textMatch =
				event.topLine.toLowerCase().includes(searchLower) ||
				event.bottomLine.toLowerCase().includes(searchLower);

			// Search in date (various formats)
			const eventDate = new Date(event.date + 'T00:00:00');
			const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
			                    'july', 'august', 'september', 'october', 'november', 'december'];
			const monthShort = ['jan', 'feb', 'mar', 'apr', 'may', 'jun',
			                    'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

			const dateMatch =
				event.date.includes(eventFilters.search) || // Full date: "2025-01-15"
				monthNames[eventDate.getMonth()].includes(searchLower) || // "january"
				monthShort[eventDate.getMonth()].includes(searchLower) || // "jan"
				eventDate.getFullYear().toString().includes(eventFilters.search) || // "2025"
				eventDate.getDate().toString().includes(eventFilters.search); // "15"

			return textMatch || dateMatch;
		});
	}

	// Date filter
	if (eventFilters.dateFilter !== 'all') {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		filtered = filtered.filter(event => {
			const eventDate = new Date(event.date + 'T00:00:00');

			switch (eventFilters.dateFilter) {
				case 'upcoming':
					return eventDate >= today;
				case 'past':
					// Recurring events are never past
					if (event.type === 'recurring') return false;
					return eventDate < today;
				case 'today':
					return eventDate.getTime() === today.getTime();
				case 'this-week':
					const weekEnd = new Date(today);
					weekEnd.setDate(today.getDate() + 7);
					return eventDate >= today && eventDate < weekEnd;
				case 'this-month':
					return eventDate.getMonth() === today.getMonth() &&
					       eventDate.getFullYear() === today.getFullYear();
				case 'next-month':
					const nextMonth = new Date(today);
					nextMonth.setMonth(today.getMonth() + 1);
					return eventDate.getMonth() === nextMonth.getMonth() &&
					       eventDate.getFullYear() === nextMonth.getFullYear();
				default:
					return true;
			}
		});
	}

	return filtered;
}

function applySorting(events) {
	const sorted = [...events];

	switch (eventFilters.sort) {
		case 'date-asc':
			sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
			break;
		case 'date-desc':
			sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
			break;
		case 'alpha-asc':
			sorted.sort((a, b) => {
				const nameA = `${a.topLine} ${a.bottomLine}`.toLowerCase();
				const nameB = `${b.topLine} ${b.bottomLine}`.toLowerCase();
				return nameA.localeCompare(nameB);
			});
			break;
		case 'alpha-desc':
			sorted.sort((a, b) => {
				const nameA = `${a.topLine} ${a.bottomLine}`.toLowerCase();
				const nameB = `${b.topLine} ${b.bottomLine}`.toLowerCase();
				return nameB.localeCompare(nameA);
			});
			break;
		default:
			sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
	}

	return sorted;
}

function updateFilterInfo(filteredCount, totalCount) {
	const filterCountEl = document.getElementById('filter-count');
	if (!filterCountEl) return;

	if (filteredCount === totalCount) {
		filterCountEl.textContent = `Showing all ${totalCount} event${totalCount !== 1 ? 's' : ''}`;
	} else {
		filterCountEl.textContent = `Showing ${filteredCount} of ${totalCount} event${totalCount !== 1 ? 's' : ''}`;
	}
}

function updateClearFiltersButton() {
	const clearBtn = document.getElementById('clear-filters');
	if (!clearBtn) return;

	// Check if any filters are active
	const hasActiveFilters =
		eventFilters.search !== '' ||
		eventFilters.dateFilter !== 'all' ||
		eventFilters.sort !== 'date-asc' ||
		eventFilters.typeFilter !== 'all';

	clearBtn.style.display = hasActiveFilters ? 'inline-block' : 'none';
}

// =====================
// RECURRING EVENT FUNCTIONS
// =====================

// Create a new recurring event (opens editor in recurring mode)
export function createNewRecurringEvent() {
	editorMode = 'recurring';
	editingRecurringIndex = null;
	editingEventIndex = null;
	clearEventForm();

	// Update form for recurring mode
	updateEditorForMode('recurring');

	// Update form title
	const formTitle = document.getElementById('editor-form-title');
	if (formTitle) formTitle.textContent = '🔄 Add Recurring Event';

	// Switch to add-event tab
	if (window.handleTabSwitch) {
		window.handleTabSwitch('add-event');
	}

	setTimeout(() => {
		document.getElementById('editor-recurring-month')?.focus();
	}, 300);
}

// Edit an existing recurring event
export function editRecurringEvent(index) {
	editorMode = 'recurring';
	editingRecurringIndex = index;
	editingEventIndex = null;

	const recurringEvents = getCurrentRecurringEvents();
	const event = recurringEvents[index];

	if (!event) {
		showStatus('Recurring event not found', 'error');
		return;
	}

	// Update form title
	const formTitle = document.getElementById('editor-form-title');
	if (formTitle) formTitle.textContent = '🔄 Edit Recurring Event';

	// Switch to add-event tab first
	if (window.handleTabSwitch) {
		window.handleTabSwitch('add-event');
	}

	// Populate form after tab switch to ensure elements are accessible
	setTimeout(() => {
		// Update form for recurring mode
		updateEditorForMode('recurring');
		// Populate the form
		populateRecurringEditForm(event);
		// Focus and update preview
		document.getElementById('editor-event-top')?.focus();
		updateEventPreview();
	}, 50);
}

// Populate form for editing a recurring event
function populateRecurringEditForm(event) {
	console.log('populateRecurringEditForm: event =', event);

	if (!event) {
		console.error('populateRecurringEditForm: No event provided');
		return;
	}

	if (!event.monthDay) {
		console.error('populateRecurringEditForm: Event has no monthDay:', event);
		return;
	}

	// Parse monthDay (MM-DD)
	const [month, day] = event.monthDay.split('-').map(s => parseInt(s, 10));
	console.log('populateRecurringEditForm: month =', month, ', day =', day);

	const monthSelect = document.getElementById('editor-recurring-month');
	const daySelect = document.getElementById('editor-recurring-day');

	console.log('populateRecurringEditForm: monthSelect =', monthSelect, ', daySelect =', daySelect);

	if (monthSelect) {
		monthSelect.value = String(month);
		console.log('populateRecurringEditForm: Set month to', month, ', actual value:', monthSelect.value);
	}
	if (daySelect) {
		daySelect.value = String(day);
		console.log('populateRecurringEditForm: Set day to', day, ', actual value:', daySelect.value);
	}

	const topField = document.getElementById('editor-event-top');
	const bottomField = document.getElementById('editor-event-bottom');
	const colorField = document.getElementById('editor-event-color');
	const imageField = document.getElementById('editor-event-image');

	if (topField) topField.value = event.topLine;
	if (bottomField) bottomField.value = event.bottomLine;
	if (colorField) colorField.value = event.colorName;
	if (imageField) imageField.value = event.iconName;

	// Set time fields if applicable
	const hasTimeCheckbox = document.getElementById('editor-event-has-time');
	const hasSpecificTime = (event.startHour !== undefined && event.startHour !== 0) ||
	                         (event.endHour !== undefined && event.endHour !== 23);

	// Always reset the time checkbox and fields
	if (hasTimeCheckbox) {
		hasTimeCheckbox.checked = hasSpecificTime;
		const timeFields = document.getElementById('editor-event-time-fields');
		if (timeFields) {
			if (hasSpecificTime) {
				timeFields.classList.remove('hidden');
			} else {
				timeFields.classList.add('hidden');
			}
		}
	}

	const startHourField = document.getElementById('editor-event-start-hour');
	const endHourField = document.getElementById('editor-event-end-hour');
	if (startHourField) startHourField.value = event.startHour !== undefined ? event.startHour : 0;
	if (endHourField) endHourField.value = event.endHour !== undefined ? event.endHour : 23;

	// Update character counters
	const topCount = document.getElementById('editor-event-top-count');
	if (topCount) topCount.textContent = `${event.topLine.length}/12`;

	const bottomCount = document.getElementById('editor-event-bottom-count');
	if (bottomCount) bottomCount.textContent = `${event.bottomLine.length}/12`;

	// Update color preview square
	updateColorPreview();

	console.log('populateRecurringEditForm: Done populating form');
}

// Save a recurring event
export async function saveRecurringEvent() {
	const monthSelect = document.getElementById('editor-recurring-month');
	const daySelect = document.getElementById('editor-recurring-day');
	const month = monthSelect?.value;
	const day = daySelect?.value;

	const topLine = document.getElementById('editor-event-top').value;
	const bottomLine = document.getElementById('editor-event-bottom').value;
	const colorName = document.getElementById('editor-event-color').value;
	const iconName = document.getElementById('editor-event-image').value;

	// Get time fields
	const hasTime = document.getElementById('editor-event-has-time')?.checked || false;
	const startHour = hasTime ? parseInt(document.getElementById('editor-event-start-hour')?.value || '0') : 0;
	const endHour = hasTime ? parseInt(document.getElementById('editor-event-end-hour')?.value || '23') : 23;

	if (!month || !day || !topLine || !bottomLine) {
		showStatus('Please fill in all required fields', 'error');
		return;
	}

	const monthDay = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

	const event = {
		monthDay,
		topLine,
		bottomLine,
		iconName,
		colorName,
		startHour,
		endHour
	};

	if (editingRecurringIndex !== null) {
		updateRecurringEvent(editingRecurringIndex, event);
		editingRecurringIndex = null;
	} else {
		addRecurringEvent(event);
	}

	try {
		await saveRecurringEventsToGitHub();
		showStatus('Recurring event saved successfully!', 'success');
		await loadAllEvents();
		closeEventEditor();
	} catch (error) {
		showStatus('Failed to save recurring event: ' + error.message, 'error');
	}
}

// Delete a recurring event
export async function deleteRecurringEvent(index) {
	if (!confirm('Delete this recurring event?')) return;

	try {
		deleteRecurringEventByIndex(index);
		await saveRecurringEventsToGitHub();
		showStatus('Recurring event deleted successfully!', 'success');
		await loadAllEvents();
	} catch (error) {
		showStatus('Failed to delete recurring event: ' + error.message, 'error');
	}
}

// =====================
// EDITOR MODE FUNCTIONS
// =====================

// Get current editor mode
export function getEditorMode() {
	return editorMode;
}

// Set editor mode and update UI
export function setEditorMode(mode) {
	editorMode = mode;
	updateEditorForMode(mode);
}

// Update editor UI based on mode
function updateEditorForMode(mode) {
	const dateInputWrapper = document.getElementById('editor-date-input-wrapper');
	const recurringDateWrapper = document.getElementById('editor-recurring-date-wrapper');
	const dateLabel = document.getElementById('editor-date-label');
	const duplicateWarning = document.getElementById('editor-duplicate-warning');

	if (mode === 'recurring') {
		// Show recurring date selectors, hide date input
		if (dateInputWrapper) dateInputWrapper.classList.add('hidden');
		if (recurringDateWrapper) recurringDateWrapper.classList.remove('hidden');
		if (dateLabel) dateLabel.textContent = 'Date (repeats yearly)';
		if (duplicateWarning) duplicateWarning.classList.add('hidden');
	} else {
		// Show date input, hide recurring selectors
		if (dateInputWrapper) dateInputWrapper.classList.remove('hidden');
		if (recurringDateWrapper) recurringDateWrapper.classList.add('hidden');
		if (dateLabel) dateLabel.textContent = 'Date *';
	}
}

// Check for duplicate warning when creating ephemeral event
export function checkDuplicateWarning(date) {
	if (!date || editorMode !== 'ephemeral') return null;

	const monthDay = date.substring(5); // "2025-01-04" -> "01-04"
	const recurring = findRecurringEventByMonthDay(monthDay);

	if (recurring) {
		return `Note: Recurring event "${recurring.topLine} / ${recurring.bottomLine}" exists for this date`;
	}
	return null;
}

// Update duplicate warning display
function updateDuplicateWarning() {
	const dateInput = document.getElementById('editor-event-date');
	const warningEl = document.getElementById('editor-duplicate-warning');

	if (!dateInput || !warningEl) return;

	const warning = checkDuplicateWarning(dateInput.value);

	if (warning) {
		warningEl.textContent = warning;
		warningEl.classList.remove('hidden');
	} else {
		warningEl.classList.add('hidden');
	}
}

// Expose functions globally for onclick handlers
window.eventsModule = {
	initializeEvents,
	loadEvents,
	loadAllEvents,
	createNewEvent,
	createNewRecurringEvent,
	editEvent,
	editRecurringEvent,
	deleteEvent,
	deleteRecurringEvent,
	clearPastEvents,
	saveEvent,
	saveRecurringEvent,
	clearEventForm,
	closeEventEditor,
	isEditing,
	initializeColorPreview,
	applyFilters,
	clearFilters,
	getEditorMode,
	setEditorMode,
	checkDuplicateWarning
};

// Also expose directly for HTML onclick
window.createNewEvent = createNewEvent;
window.createNewRecurringEvent = createNewRecurringEvent;
window.clearEventForm = clearEventForm;
window.closeEventEditor = closeEventEditor;
window.saveRecurringEvent = saveRecurringEvent;
