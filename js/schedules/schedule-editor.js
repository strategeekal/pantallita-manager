// Schedule Editor Module - Edit schedule items, add/delete, save
import { fetchGitHubFile, saveGitHubFile, deleteGitHubFile } from '../core/api.js';
import { showStatus, parseCSV, getDayOfWeek } from '../core/utils.js';
import { loadConfig } from '../core/config.js';
import { loadSchedules, scheduleImages } from './schedule-manager.js';
import { updateTimelineView } from './timeline.js';
import { updateSchedulePreview } from './preview.js';

let currentScheduleData = null;
let scheduleMatrix = null;

export { currentScheduleData, scheduleMatrix };

export function createNewSchedule() {
	currentScheduleData = {
		type: 'new-date',
		date: null,
		items: [],
		isNew: true
	};

	showScheduleEditor();
	populateScheduleEditor();
	document.getElementById('schedule-editor-title').textContent = 'Create New Schedule';
}

export async function editSchedule(filename) {
	const config = loadConfig();
	currentScheduleData = null;

	try {
		const timestamp = new Date().getTime();
		const apiUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/schedules/${filename}?nocache=${timestamp}`;

		const response = await fetch(apiUrl, {
			headers: {
				'Authorization': `Bearer ${config.token}`,
				'Accept': 'application/vnd.github.v3+json'
			}
		});

		if (!response.ok) {
			throw new Error(`GitHub API error: ${response.status}`);
		}

		const data = await response.json();
		const content = decodeURIComponent(escape(atob(data.content)));

		const isDefault = filename === 'default.csv';
		const date = isDefault ? null : filename.replace('.csv', '');

		const parsedItems = parseScheduleCSV(content);

		currentScheduleData = {
			type: isDefault ? 'default' : 'edit-date',
			date: date,
			filename: filename,
			sha: data.sha,
			items: parsedItems,
			isNew: false
		};

		showScheduleEditor();
		populateScheduleEditor();

		const title = isDefault ? 'Edit Default Schedule' : `Edit Schedule for ${date}`;
		const titleElement = document.getElementById('schedule-editor-title');

		if (titleElement) {
			titleElement.textContent = title;
		}

	} catch (error) {
		showStatus('Failed to load schedule: ' + error.message, 'error');
	}
}

function parseScheduleCSV(content) {
	const lines = parseCSV(content);

	return lines.map((line, index) => {
		const parts = line.split(',');

		if (parts.length < 9) return null;

		return {
			name: parts[0].trim(),
			enabled: parts[1].trim() === '1',
			days: parts[2].trim(),
			startHour: parseInt(parts[3].trim()),
			startMin: parseInt(parts[4].trim()),
			endHour: parseInt(parts[5].trim()),
			endMin: parseInt(parts[6].trim()),
			image: parts[7].trim(),
			progressBar: parts[8].trim() === '1',
			index: index
		};
	}).filter(item => item !== null);
}

function showScheduleEditor() {
	document.getElementById('schedule-editor').classList.remove('hidden');
	document.querySelector('.schedule-list-section').classList.add('hidden');
}

export function closeScheduleEditor() {
	document.getElementById('schedule-editor').classList.add('hidden');
	document.querySelector('.schedule-list-section').classList.remove('hidden');

	currentScheduleData = null;

	// Clean up schedule matrix
	if (window.scheduleMatrix) {
		window.scheduleMatrix.clear();
		const container = document.getElementById('matrix-container-schedule');
		if (container) {
			container.innerHTML = '';
		}
		window.scheduleMatrix = null;
	}
}

function populateScheduleEditor() {
	if (!currentScheduleData) return;

	const scheduleInfoForm = document.getElementById('schedule-info-form');
	if (!scheduleInfoForm) return;

	try {
		if (currentScheduleData.type === 'default') {
			scheduleInfoForm.innerHTML = `
				<div class="form-group">
					<p class="schedule-mode-info">Editing default schedule template</p>
				</div>
			`;
		} else if (currentScheduleData.type === 'edit-date') {
			if (!currentScheduleData.date) {
				scheduleInfoForm.innerHTML = `
					<div class="form-group">
						<p class="schedule-mode-info error">Error: Date is missing</p>
					</div>
				`;
			} else {
				try {
					const scheduleDate = new Date(currentScheduleData.date + 'T00:00:00');
					const dayOfWeek = getDayOfWeek(currentScheduleData.date);

					scheduleInfoForm.innerHTML = `
						<div class="form-group">
							<label>Schedule Date</label>
							<input type="date" id="schedule-date" value="${currentScheduleData.date}" onchange="window.schedulesModule.handleDateChange()">
							<small>This schedule is for ${dayOfWeek}</small>
						</div>
						<div class="form-group">
							<button type="button" class="btn-pixel btn-secondary" onclick="window.schedulesModule.makeThisDefault()">
								💾 Make This the Default Schedule
							</button>
						</div>
					`;
				} catch (dateError) {
					scheduleInfoForm.innerHTML = `
						<div class="form-group">
							<p class="schedule-mode-info error">Error: Invalid date format</p>
						</div>
					`;
				}
			}
		} else if (currentScheduleData.type === 'new-date') {
			scheduleInfoForm.innerHTML = `
				<div class="form-group">
					<label>Schedule Date *</label>
					<input type="date" id="schedule-date" value="${currentScheduleData.date || ''}" onchange="window.schedulesModule.handleDateChange()">
				</div>
				<div class="form-group">
					<label>Start From Template</label>
					<select id="schedule-template" onchange="window.schedulesModule.loadScheduleTemplate()">
						<option value="">-- Blank Schedule --</option>
						<option value="default">Default Schedule</option>
					</select>
				</div>
			`;
		} else {
			scheduleInfoForm.innerHTML = `
				<div class="form-group">
					<p class="schedule-mode-info error">Error: Unknown schedule type</p>
				</div>
			`;
		}

		renderScheduleItems();
		updateTimelineView();

		// Expose currentScheduleData globally for preview module
		if (window.schedulesModule) {
			window.schedulesModule.currentScheduleData = currentScheduleData;
		}

		// Update preview after rendering with a short delay
		setTimeout(() => updateSchedulePreview(), 50);

	} catch (error) {
		scheduleInfoForm.innerHTML = `
			<div class="form-group">
				<p class="schedule-mode-info error">Error loading schedule: ${error.message}</p>
			</div>
		`;
	}
}

export function handleDateChange() {
	const dateInput = document.getElementById('schedule-date');
	if (dateInput && currentScheduleData) {
		currentScheduleData.date = dateInput.value;

		const dayOfWeek = getDayOfWeek(currentScheduleData.date);
		const smallEl = dateInput.parentElement.querySelector('small');
		if (smallEl) {
			smallEl.textContent = `This schedule is for ${dayOfWeek}`;
		}

		// Update all schedule items to use the new day-of-week
		if (currentScheduleData.type !== 'default' && currentScheduleData.date) {
			const scheduleDate = new Date(currentScheduleData.date + 'T00:00:00');
			const scheduleDayOfWeek = (scheduleDate.getDay() + 6) % 7;
			const newDayString = scheduleDayOfWeek.toString();

			// Update all items to use the new day
			currentScheduleData.items.forEach(item => {
				item.days = newDayString;
			});

			// Re-render items to show updated day
			renderScheduleItems();
		}

		updateTimelineView();
	}
}

export async function loadScheduleTemplate() {
	const templateSelect = document.getElementById('schedule-template');
	if (!templateSelect || !currentScheduleData) return;

	const templateName = templateSelect.value;
	if (!templateName) return;

	try {
		const { content } = await fetchGitHubFile(`schedules/${templateName}.csv`);
		const parsedItems = parseScheduleCSV(content);

		currentScheduleData.items = parsedItems.map((item, index) => ({
			...item,
			index
		}));

		renderScheduleItems();
		updateTimelineView();
		showStatus('Template loaded successfully!', 'success');
	} catch (error) {
		showStatus('Failed to load template: ' + error.message, 'error');
	}
}

export async function makeThisDefault() {
	if (!currentScheduleData || currentScheduleData.type !== 'edit-date') return;

	if (!confirm('Replace the default schedule with this one? This cannot be undone.\n\nAfter saving, you will be redirected to the default schedule editor where you can select which days of the week this schedule should apply to.')) {
		return;
	}

	const config = loadConfig();

	try {
		let sha = null;
		try {
			const response = await fetch(
				`https://api.github.com/repos/${config.owner}/${config.repo}/contents/schedules/default.csv`,
				{
					headers: {
						'Authorization': `Bearer ${config.token}`,
						'Accept': 'application/vnd.github.v3+json'
					}
				}
			);

			if (response.ok) {
				const data = await response.json();
				sha = data.sha;
			}
		} catch (e) {
			// File doesn't exist yet
		}

		const csvContent = generateScheduleCSV();
		const encodedContent = btoa(unescape(encodeURIComponent(csvContent)));

		const response = await fetch(
			`https://api.github.com/repos/${config.owner}/${config.repo}/contents/schedules/default.csv`,
			{
				method: 'PUT',
				headers: {
					'Authorization': `Bearer ${config.token}`,
					'Accept': 'application/vnd.github.v3+json',
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					message: `Update default schedule from ${currentScheduleData.date}`,
					content: encodedContent,
					sha: sha
				})
			}
		);

		if (!response.ok) {
			throw new Error(`GitHub API error: ${response.status}`);
		}

		showStatus('Default schedule updated successfully!', 'success');

		setTimeout(async () => {
			await loadSchedules();

			alert('Default schedule saved! Now redirecting to the default schedule editor where you can select which days of the week this schedule applies to.');
			editSchedule('default.csv');
		}, 1000);

	} catch (error) {
		showStatus('Failed to update default: ' + error.message, 'error');
	}
}

