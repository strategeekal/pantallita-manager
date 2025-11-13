// Validation Module for SCREENY Manager
import { fetchGitHubFile, listGitHubDirectory } from '../core/api.js';
import { loadConfig } from '../core/config.js';
import { parseCSV } from '../core/utils.js';

// Valid color names for events
const VALID_COLORS = [
	'MINT', 'LILAC', 'ORANGE', 'YELLOW', 'BLUE', 'WHITE',
	'RED', 'GREEN', 'PINK', 'PURPLE', 'BUGAMBILIA', 'AQUA'
];

let validationResults = {
	errors: [],
	warnings: [],
	info: []
};

export async function runValidation() {
	// Reset results
	validationResults = {
		errors: [],
		warnings: [],
		info: []
	};

	// Show validation modal
	showValidationModal();
	updateValidationStatus('Running validation...');

	try {
		// Run all validation checks
		await validateEvents();
		await validateSchedules();
		await validateImages();

		// Display results
		displayValidationResults();
	} catch (error) {
		validationResults.errors.push(`Validation failed: ${error.message}`);
		displayValidationResults();
	}
}

async function validateEvents() {
	updateValidationStatus('Validating events...');

	try {
		const { content } = await fetchGitHubFile('ephemeral_events.csv');
		const events = parseEventsCSV(content);

		if (events.length === 0) {
			validationResults.info.push('No events found in ephemeral_events.csv');
			return;
		}

		validationResults.info.push(`Found ${events.length} event(s) to validate`);

		// Get current date normalized to midnight
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		let oldEventsCount = 0;
		let invalidDateCount = 0;

		events.forEach((event, index) => {
			const lineNum = index + 1;
			const eventIdentifier = `"${event.topLine} - ${event.bottomLine}" (${event.date})`;

			// Validate date format
			const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
			if (!dateRegex.test(event.date)) {
				validationResults.errors.push(
					`Event ${lineNum} ${eventIdentifier}: Invalid date format "${event.date}" (expected YYYY-MM-DD)`
				);
				invalidDateCount++;
				return; // Skip further validation for this event
			}

			// Check if event is in the past (before today)
			const eventDate = new Date(event.date + 'T00:00:00');
			if (eventDate < today) {
				validationResults.warnings.push(
					`Event ${lineNum} ${eventIdentifier}: Date is in the past - can be cleaned up`
				);
				oldEventsCount++;
			}

			// Validate top line length
			if (event.topLine.length > 12) {
				validationResults.errors.push(
					`Event ${lineNum} ${eventIdentifier}: Top line exceeds 12 character limit (${event.topLine.length} chars)`
				);
			}

			// Validate bottom line length
			if (event.bottomLine.length > 12) {
				validationResults.errors.push(
					`Event ${lineNum} ${eventIdentifier}: Bottom line exceeds 12 character limit (${event.bottomLine.length} chars)`
				);
			}

			// Validate color
			if (!VALID_COLORS.includes(event.colorName)) {
				validationResults.errors.push(
					`Event ${lineNum} ${eventIdentifier}: Invalid color "${event.colorName}" (valid: ${VALID_COLORS.join(', ')})`
				);
			}

			// Validate hours
			if (event.startHour !== undefined && (event.startHour < 0 || event.startHour > 23)) {
				validationResults.errors.push(
					`Event ${lineNum} ${eventIdentifier}: Invalid start hour ${event.startHour} (must be 0-23)`
				);
			}

			if (event.endHour !== undefined && (event.endHour < 0 || event.endHour > 23)) {
				validationResults.errors.push(
					`Event ${lineNum} ${eventIdentifier}: Invalid end hour ${event.endHour} (must be 0-23)`
				);
			}

			// Validate hour range logic
			if (event.startHour !== undefined && event.endHour !== undefined && event.startHour >= event.endHour) {
				validationResults.warnings.push(
					`Event ${lineNum} ${eventIdentifier}: Start hour (${event.startHour}) is >= end hour (${event.endHour})`
				);
			}

			// Validate image filename
			if (!event.iconName) {
				validationResults.warnings.push(
					`Event ${lineNum} ${eventIdentifier}: No image specified`
				);
			} else if (!event.iconName.endsWith('.bmp')) {
				validationResults.errors.push(
					`Event ${lineNum} ${eventIdentifier}: Image "${event.iconName}" must be a .bmp file`
				);
			}
		});

		if (oldEventsCount > 0) {
			validationResults.info.push(
				`Found ${oldEventsCount} past event(s) that can be cleaned up`
			);
		}
	} catch (error) {
		if (error.message.includes('404')) {
			validationResults.info.push('No ephemeral_events.csv file found');
		} else {
			validationResults.errors.push(`Error validating events: ${error.message}`);
		}
	}
}

