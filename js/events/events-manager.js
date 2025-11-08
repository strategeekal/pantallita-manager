// Events Management Module
import { fetchGitHubFile, saveGitHubFile, deleteGitHubFile } from '../core/api.js';
import { showStatus, parseCSV, formatDate } from '../core/utils.js';
import { loadConfig } from '../core/config.js';

let currentEvents = [];
let editingEventIndex = null;

export async function initializeEvents() {
	await loadEvents();
	setupEventFormHandlers();
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

	const eventsHTML = currentEvents.map((event, index) => {
		const eventDate = new Date(event.date + 'T00:00:00');
		const isPast = eventDate < new Date();
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
					<p>Color: ${event.colorName} | Icon: ${event.iconName || 'None'}</p>
				</div>
				<div class="event-actions">
					<button class="btn-pixel btn-primary btn-sm" onclick="window.eventsModule.editEvent(${index})">Edit</button>
					<button class="btn-pixel btn-secondary btn-sm" onclick="window.eventsModule.deleteEvent(${index})">Delete</button>
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
		clearEventForm();
		await loadEvents();
	} catch (error) {
		showStatus('Failed to save event: ' + error.message, 'error');
	}
}

export function editEvent(index) {
	editingEventIndex = index;
	populateEditForm();

	// Switch to add-event tab
	const tabButton = document.querySelector('[data-tab="add-event"]');
	if (tabButton) tabButton.click();

	// Focus on the top line input
	setTimeout(() => {
		document.getElementById('editor-event-top')?.focus();
	}, 100);
}

function populateEditForm() {
	const event = currentEvents[editingEventIndex];

	document.getElementById('editor-event-date').value = event.date;
	document.getElementById('editor-event-top').value = event.topLine;
	document.getElementById('editor-event-bottom').value = event.bottomLine;
	document.getElementById('editor-event-color').value = event.colorName;
	document.getElementById('editor-event-image').value = event.iconName;

	// Set time fields if applicable (if not all-day event)
	const hasTimeCheckbox = document.getElementById('editor-event-has-time');
	if (hasTimeCheckbox && event.startHour !== 0 && event.endHour !== 23) {
		hasTimeCheckbox.checked = true;
		const timeFields = document.getElementById('editor-event-time-fields');
		if (timeFields) timeFields.classList.remove('hidden');

		const startHourField = document.getElementById('editor-event-start-hour');
		if (startHourField) startHourField.value = event.startHour;

		const endHourField = document.getElementById('editor-event-end-hour');
		if (endHourField) endHourField.value = event.endHour;
	}

	// Update form title
	const formTitle = document.getElementById('editor-form-title');
	if (formTitle) formTitle.textContent = 'Edit Event';

	// Update character counters
	const topCount = document.getElementById('editor-event-top-count');
	if (topCount) topCount.textContent = `${event.topLine.length}/12`;

	const bottomCount = document.getElementById('editor-event-bottom-count');
	if (bottomCount) bottomCount.textContent = `${event.bottomLine.length}/12`;
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
		const now = new Date();
		currentEvents = currentEvents.filter(event => {
			const eventDate = new Date(event.date + 'T00:00:00');
			return eventDate >= now;
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

function setupEventFormHandlers() {
	// Character counters
	const topInput = document.getElementById('editor-event-top');
	if (topInput) {
		topInput.addEventListener('input', () => {
			const count = topInput.value.length;
			const counter = document.getElementById('editor-event-top-count');
			if (counter) counter.textContent = `${count}/12`;
		});
	}

	const bottomInput = document.getElementById('editor-event-bottom');
	if (bottomInput) {
		bottomInput.addEventListener('input', () => {
			const count = bottomInput.value.length;
			const counter = document.getElementById('editor-event-bottom-count');
			if (counter) counter.textContent = `${count}/12`;
		});
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
	editEvent,
	deleteEvent,
	clearPastEvents,
	saveEvent,
	clearEventForm
};

// Also expose directly for HTML onclick
window.clearEventForm = clearEventForm;
