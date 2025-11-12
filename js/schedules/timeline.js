// Timeline Module - Render schedule timeline view with gaps and overlap detection
import * as scheduleEditorModule from './schedule-editor.js';

let timelineViewMode = 'day'; // 'day' or 'week'

// Helper to get current schedule data from either regular schedule or template
function getCurrentData() {
	// Check if we're editing a template
	if (window.__currentTemplateData) {
		return window.__currentTemplateData;
	}
	// Otherwise use regular schedule data
	return scheduleEditorModule.currentScheduleData;
}

// Helper function to update both views
export function refreshTimelineViews() {
	if (timelineViewMode === 'week') {
		updateWeekView();
	}
	updateTimelineView();
	updateMobileDayIndicator();
}

export function setTimelineViewMode(mode) {
	timelineViewMode = mode;

	// Update button states
	const dayBtn = document.getElementById('timeline-view-day');
	const weekBtn = document.getElementById('timeline-view-week');
	const dayFilter = document.getElementById('timeline-day-filter');
	const dayView = document.getElementById('timeline-view');
	const weekView = document.getElementById('timeline-week-view');
	const editorLayout = document.querySelector('.schedule-editor-layout');

	if (mode === 'day') {
		if (dayBtn) {
			dayBtn.classList.remove('btn-secondary');
			dayBtn.classList.add('btn-primary');
		}
		if (weekBtn) {
			weekBtn.classList.remove('btn-primary');
			weekBtn.classList.add('btn-secondary');
		}
		if (dayFilter) dayFilter.style.display = 'block';
		if (dayView) dayView.classList.remove('hidden');
		if (weekView) weekView.classList.add('hidden');
		if (editorLayout) editorLayout.classList.remove('week-view-active');
		updateTimelineView();
	} else if (mode === 'week') {
		if (dayBtn) {
			dayBtn.classList.remove('btn-primary');
			dayBtn.classList.add('btn-secondary');
		}
		if (weekBtn) {
			weekBtn.classList.remove('btn-secondary');
			weekBtn.classList.add('btn-primary');
		}
		if (dayFilter) dayFilter.style.display = 'none';
		if (dayView) dayView.classList.add('hidden');
		if (weekView) weekView.classList.remove('hidden');
		if (editorLayout) editorLayout.classList.add('week-view-active');
		updateWeekView();
	}
}

export function updateWeekView() {
	const container = document.getElementById('timeline-week-view');
	const currentData = getCurrentData();

	if (!currentData || currentData.items.length === 0) {
		container.innerHTML = '<p class="empty-message">No items to display</p>';
		return;
	}

	// Week view only makes sense for default schedules and templates
	if (currentData.type !== 'default' && currentData.type !== 'template') {
		container.innerHTML = '<p class="empty-message">Week view is only available for default schedules and templates</p>';
		return;
	}

	const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
	const today = (new Date().getDay() + 6) % 7; // Convert Sunday=0 to Monday=0

	let weekHTML = '<div class="week-grid">';

	// Generate each day column
	for (let dayNum = 0; dayNum < 7; dayNum++) {
		const dayItems = currentData.items.filter(item =>
			item.enabled && item.days.includes(dayNum.toString())
		).sort((a, b) => {
			const aStart = a.startHour * 60 + a.startMin;
			const bStart = b.startHour * 60 + b.startMin;
			return aStart - bStart;
		});

		const isToday = dayNum === today;

		weekHTML += `
			<div class="week-day-column">
				<div class="week-day-header ${isToday ? 'today' : ''}">${days[dayNum]}</div>
				<div class="week-day-items">
		`;

		if (dayItems.length === 0) {
			weekHTML += '<p style="text-align: center; color: #999; font-size: 0.8em; margin-top: 20px;">No items</p>';
		} else {
			dayItems.forEach(item => {
				const startTime = `${String(item.startHour).padStart(2, '0')}:${String(item.startMin).padStart(2, '0')}`;
				const endTime = `${String(item.endHour).padStart(2, '0')}:${String(item.endMin).padStart(2, '0')}`;

				weekHTML += `
					<div class="week-item ${item.enabled ? '' : 'disabled'}"
					     data-index="${item.index}"
					     onclick="window.schedulesModule.selectScheduleItem(${item.index})"
					     title="${item.name} (${startTime} - ${endTime})">
						<div class="week-item-name">${item.name}</div>
						<div class="week-item-time">${startTime} - ${endTime}</div>
					</div>
				`;
			});
		}

		weekHTML += `
				</div>
			</div>
		`;
	}

	weekHTML += '</div>';
	container.innerHTML = weekHTML;
}