export function addScheduleItem() {
	if (!currentScheduleData) {
		currentScheduleData = {
			type: 'default',
			items: []
		};
	}

	let defaultDays = '0123456';
	if (currentScheduleData.type !== 'default' && currentScheduleData.date) {
		const scheduleDate = new Date(currentScheduleData.date + 'T00:00:00');
		// Convert JS day (0=Sunday) to schedule day (0=Monday)
		const scheduleDayOfWeek = (scheduleDate.getDay() + 6) % 7;
		defaultDays = scheduleDayOfWeek.toString();
	}

	const newItem = {
		name: 'New Item',
		enabled: true,
		days: defaultDays,
		startHour: 9,
		startMin: 0,
		endHour: 17,
		endMin: 0,
		image: '',
		progressBar: false,
		index: currentScheduleData.items.length
	};

	currentScheduleData.items.push(newItem);
	renderScheduleItems();
	updateTimelineView();

	// Update preview after a short delay to ensure DOM is updated
	setTimeout(() => updateSchedulePreview(), 50);
}

function renderScheduleItems() {
	const container = document.getElementById('schedule-items-list');
	if (!container || !currentScheduleData) return;

	if (currentScheduleData.items.length === 0) {
		container.innerHTML = '<p class="empty-message">No items yet. Click "Add Item" to create one.</p>';
		return;
	}

	const itemsHTML = currentScheduleData.items.map((item, index) => {
		const imageOptions = scheduleImages.map(img =>
			`<option value="${img.name}" ${item.image === img.name ? 'selected' : ''}>${img.name}</option>`
		).join('');

		// For date-specific schedules, show read-only day instead of checkboxes
		const isDateSpecific = currentScheduleData.type !== 'default';
		let daysHTML;

		if (isDateSpecific && currentScheduleData.date) {
			// Show read-only day name
			const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
			const scheduleDate = new Date(currentScheduleData.date + 'T00:00:00');
			// Convert JS day (0=Sunday) to schedule day (0=Monday)
			const scheduleDayOfWeek = (scheduleDate.getDay() + 6) % 7;
			daysHTML = `<span class="read-only-day">${dayNames[scheduleDayOfWeek]}</span>`;
		} else {
			// Show checkboxes for default schedule
			daysHTML = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, dayIndex) => {
				const isChecked = item.days.includes(dayIndex.toString());
				return `
					<label class="day-checkbox ${isChecked ? 'checked' : ''}">
						<input type="checkbox"
							${isChecked ? 'checked' : ''}
							onchange="window.schedulesModule.updateScheduleDays(${index}, this)">
						${day}
					</label>
				`;
			}).join('');
		}

		return `
			<div class="schedule-item">
				<div class="schedule-item-header">
					<input type="text"
						class="item-name-input"
						value="${item.name}"
						onchange="window.schedulesModule.updateScheduleItem(${index}, 'name', this.value)"
						placeholder="Item name">
					<label class="item-enabled">
						<input type="checkbox"
							${item.enabled ? 'checked' : ''}
							onchange="window.schedulesModule.updateScheduleItem(${index}, 'enabled', this.checked)">
						Enabled
					</label>
				</div>
				<div class="schedule-item-body">
					<div class="schedule-item-row">
						<span class="item-label">Days:</span>
						<div class="day-checkboxes">${daysHTML}</div>
					</div>
					<div class="schedule-item-row">
						<span class="item-label">Time:</span>
						<div class="time-inputs">
							<input type="number" class="time-input" min="0" max="23"
								value="${item.startHour}"
								onchange="window.schedulesModule.updateScheduleItem(${index}, 'startHour', parseInt(this.value))">
							<span class="time-separator">:</span>
							<input type="number" class="time-input" min="0" max="59"
								value="${item.startMin}"
								onchange="window.schedulesModule.updateScheduleItem(${index}, 'startMin', parseInt(this.value))">
							<span class="time-separator">to</span>
							<input type="number" class="time-input" min="0" max="23"
								value="${item.endHour}"
								onchange="window.schedulesModule.updateScheduleItem(${index}, 'endHour', parseInt(this.value))">
							<span class="time-separator">:</span>
							<input type="number" class="time-input" min="0" max="59"
								value="${item.endMin}"
								onchange="window.schedulesModule.updateScheduleItem(${index}, 'endMin', parseInt(this.value))">
						</div>
					</div>
					<div class="schedule-item-row">
						<span class="item-label">Image:</span>
						<select class="image-select" onchange="window.schedulesModule.updateScheduleItem(${index}, 'image', this.value)">
							<option value="">None</option>
							${imageOptions}
						</select>
					</div>
					<div class="schedule-item-row">
						<label class="progress-label">
							<input type="checkbox"
								${item.progressBar ? 'checked' : ''}
								onchange="window.schedulesModule.updateScheduleItem(${index}, 'progressBar', this.checked)">
							Show Progress Bar
						</label>
						<button class="btn-pixel btn-secondary btn-sm" onclick="window.schedulesModule.deleteScheduleItem(${index})">
							🗑️ Delete
						</button>
					</div>
				</div>
			</div>
		`;
	}).join('');

	container.innerHTML = itemsHTML;

	// Update preview selector
	updatePreviewSelector();
}

