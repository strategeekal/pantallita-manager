// Timeline Module - Render schedule timeline view with gaps and overlap detection
import { currentScheduleData } from './schedule-editor.js';

let timelineViewMode = 'day'; // 'day' or 'week'

// Helper function to update both views
export function refreshTimelineViews() {
	if (timelineViewMode === 'week') {
		updateWeekView();
	}
	updateTimelineView();
}

export function setTimelineViewMode(mode) {
	timelineViewMode = mode;

	// Update button states
	const dayBtn = document.getElementById('timeline-view-day');
	const weekBtn = document.getElementById('timeline-view-week');
	const dayFilter = document.getElementById('timeline-day-filter');
	const dayView = document.getElementById('timeline-view');
	const weekView = document.getElementById('timeline-week-view');

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
		updateWeekView();
	}
}

export function updateWeekView() {
	const container = document.getElementById('timeline-week-view');

	if (!currentScheduleData || currentScheduleData.items.length === 0) {
		container.innerHTML = '<p class="empty-message">No items to display</p>';
		return;
	}

	// Week view only makes sense for default schedules
	if (currentScheduleData.type !== 'default') {
		container.innerHTML = '<p class="empty-message">Week view is only available for default schedules</p>';
		return;
	}

	const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
	const today = (new Date().getDay() + 6) % 7; // Convert Sunday=0 to Monday=0

	let weekHTML = '<div class="week-grid">';

	// Generate each day column
	for (let dayNum = 0; dayNum < 7; dayNum++) {
		const dayItems = currentScheduleData.items.filter(item =>
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

	if (!currentScheduleData || currentScheduleData.items.length === 0) {
		container.innerHTML = '<p class="empty-message">No items to display</p>';
		return;
	}

	// Determine day filter based on schedule type
	let dayFilter;
	if (currentScheduleData.type !== 'default' && currentScheduleData.date) {
		// Date-specific schedule: show only for that date's day
		if (dayFilterSelect) {
			dayFilterSelect.style.display = 'none';
		}
		if (dateDisplay) {
			dateDisplay.style.display = 'block';
			dateDisplay.classList.remove('hidden');

			const scheduleDate = new Date(currentScheduleData.date + 'T00:00:00');
			const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
			const month = months[scheduleDate.getMonth()];
			const day = scheduleDate.getDate();
			const year = scheduleDate.getFullYear();
			dateDisplay.textContent = `${month} ${day}, ${year}`;
		}

		const scheduleDate = new Date(currentScheduleData.date + 'T00:00:00');
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
	const dayItems = currentScheduleData.items.filter(item =>
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
				 style="min-height: ${itemHeight}px;"
				 onclick="window.schedulesModule.selectScheduleItem(${item.index})">
				<div class="timeline-item-header">${item.name}</div>
				<div class="timeline-item-time">${startTime} - ${endTime} (${duration} min)</div>
				${hasOverlap ? '<div class="overlap-warning">⚠️ Time Overlap Detected</div>' : ''}
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
}

export async function selectScheduleItem(index) {
	document.getElementById('preview-item-select').value = index;
	// Preview will be handled by preview.js module
	if (window.schedulesModule && window.schedulesModule.updateSchedulePreview) {
		await window.schedulesModule.updateSchedulePreview();
	}
}
