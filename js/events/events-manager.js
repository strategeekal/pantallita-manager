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
		const { content } = await fetchGitHubFile('events.csv');
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

		if (parts.length < 6) return null;

		return {
			index,
			date: parts[0].trim(),
			startHour: parseInt(parts[1].trim()),
			startMin: parseInt(parts[2].trim()),
			topLine: parts[3].trim(),
			bottomLine: parts[4].trim(),
			colorName: parts[5].trim(),
			iconName: parts.length > 6 ? parts[6].trim() : ''
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
					<h4>${event.topLine} ${event.bottomLine}</h4>
					<p class="event-time">${String(event.startHour).padStart(2,'0')}:${String(event.startMin).padStart(2,'0')}</p>
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
	const startHour = parseInt(document.getElementById('editor-event-start-hour').value);
	const startMin = parseInt(document.getElementById('editor-event-start-min').value);
	const topLine = document.getElementById('editor-event-top').value;
	const bottomLine = document.getElementById('editor-event-bottom').value;
	const colorName = document.getElementById('editor-event-color').value;
	const iconName = document.getElementById('editor-event-image').value;

	if (!date || !topLine || !bottomLine) {
		showStatus('Please fill in all required fields', 'error');
		return;
	}

	const event = {
		date,
		startHour,
		startMin,
		topLine,
		bottomLine,
		colorName,
		iconName
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
	document.getElementById('editor-event-top').focus();
}

function populateEditForm() {
	const event = currentEvents[editingEventIndex];

	document.getElementById('editor-event-date').value = event.date;
	document.getElementById('editor-event-start-hour').value = event.startHour;
	document.getElementById('editor-event-start-min').value = event.startMin;
	document.getElementById('editor-event-top').value = event.topLine;
	document.getElementById('editor-event-bottom').value = event.bottomLine;
	document.getElementById('editor-event-color').value = event.colorName;
	document.getElementById('editor-event-image').value = event.iconName;

	document.getElementById('save-event-btn').textContent = '💾 Update Event';
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

function clearEventForm() {
	document.getElementById('editor-event-date').value = '';
	document.getElementById('editor-event-start-hour').value = '9';
	document.getElementById('editor-event-start-min').value = '0';
	document.getElementById('editor-event-top').value = '';
	document.getElementById('editor-event-bottom').value = '';
	document.getElementById('editor-event-color').value = 'MINT';
	document.getElementById('editor-event-image').value = '';
	document.getElementById('save-event-btn').textContent = '💾 Save Event';
	editingEventIndex = null;
}

async function saveEventsToGitHub() {
	const csvContent = generateEventsCSV();
	await saveGitHubFile('events.csv', csvContent);
}

function generateEventsCSV() {
	const header = `# Format: date,start_hour,start_min,top_line,bottom_line,color,icon_name\n`;
	const lines = currentEvents.map(e =>
		`${e.date},${e.startHour},${e.startMin},${e.topLine},${e.bottomLine},${e.colorName},${e.iconName}`
	);
	return header + lines.join('\n');
}

function setupEventFormHandlers() {
	const saveBtn = document.getElementById('save-event-btn');
	if (saveBtn) {
		saveBtn.addEventListener('click', saveEvent);
	}

	const clearBtn = document.getElementById('clear-past-events-btn');
	if (clearBtn) {
		clearBtn.addEventListener('click', clearPastEvents);
	}
}

function showEventsLoading() {
	document.getElementById('events-loading').classList.remove('hidden');
	hideEventsError();
	hideEventsEmpty();
}

function showEventsError(message) {
	const errorEl = document.getElementById('events-error');
	errorEl.textContent = message;
	errorEl.classList.remove('hidden');
	hideEventsLoading();
	hideEventsEmpty();
}

function showEventsEmpty() {
	document.getElementById('events-empty').classList.remove('hidden');
	hideEventsLoading();
	hideEventsError();
}

function hideEventsLoading() {
	document.getElementById('events-loading').classList.add('hidden');
}

function hideEventsError() {
	document.getElementById('events-error').classList.add('hidden');
}

function hideEventsEmpty() {
	document.getElementById('events-empty').classList.add('hidden');
}

function hideEventsMessages() {
	hideEventsLoading();
	hideEventsError();
	hideEventsEmpty();
}

// Expose functions globally for onclick handlers
window.eventsModule = {
	editEvent,
	deleteEvent,
	clearPastEvents,
	saveEvent
};