function updatePreviewSelector() {
	const selector = document.getElementById('preview-item-select');
	if (!selector || !currentScheduleData) return;

	const currentValue = selector.value;

	// Clear and populate selector
	selector.innerHTML = currentScheduleData.items.map((item, index) =>
		`<option value="${index}">${item.name}</option>`
	).join('');

	// Restore previous selection if it still exists, otherwise select first item
	if (currentValue !== '' && currentScheduleData.items[currentValue]) {
		selector.value = currentValue;
	} else if (currentScheduleData.items.length > 0) {
		selector.value = '0';
	}
}

export function updateScheduleDays(index, checkbox) {
	if (!currentScheduleData || !currentScheduleData.items[index]) return;

	const item = currentScheduleData.items[index];
	const dayIndex = Array.from(checkbox.parentElement.parentElement.children).indexOf(checkbox.parentElement);

	let days = item.days.split('').filter(d => d !== '');
	const dayStr = dayIndex.toString();

	if (checkbox.checked) {
		if (!days.includes(dayStr)) {
			days.push(dayStr);
		}
	} else {
		days = days.filter(d => d !== dayStr);
	}

	item.days = days.sort().join('');

	const label = checkbox.parentElement;
	if (checkbox.checked) {
		label.classList.add('checked');
	} else {
		label.classList.remove('checked');
	}

	updateTimelineView();
}

