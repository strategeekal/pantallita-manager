// Rendering Utilities Module - Image loading and event rendering
import { loadConfig } from '../core/config.js';
import { COLOR_MAP, SIMPLE_ICONS } from './matrix-emulator.js';

let availableImages = [];
let imageCache = {};

export { availableImages };

// Load list of available images from GitHub
export async function loadAvailableImages() {
	const config = loadConfig();

	if (!config.token || !config.owner || !config.repo) {
		console.log('GitHub not configured - using placeholder icons');
		return;
	}

	try {
		const response = await fetch(
			`https://api.github.com/repos/${config.owner}/${config.repo}/contents/img/events`,
			{
				headers: {
					'Authorization': `Bearer ${config.token}`,
					'Accept': 'application/vnd.github.v3+json'
				}
			}
		);

		if (!response.ok) {
			console.error('Failed to load images:', response.status);
			return;
		}

		const files = await response.json();
		availableImages = files
			.filter(f => f.name.endsWith('.bmp'))
			.map(f => ({
				name: f.name,
				url: f.download_url,
				sha: f.sha
			}));

		console.log(`Loaded ${availableImages.length} images from GitHub`);

		// Populate image dropdowns
		populateImageDropdowns();

	} catch (error) {
		console.error('Error loading images:', error);
	}
}

function populateImageDropdowns() {
	const imageSelect = document.getElementById('editor-event-image');
	if (imageSelect && availableImages.length > 0) {
		imageSelect.innerHTML = '<option value="">Select an image...</option>';
		availableImages.forEach(img => {
			const option = document.createElement('option');
			option.value = img.name;
			option.textContent = img.name;
			imageSelect.appendChild(option);
		});
	}
}

// Load and parse BMP image from GitHub (simplified for 8-bit only)
export async function loadBMPImage(imageName) {
	const config = loadConfig();

	console.log('Loading event image:', imageName);

	// Check cache first
	if (imageCache[imageName]) {
		console.log('Using cached image:', imageName);
		return imageCache[imageName];
	}

	// Clear cache if it gets too large (memory management for mobile)
	if (Object.keys(imageCache).length > 20) {
		console.log('Clearing image cache to free memory');
		imageCache = {};
	}

	// Find image info
	const imageInfo = availableImages.find(img => img.name === imageName);
	if (!imageInfo) {
		console.error('Image not found in availableImages:', imageName);
		return null;
	}

	console.log('Fetching from URL:', imageInfo.url);

	return await fetchAndParseBMP(imageInfo.url, imageName);
}

