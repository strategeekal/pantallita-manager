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

	// Update edit panel when dropdown changes
	if (window.schedulesModule?.showEditPanel && itemIndex !== '') {
		window.schedulesModule.showEditPanel(parseInt(itemIndex));
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

	const SCHEDULE_IMAGE_X = 23;
	const SCHEDULE_IMAGE_Y = 2;

	// Load and render image if specified
	if (item.image && window.loadScheduleBMPImage) {
		try {
			const imageData = await window.loadScheduleBMPImage(item.image);
			if (imageData && imageData.pixels) {
				// Draw the image pixels on the matrix (40x28 at x=23, y=2)
				const pixels = imageData.pixels;
				for (let y = 0; y < pixels.length && y < 28; y++) {
					for (let x = 0; x < pixels[y].length && x < 40; x++) {
						const color = pixels[y][x];
						if (color && color !== 'transparent') {
							scheduleMatrix.setPixel(SCHEDULE_IMAGE_X + x, SCHEDULE_IMAGE_Y + y, color);
						}
					}
				}
			}
		} catch (error) {
			console.error('Error loading schedule image:', error);
		}
	}

	// Draw progress bar if enabled (below the image)
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

		drawProgressBar(scheduleMatrix, progressPercent, SCHEDULE_IMAGE_X, 30);
	}

	// Render the matrix
	scheduleMatrix.render();
}

function drawProgressBar(matrix, progressPercent, x, y) {
	const MINT = '#00FFAA';
	const LILAC = '#AA00FF';
	const WHITE = '#FFFFFF';
	const barWidth = 40;
	const filledWidth = Math.floor((progressPercent / 100) * barWidth);

	// Draw mint background (full bar)
	for (let i = 0; i < barWidth; i++) {
		matrix.setPixel(x + i, y, MINT);
		matrix.setPixel(x + i, y + 1, MINT);
	}

	// Draw lilac progress (filled portion)
	for (let i = 0; i < filledWidth; i++) {
		matrix.setPixel(x + i, y, LILAC);
		matrix.setPixel(x + i, y + 1, LILAC);
	}

	// Draw white markers at 0%, 25%, 50%, 75%, 100%
	const markers = [0, 10, 20, 30, 39]; // 0%, 25%, 50%, 75%, 100% of 40 pixels
	markers.forEach(markerX => {
		matrix.setPixel(x + markerX, y, WHITE);
		matrix.setPixel(x + markerX, y + 1, WHITE);
	});
}
