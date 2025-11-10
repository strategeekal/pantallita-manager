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
	const SCHEDULE_IMAGE_Y = 1;
	const TIME_X = 2;
	const TIME_Y = 1;

	// Calculate midpoint time of schedule item
	const startMinutes = item.startHour * 60 + item.startMin;
	const endMinutes = item.endHour * 60 + item.endMin;
	const midMinutes = Math.floor((startMinutes + endMinutes) / 2);
	const midHour = Math.floor(midMinutes / 60);
	const midMin = midMinutes % 60;
	const timeString = `${String(midHour)}:${String(midMin).padStart(2, '0')}`;

	// Draw time at top left
	if (window.TINYBIT_FONT) {
		scheduleMatrix.drawTextWithFont(timeString, TIME_X, TIME_Y, '#FFFFFF', window.TINYBIT_FONT);
	}

	// Load and render weather column (moved right 3 units)
	const WEATHER_X = 3;
	const WEATHER_Y = 9; // Time (y=2) + font height (5) + 3px margin
	if (window.loadWeatherColumnImage) {
		try {
			const weatherData = await window.loadWeatherColumnImage('1.bmp');
			if (weatherData && weatherData.pixels) {
				const pixels = weatherData.pixels;
				for (let y = 0; y < pixels.length; y++) {
					for (let x = 0; x < pixels[y].length; x++) {
						const color = pixels[y][x];
						if (color && color !== 'transparent') {
							scheduleMatrix.setPixel(WEATHER_X + x, WEATHER_Y + y, color);
						}
					}
				}
			}
		} catch (error) {
			console.error('Error loading weather column:', error);
		}
	}

	// Draw temperature (moved down 2 units from previous)
	const TEMP_Y = 25;
	if (window.TINYBIT_FONT) {
		// Draw "18" first
		scheduleMatrix.drawTextWithFont('18', TIME_X, TEMP_Y, '#FFFFFF', window.TINYBIT_FONT);

		// Calculate width of "18" to position degree symbol
		// Each character in TINYBIT_FONT is 3 pixels wide + 1 pixel spacing
		const numberWidth = (3 * 2) + 1; // Two digits: 3px each + 1px spacing = 7px

		// Draw degree symbol aligned with top of the "8" (1 pixel up from baseline, 1 unit right)
		scheduleMatrix.drawTextWithFont('°', TIME_X + numberWidth + 1, TEMP_Y - 3, '#FFFFFF', window.TINYBIT_FONT);
	}

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

	// Draw progress bar if enabled (below the image) - always at 50%
	if (item.progressBar) {
		drawProgressBar(scheduleMatrix, 50, SCHEDULE_IMAGE_X, 29);
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
	const extendedMarkers = [0, 20, 39]; // First, middle, last markers get extra pixels

	markers.forEach(markerX => {
		matrix.setPixel(x + markerX, y, WHITE);
		matrix.setPixel(x + markerX, y + 1, WHITE);

		// Add pixels above and below for first, middle, and last markers
		if (extendedMarkers.includes(markerX)) {
			matrix.setPixel(x + markerX, y - 1, WHITE); // Above
			matrix.setPixel(x + markerX, y + 2, WHITE); // Below
		}
	});
}
