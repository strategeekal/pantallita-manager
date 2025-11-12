// Schedule Editor Module - Edit schedule items, add/delete, save
import { fetchGitHubFile, saveGitHubFile, deleteGitHubFile } from '../core/api.js';
import { showStatus, parseCSV, getDayOfWeek, formatImageName } from '../core/utils.js';
import { loadConfig } from '../core/config.js';
import { loadSchedules, scheduleImages, scheduleTemplates } from './schedule-manager.js';
import { updateTimelineView, refreshTimelineViews } from './timeline.js';
import { updateSchedulePreview } from './preview.js';
import { TINYBIT_FONT } from '../ui/fonts.js';

let currentScheduleData = null;
let scheduleMatrix = null;

export { currentScheduleData, scheduleMatrix };

// Render mobile preview with text and images
// Replicates desktop emulator layout at 4x scale (64x32 -> 256x128)
export async function renderMobilePreview() {
	// Only render on mobile
	if (window.innerWidth > 768) return;

	const previewSquare = document.querySelector('.mobile-preview-square');
	if (!previewSquare) return;

	// Get selected schedule item
	const itemIndex = document.getElementById('preview-item-select')?.value;
	if (!currentScheduleData || itemIndex === '' || !currentScheduleData.items[itemIndex]) {
		return;
	}

	const item = currentScheduleData.items[itemIndex];

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
	const TIME_X = 2;
	const TIME_Y = 1;
	const WEATHER_X = 3;
	const WEATHER_Y = 9;
	const TEMP_X = 2;
	const TEMP_Y = 25;
	const SCHEDULE_IMAGE_X = 23;
	const SCHEDULE_IMAGE_Y = 1;
	const PROGRESS_BAR_Y = 29;

	// Calculate midpoint time of schedule item (like desktop version)
	const startMinutes = item.startHour * 60 + item.startMin;
	const endMinutes = item.endHour * 60 + item.endMin;
	const midMinutes = Math.floor((startMinutes + endMinutes) / 2);
	const midHour = Math.floor(midMinutes / 60);
	const midHour12 = (midHour % 12) || 12;
	const midMin = midMinutes % 60;
	const timeString = `${String(midHour12)}:${String(midMin).padStart(2, '0')}`;

	// Draw dynamic time at scaled position
	drawTextMobile(ctx, timeString, TIME_X * SCALE, TIME_Y * SCALE, '#FFFFFF', SCALE);

	// Draw temperature "18°" at scaled position
	const tempText = '18';
	drawTextMobile(ctx, tempText, TEMP_X * SCALE, TEMP_Y * SCALE, '#FFFFFF', SCALE);
	// Draw degree symbol slightly offset
	const numberWidth = (3 * 2) + 1; // Two digits in TINYBIT_FONT
	drawTextMobile(ctx, '°', (TEMP_X + numberWidth + 1) * SCALE, (TEMP_Y - 3) * SCALE, '#FFFFFF', SCALE);

	// Load and draw weather icon
	if (window.loadWeatherColumnImage) {
		try {
			const weatherData = await window.loadWeatherColumnImage('1.bmp');
			if (weatherData && weatherData.pixels) {
				drawBMPMobile(ctx, weatherData.pixels, WEATHER_X * SCALE, WEATHER_Y * SCALE, SCALE);
			}
		} catch (error) {
			console.error('Error loading weather icon:', error);
		}
	}

	// Load and draw schedule image dynamically
	if (item.image && window.loadScheduleBMPImage) {
		try {
			const scheduleImageData = await window.loadScheduleBMPImage(item.image);
			if (scheduleImageData && scheduleImageData.pixels) {
				drawBMPMobile(ctx, scheduleImageData.pixels, SCHEDULE_IMAGE_X * SCALE, SCHEDULE_IMAGE_Y * SCALE, SCALE);
			}
		} catch (error) {
			console.error('Error loading schedule image:', error);
		}
	}

	// Draw progress bar if enabled
	if (item.progressBar) {
		drawProgressBarMobile(ctx, 50, SCHEDULE_IMAGE_X * SCALE, PROGRESS_BAR_Y * SCALE, SCALE);
	}

	// Populate mobile edit panel with the selected item
	const index = parseInt(itemIndex);
	if (window.schedulesModule && window.schedulesModule.populateMobileEditPanel) {
		window.schedulesModule.populateMobileEditPanel(index);
	}
}