export function updateScheduleItem(index, field, value) {
	if (!currentScheduleData || !currentScheduleData.items[index]) return;

	currentScheduleData.items[index][field] = value;

	if (['startHour', 'startMin', 'endHour', 'endMin', 'enabled', 'days'].includes(field)) {
		updateTimelineView();
	}

	// Update preview selector when name changes
	if (field === 'name') {
		updatePreviewSelector();
	}

	// Update preview when image or progress bar changes
	if (['image', 'progressBar'].includes(field)) {
		updateSchedulePreview();
	}
}

export function deleteScheduleItem(index) {
	if (!currentScheduleData) return;

	if (!confirm('Delete this schedule item?')) return;

	currentScheduleData.items.splice(index, 1);
	currentScheduleData.items.forEach((item, i) => item.index = i);

	renderScheduleItems();
	updateTimelineView();

	// Update preview after a short delay
	setTimeout(() => updateSchedulePreview(), 50);
}

export async function saveSchedule() {
	if (!currentScheduleData) return;

	if (!validateUniqueNames()) {
		return;
	}

	const config = loadConfig();
	let filename;
	let oldFilename = null;

	if (currentScheduleData.type === 'default') {
		filename = 'default.csv';
	} else {
		const date = document.getElementById('schedule-date')?.value || currentScheduleData.date;
		if (!date) {
			showStatus('Please select a date', 'error');
			return;
		}
		filename = `${date}.csv`;

		// Check if date was changed on an existing schedule
		if (currentScheduleData.filename && currentScheduleData.filename !== filename) {
			oldFilename = currentScheduleData.filename;
		}

		currentScheduleData.date = date;
	}

	try {
		// If date was changed, delete the old file first
		if (oldFilename && currentScheduleData.sha) {
			try {
				await deleteGitHubFile(`schedules/${oldFilename}`, currentScheduleData.sha);
				console.log('Deleted old schedule file:', oldFilename);
				// Clear sha since we deleted the old file
				currentScheduleData.sha = null;
			} catch (error) {
				console.error('Failed to delete old schedule file:', error);
				showStatus('Warning: Could not delete old schedule file', 'warning');
			}
		}

		const csvContent = generateScheduleCSV();
		const saveData = await saveGitHubFile(`schedules/${filename}`, csvContent, currentScheduleData.sha);

		if (currentScheduleData) {
			currentScheduleData.sha = saveData.content.sha;
			currentScheduleData.filename = filename;
		}

		showStatus('Schedule saved successfully!', 'success');

		setTimeout(async () => {
			await loadSchedules();
		}, 1000);

		closeScheduleEditor();

	} catch (error) {
		showStatus('Failed to save schedule: ' + error.message, 'error');
	}
}

function validateUniqueNames() {
	if (!currentScheduleData || !currentScheduleData.items) return true;

	const names = currentScheduleData.items.map(item => item.name.trim().toLowerCase());
	const uniqueNames = new Set(names);

	if (names.length !== uniqueNames.size) {
		const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
		const uniqueDuplicates = [...new Set(duplicates)];

		showStatus(`Duplicate names found: ${uniqueDuplicates.join(', ')}. Each item must have a unique name.`, 'error');
		return false;
	}

	return true;
}

function generateScheduleCSV() {
	const header = `# Format: name,enabled,days,start_hour,start_min,end_hour,end_min,image,progressbar
# enabled: 1=true, 0=false
# days: 0-6 for Mon-Sun (e.g., "01234" = Mon-Fri)
# progressbar: 1=true, 0=false
`;

	const lines = currentScheduleData.items.map(item =>
		`${item.name},${item.enabled ? 1 : 0},${item.days},${item.startHour},${item.startMin},${item.endHour},${item.endMin},${item.image},${item.progressBar ? 1 : 0}`
	);

	return header + lines.join('\n');
}
