// Schedule Preview Module - Preview schedule items on matrix (desktop only)
import { currentScheduleData, scheduleMatrix } from './schedule-editor.js';
import { isMobileDevice } from '../core/utils.js';

export async function selectScheduleItem(index) {
	document.getElementById('preview-item-select').value = index;
	await updateSchedulePreview();
}

export async function updateSchedulePreview() {
	// Skip preview on mobile to save performance
	if (isMobileDevice()) {
		return;
	}

	const itemIndex = document.getElementById('preview-item-select').value;

	if (!currentScheduleData || itemIndex === '' || !currentScheduleData.items[itemIndex]) {
		return;
	}

	const item = currentScheduleData.items[itemIndex];

	// Create or get schedule matrix emulator (desktop only)
	if (!scheduleMatrix) {
		const container = document.getElementById('matrix-container-schedule');
		if (container && window.MatrixEmulator) {
			scheduleMatrix = new window.MatrixEmulator('matrix-container-schedule', 64, 32, 6);
		}
	}

	if (!scheduleMatrix) return;

	// Clear matrix
	scheduleMatrix.clear();

	// Load and render image if specified
	if (item.image) {
		try {
			const imageData = await window.loadScheduleBMPImage(item.image);
			if (imageData) {
				// Render image (placeholder - actual rendering would be in app.js)
				// This would call scheduleMatrix.setPixel for each pixel
			}
		} catch (error) {
			console.error('Error loading image:', error);
		}
	}

	// Draw progress bar if enabled
	if (item.progressBar) {
		const now = new Date();
		const startTime = new Date();
		startTime.setHours(item.startHour, item.startMin, 0);
		const endTime = new Date();
		endTime.setHours(item.endHour, item.endMin, 0);

		let progressPercent = 74; // Default to 74%

		if (now >= startTime && now <= endTime) {
			const total = endTime - startTime;
			const elapsed = now - startTime;
			progressPercent = Math.floor((elapsed / total) * 100);
		} else if (now > endTime) {
			progressPercent = 100;
		} else {
			progressPercent = 0;
		}

		drawProgressBar(scheduleMatrix, progressPercent, 0, 29);
	}
}

function drawProgressBar(matrix, progressPercent, x, y) {
	const WHITE = '#FFFFFF';
	const barWidth = 64;
	const filledWidth = Math.floor((progressPercent / 100) * barWidth);

	// Draw filled portion
	for (let i = 0; i < filledWidth; i++) {
		matrix.setPixel(x + i, y, WHITE);
		matrix.setPixel(x + i, y + 1, WHITE);
		matrix.setPixel(x + i, y + 2, WHITE);
	}
}
