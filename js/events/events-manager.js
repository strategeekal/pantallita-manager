// Events Management Module
import { fetchGitHubFile, saveGitHubFile, deleteGitHubFile } from '../core/api.js';
import { showStatus, parseCSV, formatDate } from '../core/utils.js';
import { loadConfig } from '../core/config.js';

let currentEvents = [];
let editingEventIndex = null;

export async function initializeEvents() {
	await loadEvents();
	setupEventFormHandlers();
	// Initialize color preview on first load
	initializeColorPreview();
}

export async function loadEvents() {
	const config = loadConfig();

	if (!config.token || !config.owner || !config.repo) {
		showEventsError('Please configure GitHub settings first');
		return;
	}

	showEventsLoading();

	try {
		const { content } = await fetchGitHubFile('ephemeral_events.csv');
		currentEvents = parseEventsCSV(content);
		displayEvents();

		// Update validation badge after loading events
		if (window.updateValidationBadge) {
			window.updateValidationBadge();
		}
	} catch (error) {
		if (error.message.includes('404')) {
			showEventsEmpty();
			currentEvents = [];
		} else {
			showEventsError('Failed to load events: ' + error.message);
		}
	}
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
			startMin: 0 // Not used in this format
		};
	}).filter(e => e !== null);
}

function displayEvents() {
	const listContainer = document.getElementById('events-list');

	hideEventsMessages();

	if (currentEvents.length === 0) {
		showEventsEmpty();
		return;
	}

	// Sort events by date ascending (earliest first)
	const sortedEvents = [...currentEvents].sort((a, b) => {
		return new Date(a.date) - new Date(b.date);
	});

	const eventsHTML = sortedEvents.map((event) => {
		const eventDate = new Date(event.date + 'T00:00:00');

		// Get current date normalized to midnight
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		// Check if event date is before today (past) or if it's today but end hour has passed
		let isPast = eventDate < today;

		// If event is today and has specific time window, check if end hour has passed
		if (!isPast && eventDate.getTime() === today.getTime()) {
			const now = new Date();
			const currentHour = now.getHours();
			// Event is past if it has an end hour and current hour is after it
			if (event.endHour !== undefined && event.endHour !== 23 && currentHour > event.endHour) {
				isPast = true;
			}
		}

		const formattedDate = formatDate(event.date);

		return `
			<div class="event-card ${isPast ? 'past-event' : ''}">
				<div class="event-date-badge">
					<span class="month">${eventDate.toLocaleString('en-US', { month: 'short' })}</span>
					<span class="day">${eventDate.getDate()}</span>
					<span class="year">${eventDate.getFullYear()}</span>
				</div>
				<div class="event-info">
					<h4>${event.topLine} - ${event.bottomLine}</h4>
					<p class="event-time">${event.startHour !== 0 || event.endHour !== 23 ? `${String(event.startHour).padStart(2,'0')}:00 - ${String(event.endHour).padStart(2,'0')}:00` : 'All Day'}</p>
					<p>${formattedDate}</p>
					<p class="event-meta"><span class="event-color">Color: ${event.colorName}</span><span class="event-separator"> | </span><span class="event-icon">Icon: ${event.iconName || 'None'}</span></p>
				</div>
				<div class="event-actions">
					<button class="btn-pixel btn-primary btn-sm" onclick="window.eventsModule.editEvent(${event.index})">Edit</button>
					<button class="btn-pixel btn-secondary btn-sm" onclick="window.eventsModule.deleteEvent(${event.index})">Delete</button>
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
	// Clear the form and reset editing state
	editingEventIndex = null;
	clearEventForm();

	// Update form title
	const formTitle = document.getElementById('editor-form-title');
	if (formTitle) formTitle.textContent = 'Add New Event';

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
	editingEventIndex = index;
	populateEditForm();

	// Update form title
	const formTitle = document.getElementById('editor-form-title');
	if (formTitle) formTitle.textContent = 'Edit Event';

	// Switch to add-event tab using the tab system
	if (window.handleTabSwitch) {
		window.handleTabSwitch('add-event');
	}

	// Focus on the top line input and update preview after a delay
	setTimeout(() => {
		document.getElementById('editor-event-top')?.focus();
		// Trigger preview update for existing event
		updateEventPreview();
	}, 300);
}

export function closeEventEditor() {
	// Switch back to events tab
	if (window.handleTabSwitch) {
		window.handleTabSwitch('events');
	}
}

// Check if currently editing
export function isEditing() {
	return editingEventIndex !== null;
}

function populateEditForm() {
	const event = currentEvents[editingEventIndex];

	document.getElementById('editor-event-date').value = event.date;
	document.getElementById('editor-event-top').value = event.topLine;
	document.getElementById('editor-event-bottom').value = event.bottomLine;
	document.getElementById('editor-event-color').value = event.colorName;
	document.getElementById('editor-event-image').value = event.iconName;

	// Set time fields if applicable (if not all-day event)
	// All-day event is 0-23, so if either startHour != 0 OR endHour != 23, it has specific time
	const hasTimeCheckbox = document.getElementById('editor-event-has-time');
	const hasSpecificTime = (event.startHour !== undefined && event.startHour !== 0) ||
	                         (event.endHour !== undefined && event.endHour !== 23);
	if (hasTimeCheckbox && hasSpecificTime) {
		hasTimeCheckbox.checked = true;
		const timeFields = document.getElementById('editor-event-time-fields');
		if (timeFields) timeFields.classList.remove('hidden');

		const startHourField = document.getElementById('editor-event-start-hour');
		if (startHourField) startHourField.value = event.startHour !== undefined ? event.startHour : 0;

		const endHourField = document.getElementById('editor-event-end-hour');
		if (endHourField) endHourField.value = event.endHour !== undefined ? event.endHour : 23;
	}

	// Update form title
	const formTitle = document.getElementById('editor-form-title');
	if (formTitle) formTitle.textContent = 'Edit Event';

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
	const dateField = document.getElementById('editor-event-date');
	if (dateField) dateField.value = '';

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

	editingEventIndex = null;

	// Clear matrix if on desktop
	if (window.editorMatrix) {
		window.editorMatrix.clear();
		window.editorMatrix.render();
	}

	// Reset color preview square to MINT
	updateColorPreview();
}

async function saveEventsToGitHub() {
	const csvContent = generateEventsCSV();
	await saveGitHubFile('ephemeral_events.csv', csvContent);
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

	// Date input - hide/show placeholder
	const dateInput = document.getElementById('editor-event-date');
	if (dateInput) {
		const updateDatePlaceholder = () => {
			const placeholder = dateInput.nextElementSibling;
			if (placeholder && placeholder.classList.contains('date-placeholder')) {
				placeholder.style.display = dateInput.value ? 'none' : 'block';
			}
		};
		dateInput.addEventListener('input', updateDatePlaceholder);
		dateInput.addEventListener('change', updateDatePlaceholder);
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

// Expose functions globally for onclick handlers
window.eventsModule = {
	initializeEvents,
	loadEvents,
	createNewEvent,
	editEvent,
	deleteEvent,
	clearPastEvents,
	saveEvent,
	clearEventForm,
	closeEventEditor,
	isEditing,
	initializeColorPreview
};

// Also expose directly for HTML onclick
window.createNewEvent = createNewEvent;
window.clearEventForm = clearEventForm;
window.closeEventEditor = closeEventEditor;