// Draw text using TINYBIT_FONT on mobile canvas
function drawTextMobile(ctx, text, x, y, color, scale) {
	let currentX = x;

	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		const glyph = TINYBIT_FONT.glyphs[char];

		if (!glyph) {
			currentX += 3 * scale; // Default spacing
			continue;
		}

		const { width, height, bitmap } = glyph;

		// Draw each pixel of the character
		for (let row = 0; row < height; row++) {
			const byte = bitmap[row];
			for (let col = 0; col < width; col++) {
				const bitMask = 0x80 >> col;
				if (byte & bitMask) {
					ctx.fillStyle = color;
					ctx.fillRect(currentX + (col * scale), y + (row * scale), scale, scale);
				}
			}
		}

		currentX += (width + 1) * scale; // Character width + 1px spacing, scaled
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

// Draw progress bar on mobile canvas (160x8 pixels = 40x2 at 4x scale)
function drawProgressBarMobile(ctx, progressPercent, x, y, scale) {
	const MINT = '#00FFAA';
	const LILAC = '#AA00FF';
	const WHITE = '#FFFFFF';

	// Desktop dimensions
	const barWidth = 40;
	const barHeight = 2;

	// Scaled dimensions
	const scaledWidth = barWidth * scale; // 160px
	const scaledHeight = barHeight * scale; // 8px
	const filledWidth = Math.floor((progressPercent / 100) * barWidth);

	// Draw mint background (full bar) - right 50%
	ctx.fillStyle = MINT;
	for (let row = 0; row < barHeight; row++) {
		for (let col = 0; col < barWidth; col++) {
			ctx.fillRect(x + (col * scale), y + (row * scale), scale, scale);
		}
	}

	// Draw lilac progress (filled portion) - left 50%
	ctx.fillStyle = LILAC;
	for (let row = 0; row < barHeight; row++) {
		for (let col = 0; col < filledWidth; col++) {
			ctx.fillRect(x + (col * scale), y + (row * scale), scale, scale);
		}
	}

	// Draw white markers at 0%, 25%, 50%, 75%, 100%
	const markers = [0, 10, 20, 30, 39]; // Desktop pixel positions
	const extendedMarkers = [0, 20, 39]; // First, middle, last get extra pixels

	ctx.fillStyle = WHITE;
	markers.forEach(markerX => {
		// Draw main 2-pixel tall marker
		for (let row = 0; row < barHeight; row++) {
			ctx.fillRect(x + (markerX * scale), y + (row * scale), scale, scale);
		}

		// Add pixels above and below for extended markers
		if (extendedMarkers.includes(markerX)) {
			ctx.fillRect(x + (markerX * scale), y - scale, scale, scale); // Above
			ctx.fillRect(x + (markerX * scale), y + (barHeight * scale), scale, scale); // Below
		}
	});
}

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
	const scheduleEditor = document.getElementById('schedule-editor');
	scheduleEditor.classList.add('hidden');
	document.querySelector('.schedule-list-section').classList.remove('hidden');

	currentScheduleData = null;

	// Remove data attribute
	if (scheduleEditor) {
		scheduleEditor.removeAttribute('data-schedule-type');
	}

	// Remove make default button if it exists
	const makeDefaultBtn = document.querySelector('.make-default-btn');
	if (makeDefaultBtn) {
		makeDefaultBtn.remove();
	}

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

	// Set data attribute on schedule editor for CSS targeting
	const scheduleEditor = document.getElementById('schedule-editor');
	if (scheduleEditor) {
		scheduleEditor.setAttribute('data-schedule-type', currentScheduleData.type);
	}

	// Remove make default button if it exists (in case switching modes)
	const makeDefaultBtn = document.querySelector('.make-default-btn');
	if (makeDefaultBtn) {
		makeDefaultBtn.remove();
	}

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
					`;

					// Add default schedule button to actions section - use setTimeout to ensure DOM is ready
					setTimeout(() => {
						const actionsDiv = document.querySelector('.schedule-editor .schedule-actions');
						if (actionsDiv) {
							// Check if button doesn't already exist
							if (!actionsDiv.querySelector('.make-default-btn')) {
								const defaultBtn = document.createElement('button');
								defaultBtn.className = 'btn-pixel btn-secondary make-default-btn';
								defaultBtn.onclick = () => window.schedulesModule.makeThisDefault();
								defaultBtn.innerHTML = '💾 Make This the Default Schedule';
								// Insert before the Cancel button (last button)
								const cancelBtn = actionsDiv.querySelector('button:last-child');
								if (cancelBtn) {
									actionsDiv.insertBefore(defaultBtn, cancelBtn);
								}
							}
						}
					}, 50);
				} catch (dateError) {
					scheduleInfoForm.innerHTML = `
						<div class="form-group">
							<p class="schedule-mode-info error">Error: Invalid date format</p>
						</div>
					`;
				}
			}
		} else if (currentScheduleData.type === 'new-date') {
			// Generate template options
			const templateOptions = scheduleTemplates.map(t =>
				`<option value="${t.name}">${t.displayName}</option>`
			).join('');

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
						${templateOptions}
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
		refreshTimelineViews();

		// Expose currentScheduleData globally for preview module
		if (window.schedulesModule) {
			window.schedulesModule.currentScheduleData = currentScheduleData;
		}

		// Update preview after rendering with a short delay
		setTimeout(() => updateSchedulePreview(), 50);

		// Render mobile preview
		renderMobilePreview();

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

		refreshTimelineViews();
	}
}

export async function loadScheduleTemplate() {
	const templateSelect = document.getElementById('schedule-template');
	if (!templateSelect || !currentScheduleData) return;

	const templateName = templateSelect.value;
	if (!templateName) return;

	try {
		// Load from templates directory, or from schedules/ for "default"
		const templatePath = templateName === 'default'
			? `schedules/default.csv`
			: `schedules/templates/${templateName}`;

		const { content } = await fetchGitHubFile(templatePath);
		const parsedItems = parseScheduleCSV(content);

		currentScheduleData.items = parsedItems.map((item, index) => ({
			...item,
			index
		}));

		// If this is a date-specific schedule, update all items to use the date's day of week
		if (currentScheduleData.type !== 'default' && currentScheduleData.date) {
			const scheduleDate = new Date(currentScheduleData.date + 'T00:00:00');
			const scheduleDayOfWeek = (scheduleDate.getDay() + 6) % 7;
			const newDayString = scheduleDayOfWeek.toString();

			currentScheduleData.items.forEach(item => {
				item.days = newDayString;
			});
		}

		renderScheduleItems();
		refreshTimelineViews();
		showStatus('Template loaded successfully!', 'success');
	} catch (error) {
		showStatus('Failed to load template: ' + error.message, 'error');
	}
}

export async function saveAsTemplate() {
	if (!currentScheduleData || !currentScheduleData.items || currentScheduleData.items.length === 0) {
		showStatus('Cannot save empty schedule as template', 'error');
		return;
	}

	const templateName = prompt('Enter template name (will be saved as schedules/templates/[name].csv):');
	if (!templateName) return;

	// Clean up the name (remove .csv if user added it, replace spaces with dashes)
	const cleanName = templateName.replace('.csv', '').replace(/\s+/g, '-').toLowerCase();
	if (!cleanName) {
		showStatus('Invalid template name', 'error');
		return;
	}

	const config = loadConfig();

	try {
		// Check if template already exists
		let sha = null;
		try {
			const response = await fetch(
				`https://api.github.com/repos/${config.owner}/${config.repo}/contents/schedules/templates/${cleanName}.csv`,
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
				if (!confirm(`Template "${cleanName}" already exists. Overwrite?`)) {
					return;
				}
			}
		} catch (e) {
			// Template doesn't exist yet - that's fine
		}

		const csvContent = generateScheduleCSV();
		await saveGitHubFile(`schedules/templates/${cleanName}.csv`, csvContent, sha);

		showStatus('Template saved successfully!', 'success');

		// Reload templates
		const { loadScheduleTemplates } = await import('./schedule-manager.js');
		await loadScheduleTemplates();

	} catch (error) {
		showStatus('Failed to save template: ' + error.message, 'error');
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

	// Calculate default times based on existing items
	let startHour = 8;
	let startMin = 0;

	if (currentScheduleData.items.length > 0) {
		// Find the latest end time from existing items
		const latestItem = currentScheduleData.items.reduce((latest, item) => {
			const latestTime = latest.endHour * 60 + latest.endMin;
			const currentTime = item.endHour * 60 + item.endMin;
			return currentTime > latestTime ? item : latest;
		});

		startHour = latestItem.endHour;
		startMin = latestItem.endMin;
	}

	// Calculate end time (15 minutes after start)
	let endMin = startMin + 15;
	let endHour = startHour;

	if (endMin >= 60) {
		endMin -= 60;
		endHour += 1;
	}

	const newItem = {
		name: 'New Item',
		enabled: true,
		days: defaultDays,
		startHour: startHour,
		startMin: startMin,
		endHour: endHour,
		endMin: endMin,
		image: '',
		progressBar: false,
		index: currentScheduleData.items.length
	};

	currentScheduleData.items.push(newItem);
	renderScheduleItems();
	refreshTimelineViews();

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
			`<option value="${img.name}" ${item.image === img.name ? 'selected' : ''}>${formatImageName(img.name)}</option>`
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
							<input type="number" class="time-input-large min="0" max="23"
								value="${item.startHour}"
								onchange="window.schedulesModule.updateScheduleItem(${index}, 'startHour', parseInt(this.value))">
							<span class="time-separator">:</span>
							<input type="number" class="time-input-large min="0" max="59"
								value="${item.startMin}"
								onchange="window.schedulesModule.updateScheduleItem(${index}, 'startMin', parseInt(this.value))">
							<span class="time-separator">to</span>
							<input type="number" class="time-input-large min="0" max="23"
								value="${item.endHour}"
								onchange="window.schedulesModule.updateScheduleItem(${index}, 'endHour', parseInt(this.value))">
							<span class="time-separator">:</span>
							<input type="number" class="time-input-large min="0" max="59"
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

	refreshTimelineViews();
}

export function updateScheduleItem(index, field, value) {
	if (!currentScheduleData || !currentScheduleData.items[index]) return;

	currentScheduleData.items[index][field] = value;

	if (['startHour', 'startMin', 'endHour', 'endMin', 'enabled', 'days'].includes(field)) {
		refreshTimelineViews();
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
	refreshTimelineViews();

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
