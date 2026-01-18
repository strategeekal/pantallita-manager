// Recurring Events Management Module
import { fetchGitHubFile, saveGitHubFile } from '../core/api.js';
import { showStatus, parseCSV } from '../core/utils.js';
import { loadConfig } from '../core/config.js';
import { updateCSVVersion } from '../config/config-manager.js';

let currentRecurringEvents = [];

export async function loadRecurringEvents() {
	const config = loadConfig();

	if (!config.token || !config.owner || !config.repo) {
		console.log('GitHub settings not configured, skipping recurring events load');
		return [];
	}

	try {
		const { content } = await fetchGitHubFile('recurring_events.csv');
		currentRecurringEvents = parseRecurringEventsCSV(content);
		return currentRecurringEvents;
	} catch (error) {
		if (error.message.includes('404')) {
			console.log('No recurring_events.csv found, starting with empty list');
			currentRecurringEvents = [];
			return [];
		} else {
			console.error('Failed to load recurring events:', error.message);
			throw error;
		}
	}
}

export function parseRecurringEventsCSV(content) {
	const lines = parseCSV(content);

	return lines.map((line, index) => {
		const parts = line.split(',');

		// Format: MM-DD,TopLine,BottomLine,Image,Color[,StartHour,EndHour]
		if (parts.length < 5) return null;

		return {
			index,
			monthDay: parts[0].trim(),
			topLine: parts[1].trim(),
			bottomLine: parts[2].trim(),
			iconName: parts[3].trim(),
			colorName: parts[4].trim(),
			startHour: parts.length > 5 ? parseInt(parts[5].trim()) : 0,
			endHour: parts.length > 6 ? parseInt(parts[6].trim()) : 23,
			type: 'recurring'
		};
	}).filter(e => e !== null);
}

export function generateRecurringEventsCSV() {
	const header = `# Format: MM-DD,TopLine,BottomLine,Image,Color[,StartHour,EndHour]
# Recurring events repeat yearly on the specified date
# TopLine = displays on TOP of screen
# BottomLine = displays on BOTTOM (usually the name)
# Times are optional (24-hour format, 0-23). If omitted, event shows all day.
`;
	const lines = currentRecurringEvents.map(e => {
		// Include start/end hour only if they're not default values (0 and 23)
		if (e.startHour !== 0 || e.endHour !== 23) {
			return `${e.monthDay},${e.topLine},${e.bottomLine},${e.iconName},${e.colorName},${e.startHour},${e.endHour}`;
		} else {
			return `${e.monthDay},${e.topLine},${e.bottomLine},${e.iconName},${e.colorName}`;
		}
	});
	return header + lines.join('\n');
}

export async function saveRecurringEventsToGitHub() {
	const csvContent = generateRecurringEventsCSV();
	await saveGitHubFile('recurring_events.csv', csvContent);

	// Update CSV version timestamp in config
	try {
		console.log('Updating recurring_events CSV version timestamp...');
		await updateCSVVersion('recurring_events');
		console.log('CSV version timestamp updated successfully');
	} catch (error) {
		console.error('Failed to update CSV version timestamp:', error);
	}
}

// Compute the next occurrence date for a recurring event
export function getNextOccurrence(monthDay) {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const [month, day] = monthDay.split('-').map(s => parseInt(s, 10));

	// Try this year first
	const thisYear = new Date(today.getFullYear(), month - 1, day);
	thisYear.setHours(0, 0, 0, 0);

	if (thisYear >= today) {
		return formatDateYYYYMMDD(thisYear);
	}

	// Otherwise, next year
	const nextYear = new Date(today.getFullYear() + 1, month - 1, day);
	nextYear.setHours(0, 0, 0, 0);
	return formatDateYYYYMMDD(nextYear);
}

function formatDateYYYYMMDD(date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

// Get current recurring events array
export function getCurrentRecurringEvents() {
	return currentRecurringEvents;
}

// Set current recurring events array (used when saving)
export function setCurrentRecurringEvents(events) {
	currentRecurringEvents = events;
}

// Add a new recurring event
export function addRecurringEvent(event) {
	const newEvent = {
		...event,
		index: currentRecurringEvents.length,
		type: 'recurring'
	};
	currentRecurringEvents.push(newEvent);
	return newEvent;
}

// Update an existing recurring event
export function updateRecurringEvent(index, updatedEvent) {
	if (index >= 0 && index < currentRecurringEvents.length) {
		currentRecurringEvents[index] = {
			...updatedEvent,
			index,
			type: 'recurring'
		};
		return currentRecurringEvents[index];
	}
	return null;
}

// Delete a recurring event
export function deleteRecurringEventByIndex(index) {
	if (index >= 0 && index < currentRecurringEvents.length) {
		currentRecurringEvents.splice(index, 1);
		// Re-index remaining events
		currentRecurringEvents.forEach((e, i) => e.index = i);
		return true;
	}
	return false;
}

// Check if a recurring event exists for a given monthDay
export function findRecurringEventByMonthDay(monthDay) {
	return currentRecurringEvents.find(e => e.monthDay === monthDay);
}

// Convert recurring event to displayable format with computed next occurrence
export function recurringEventToDisplayFormat(event) {
	const nextDate = getNextOccurrence(event.monthDay);
	return {
		...event,
		date: nextDate,
		displayDate: nextDate,
		isNextYear: nextDate.startsWith(String(new Date().getFullYear() + 1))
	};
}

// Export module functions to window
window.recurringEventsModule = {
	loadRecurringEvents,
	parseRecurringEventsCSV,
	generateRecurringEventsCSV,
	saveRecurringEventsToGitHub,
	getNextOccurrence,
	getCurrentRecurringEvents,
	setCurrentRecurringEvents,
	addRecurringEvent,
	updateRecurringEvent,
	deleteRecurringEventByIndex,
	findRecurringEventByMonthDay,
	recurringEventToDisplayFormat
};