export function updateTimelineView() {
	const container = document.getElementById('timeline-view');
	const dayFilterSelect = document.getElementById('timeline-day-filter');
	const dateDisplay = document.getElementById('timeline-date-display');
	const currentData = getCurrentData();

	if (!currentData || currentData.items.length === 0) {
		container.innerHTML = '<p class="empty-message">No items to display</p>';
		return;
	}

	// Determine day filter based on schedule type
	let dayFilter;
	if (currentData.type !== 'default' && currentData.date) {
		// Date-specific schedule: show only for that date's day
		if (dayFilterSelect) {
			dayFilterSelect.style.display = 'none';
		}
		if (dateDisplay) {
			dateDisplay.style.display = 'block';
			dateDisplay.classList.remove('hidden');

			const scheduleDate = new Date(currentData.date + 'T00:00:00');
			const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
			const month = months[scheduleDate.getMonth()];
			const day = scheduleDate.getDate();
			const year = scheduleDate.getFullYear();
			dateDisplay.textContent = `${month} ${day}, ${year}`;
		}

		const scheduleDate = new Date(currentData.date + 'T00:00:00');
		dayFilter = (scheduleDate.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
	} else {
		// Default schedule: allow day selection
		if (dayFilterSelect) {
			dayFilterSelect.style.display = 'block';
		}
		if (dateDisplay) {
			dateDisplay.style.display = 'none';
			dateDisplay.classList.add('hidden');
		}
		dayFilter = parseInt(dayFilterSelect?.value || 0);
	}

	// Filter items for selected day
	const dayItems = currentData.items.filter(item =>
		item.enabled && item.days.includes(dayFilter.toString())
	);

	if (dayItems.length === 0) {
		container.innerHTML = '<p class="empty-message">No items for this day</p>';
		return;
	}

	// Sort by start time
	dayItems.sort((a, b) => {
		const aStart = a.startHour * 60 + a.startMin;
		const bStart = b.startHour * 60 + b.startMin;
		return aStart - bStart;
	});

	// Detect overlaps
	const overlaps = [];
	for (let i = 0; i < dayItems.length - 1; i++) {
		const current = dayItems[i];
		const next = dayItems[i + 1];

		const currentEnd = current.endHour * 60 + current.endMin;
		const nextStart = next.startHour * 60 + next.startMin;

		if (currentEnd > nextStart) {
			overlaps.push(current.index);
			overlaps.push(next.index);
		}
	}

	// Render timeline using card-based layout
	let timelineHTML = '';
	let currentMinute = 0;
	const dayEnd = 1440;

	dayItems.forEach((item) => {
		const startMinutes = item.startHour * 60 + item.startMin;
		const endMinutes = item.endHour * 60 + item.endMin;
		const duration = endMinutes - startMinutes;
		const hasOverlap = overlaps.includes(item.index);

		// Render gap before item
		if (startMinutes > currentMinute) {
			const gapDuration = startMinutes - currentMinute;
			const gapHours = Math.floor(gapDuration / 60);
			const gapMins = gapDuration % 60;
			const startHour = Math.floor(currentMinute / 60);
			const startMin = currentMinute % 60;
			const endHour = Math.floor(startMinutes / 60);
			const endMin = startMinutes % 60;

			let timeText = '';
			if (gapHours > 0 && gapMins > 0) {
				timeText = `${gapHours}h ${gapMins}m`;
			} else if (gapHours > 0) {
				timeText = `${gapHours}h`;
			} else {
				timeText = `${gapMins}m`;
			}

			timelineHTML += `
				<div class="timeline-gap">
					<div class="timeline-gap-content">
						<span class="gap-time">${String(startHour).padStart(2,'0')}:${String(startMin).padStart(2,'0')} - ${String(endHour).padStart(2,'0')}:${String(endMin).padStart(2,'0')}</span>
						<span class="gap-duration">${timeText} free</span>
					</div>
				</div>
			`;
		}

		// Calculate proportional height (15 min or less = gap height of 30px, then scale at 2px/min)
		const minHeight = 30; // Same as gap blocks
		const pixelsPerMinute = 2; // 2px per minute gives proper proportions
		const itemHeight = Math.max(minHeight, duration * pixelsPerMinute);

		// Render schedule item
		const startTime = `${String(item.startHour).padStart(2, '0')}:${String(item.startMin).padStart(2, '0')}`;
		const endTime = `${String(item.endHour).padStart(2, '0')}:${String(item.endMin).padStart(2, '0')}`;

		timelineHTML += `
			<div class="timeline-item ${hasOverlap ? 'overlap' : ''}"
				 style="height: ${itemHeight}px;"
				 data-index="${item.index}"
				 onclick="window.schedulesModule.selectScheduleItem(${item.index})">
				<div class="timeline-item-content">
					<span class="timeline-item-time">${startTime}-${endTime}</span>
					<span class="timeline-item-name">${item.name}</span>
					<span class="timeline-item-duration">(${duration} min)</span>
				</div>
				${hasOverlap ? '<div class="overlap-warning">⚠️ Overlap</div>' : ''}
			</div>
		`;

		currentMinute = endMinutes;
	});

	// Render final gap
	if (currentMinute < dayEnd) {
		const gapDuration = dayEnd - currentMinute;
		const gapHours = Math.floor(gapDuration / 60);
		const gapMins = gapDuration % 60;
		const startHour = Math.floor(currentMinute / 60);
		const startMin = currentMinute % 60;

		let timeText = '';
		if (gapHours > 0 && gapMins > 0) {
			timeText = `${gapHours}h ${gapMins}m`;
		} else if (gapHours > 0) {
			timeText = `${gapHours}h`;
		} else {
			timeText = `${gapMins}m`;
		}

		timelineHTML += `
			<div class="timeline-gap">
				<div class="timeline-gap-content">
					<span class="gap-time">${String(startHour).padStart(2,'0')}:${String(startMin).padStart(2,'0')} - 24:00</span>
					<span class="gap-duration">${timeText} free</span>
				</div>
			</div>
		`;
	}

	// Render container
	container.innerHTML = `
		<div class="timeline-container">
			${timelineHTML}
		</div>
	`;

	// Update mobile day indicator
	updateMobileDayIndicator();
}

export async function selectScheduleItem(index) {
	document.getElementById('preview-item-select').value = index;
	// Preview will be handled by preview.js module
	if (window.schedulesModule && window.schedulesModule.updateSchedulePreview) {
		await window.schedulesModule.updateSchedulePreview();
	}
	// Show and populate edit panel
	showEditPanel(index);
}

export function showEditPanel(index) {
	const editPanel = document.getElementById('timeline-edit-panel');
	const currentData = getCurrentData();
	if (!editPanel || !currentData) return;

	const item = currentData.items[index];
	if (!item) return;

	// Store current editing index
	editPanel.dataset.editingIndex = index;

	// Highlight selected timeline item
	const timelineItems = document.querySelectorAll('.timeline-item');
	timelineItems.forEach((timelineItem) => {
		const itemIndex = parseInt(timelineItem.dataset.index);
		if (itemIndex === index) {
			timelineItem.classList.add('selected');
		} else {
			timelineItem.classList.remove('selected');
		}
	});

	// Populate form fields
	document.getElementById('edit-item-name').value = item.name || '';
	document.getElementById('edit-item-enabled').checked = item.enabled !== false;
	document.getElementById('edit-item-progressbar').checked = item.progressBar || false;

	// Populate time fields
	document.getElementById('edit-start-hour').value = item.startHour || 0;
	document.getElementById('edit-start-min').value = item.startMin || 0;
	document.getElementById('edit-end-hour').value = item.endHour || 0;
	document.getElementById('edit-end-min').value = item.endMin || 0;

	// Handle days checkboxes (only for default schedules)
	const daysGroup = document.getElementById('edit-days-group');
	const isDefaultSchedule = !currentData.date;

	if (isDefaultSchedule) {
		daysGroup.style.display = 'flex';
		// Clear all checkboxes and update label classes
		for (let i = 0; i < 7; i++) {
			const checkbox = document.getElementById(`edit-day-${i}`);
			if (checkbox) {
				const isChecked = item.days && item.days.includes(i.toString());
				checkbox.checked = isChecked;
				// Toggle checked class on the label
				const label = checkbox.parentElement;
				if (label) {
					label.classList.toggle('checked', isChecked);
				}
			}
		}
	} else {
		daysGroup.style.display = 'none';
	}

	// Populate image dropdown with available images and select current
	populateImageDropdown(item.image);

	// Show the panel
	editPanel.classList.remove('hidden');
}

function populateImageDropdown(currentImage) {
	const imageSelect = document.getElementById('edit-item-image');
	if (!imageSelect) return;

	// Get images from window.schedulesModule if available
	if (window.schedulesModule && window.schedulesModule.availableImages) {
		const images = window.schedulesModule.availableImages;
		imageSelect.innerHTML = '<option value="">Select image...</option>';
		images.forEach(img => {
			const option = document.createElement('option');
			option.value = img.name;
			option.textContent = img.name;
			if (img.name === currentImage) {
				option.selected = true;
			}
			imageSelect.appendChild(option);
		});
	}
}

// Live update functions for edit panel
export function liveUpdateItem(property, value) {
	const editPanel = document.getElementById('timeline-edit-panel');
	const currentData = getCurrentData();
	if (!editPanel || !currentData) return;

	const index = parseInt(editPanel.dataset.editingIndex);
	const item = currentData.items[index];
	if (!item) return;

	// Update the property
	item[property] = value;

	// Refresh timeline views
	refreshTimelineViews();

	// Update schedule editor if available
	if (window.schedulesModule && window.schedulesModule.renderScheduleEditor) {
		window.schedulesModule.renderScheduleEditor();
	}

	// Update preview
	if (window.schedulesModule && window.schedulesModule.updateSchedulePreview) {
		window.schedulesModule.updateSchedulePreview();
	}
}

export function liveUpdateDays() {
	const editPanel = document.getElementById('timeline-edit-panel');
	const currentData = getCurrentData();
	if (!editPanel || !currentData) return;

	const index = parseInt(editPanel.dataset.editingIndex);
	const item = currentData.items[index];
	if (!item) return;

	// Update days if default schedule
	const isDefaultSchedule = !currentData.date;
	if (isDefaultSchedule) {
		const selectedDays = [];
		for (let i = 0; i < 7; i++) {
			const checkbox = document.getElementById(`edit-day-${i}`);
			if (checkbox) {
				// Update label checked class
				const label = checkbox.parentElement;
				if (label) {
					label.classList.toggle('checked', checkbox.checked);
				}
				// Add to selected days if checked
				if (checkbox.checked) {
					selectedDays.push(i.toString());
				}
			}
		}
		// Store days as a string (not array) to match CSV format
		item.days = selectedDays.join('');
	}

	// Refresh timeline views
	refreshTimelineViews();

	// Update schedule editor if available
	if (window.schedulesModule && window.schedulesModule.renderScheduleEditor) {
		window.schedulesModule.renderScheduleEditor();
	}

	// Update preview
	if (window.schedulesModule && window.schedulesModule.updateSchedulePreview) {
		window.schedulesModule.updateSchedulePreview();
	}
}

export function deleteScheduleItemFromPanel() {
	const editPanel = document.getElementById('timeline-edit-panel');
	const currentData = getCurrentData();
	if (!editPanel || !currentData) return;

	const index = parseInt(editPanel.dataset.editingIndex);

	// Hide edit panel first
	editPanel.classList.add('hidden');

	// Delete the item
	if (window.schedulesModule && window.schedulesModule.deleteScheduleItem) {
		window.schedulesModule.deleteScheduleItem(index);
	}
}

// Mobile day indicator functions
export function updateMobileDayIndicator() {
	const indicator = document.getElementById('mobile-day-indicator');
	if (!indicator) return;

	const currentData = getCurrentData();
	if (!currentData || !currentData.items) return;

	// Count items per day
	const dayHasItems = new Array(7).fill(false);
	currentData.items.forEach(item => {
		if (item.enabled && item.days) {
			for (let i = 0; i < item.days.length; i++) {
				const dayNum = parseInt(item.days[i]);
				if (dayNum >= 0 && dayNum < 7) {
					dayHasItems[dayNum] = true;
				}
			}
		}
	});

	// Update UI
	const dayItems = indicator.querySelectorAll('.mobile-day-item');
	const selectedDay = parseInt(document.getElementById('timeline-day-filter')?.value || '0');

	dayItems.forEach((item, index) => {
		// Add/remove has-items class
		if (dayHasItems[index]) {
			item.classList.add('has-items');
		} else {
			item.classList.remove('has-items');
		}

		// Add/remove selected class
		if (index === selectedDay) {
			item.classList.add('selected');
		} else {
			item.classList.remove('selected');
		}

		// Add click handler
		item.onclick = () => {
			const dayFilter = document.getElementById('timeline-day-filter');
			if (dayFilter) {
				dayFilter.value = index.toString();
				updateTimelineView();
			}
		};
	});
}

// Mobile edit panel functions
export function populateMobileEditPanel(index) {
	const mobileEditPanel = document.getElementById('mobile-edit-panel');
	const currentData = getCurrentData();
	if (!mobileEditPanel || !currentData) return;

	const item = currentData.items[index];
	if (!item) return;

	// Store current editing index
	mobileEditPanel.dataset.editingIndex = index;

	// Populate form fields
	document.getElementById('mobile-edit-item-name').value = item.name || '';
	document.getElementById('mobile-edit-item-enabled').checked = item.enabled !== false;
	document.getElementById('mobile-edit-item-progressbar').checked = item.progressBar || false;

	// Populate time fields
	document.getElementById('mobile-edit-start-hour').value = item.startHour || 0;
	document.getElementById('mobile-edit-start-min').value = item.startMin || 0;
	document.getElementById('mobile-edit-end-hour').value = item.endHour || 0;
	document.getElementById('mobile-edit-end-min').value = item.endMin || 0;

	// Handle days checkboxes (only for default schedules)
	const daysGroup = document.getElementById('mobile-edit-days-group');
	const isDefaultSchedule = !currentData.date;

	if (isDefaultSchedule) {
		daysGroup.style.display = 'block';
		// Clear all checkboxes and update label classes
		for (let i = 0; i < 7; i++) {
			const checkbox = document.getElementById(`mobile-edit-day-${i}`);
			if (checkbox) {
				const isChecked = item.days && item.days.includes(i.toString());
				checkbox.checked = isChecked;
				// Toggle checked class on the label
				const label = checkbox.parentElement;
				if (label) {
					label.classList.toggle('checked', isChecked);
				}
			}
		}
	} else {
		daysGroup.style.display = 'none';
	}

	// Populate image dropdown with available images and select current
	populateMobileImageDropdown(item.image);

	// Show the panel
	mobileEditPanel.style.display = 'block';
}

function populateMobileImageDropdown(currentImage) {
	const imageSelect = document.getElementById('mobile-edit-item-image');
	if (!imageSelect) return;

	// Get images from window.schedulesModule if available
	if (window.schedulesModule && window.schedulesModule.availableImages) {
		const images = window.schedulesModule.availableImages;
		imageSelect.innerHTML = '<option value="">Select image...</option>';
		images.forEach(img => {
			const option = document.createElement('option');
			option.value = img.name;
			option.textContent = img.name;
			if (img.name === currentImage) {
				option.selected = true;
			}
			imageSelect.appendChild(option);
		});
	}
}

// Live update functions for mobile edit panel
export function liveUpdateItemMobile(property, value) {
	const mobileEditPanel = document.getElementById('mobile-edit-panel');
	const currentData = getCurrentData();
	if (!mobileEditPanel || !currentData) return;

	const index = parseInt(mobileEditPanel.dataset.editingIndex);
	const item = currentData.items[index];
	if (!item) return;

	// Update the property
	item[property] = value;

	// Refresh timeline views
	refreshTimelineViews();

	// Update schedule editor if available
	if (window.schedulesModule && window.schedulesModule.renderScheduleEditor) {
		window.schedulesModule.renderScheduleEditor();
	}

	// Update preview
	if (window.schedulesModule && window.schedulesModule.updateSchedulePreview) {
		window.schedulesModule.updateSchedulePreview();
	}
}

export function liveUpdateDaysMobile() {
	const mobileEditPanel = document.getElementById('mobile-edit-panel');
	const currentData = getCurrentData();
	if (!mobileEditPanel || !currentData) return;

	const index = parseInt(mobileEditPanel.dataset.editingIndex);
	const item = currentData.items[index];
	if (!item) return;

	// Update days if default schedule
	const isDefaultSchedule = !currentData.date;
	if (isDefaultSchedule) {
		const selectedDays = [];
		for (let i = 0; i < 7; i++) {
			const checkbox = document.getElementById(`mobile-edit-day-${i}`);
			if (checkbox) {
				// Update label checked class
				const label = checkbox.parentElement;
				if (label) {
					label.classList.toggle('checked', checkbox.checked);
				}
				// Add to selected days if checked
				if (checkbox.checked) {
					selectedDays.push(i.toString());
				}
			}
		}
		// Store days as a string (not array) to match CSV format
		item.days = selectedDays.join('');
	}

	// Refresh timeline views
	refreshTimelineViews();

	// Update schedule editor if available
	if (window.schedulesModule && window.schedulesModule.renderScheduleEditor) {
		window.schedulesModule.renderScheduleEditor();
	}

	// Update preview
	if (window.schedulesModule && window.schedulesModule.updateSchedulePreview) {
		window.schedulesModule.updateSchedulePreview();
	}
}

export function deleteScheduleItemFromPanelMobile() {
	const mobileEditPanel = document.getElementById('mobile-edit-panel');
	const currentData = getCurrentData();
	if (!mobileEditPanel || !currentData) return;

	const index = parseInt(mobileEditPanel.dataset.editingIndex);

	// Hide edit panel first
	mobileEditPanel.style.display = 'none';

	// Delete the item
	if (window.schedulesModule && window.schedulesModule.deleteScheduleItem) {
		window.schedulesModule.deleteScheduleItem(index);
	}
}