// Load schedule BMP image from img/schedules
export async function loadScheduleBMPImage(imageName) {
	const config = loadConfig();

	console.log('Loading schedule image:', imageName);

	// Check cache first
	const cacheKey = 'schedule_' + imageName;
	if (imageCache[cacheKey]) {
		console.log('Using cached schedule image:', imageName);
		return imageCache[cacheKey];
	}

	// Clear cache if it gets too large
	if (Object.keys(imageCache).length > 20) {
		console.log('Clearing image cache to free memory');
		imageCache = {};
	}

	try {
		const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/img/schedules/${imageName}`;
		const response = await fetch(url, {
			headers: {
				'Authorization': `Bearer ${config.token}`,
				'Accept': 'application/vnd.github.v3+json'
			}
		});

		if (!response.ok) {
			console.error('Failed to fetch schedule image metadata:', response.status);
			return null;
		}

		const data = await response.json();
		const downloadUrl = data.download_url;

		const result = await fetchAndParseBMP(downloadUrl, cacheKey);
		return result;

	} catch (error) {
		console.error('Error loading schedule BMP:', error);
		return null;
	}
}

async function fetchAndParseBMP(url, cacheKey) {
	try {
		const response = await fetch(url);

		if (!response.ok) {
			console.error('Fetch failed:', response.status, response.statusText);
			return null;
		}

		const arrayBuffer = await response.arrayBuffer();
		console.log('Downloaded', arrayBuffer.byteLength, 'bytes');

		const dataView = new DataView(arrayBuffer);

		// Parse BMP header
		const signature = String.fromCharCode(dataView.getUint8(0)) + String.fromCharCode(dataView.getUint8(1));

		if (signature !== 'BM') {
			console.error('Not a valid BMP file! Signature:', signature);
			return null;
		}

		const dataOffset = dataView.getUint32(10, true);
		const width = dataView.getInt32(18, true);
		const height = Math.abs(dataView.getInt32(22, true));
		const bitsPerPixel = dataView.getUint16(28, true);

		console.log('BMP Info:', {
			cacheKey,
			width,
			height,
			bitsPerPixel,
			dataOffset
		});

		// Only handle 8-bit BMPs
		if (bitsPerPixel !== 8) {
			console.error('Only 8-bit BMPs supported! Got:', bitsPerPixel);
			return null;
		}

		// Parse color palette for 8-bit BMPs
		const paletteSize = dataView.getUint32(46, true) || 256;
		console.log('Reading', paletteSize, 'color palette entries');

		let palette = [];
		for (let i = 0; i < paletteSize; i++) {
			const paletteIndex = 54 + (i * 4);
			const b = dataView.getUint8(paletteIndex);
			const g = dataView.getUint8(paletteIndex + 1);
			const r = dataView.getUint8(paletteIndex + 2);
			palette.push({ r, g, b });
		}

		// Create 2D array for pixels
		const pixels = Array(height).fill(null).map(() => Array(width).fill('transparent'));

		let pixelsSet = 0;

		for (let row = 0; row < height; row++) {
			for (let col = 0; col < width; col++) {
				// BMPs are stored bottom-to-top
				const bmpRow = (height - 1 - row);

				// 8-bit indexed color
				const rowSize = Math.floor((width * 8 + 31) / 32) * 4;
				const pixelIndex = dataOffset + (bmpRow * rowSize) + col;

				const colorIndex = dataView.getUint8(pixelIndex);

				let r, g, b;
				if (colorIndex < palette.length) {
					r = palette[colorIndex].r;
					g = palette[colorIndex].g;
					b = palette[colorIndex].b;
				} else {
					console.warn('Color index out of range:', colorIndex);
					r = g = b = 0;
				}

				// Check if pixel is black (treat as transparent)
				if (r < 10 && g < 10 && b < 10) {
					pixels[row][col] = 'transparent';
				} else {
					pixels[row][col] = `rgb(${r},${g},${b})`;
					pixelsSet++;
				}
			}
		}

		console.log('Pixels set:', pixelsSet, 'out of', width * height);

		// Create canvas for mobile preview
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		const ctx = canvas.getContext('2d');

		// Draw pixels to canvas
		for (let row = 0; row < height; row++) {
			for (let col = 0; col < width; col++) {
				const color = pixels[row][col];
				if (color !== 'transparent') {
					ctx.fillStyle = color;
					ctx.fillRect(col, row, 1, 1);
				}
			}
		}

		// Scale up for visibility
		canvas.style.width = (width * 4) + 'px';
		canvas.style.height = (height * 4) + 'px';
		canvas.style.imageRendering = 'pixelated';

		const result = { pixels, canvas };

		// Cache the result
		imageCache[cacheKey] = result;

		return result;

	} catch (error) {
		console.error('Error loading BMP:', error);
		return null;
	}
}

// Render event on matrix (shared function)
export async function renderEventOnMatrix(matrix, topLine, bottomLine, colorName, iconName) {
	const TEXT_MARGIN = 2;
	const EVENT_IMAGE_X = 37;
	const EVENT_IMAGE_Y = 2;

	const bottomColor = COLOR_MAP[colorName] || COLOR_MAP['MINT'];
	const topColor = COLOR_MAP['WHITE'];

	matrix.clear();

	// Load and draw icon
	let icon = null;
	if (iconName && iconName.endsWith('.bmp')) {
		const imageData = await loadBMPImage(iconName);
		if (imageData && imageData.pixels) {
			icon = imageData.pixels;
		}
	} else if (iconName && SIMPLE_ICONS[iconName]) {
		icon = SIMPLE_ICONS[iconName];
	}

	if (icon) {
		matrix.drawImage(icon, EVENT_IMAGE_X, EVENT_IMAGE_Y);
	}

	// Calculate bottom-aligned text positions
	const positions = matrix.calculateBottomAlignedPositions(
		window.TINYBIT_FONT,
		topLine,
		bottomLine,
		32
	);

	// Draw text
	if (topLine) {
		matrix.drawTextWithFont(topLine, TEXT_MARGIN, positions.line1Y, topColor, window.TINYBIT_FONT);
	}

	if (bottomLine) {
		matrix.drawTextWithFont(bottomLine, TEXT_MARGIN, positions.line2Y, bottomColor, window.TINYBIT_FONT);
	}

	matrix.render();
}

// Expose functions globally for onclick handlers and compatibility
window.loadBMPImage = loadBMPImage;
window.loadScheduleBMPImage = loadScheduleBMPImage;
window.renderEventOnMatrix = renderEventOnMatrix;
window.loadAvailableImages = loadAvailableImages;
