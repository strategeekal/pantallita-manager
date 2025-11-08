// Schedule Preview Module - Preview schedule items on matrix (desktop only)
import { isMobileDevice } from '../core/utils.js';

// Get schedule data and matrix from editor module
function getScheduleData() {
	return window.schedulesModule?.currentScheduleData || null;
}

function getScheduleMatrix() {
	return window.scheduleMatrix || null;
}

function setScheduleMatrix(matrix) {
	window.scheduleMatrix = matrix;
}

export async function selectScheduleItem(index) {
	document.getElementById('preview-item-select').value = index;
	await updateSchedulePreview();
}

export async function updateSchedulePreview() {
	// Skip preview on mobile to save performance
	if (isMobileDevice()) {
		return;
	}

	const currentScheduleData = getScheduleData();
	const itemIndex = document.getElementById('preview-item-select')?.value;

	if (!currentScheduleData || itemIndex === '' || !currentScheduleData.items[itemIndex]) {
		return;
	}

	const item = currentScheduleData.items[itemIndex];

	// Create or get schedule matrix emulator (desktop only)
	let scheduleMatrix = getScheduleMatrix();
	if (!scheduleMatrix) {
		const container = document.getElementById('matrix-container-schedule');
		if (container && window.MatrixEmulator) {
			scheduleMatrix = new window.MatrixEmulator('matrix-container-schedule', 64, 32, 6);
			setScheduleMatrix(scheduleMatrix);
		}
	}

	if (!scheduleMatrix) return;

	// Clear matrix
	scheduleMatrix.clear();

	// Load and render image if specified
	if (item.image && window.loadScheduleBMPImage) {
		try {
			const imageData = await window.loadScheduleBMPImage(item.image);
			if (imageData && imageData.pixels) {
				// Draw the image pixels on the matrix
				const pixels = imageData.pixels;
				for (let y = 0; y < pixels.length && y < 32; y++) {
					for (let x = 0; x < pixels[y].length && x < 64; x++) {
						const color = pixels[y][x];
						if (color && color !== 'transparent') {
							scheduleMatrix.setPixel(x, y, color);
						}
					}
				}
			}
		} catch (error) {
			console.error('Error loading schedule image:', error);
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

	// Render the matrix
	scheduleMatrix.render();
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
