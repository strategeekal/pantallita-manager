// Timeline Module - Render schedule timeline view with gaps and overlap detection
import { currentScheduleData } from './schedule-editor.js';

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

	// Calculate total schedule duration
	let totalScheduleMinutes = 0;
	dayItems.forEach(item => {
		const startMinutes = item.startHour * 60 + item.startMin;
		const endMinutes = item.endHour * 60 + item.endMin;
		totalScheduleMinutes += (endMinutes - startMinutes);
	});

	// Count gaps
	const dayStart = 0;
	const dayEnd = 1440;
	let gapCount = 0;
	let currentMinute = 0;
	dayItems.forEach(item => {
		const startMinutes = item.startHour * 60 + item.startMin;
		if (startMinutes > currentMinute) {
			gapCount++;
		}
		currentMinute = item.endHour * 60 + item.endMin;
	});
	if (currentMinute < dayEnd) {
		gapCount++;
	}

	// Calculate heights
	const GAP_HEIGHT = 25; // Fixed gap height
	const totalGapHeight = gapCount * GAP_HEIGHT;
	const AVAILABLE_HEIGHT = Math.max(500, totalScheduleMinutes * 2.5);
	const pixelsPerScheduleMinute = AVAILABLE_HEIGHT / totalScheduleMinutes;
	const containerHeight = AVAILABLE_HEIGHT + totalGapHeight + 40;

	// Render timeline
	let timelineHTML = '';
	currentMinute = 0;
	let currentTopOffset = 20;

	dayItems.forEach((item, idx) => {
		const startMinutes = item.startHour * 60 + item.startMin;
		const endMinutes = item.endHour * 60 + item.endMin;

		// Declare variables needed for rendering
		const hasOverlap = overlaps.includes(item.index);
		const duration = endMinutes - startMinutes;
		const MIN_ITEM_HEIGHT = 40;
		const calculatedHeight = duration * pixelsPerScheduleMinute;
		const itemHeight = Math.max(MIN_ITEM_HEIGHT, calculatedHeight);

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
				<div class="timeline-gap"
					 style="top: ${currentTopOffset}px; height: ${GAP_HEIGHT}px;">
					<div class="timeline-gap-content">
						<span class="gap-time">${String(startHour).padStart(2,'0')}:${String(startMin).padStart(2,'0')} - ${String(endHour).padStart(2,'0')}:${String(endMin).padStart(2,'0')}</span>
						<span class="gap-duration">${timeText} free</span>
					</div>
				</div>
			`;

			currentTopOffset += GAP_HEIGHT;
		}

		// Render schedule item
		timelineHTML += `
			<div class="timeline-item ${hasOverlap ? 'overlap' : ''}"
				 style="top: ${currentTopOffset}px; height: ${itemHeight}px;"
				 onclick="window.schedulesModule.selectScheduleItem(${item.index})">
				<div class="timeline-item-content">
					<span class="timeline-text">${String(item.startHour).padStart(2,'0')}:${String(item.startMin).padStart(2,'0')} - ${String(item.endHour).padStart(2,'0')}:${String(item.endMin).padStart(2,'0')} ${item.name}</span>
					${hasOverlap ? '<span class="overlap-warning">⚠️ Overlap</span>' : ''}
				</div>
			</div>
		`;

		currentTopOffset += itemHeight;
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
			<div class="timeline-gap"
				 style="top: ${currentTopOffset}px; height: ${GAP_HEIGHT}px;">
				<div class="timeline-gap-content">
					<span class="gap-time">${String(startHour).padStart(2,'0')}:${String(startMin).padStart(2,'0')} - 24:00</span>
					<span class="gap-duration">${timeText} free</span>
				</div>
			</div>
		`;
	}

	// Render container
	container.innerHTML = `
		<div class="timeline-container" style="height: ${containerHeight}px;">
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