async function validateSchedules() {
	updateValidationStatus('Validating schedules...');

	try {
		const files = await listGitHubDirectory('schedules');
		const scheduleFiles = files.filter(f =>
			f.name.endsWith('.csv') &&
			!f.name.startsWith('template') &&
			f.type === 'file'
		);

		if (scheduleFiles.length === 0) {
			validationResults.info.push('No schedule files found');
			return;
		}

		validationResults.info.push(`Found ${scheduleFiles.length} schedule file(s) to validate`);

		// Get current date normalized to midnight
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		let oldSchedulesCount = 0;

		for (const file of scheduleFiles) {
			const isDefault = file.name === 'default_schedule.csv' || file.name === 'default.csv';

			// Check for old date-specific schedules (before today)
			if (!isDefault) {
				const dateMatch = file.name.match(/schedule_(\d{4}-\d{2}-\d{2})\.csv/) ||
								 file.name.match(/(\d{4}-\d{2}-\d{2})\.csv/);

				if (dateMatch) {
					const scheduleDate = new Date(dateMatch[1] + 'T00:00:00');
					if (scheduleDate < today) {
						validationResults.warnings.push(
							`Schedule file "${file.name}": Date ${dateMatch[1]} is in the past - can be cleaned up`
						);
						oldSchedulesCount++;
					}
				}
			}

			// Validate schedule content
			try {
				const { content } = await fetchGitHubFile(`schedules/${file.name}`);
				const scheduleItems = parseScheduleCSV(content);

				scheduleItems.forEach((item, index) => {
					const lineNum = index + 1;
					const scheduleName = file.name;
					const itemIdentifier = `"${item.name}" in ${scheduleName}`;

					// Validate time ranges
					if (item.startHour < 0 || item.startHour > 23) {
						validationResults.errors.push(
							`Schedule item ${itemIdentifier} (line ${lineNum}): Invalid start hour ${item.startHour} (must be 0-23)`
						);
					}

					if (item.endHour < 0 || item.endHour > 23) {
						validationResults.errors.push(
							`Schedule item ${itemIdentifier} (line ${lineNum}): Invalid end hour ${item.endHour} (must be 0-23)`
						);
					}

					if (item.startMin < 0 || item.startMin > 59) {
						validationResults.errors.push(
							`Schedule item ${itemIdentifier} (line ${lineNum}): Invalid start minute ${item.startMin} (must be 0-59)`
						);
					}

					if (item.endMin < 0 || item.endMin > 59) {
						validationResults.errors.push(
							`Schedule item ${itemIdentifier} (line ${lineNum}): Invalid end minute ${item.endMin} (must be 0-59)`
						);
					}

					// Validate time logic
					const startMinutes = item.startHour * 60 + item.startMin;
					const endMinutes = item.endHour * 60 + item.endMin;
					if (startMinutes >= endMinutes) {
						validationResults.warnings.push(
							`Schedule item ${itemIdentifier} (line ${lineNum}): Start time ${item.startHour}:${String(item.startMin).padStart(2, '0')} is >= end time ${item.endHour}:${String(item.endMin).padStart(2, '0')}`
						);
					}

					// Validate image
					if (!item.image) {
						validationResults.warnings.push(
							`Schedule item ${itemIdentifier} (line ${lineNum}): No image specified`
						);
					} else if (!item.image.endsWith('.bmp')) {
						validationResults.errors.push(
							`Schedule item ${itemIdentifier} (line ${lineNum}): Image "${item.image}" must be a .bmp file`
						);
					}

					// Validate days format for default schedule
					if (isDefault && item.days) {
						const validDays = /^[0-6]*$/;
						if (!validDays.test(item.days)) {
							validationResults.errors.push(
								`Schedule item ${itemIdentifier} (line ${lineNum}): Invalid days format "${item.days}" (must contain only digits 0-6)`
							);
						}
					}
				});
			} catch (error) {
				validationResults.errors.push(
					`Error reading schedule file "${file.name}": ${error.message}`
				);
			}
		}

		if (oldSchedulesCount > 0) {
			validationResults.info.push(
				`Found ${oldSchedulesCount} past schedule(s) that can be cleaned up`
			);
		}
	} catch (error) {
		if (error.message.includes('404')) {
			validationResults.info.push('No schedules directory found');
		} else {
			validationResults.errors.push(`Error validating schedules: ${error.message}`);
		}
	}
}

async function validateImages() {
	updateValidationStatus('Validating images...');

	try {
		// Load event images
		const eventImageFiles = await listGitHubDirectory('img/events');
		const eventImages = eventImageFiles
			.filter(f => f.name.endsWith('.bmp'))
			.map(f => f.name);

		validationResults.info.push(`Found ${eventImages.length} event image(s)`);

		// Load schedule images
		const scheduleImageFiles = await listGitHubDirectory('img/schedules');
		const scheduleImages = scheduleImageFiles
			.filter(f => f.name.endsWith('.bmp'))
			.map(f => f.name);

		validationResults.info.push(`Found ${scheduleImages.length} schedule image(s)`);

		// Check if event images referenced in events exist
		try {
			const { content } = await fetchGitHubFile('ephemeral_events.csv');
			const events = parseEventsCSV(content);

			events.forEach((event, index) => {
				if (event.iconName && !eventImages.includes(event.iconName)) {
					const eventIdentifier = `"${event.topLine} - ${event.bottomLine}" (${event.date})`;
					validationResults.errors.push(
						`Event ${index + 1} ${eventIdentifier}: Image "${event.iconName}" not found in img/events/ directory`
					);
				}
			});
		} catch (error) {
			// Skip if events file doesn't exist
		}

		// Check if schedule images referenced in schedules exist
		try {
			const files = await listGitHubDirectory('schedules');
			const scheduleFiles = files.filter(f =>
				f.name.endsWith('.csv') &&
				f.type === 'file'
			);

			for (const file of scheduleFiles) {
				const { content } = await fetchGitHubFile(`schedules/${file.name}`);
				const scheduleItems = parseScheduleCSV(content);

				scheduleItems.forEach((item, index) => {
					if (item.image && !scheduleImages.includes(item.image)) {
						const itemIdentifier = `"${item.name}" in ${file.name}`;
						validationResults.errors.push(
							`Schedule item ${itemIdentifier} (line ${index + 1}): Image "${item.image}" not found in img/schedules/ directory`
						);
					}
				});
			}
		} catch (error) {
			// Skip if schedules don't exist
		}
	} catch (error) {
		validationResults.warnings.push(`Could not validate images: ${error.message}`);
	}
}

function parseEventsCSV(content) {
	const lines = parseCSV(content);

	return lines.map((line) => {
		const parts = line.split(',').map(p => p.trim());

		if (parts.length < 5) return null;

		return {
			date: parts[0],
			topLine: parts[1],
			bottomLine: parts[2],
			iconName: parts[3],
			colorName: parts[4],
			startHour: parts.length > 5 ? parseInt(parts[5]) : 0,
			endHour: parts.length > 6 ? parseInt(parts[6]) : 23
		};
	}).filter(e => e !== null);
}

function parseScheduleCSV(content) {
	const lines = parseCSV(content);

	return lines.map((line) => {
		const parts = line.split(',').map(p => p.trim());

		// Format: name,enabled,days,start_hour,start_min,end_hour,end_min,image,progressbar
		if (parts.length < 9) return null;

		return {
			name: parts[0],
			enabled: parts[1],
			days: parts[2],
			startHour: parseInt(parts[3]) || 0,
			startMin: parseInt(parts[4]) || 0,
			endHour: parseInt(parts[5]) || 0,
			endMin: parseInt(parts[6]) || 0,
			image: parts[7],
			progressBar: parts[8]
		};
	}).filter(item => item !== null);
}

function showValidationModal() {
	const modal = document.getElementById('validation-modal');
	if (modal) {
		modal.classList.remove('hidden');
	}
}

function hideValidationModal() {
	const modal = document.getElementById('validation-modal');
	if (modal) {
		modal.classList.add('hidden');
	}
}

function updateValidationStatus(message) {
	const statusEl = document.getElementById('validation-status');
	if (statusEl) {
		statusEl.textContent = message;
	}
}

function displayValidationResults() {
	const resultsContainer = document.getElementById('validation-results');
	const statusEl = document.getElementById('validation-status');

	if (!resultsContainer) return;

	// Hide status message
	if (statusEl) {
		statusEl.style.display = 'none';
	}

	const totalIssues = validationResults.errors.length + validationResults.warnings.length;

	let html = '';

	// Summary
	if (totalIssues === 0) {
		html += `
			<div class="validation-success">
				<h3>✅ Validation Passed!</h3>
				<p>No errors or warnings found. Your data is in good shape!</p>
			</div>
		`;
	} else {
		html += `
			<div class="validation-summary">
				<h3>Validation Complete</h3>
				<p>Found ${validationResults.errors.length} error(s) and ${validationResults.warnings.length} warning(s)</p>
			</div>
		`;
	}

	// Errors
	if (validationResults.errors.length > 0) {
		html += `
			<div class="validation-section validation-errors">
				<h4>❌ Errors (${validationResults.errors.length})</h4>
				<ul>
					${validationResults.errors.map(err => `<li>${err}</li>`).join('')}
				</ul>
			</div>
		`;
	}

	// Warnings
	if (validationResults.warnings.length > 0) {
		html += `
			<div class="validation-section validation-warnings">
				<h4>⚠️ Warnings (${validationResults.warnings.length})</h4>
				<ul>
					${validationResults.warnings.map(warn => `<li>${warn}</li>`).join('')}
				</ul>
			</div>
		`;
	}

	// Info
	if (validationResults.info.length > 0) {
		html += `
			<div class="validation-section validation-info">
				<h4>ℹ️ Information</h4>
				<ul>
					${validationResults.info.map(info => `<li>${info}</li>`).join('')}
				</ul>
			</div>
		`;
	}

	resultsContainer.innerHTML = html;
}

export function closeValidationModal() {
	hideValidationModal();
}

// Expose functions globally
window.validatorModule = {
	runValidation,
	closeValidationModal
};

window.runValidation = runValidation;
window.closeValidationModal = closeValidationModal;
