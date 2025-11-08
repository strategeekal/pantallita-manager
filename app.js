// Configuration storage key
const CONFIG_KEY = 'screeny_config';

// Mobile detection
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 768;

// Global matrix emulator instance for landing page
let landingMatrix = null;

// Single reusable emulator for add/edit operations
let editorMatrix = null;

// Image loading functionality
let availableImages = [];
let imageCache = {};

// Global variables for events management
let currentEvents = [];

// Track current editing state
let isEditMode = false;
let editingEventIndex = null;

// Mobile preview control
let mobilePreviewNeedsUpdate = false;

// Track if editor tab has been initialized
let editorTabInitialized = false;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
	console.log('SCREENY Manager loaded!');
	
	// Create pixelated background
	createPixelBackground();
	
	// Draw pixelated feature icons
	drawFeatureIcons();
	
	// Initialize landing matrix emulator
	landingMatrix = new MatrixEmulator('matrix-container', 64, 32, 6);
	
	// Display "Hello!" centered on landing page
	displayHello(landingMatrix);
	
	// Load saved settings
	loadSettings();
	
	// Load available images from GitHub (silently, don't show errors on landing)
	loadAvailableImages();
	
	// Add listener for date changes in date-specific schedules
	const dateInput = document.getElementById('schedule-date');
	if (dateInput) {
		dateInput.addEventListener('change', updateDateSpecificDays);
	}
});

// Create pixelated background similar to the reference image
function createPixelBackground() {
	const canvas = document.getElementById('pixel-background');
	const ctx = canvas.getContext('2d');
	
	// Set canvas to full window size
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	
	const pixelSize = 20;
	const cols = Math.ceil(canvas.width / pixelSize);
	const rows = Math.ceil(canvas.height / pixelSize);
	
	// Base colors - shades of blue
	const baseColors = [
		{ r: 10, g: 30, b: 80 },
		{ r: 20, g: 50, b: 120 },
		{ r: 30, g: 70, b: 150 },
		{ r: 50, g: 100, b: 180 },
		{ r: 80, g: 130, b: 200 },
		{ r: 100, g: 160, b: 220 }
	];
	
	// Draw pixelated background
	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < cols; col++) {
			const noiseValue = Math.sin(col * 0.1) * Math.cos(row * 0.1);
			const colorIndex = Math.floor((noiseValue + 1) * 0.5 * (baseColors.length - 1));
			const baseColor = baseColors[Math.max(0, Math.min(colorIndex, baseColors.length - 1))];
			
			const r = baseColor.r + Math.random() * 20 - 10;
			const g = baseColor.g + Math.random() * 20 - 10;
			const b = baseColor.b + Math.random() * 20 - 10;
			
			ctx.fillStyle = `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
			ctx.fillRect(col * pixelSize, row * pixelSize, pixelSize, pixelSize);
		}
	}
	
	// Handle window resize
	window.addEventListener('resize', () => {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		createPixelBackground();
	});
}

// Draw pixelated feature icons
function drawFeatureIcons() {
	// Calendar icon
	const calendarCanvas = document.getElementById('calendar-icon');
	if (calendarCanvas) {
		const ctx = calendarCanvas.getContext('2d');
		const pixelSize = 6;
		
		const calendar = [
			[0,1,1,1,1,1,1,0],
			[0,1,2,2,2,2,1,0],
			[0,1,1,1,1,1,1,0],
			[0,1,0,1,0,1,0,0],
			[0,1,1,1,1,1,0,0],
			[0,1,0,1,0,1,0,0],
			[0,1,1,1,1,1,0,0],
			[0,0,0,0,0,0,0,0]
		];
		
		ctx.fillStyle = '#f0f0f0';
		ctx.fillRect(0, 0, 48, 48);
		
		for (let y = 0; y < 8; y++) {
			for (let x = 0; x < 8; x++) {
				if (calendar[y][x] === 1) {
					ctx.fillStyle = '#000';
					ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
				} else if (calendar[y][x] === 2) {
					ctx.fillStyle = '#FF0088';
					ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
				}
			}
		}
	}
	
	// Clock icon
	const clockCanvas = document.getElementById('clock-icon');
	if (clockCanvas) {
		const ctx = clockCanvas.getContext('2d');
		const pixelSize = 6;
		
		const clock = [
			[0,0,1,1,1,1,0,0],
			[0,1,0,0,0,0,1,0],
			[1,0,0,0,1,0,0,1],
			[1,0,0,0,1,0,0,1],
			[1,0,0,1,1,0,0,1],
			[1,0,0,0,0,0,0,1],
			[0,1,0,0,0,0,1,0],
			[0,0,1,1,1,1,0,0]
		];
		
		ctx.fillStyle = '#f0f0f0';
		ctx.fillRect(0, 0, 48, 48);
		
		for (let y = 0; y < 8; y++) {
			for (let x = 0; x < 8; x++) {
				if (clock[y][x] === 1) {
					ctx.fillStyle = '#000';
					ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
				}
			}
		}
	}
	
	// Eye icon
	const eyeCanvas = document.getElementById('eye-icon');
	if (eyeCanvas) {
		const ctx = eyeCanvas.getContext('2d');
		const pixelSize = 6;
		
		const eye = [
			[0,0,0,0,0,0,0,0],
			[0,0,1,1,1,1,0,0],
			[0,1,0,0,0,0,1,0],
			[1,0,0,1,1,0,0,1],
			[1,0,0,1,1,0,0,1],
			[0,1,0,0,0,0,1,0],
			[0,0,1,1,1,1,0,0],
			[0,0,0,0,0,0,0,0]
		];
		
		ctx.fillStyle = '#f0f0f0';
		ctx.fillRect(0, 0, 48, 48);
		
		for (let y = 0; y < 8; y++) {
			for (let x = 0; x < 8; x++) {
				if (eye[y][x] === 1) {
					ctx.fillStyle = '#000';
					ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
				}
			}
		}
	}
}

// Display "Hello!" centered on the matrix, with optional name from URL
function displayHello(matrix) {
	if (!matrix) return;
	
	matrix.clear();
	
	// Get name from URL parameter
	const urlParams = new URLSearchParams(window.location.search);
	const name = urlParams.get('name') || urlParams.get('n');
	
	const font = TINYBIT_FONT;
	const fontHeight = 6;
	const lineSpacing = 2;
	
	if (name && name.length <= 12) {
		// Two-line greeting: "Hello!" and name
		const line1 = "Hello!";
		const line2 = name;
		
		const totalHeight = (fontHeight * 2) + lineSpacing;
		const startY = Math.floor((32 - totalHeight) / 2);
		
		const line1Y = startY;
		const line2Y = startY + fontHeight + lineSpacing;
		
		const color = '#00FFAA';
		
		// Calculate center position for line 1
		let line1Width = 0;
		for (let char of line1.toUpperCase()) {
			const glyph = font.glyphs[char];
			if (glyph) {
				line1Width += glyph.width + 1;
			}
		}
		line1Width -= 1;
		const line1X = Math.floor((64 - line1Width) / 2);
		
		// Calculate center position for line 2
		let line2Width = 0;
		for (let char of line2.toUpperCase()) {
			const glyph = font.glyphs[char];
			if (glyph) {
				line2Width += glyph.width + 1;
			}
		}
		line2Width -= 1;
		const line2X = Math.floor((64 - line2Width) / 2);
		
		matrix.drawTextWithFont(line1, line1X, line1Y, color, font);
		matrix.drawTextWithFont(line2, line2X, line2Y, color, font);
		
	} else {
		// Single line: just "Hello!"
		const text = "Hello!";
		
		let textWidth = 0;
		for (let char of text.toUpperCase()) {
			const glyph = font.glyphs[char];
			if (glyph) {
				textWidth += glyph.width + 1;
			}
		}
		textWidth -= 1;
		
		const x = Math.floor((64 - textWidth) / 2);
		const y = Math.floor((32 - fontHeight) / 2);
		
		matrix.drawTextWithFont(text, x, y, '#00FFAA', font);
	}
	
	matrix.render();
}

// Show main app (hide landing page)
function showApp() {
	document.getElementById('landing-page').style.display = 'none';
	document.getElementById('main-app').classList.remove('hidden');
	
	// CRITICAL: Destroy landing matrix to free memory
	if (landingMatrix) {
		console.log('Destroying landing matrix');
		landingMatrix.clear();
		const landingContainer = document.getElementById('matrix-container');
		if (landingContainer) {
			landingContainer.innerHTML = '';
		}
		landingMatrix = null;
	}
	
	// Setup tabs
	setupTabs();
	
	// Initialize View Events tab (default tab) - loads events immediately
	loadEvents();
}

// Scroll to about section
function scrollToAbout() {
	document.getElementById('about-section').scrollIntoView({ 
		behavior: 'smooth',
		block: 'start'
	});
}

// Tab switching with memory cleanup
function setupTabs() {
	const tabs = document.querySelectorAll('.tab');
	const tabContents = document.querySelectorAll('.tab-content');

	tabs.forEach(tab => {
		tab.addEventListener('click', () => {
			const targetTab = tab.dataset.tab;

			tabs.forEach(t => t.classList.remove('active'));
			tabContents.forEach(tc => tc.classList.remove('active'));

			tab.classList.add('active');
			document.getElementById(`${targetTab}-tab`).classList.add('active');
			
			// Handle tab-specific initialization and cleanup
			handleTabSwitch(targetTab);
		});
	});
}

// Handle tab switching with proper cleanup
function handleTabSwitch(targetTab) {
	// Clean up editor when leaving add-event tab
	if (targetTab !== 'add-event') {
		// Clear the form to avoid confusion
		if (editorTabInitialized) {
			clearEventForm();
		}
		
		// Reset edit mode
		isEditMode = false;
		editingEventIndex = null;
		
		// Clean up matrix on desktop
		if (editorMatrix) {
			console.log('Cleaning up editor matrix');
			editorMatrix.clear();
			
			// Remove canvas from DOM
			const container = document.getElementById('matrix-container-editor');
			if (container) {
				container.innerHTML = ''; // Clear all canvas elements
			}
			
			editorMatrix = null;
			
			// Force garbage collection hint
			if (window.gc) window.gc();
		}
	}
	
	// Initialize tab-specific content
	if (targetTab === 'add-event') {
		initializeEditorTab();
	} else if (targetTab === 'view-events') {
		// Refresh events list if needed
		if (currentEvents.length === 0) {
			loadEvents();
		}
	} else if (targetTab === 'schedules') {
		initializeSchedulesTab();
	}
}

// Initialize editor tab (for add/edit)
function initializeEditorTab() {
	console.log('Initializing editor tab, isMobile:', isMobile, 'already initialized:', editorTabInitialized);
	
	// Setup event form handlers only once
	if (!editorTabInitialized) {
		setupEventFormHandlers();
		populateImageDropdown();
		editorTabInitialized = true;
	}
	
	// Always recreate preview (it gets cleared when leaving tab)
	if (isMobile) {
		console.log('Mobile detected - using lightweight text preview');
		setupMobileTextPreview();
	} else {
		// Desktop: Create emulator if it doesn't exist
		if (!editorMatrix) {
			console.log('Creating editor matrix for desktop');
			editorMatrix = new MatrixEmulator('matrix-container-editor', 64, 32, 6);
		}
	}
	
	// If in edit mode, populate the form
	if (isEditMode && editingEventIndex !== null) {
		populateEditForm();
	}
	
	// Update preview
	updateEditorPreview();
}

// Setup event form handlers
function setupEventFormHandlers() {
	// Character counters
	const topInput = document.getElementById('editor-event-top');
	const bottomInput = document.getElementById('editor-event-bottom');
	
	if (topInput && !topInput.hasAttribute('data-listener')) {
		topInput.setAttribute('data-listener', 'true');
		topInput.addEventListener('input', (e) => {
			const count = e.target.value.length;
			document.getElementById('editor-event-top-count').textContent = `${count}/12`;
			updateEditorPreview(); // Instant on mobile (text), live on desktop (matrix)
		});
	}
	
	if (bottomInput && !bottomInput.hasAttribute('data-listener')) {
		bottomInput.setAttribute('data-listener', 'true');
		bottomInput.addEventListener('input', (e) => {
			const count = e.target.value.length;
			document.getElementById('editor-event-bottom-count').textContent = `${count}/12`;
			updateEditorPreview(); // Instant on mobile (text), live on desktop (matrix)
		});
	}
	
	// Update preview on changes
	const imageSelect = document.getElementById('editor-event-image');
	if (imageSelect && !imageSelect.hasAttribute('data-listener')) {
		imageSelect.setAttribute('data-listener', 'true');
		imageSelect.addEventListener('change', updateEditorPreview);
	}
	
	const colorSelect = document.getElementById('editor-event-color');
	if (colorSelect && !colorSelect.hasAttribute('data-listener')) {
		colorSelect.setAttribute('data-listener', 'true');
		colorSelect.addEventListener('change', (e) => {
			const colorHex = COLOR_MAP[e.target.value];
			document.getElementById('editor-event-color-preview').style.background = colorHex;
			updateEditorPreview();
		});
	}
	
	// Toggle time fields
	const hasTimeCheckbox = document.getElementById('editor-event-has-time');
	if (hasTimeCheckbox && !hasTimeCheckbox.hasAttribute('data-listener')) {
		hasTimeCheckbox.setAttribute('data-listener', 'true');
		hasTimeCheckbox.addEventListener('change', (e) => {
			document.getElementById('editor-event-time-fields').classList.toggle('hidden', !e.target.checked);
		});
	}
	
	// On mobile, no need for preview button since text preview is instant
	if (!isMobile) {
		// Desktop might want to manually update preview in future
	}
}

// Setup mobile preview button
function setupMobilePreviewButton() {
	if (!isMobile) return;
	
	const previewContainer = document.querySelector('.event-preview-container');
	if (!previewContainer) return;
	
	// Check if button already exists
	let previewButton = document.getElementById('mobile-preview-btn');
	if (!previewButton) {
		// Create preview button
		previewButton = document.createElement('button');
		previewButton.id = 'mobile-preview-btn';
		previewButton.className = 'btn-pixel btn-primary mobile-preview-btn';
		previewButton.textContent = '👁️ Update Preview';
		previewButton.onclick = () => {
			updateEditorPreview();
			mobilePreviewNeedsUpdate = false;
			previewButton.classList.remove('needs-update');
		};
		
		// Insert before the emulator wrapper
		const emulatorWrapper = previewContainer.querySelector('.emulator-wrapper');
		if (emulatorWrapper) {
			previewContainer.insertBefore(previewButton, emulatorWrapper);
		}
	}
}

// Show hint that preview needs update on mobile
function showMobilePreviewHint() {
	if (!isMobile) return;
	
	const previewButton = document.getElementById('mobile-preview-btn');
	if (previewButton) {
		previewButton.classList.add('needs-update');
	}
}

// Setup lightweight text preview for mobile (no emulator)
function setupMobileTextPreview() {
	const container = document.getElementById('matrix-container-editor');
	if (!container) return;
	
	// Replace emulator with simple text + image preview
	container.innerHTML = `
		<div class="mobile-text-preview">
			<div class="preview-hint">📱 Mobile Preview</div>
			<div class="preview-image-container" id="mobile-preview-image-container">
				<div class="preview-image-placeholder">Select an image...</div>
			</div>
			<div class="preview-content">
				<div class="preview-top-line" id="mobile-preview-top">Top Line</div>
				<div class="preview-bottom-line" id="mobile-preview-bottom">Bottom Line</div>
				<div class="preview-meta">
					<span id="mobile-preview-image-name">📷 Image: None</span>
					<span id="mobile-preview-color">🎨 Color: MINT</span>
				</div>
			</div>
		</div>
	`;
}

// Populate image dropdown with available images
function populateImageDropdown() {
	const select = document.getElementById('editor-event-image');
	
	if (!select) return;
	
	if (availableImages.length > 0) {
		const options = availableImages.map(img => 
			`<option value="${img.name}">${img.name}</option>`
		).join('');
		
		select.innerHTML = '<option value="">Select an image...</option>' + options;
	} else {
		// Placeholder icons
		select.innerHTML = `
			<option value="">Select an image...</option>
			<option value="halloween">Halloween 🎃 (placeholder)</option>
			<option value="heart">Heart ❤️ (placeholder)</option>
			<option value="star">Star ⭐ (placeholder)</option>
			<option value="sun">Sun ☀️ (placeholder)</option>
			<option value="cloud">Cloud ☁️ (placeholder)</option>
		`;
	}
}

// Update editor preview
async function updateEditorPreview() {
	const topLine = document.getElementById('editor-event-top').value || '';
	const bottomLine = document.getElementById('editor-event-bottom').value || '';
	const colorName = document.getElementById('editor-event-color').value;
	const iconName = document.getElementById('editor-event-image').value;
	
	if (isMobile) {
		// Update mobile text preview (lightweight, no rendering)
		updateMobileTextPreview(topLine, bottomLine, colorName, iconName);
	} else {
		// Update desktop matrix emulator
		if (editorMatrix) {
			await renderEventOnMatrix(editorMatrix, topLine, bottomLine, colorName, iconName);
		}
	}
}

// Update mobile text preview (no canvas rendering)
async function updateMobileTextPreview(topLine, bottomLine, colorName, iconName) {
	const topEl = document.getElementById('mobile-preview-top');
	const bottomEl = document.getElementById('mobile-preview-bottom');
	const imageNameEl = document.getElementById('mobile-preview-image-name');
	const colorEl = document.getElementById('mobile-preview-color');
	const imageContainer = document.getElementById('mobile-preview-image-container');
	
	if (topEl) topEl.textContent = topLine || 'Top Line';
	if (bottomEl) {
		bottomEl.textContent = bottomLine || 'Bottom Line';
		const colorHex = COLOR_MAP[colorName] || COLOR_MAP['MINT'];
		bottomEl.style.color = colorHex;
	}
	if (imageNameEl) imageNameEl.textContent = `📷 ${iconName || 'None'}`;
	if (colorEl) colorEl.textContent = `🎨 ${colorName || 'MINT'}`;
	
	// Load and display actual image (as regular img, not canvas)
	if (iconName && iconName.endsWith('.bmp') && imageContainer) {
		const imageInfo = availableImages.find(img => img.name === iconName);
		if (imageInfo) {
			// Show the image directly using the download URL
			imageContainer.innerHTML = `
				<img src="${imageInfo.url}" 
					 alt="${iconName}" 
					 class="preview-image-display"
					 onerror="this.parentElement.innerHTML='<div class=\\'preview-image-placeholder\\'>Image load failed</div>'"
				/>
			`;
		}
	} else if (imageContainer) {
		imageContainer.innerHTML = '<div class="preview-image-placeholder">Select an image...</div>';
	}
}

// Render event on matrix (shared function)
async function renderEventOnMatrix(matrix, topLine, bottomLine, colorName, iconName) {
	const TEXT_MARGIN = 2;
	const EVENT_IMAGE_X = 37;
	const EVENT_IMAGE_Y = 2;
	
	const bottomColor = COLOR_MAP[colorName] || COLOR_MAP['MINT'];
	const topColor = COLOR_MAP['WHITE'];
	
	matrix.clear();
	
	// Load and draw icon
	let icon = null;
	if (iconName && iconName.endsWith('.bmp')) {
		icon = await loadBMPImage(iconName);
	} else if (iconName && SIMPLE_ICONS[iconName]) {
		icon = SIMPLE_ICONS[iconName];
	}
	
	if (icon) {
		matrix.drawImage(icon, EVENT_IMAGE_X, EVENT_IMAGE_Y);
	}
	
	// Calculate bottom-aligned text positions
	const positions = matrix.calculateBottomAlignedPositions(
		TINYBIT_FONT,
		topLine,
		bottomLine,
		32
	);
	
	// Draw text
	if (topLine) {
		matrix.drawTextWithFont(topLine, TEXT_MARGIN, positions.line1Y, topColor, TINYBIT_FONT);
	}
	
	if (bottomLine) {
		matrix.drawTextWithFont(bottomLine, TEXT_MARGIN, positions.line2Y, bottomColor, TINYBIT_FONT);
	}
	
	matrix.render();
}

// Settings management
function loadSettings() {
	const config = loadConfig();
	if (config.token) {
		const tokenInput = document.getElementById('github-token');
		if (tokenInput) tokenInput.value = config.token;
	}
	if (config.owner) {
		const ownerInput = document.getElementById('github-owner');
		if (ownerInput) ownerInput.value = config.owner;
	}
	if (config.repo) {
		const repoInput = document.getElementById('github-repo');
		if (repoInput) repoInput.value = config.repo;
	}
}

function loadConfig() {
	const config = localStorage.getItem(CONFIG_KEY);
	return config ? JSON.parse(config) : {};
}

function saveConfig(config) {
	localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

function handleSettingsSubmit(e) {
	e.preventDefault();

	const config = {
		token: document.getElementById('github-token').value,
		owner: document.getElementById('github-owner').value,
		repo: document.getElementById('github-repo').value
	};

	saveConfig(config);
	showStatus('Settings saved!', 'success');
	
	// Reload images with new credentials
	loadAvailableImages();
}

// Status messages
function showStatus(message, type) {
	const status = document.getElementById('status');
	status.textContent = message;
	status.className = `status ${type}`;
	status.classList.remove('hidden');

	setTimeout(() => {
		status.classList.add('hidden');
	}, 3000);
}

// Load list of available images from GitHub
async function loadAvailableImages() {
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
		
	} catch (error) {
		console.error('Error loading images:', error);
	}
}

// Load and parse BMP image from GitHub (simplified for 8-bit only)
async function loadBMPImage(imageName) {
	const config = loadConfig();
	
	console.log('Loading image:', imageName);
	
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
	
	try {
		const response = await fetch(imageInfo.url);
		
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
			imageName, 
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
		
		// Cache the result
		imageCache[imageName] = pixels;
		
		return pixels;
		
	} catch (error) {
		console.error('Error loading BMP:', error);
		console.error('Error stack:', error.stack);
		return null;
	}
}

// Load schedule BMP image (uses same logic as event images)
async function loadScheduleBMPImage(imageName) {
	const config = loadConfig();
	
	console.log('Loading schedule image:', imageName);
	
	// Check if it's in the schedule images list
	const imageInfo = scheduleImages.find(img => img.name === imageName);
	if (!imageInfo) {
		console.error('Schedule image not found:', imageName);
		return null;
	}
	
	// Check cache first
	if (imageCache[imageName]) {
		console.log('Using cached schedule image:', imageName);
		return imageCache[imageName];
	}
	
	try {
		const response = await fetch(imageInfo.url);
		
		if (!response.ok) {
			console.error('Fetch failed:', response.status, response.statusText);
			return null;
		}
		
		const arrayBuffer = await response.arrayBuffer();
		const dataView = new DataView(arrayBuffer);
		
		// Parse BMP header
		const signature = String.fromCharCode(dataView.getUint8(0)) + String.fromCharCode(dataView.getUint8(1));
		
		if (signature !== 'BM') {
			console.error('Not a valid BMP file!');
			return null;
		}
		
		const dataOffset = dataView.getUint32(10, true);
		const width = dataView.getInt32(18, true);
		const height = Math.abs(dataView.getInt32(22, true));
		const bitsPerPixel = dataView.getUint16(28, true);
		
		// Only handle 8-bit BMPs
		if (bitsPerPixel !== 8) {
			console.error('Only 8-bit BMPs supported! Got:', bitsPerPixel);
			return null;
		}
		
		// Parse color palette
		const paletteSize = dataView.getUint32(46, true) || 256;
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
		
		for (let row = 0; row < height; row++) {
			for (let col = 0; col < width; col++) {
				const bmpRow = (height - 1 - row);
				const rowSize = Math.floor((width * 8 + 31) / 32) * 4;
				const pixelIndex = dataOffset + (bmpRow * rowSize) + col;
				const colorIndex = dataView.getUint8(pixelIndex);
				
				let r, g, b;
				if (colorIndex < palette.length) {
					r = palette[colorIndex].r;
					g = palette[colorIndex].g;
					b = palette[colorIndex].b;
				} else {
					r = g = b = 0;
				}
				
				if (r < 10 && g < 10 && b < 10) {
					pixels[row][col] = 'transparent';
				} else {
					pixels[row][col] = `rgb(${r},${g},${b})`;
				}
			}
		}
		
		// Cache the result
		imageCache[imageName] = pixels;
		
		return pixels;
		
	} catch (error) {
		console.error('Error loading schedule BMP:', error);
		return null;
	}
}

// ==================== EVENTS CRUD FUNCTIONALITY ====================

// Load events from GitHub
async function loadEvents() {
	const config = loadConfig();
	
	if (!config.token || !config.owner || !config.repo) {
		showEventsError('Please configure GitHub settings first');
		return;
	}
	
	showEventsLoading();
	
	try {
		const response = await fetch(
			`https://api.github.com/repos/${config.owner}/${config.repo}/contents/ephemeral_events.csv`,
			{
				headers: {
					'Authorization': `Bearer ${config.token}`,
					'Accept': 'application/vnd.github.v3+json'
				}
			}
		);
		
		if (!response.ok) {
			if (response.status === 404) {
				showEventsEmpty();
				currentEvents = [];
				return;
			}
			throw new Error(`GitHub API error: ${response.status}`);
		}
		
		const data = await response.json();
		const content = atob(data.content);
		
		// Parse CSV
		currentEvents = parseEventsCSV(content);
		displayEvents();
		
	} catch (error) {
		console.error('Error loading events:', error);
		showEventsError('Failed to load events: ' + error.message);
	}
}

// Parse events CSV content
function parseEventsCSV(content) {
	const lines = content.split('\n').filter(line => {
		const trimmed = line.trim();
		return trimmed && !trimmed.startsWith('#');
	});
	
	return lines.map((line, index) => {
		const parts = line.split(',');
		
		if (parts.length < 4) return null;
		
		const event = {
			date: parts[0].trim(),
			topLine: parts[1].trim(),
			bottomLine: parts[2].trim(),
			image: parts[3].trim(),
			color: parts[4] ? parts[4].trim() : 'MINT',
			startHour: parts[5] ? parseInt(parts[5].trim()) : null,
			endHour: parts[6] ? parseInt(parts[6].trim()) : null,
			index: index
		};
		
		return event;
	}).filter(event => event !== null);
}

// Display events in the list
function displayEvents() {
	const listContainer = document.getElementById('events-list');
	
	hideEventsMessages();
	
	if (currentEvents.length === 0) {
		showEventsEmpty();
		return;
	}
	
	// Sort events by date
	const sortedEvents = [...currentEvents].sort((a, b) => {
		return new Date(a.date) - new Date(b.date);
	});
	
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	
	// Split into upcoming and past events
	const upcomingEvents = sortedEvents.filter(event => new Date(event.date + 'T00:00:00') >= today);
	const pastEvents = sortedEvents.filter(event => new Date(event.date + 'T00:00:00') < today);
	
	// Show upcoming + last 10 past events to reduce DOM size
	const eventsToShow = [...upcomingEvents, ...pastEvents.slice(-10)];
	
	// Build HTML - simplified structure for better performance
	const eventsHTML = eventsToShow.map(event => {
		// Parse date without timezone conversion
		const eventDate = new Date(event.date + 'T00:00:00');
		const isPast = eventDate < today;
		
		const month = eventDate.toLocaleString('default', { month: 'short' }).toUpperCase();
		const day = eventDate.getDate();
		const year = eventDate.getFullYear();
		
		const timeInfo = event.startHour !== null && event.endHour !== null
			? `${event.startHour}:00 - ${event.endHour}:00`
			: 'All Day';
		
		return `
			<div class="event-card ${isPast ? 'past-event' : ''}">
				<div class="event-date-badge">
					<span class="month">${month}</span>
					<span class="day">${day}</span>
					<span class="year">${year}</span>
				</div>
				<div class="event-info">
					<h4>${event.topLine}</h4>
					<p><strong>${event.bottomLine}</strong></p>
					<p>🖼️ ${event.image} | 🎨 ${event.color}</p>
					<p class="event-time">${timeInfo}</p>
				</div>
				<div class="event-actions">
					<button class="btn-pixel btn-primary" onclick="editEvent(${event.index})">✏️ Edit</button>
					<button class="btn-pixel btn-secondary" onclick="deleteEvent(${event.index})">🗑️</button>
				</div>
			</div>
		`;
	}).join('');
	
	// Clear and set in one operation
	listContainer.innerHTML = eventsHTML;
	
	// Show message if there are hidden past events
	if (pastEvents.length > 10) {
		const hiddenCount = pastEvents.length - 10;
		listContainer.insertAdjacentHTML('beforeend', `
			<div class="info-message">
				${hiddenCount} older past event(s) hidden. 
				<button class="btn-pixel btn-secondary" onclick="clearPastEvents()">Clear Past Events</button>
			</div>
		`);
	}
}

// Add or save event (handles both add and edit)
async function saveEvent() {
	const saveButton = document.querySelector('button[onclick="saveEvent()"]');
	
	// Prevent double-submission
	if (saveButton.disabled) {
		return;
	}
	
	const date = document.getElementById('editor-event-date').value;
	const topLine = document.getElementById('editor-event-top').value;
	const bottomLine = document.getElementById('editor-event-bottom').value;
	const image = document.getElementById('editor-event-image').value;
	const color = document.getElementById('editor-event-color').value;
	const hasTime = document.getElementById('editor-event-has-time').checked;
	const startHour = hasTime ? document.getElementById('editor-event-start-hour').value : '';
	const endHour = hasTime ? document.getElementById('editor-event-end-hour').value : '';
	
	// Validation
	if (!date || !topLine || !bottomLine || !image || !color) {
		showStatus('Please fill in all required fields', 'error');
		return;
	}
	
	// Check for duplicate events (only when adding new)
	if (!isEditMode) {
		const isDuplicate = currentEvents.some(event => 
			event.date === date &&
			event.topLine === topLine &&
			event.bottomLine === bottomLine
		);
		
		if (isDuplicate) {
			if (!confirm('An event with the same date and text already exists. Add anyway?')) {
				return;
			}
		}
	}
	
	// Disable button to prevent double-clicks
	saveButton.disabled = true;
	const originalText = saveButton.textContent;
	saveButton.textContent = isEditMode ? 'Saving...' : 'Adding...';
	
	try {
		// Create event object
		const eventData = {
			date,
			topLine,
			bottomLine,
			image,
			color,
			startHour: hasTime && startHour ? parseInt(startHour) : null,
			endHour: hasTime && endHour ? parseInt(endHour) : null
		};
		
		if (isEditMode && editingEventIndex !== null) {
			// Update existing event
			currentEvents[editingEventIndex] = {
				...eventData,
				index: editingEventIndex
			};
		} else {
			// Add new event
			currentEvents.push(eventData);
		}
		
		// Save to GitHub
		await saveEventsToGitHub();
		
		// Clear form and reset state
		clearEventForm();
		isEditMode = false;
		editingEventIndex = null;
		
		// Update button text
		document.getElementById('editor-form-title').textContent = 'Add New Event';
		
		showStatus(isEditMode ? 'Event updated successfully!' : 'Event added successfully!', 'success');
		
		// Switch to view events tab
		document.querySelector('[data-tab="view-events"]').click();
		
	} catch (error) {
		console.error('Error saving event:', error);
		showStatus('Failed to save event: ' + error.message, 'error');
		
		// Remove from array if save failed and it was a new event
		if (!isEditMode) {
			currentEvents.pop();
		}
	} finally {
		// Re-enable button
		saveButton.disabled = false;
		saveButton.textContent = originalText;
	}
}

// Clear event form
function clearEventForm() {
	document.getElementById('editor-event-date').value = '';
	document.getElementById('editor-event-top').value = '';
	document.getElementById('editor-event-bottom').value = '';
	document.getElementById('editor-event-image').value = '';
	document.getElementById('editor-event-color').value = 'MINT';
	document.getElementById('editor-event-has-time').checked = false;
	document.getElementById('editor-event-time-fields').classList.add('hidden');
	document.getElementById('editor-event-start-hour').value = '';
	document.getElementById('editor-event-end-hour').value = '';
	document.getElementById('editor-event-top-count').textContent = '0/12';
	document.getElementById('editor-event-bottom-count').textContent = '0/12';
	document.getElementById('editor-event-color-preview').style.background = COLOR_MAP['MINT'];
	
	if (editorMatrix) {
		editorMatrix.clear();
		editorMatrix.render();
	}
	
	// Reset edit mode
	isEditMode = false;
	editingEventIndex = null;
	document.getElementById('editor-form-title').textContent = 'Add New Event';
}

// Edit event - switches to Add Event tab with pre-filled form
function editEvent(index) {
	const event = currentEvents[index];
	
	// Set edit mode
	isEditMode = true;
	editingEventIndex = index;
	
	// Switch to add-event tab
	document.querySelector('[data-tab="add-event"]').click();
	
	// Wait for tab to initialize, then populate form
	setTimeout(() => {
		populateEditForm();
	}, 100);
}

// Populate form with event data for editing
function populateEditForm() {
	if (!isEditMode || editingEventIndex === null) return;
	
	const event = currentEvents[editingEventIndex];
	
	document.getElementById('editor-event-date').value = event.date;
	document.getElementById('editor-event-top').value = event.topLine;
	document.getElementById('editor-event-bottom').value = event.bottomLine;
	document.getElementById('editor-event-image').value = event.image;
	document.getElementById('editor-event-color').value = event.color;
	
	const hasTime = event.startHour !== null && event.endHour !== null;
	document.getElementById('editor-event-has-time').checked = hasTime;
	document.getElementById('editor-event-time-fields').classList.toggle('hidden', !hasTime);
	
	if (hasTime) {
		document.getElementById('editor-event-start-hour').value = event.startHour;
		document.getElementById('editor-event-end-hour').value = event.endHour;
	}
	
	document.getElementById('editor-event-top-count').textContent = `${event.topLine.length}/12`;
	document.getElementById('editor-event-bottom-count').textContent = `${event.bottomLine.length}/12`;
	
	const colorHex = COLOR_MAP[event.color];
	document.getElementById('editor-event-color-preview').style.background = colorHex;
	
	// Update form title
	document.getElementById('editor-form-title').textContent = 'Edit Event';
	
	// Update preview
	updateEditorPreview();
}

// Delete event
async function deleteEvent(index) {
	if (!confirm('Are you sure you want to delete this event?')) {
		return;
	}
	
	try {
		currentEvents.splice(index, 1);
		
		// Reindex remaining events
		currentEvents.forEach((event, i) => {
			event.index = i;
		});
		
		await saveEventsToGitHub();
		
		showStatus('Event deleted successfully!', 'success');
	} catch (error) {
		console.error('Error deleting event:', error);
		showStatus('Failed to delete event: ' + error.message, 'error');
		// Reload events to restore state
		await loadEvents();
	}
}

// Clear past events
async function clearPastEvents() {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	
	const futureEvents = currentEvents.filter(event => {
		const eventDate = new Date(event.date);
		return eventDate >= today;
	});
	
	if (futureEvents.length === currentEvents.length) {
		showStatus('No past events to clear', 'error');
		return;
	}
	
	if (!confirm(`This will delete ${currentEvents.length - futureEvents.length} past event(s). Continue?`)) {
		return;
	}
	
	currentEvents = futureEvents;
	
	// Reindex events
	currentEvents.forEach((event, i) => {
		event.index = i;
	});
	
	await saveEventsToGitHub();
	
	showStatus('Past events cleared successfully!', 'success');
}

// Save events to GitHub
async function saveEventsToGitHub() {
	const config = loadConfig();
	
	if (!config.token || !config.owner || !config.repo) {
		showStatus('Please configure GitHub settings first', 'error');
		return;
	}
	
	try {
		// Get current file SHA (needed for update)
		let sha = null;
		try {
			const getResponse = await fetch(
				`https://api.github.com/repos/${config.owner}/${config.repo}/contents/ephemeral_events.csv`,
				{
					headers: {
						'Authorization': `Bearer ${config.token}`,
						'Accept': 'application/vnd.github.v3+json'
					}
				}
			);
			
			if (getResponse.ok) {
				const getData = await getResponse.json();
				sha = getData.sha;
			}
		} catch (e) {
			console.log('File does not exist yet, will create new');
		}
		
		// Generate CSV content
		const csvContent = generateEventsCSV();
		const encodedContent = btoa(unescape(encodeURIComponent(csvContent)));
		
		// Save to GitHub
		const response = await fetch(
			`https://api.github.com/repos/${config.owner}/${config.repo}/contents/ephemeral_events.csv`,
			{
				method: 'PUT',
				headers: {
					'Authorization': `Bearer ${config.token}`,
					'Accept': 'application/vnd.github.v3+json',
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					message: 'Update ephemeral events',
					content: encodedContent,
					sha: sha
				})
			}
		);
		
		if (!response.ok) {
			throw new Error(`GitHub API error: ${response.status}`);
		}
		
		// Reload events to refresh display
		await loadEvents();
		
	} catch (error) {
		console.error('Error saving events:', error);
		throw error;
	}
}

// Generate CSV content from events
function generateEventsCSV() {
	const header = `# Ephemeral Events - Auto-generated
# Format: YYYY-MM-DD,TopLine,BottomLine,Image,Color[,StartHour,EndHour]
# TopLine = displays on TOP of screen
# BottomLine = displays on BOTTOM (usually the name)
# Times are optional (24-hour format, 0-23). If omitted, event shows all day.
`;
	
	const lines = currentEvents.map(event => {
		let line = `${event.date},${event.topLine},${event.bottomLine},${event.image},${event.color}`;
		
		if (event.startHour !== null && event.endHour !== null) {
			line += `,${event.startHour},${event.endHour}`;
		}
		
		return line;
	});
	
	return header + lines.join('\n');
}

// Helper functions for showing/hiding messages
function showEventsLoading() {
	document.getElementById('events-loading').classList.remove('hidden');
	document.getElementById('events-error').classList.add('hidden');
	document.getElementById('events-empty').classList.add('hidden');
	document.getElementById('events-list').innerHTML = '';
}

function showEventsError(message) {
	document.getElementById('events-loading').classList.add('hidden');
	document.getElementById('events-error').classList.remove('hidden');
	document.getElementById('events-error').textContent = message;
	document.getElementById('events-empty').classList.add('hidden');
	document.getElementById('events-list').innerHTML = '';
}

function showEventsEmpty() {
	document.getElementById('events-loading').classList.add('hidden');
	document.getElementById('events-error').classList.add('hidden');
	document.getElementById('events-empty').classList.remove('hidden');
	document.getElementById('events-list').innerHTML = '';
}

function hideEventsMessages() {
	document.getElementById('events-loading').classList.add('hidden');
	document.getElementById('events-error').classList.add('hidden');
	document.getElementById('events-empty').classList.add('hidden');
}

// ==================== SCHEDULE MANAGEMENT - FIXED VERSION ====================
// Replace the schedule management section in app.js with these updated functions

// Global variables for schedule management
let currentSchedules = []; // List of all schedule files
let currentScheduleData = null; // Currently loaded/editing schedule
let scheduleImages = []; // Available schedule images
let scheduleMatrix = null; // Matrix emulator for schedule preview

// Initialize schedules tab when shown
function initializeSchedulesTab() {
	console.log('Initializing schedules tab');
	loadSchedules();
	loadScheduleImages();
}

// Load all schedule files from GitHub
async function loadSchedules() {
	const config = loadConfig();
	
	if (!config.token || !config.owner || !config.repo) {
		showSchedulesError('Please configure GitHub settings first');
		return;
	}
	
	showSchedulesLoading();
	
	try {
		// FIXED: Add cache-busting parameter
		const timestamp = new Date().getTime();
		
		const response = await fetch(
			`https://api.github.com/repos/${config.owner}/${config.repo}/contents/schedules?nocache=${timestamp}`,
			{
				headers: {
					'Authorization': `Bearer ${config.token}`,
					'Accept': 'application/vnd.github.v3+json'
					// REMOVED: Cache-Control headers (cause CORS error)
				}
			}
		);
		
		if (!response.ok) {
			if (response.status === 404) {
				showSchedulesEmpty();
				currentSchedules = [];
				return;
			}
			throw new Error(`GitHub API error: ${response.status}`);
		}
		
		const files = await response.json();
		currentSchedules = files
			.filter(f => f.name.endsWith('.csv'))
			.map(f => ({
				name: f.name,
				url: f.download_url,
				sha: f.sha,
				isDefault: f.name === 'default.csv',
				date: f.name === 'default.csv' ? null : f.name.replace('.csv', '')
			}))
			.sort((a, b) => {
				if (a.isDefault) return -1;
				if (b.isDefault) return 1;
				return new Date(a.date) - new Date(b.date);
			});
		
		displaySchedules();
		
	} catch (error) {
		console.error('Error loading schedules:', error);
		showSchedulesError('Failed to load schedules: ' + error.message);
	}
}

// Display schedules list
function displaySchedules() {
	const listContainer = document.getElementById('schedules-list');
	
	hideSchedulesMessages();
	
	if (currentSchedules.length === 0) {
		showSchedulesEmpty();
		return;
	}
	
	const schedulesHTML = currentSchedules.map(schedule => {
		const displayName = schedule.isDefault ? 'Default Schedule' : `Schedule for ${schedule.date}`;
		const isPast = schedule.date && new Date(schedule.date) < new Date();
		
		return `
			<div class="schedule-card ${isPast ? 'past-schedule' : ''}">
				<div class="schedule-info">
					<h4>${displayName}</h4>
					<p>${schedule.name}</p>
				</div>
				<div class="schedule-actions">
					<button class="btn-pixel btn-primary btn-sm" onclick="editSchedule('${schedule.name}')">✏️ Edit</button>
					<button class="btn-pixel btn-secondary btn-sm" onclick="duplicateSchedule('${schedule.name}')">📋 Copy</button>
					${!schedule.isDefault ? `<button class="btn-pixel btn-secondary btn-sm" onclick="deleteSchedule('${schedule.name}')">🗑️</button>` : ''}
				</div>
			</div>
		`;
	}).join('');
	
	listContainer.innerHTML = schedulesHTML;
}

// Load schedule images from GitHub
async function loadScheduleImages() {
	const config = loadConfig();
	
	if (!config.token || !config.owner || !config.repo) {
		console.log('GitHub not configured - no schedule images');
		return;
	}
	
	try {
		const response = await fetch(
			`https://api.github.com/repos/${config.owner}/${config.repo}/contents/img/schedules`,
			{
				headers: {
					'Authorization': `Bearer ${config.token}`,
					'Accept': 'application/vnd.github.v3+json'
				}
			}
		);
		
		if (!response.ok) {
			console.error('Failed to load schedule images:', response.status);
			return;
		}
		
		const files = await response.json();
		scheduleImages = files
			.filter(f => f.name.endsWith('.bmp'))
			.map(f => ({
				name: f.name,
				url: f.download_url,
				sha: f.sha
			}));
		
		console.log(`Loaded ${scheduleImages.length} schedule images`);
		
	} catch (error) {
		console.error('Error loading schedule images:', error);
	}
}

// Create new schedule - FIXED: Shows template option
function createNewSchedule() {
	currentScheduleData = {
		type: 'new-date', // Special type for new schedule creation
		date: null,
		items: [],
		isNew: true
	};
	
	showScheduleEditor();
	populateScheduleEditor();
	document.getElementById('schedule-editor-title').textContent = 'Create New Schedule';
}

// Edit existing schedule - FIXED: Determines correct edit mode
async function editSchedule(filename) {
	alert('START: editSchedule called with: ' + filename);
	
	const config = loadConfig();
	currentScheduleData = null;
	
	try {
		alert('STEP 1: Starting fetch');
		
		const timestamp = new Date().getTime();
		const apiUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/schedules/${filename}?nocache=${timestamp}`;
		
		const response = await fetch(apiUrl, {
			headers: {
				'Authorization': `Bearer ${config.token}`,
				'Accept': 'application/vnd.github.v3+json'
			}
		});
		
		alert('STEP 2: Got response status: ' + response.status);
		
		if (!response.ok) {
			throw new Error(`GitHub API error: ${response.status}`);
		}
		
		const data = await response.json();
		
		alert('STEP 3: Fetching content from download_url');
		
		const contentTimestamp = new Date().getTime();
		const contentResponse = await fetch(`${data.download_url}?nocache=${contentTimestamp}`);
		const content = await contentResponse.text();
		
		alert('STEP 4: Got content, length: ' + content.length);
		
		const isDefault = filename === 'default.csv';
		const date = isDefault ? null : filename.replace('.csv', '');
		
		alert('STEP 5: About to parse CSV');
		
		const parsedItems = parseScheduleCSV(content);
		
		alert('STEP 6: Parsed ' + parsedItems.length + ' items');
		
		currentScheduleData = {
			type: isDefault ? 'default' : 'edit-date',
			date: date,
			filename: filename,
			sha: data.sha,
			items: parsedItems,
			isNew: false
		};
		
		alert('STEP 7: About to call showScheduleEditor');
		
		showScheduleEditor();
		
		alert('STEP 8: About to call populateScheduleEditor');
		
		populateScheduleEditor();
		
		alert('STEP 9: About to set title');
		
		const title = isDefault ? 'Edit Default Schedule' : `Edit Schedule for ${date}`;
		const titleElement = document.getElementById('schedule-editor-title');
		
		if (titleElement) {
			titleElement.textContent = title;
			alert('STEP 10: SUCCESS - All done!');
		} else {
			alert('STEP 10: Title element not found but continuing');
		}
		
	} catch (error) {
		alert('ERROR: ' + error.message);
		console.error('Full error:', error);
		showStatus('Failed to load schedule: ' + error.message, 'error');
	}
}

// Parse schedule CSV
function parseScheduleCSV(content) {
	const lines = content.split('\n').filter(line => {
		const trimmed = line.trim();
		return trimmed && !trimmed.startsWith('#');
	});
	
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

// Show schedule editor
function showScheduleEditor() {
	document.getElementById('schedule-editor').classList.remove('hidden');
	document.querySelector('.schedule-list-section').classList.add('hidden');
}

// Close schedule editor
function closeScheduleEditor() {
	document.getElementById('schedule-editor').classList.add('hidden');
	document.querySelector('.schedule-list-section').classList.remove('hidden');
	
	// CRITICAL: Clear cached data
	currentScheduleData = null;
	
	// Clean up schedule matrix
	if (scheduleMatrix) {
		scheduleMatrix.clear();
		const container = document.getElementById('matrix-container-schedule');
		if (container) {
			container.innerHTML = '';
		}
		scheduleMatrix = null;
	}
}

// Populate schedule editor - FIXED: Shows correct controls based on mode
function populateScheduleEditor() {
	console.log('populateScheduleEditor called');
	console.log('currentScheduleData:', currentScheduleData);
	
	if (!currentScheduleData) {
		console.error('No currentScheduleData!');
		return;
	}
	
	const scheduleInfoForm = document.getElementById('schedule-info-form');
	
	if (!scheduleInfoForm) {
		console.error('schedule-info-form element not found!');
		return;
	}
	
	try {
		if (currentScheduleData.type === 'default') {
			// EDITING DEFAULT: No controls, just show info
			scheduleInfoForm.innerHTML = `
				<div class="form-group">
					<p class="schedule-mode-info">Editing default schedule template</p>
				</div>
			`;
		} else if (currentScheduleData.type === 'edit-date') {
			// EDITING SPECIFIC DATE: Check if date exists
			if (!currentScheduleData.date) {
				console.error('Date is missing for edit-date type!');
				scheduleInfoForm.innerHTML = `
					<div class="form-group">
						<p class="schedule-mode-info error">Error: Date is missing</p>
					</div>
				`;
			} else {
				// Date exists, proceed normally
				try {
					const scheduleDate = new Date(currentScheduleData.date + 'T00:00:00');
					const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][scheduleDate.getDay()];
					
					scheduleInfoForm.innerHTML = `
						<div class="form-group">
							<label>Schedule Date</label>
							<input type="date" id="schedule-date" value="${currentScheduleData.date}" onchange="handleDateChange()">
							<small>This schedule is for ${dayOfWeek}</small>
						</div>
						<div class="form-group">
							<button type="button" class="btn-pixel btn-secondary" onclick="makeThisDefault()">
								💾 Make This the Default Schedule
							</button>
						</div>
					`;
				} catch (dateError) {
					console.error('Error parsing date:', dateError);
					scheduleInfoForm.innerHTML = `
						<div class="form-group">
							<p class="schedule-mode-info error">Error: Invalid date format</p>
						</div>
					`;
				}
			}
		} else if (currentScheduleData.type === 'new-date') {
			// CREATING NEW: Show date picker + template selector
			scheduleInfoForm.innerHTML = `
				<div class="form-group">
					<label>Schedule Date *</label>
					<input type="date" id="schedule-date" value="${currentScheduleData.date || ''}" onchange="handleDateChange()">
				</div>
				<div class="form-group">
					<label>Start From Template</label>
					<select id="schedule-template" onchange="loadScheduleTemplate()">
						<option value="">-- Blank Schedule --</option>
						<option value="default">Default Schedule</option>
					</select>
				</div>
			`;
		} else {
			// Unknown type
			console.error('Unknown schedule type:', currentScheduleData.type);
			scheduleInfoForm.innerHTML = `
				<div class="form-group">
					<p class="schedule-mode-info error">Error: Unknown schedule type</p>
				</div>
			`;
		}
		
		console.log('About to call renderScheduleItems...');
		renderScheduleItems();
		console.log('About to call updateTimelineView...');
		updateTimelineView();
		console.log('populateScheduleEditor complete');
		
	} catch (error) {
		console.error('Error in populateScheduleEditor:', error);
		scheduleInfoForm.innerHTML = `
			<div class="form-group">
				<p class="schedule-mode-info error">Error loading schedule: ${error.message}</p>
			</div>
		`;
	}
}

// Handle date change - Updates day-of-week
function handleDateChange() {
	const dateInput = document.getElementById('schedule-date');
	if (!dateInput || !dateInput.value || !currentScheduleData) return;
	
	currentScheduleData.date = dateInput.value;
	
	const scheduleDate = new Date(dateInput.value + 'T00:00:00');
	const dayOfWeek = (scheduleDate.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
	
	// CRITICAL: Update all items to use ONLY this specific day
	currentScheduleData.items.forEach(item => {
		item.days = dayOfWeek.toString();
	});
	
	// Update the info text if editing
	if (currentScheduleData.type === 'edit-date') {
		const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][scheduleDate.getDay()];
		const small = document.querySelector('#schedule-info-form small');
		if (small) {
			small.textContent = `This schedule is for ${dayName}`;
		}
	}
	
	renderScheduleItems();
	updateTimelineView();
}

// Load schedule template - FIXED: Only for new schedules
async function loadScheduleTemplate() {
	const template = document.getElementById('schedule-template').value;
	
	if (!template) {
		currentScheduleData.items = [];
		renderScheduleItems();
		return;
	}
	
	if (template === 'default') {
		const config = loadConfig();
		
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
			
			if (!response.ok) {
				throw new Error('Default schedule not found');
			}
			
			const data = await response.json();
			const content = atob(data.content);
			const templateItems = parseScheduleCSV(content);
			
			currentScheduleData.items = JSON.parse(JSON.stringify(templateItems));
			
			// CRITICAL: Force update days if date is set
			if (currentScheduleData.date) {
				const scheduleDate = new Date(currentScheduleData.date + 'T00:00:00');
				const dayOfWeek = (scheduleDate.getDay() + 6) % 7;
				
				// Force all items to use only the selected date's day
				currentScheduleData.items.forEach(item => {
					item.days = dayOfWeek.toString();
				});
			}
			
			renderScheduleItems();
			showStatus('Template loaded successfully', 'success');
			
		} catch (error) {
			console.error('Error loading template:', error);
			showStatus('Failed to load template: ' + error.message, 'error');
		}
	}
}

async function makeThisDefault() {
	if (!currentScheduleData || currentScheduleData.type !== 'edit-date') return;
	
	if (!confirm('Replace the default schedule with this one? This cannot be undone.\n\nAfter saving, you will be redirected to the default schedule editor where you can select which days of the week this schedule should apply to.')) {
		return;
	}
	
	const config = loadConfig();
	
	try {
		// Get current default.csv SHA
		let sha = null;
		try {
			const getResponse = await fetch(
				`https://api.github.com/repos/${config.owner}/${config.repo}/contents/schedules/default.csv`,
				{
					headers: {
						'Authorization': `Bearer ${config.token}`,
						'Accept': 'application/vnd.github.v3+json'
					}
				}
			);
			
			if (getResponse.ok) {
				const getData = await getResponse.json();
				sha = getData.sha;
			}
		} catch (e) {
			console.log('Default schedule does not exist, will create');
		}
		
		// Generate CSV content from current schedule items
		const csvContent = generateScheduleCSV();
		const encodedContent = btoa(unescape(encodeURIComponent(csvContent)));
		
		// Save as default.csv
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
		
		// CHANGED: Reload schedules with delay to get fresh GitHub data
		setTimeout(async () => {
			await loadSchedules(); // Force refresh from GitHub
			
			// Show alert and redirect to default schedule editor
			alert('Default schedule saved! Now redirecting to the default schedule editor where you can select which days of the week this schedule applies to.');
			editSchedule('default.csv');
		}, 1000);
		
	} catch (error) {
		console.error('Error updating default:', error);
		showStatus('Failed to update default: ' + error.message, 'error');
	}
}


// Add new schedule item
function addScheduleItem() {
	if (!currentScheduleData) {
		currentScheduleData = {
			type: 'default',
			items: []
		};
	}
	
	// Determine default days based on schedule type
	let defaultDays = '0123456'; // All days for default
	if (currentScheduleData.type !== 'default' && currentScheduleData.date) {
		const scheduleDate = new Date(currentScheduleData.date + 'T00:00:00');
		const dayOfWeek = (scheduleDate.getDay() + 6) % 7;
		defaultDays = dayOfWeek.toString();
	}
	
	const newItem = {
		name: 'New Item',
		enabled: true,
		days: defaultDays,
		startHour: 8,
		startMin: 0,
		endHour: 9,
		endMin: 0,
		image: scheduleImages.length > 0 ? scheduleImages[0].name : '',
		progressBar: true,
		index: currentScheduleData.items.length
	};
	
	currentScheduleData.items.push(newItem);
	renderScheduleItems();
}

// Render schedule items list
function renderScheduleItems() {
	const container = document.getElementById('schedule-items-list');
	
	if (!currentScheduleData || currentScheduleData.items.length === 0) {
		container.innerHTML = '<p class="empty-message">No items. Click "➕" to add one.</p>';
		return;
	}
	
	// Update preview dropdown
	const previewSelect = document.getElementById('preview-item-select');
	if (previewSelect) {
		const options = currentScheduleData.items.map((item, index) => 
			`<option value="${index}">${item.name}</option>`
		).join('');
		previewSelect.innerHTML = '<option value="">Select item...</option>' + options;
	}
	
	const isDateSpecific = currentScheduleData.type !== 'default';
	const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
	
	const itemsHTML = currentScheduleData.items.map((item, index) => {
		const imageOptions = scheduleImages.length > 0 
			? scheduleImages.map(img => `<option value="${img.name}" ${img.name === item.image ? 'selected' : ''}>${img.name}</option>`).join('')
			: '<option value="">No images available</option>';
		
		// For date-specific schedules, show which day it is (read-only)
		let daysHTML = '';
		if (isDateSpecific && currentScheduleData.date) {
			const scheduleDate = new Date(currentScheduleData.date + 'T00:00:00');
			const dayOfWeek = (scheduleDate.getDay() + 6) % 7;
			daysHTML = `<span class="day-badge">${dayNames[dayOfWeek]}</span>`;
		} else if (isDateSpecific) {
			daysHTML = `<span class="day-badge-placeholder">Select date above</span>`;
		} else {
			// For default schedule, show day checkboxes
			daysHTML = `
				<div class="day-checkboxes" id="days-${index}">
					${dayNames.map((day, dayIndex) => `
						<label class="day-checkbox ${item.days.includes(dayIndex.toString()) ? 'checked' : ''}">
							<input type="checkbox" 
								   value="${dayIndex}" 
								   ${item.days.includes(dayIndex.toString()) ? 'checked' : ''}
								   onchange="updateScheduleDays(${index}, this)">
							${day}
						</label>
					`).join('')}
				</div>
			`;
		}
		
		return `
			<div class="schedule-item">
				<div class="schedule-item-header">
					<input type="text" 
						   class="item-name-input" 
						   value="${item.name}" 
						   onchange="updateScheduleItem(${index}, 'name', this.value)" 
						   placeholder="Item name">
					<label class="item-enabled">
						<input type="checkbox" 
							   ${item.enabled ? 'checked' : ''} 
							   onchange="updateScheduleItem(${index}, 'enabled', this.checked)">
						Enabled
					</label>
					<button class="btn-pixel btn-secondary btn-sm" onclick="deleteScheduleItem(${index})">🗑️</button>
				</div>
				
				<div class="schedule-item-body">
					<div class="schedule-item-row">
						<label class="item-label">Days:</label>
						${daysHTML}
					</div>
					
					<div class="schedule-item-row">
						<label class="item-label">Time:</label>
						<div class="time-inputs">
							<input type="number" value="${item.startHour}" onchange="updateScheduleItem(${index}, 'startHour', this.value)" min="0" max="23" class="time-input-large">
							:
							<input type="number" value="${String(item.startMin).padStart(2,'0')}" onchange="updateScheduleItem(${index}, 'startMin', this.value)" min="0" max="59" class="time-input-large">
							<span class="time-separator">to</span>
							<input type="number" value="${item.endHour}" onchange="updateScheduleItem(${index}, 'endHour', this.value)" min="0" max="23" class="time-input-large">
							:
							<input type="number" value="${String(item.endMin).padStart(2,'0')}" onchange="updateScheduleItem(${index}, 'endMin', this.value)" min="0" max="59" class="time-input-large">
						</div>
					</div>
					
					<div class="schedule-item-row">
						<label class="item-label">Image:</label>
						<select class="image-select" onchange="updateScheduleItem(${index}, 'image', this.value)">
							${imageOptions}
						</select>
						<label class="progress-label">
							<input type="checkbox" 
								   ${item.progressBar ? 'checked' : ''} 
								   onchange="updateScheduleItem(${index}, 'progressBar', this.checked)">
							Progress Bar
						</label>
					</div>
				</div>
			</div>
		`;
	}).join('');
	
	container.innerHTML = itemsHTML;
	updateTimelineView();
}

// Update schedule days (for checkbox toggles)
function updateScheduleDays(index, checkbox) {
	if (!currentScheduleData || !currentScheduleData.items[index]) return;
	
	const dayValue = checkbox.value;
	let currentDays = currentScheduleData.items[index].days;
	
	if (checkbox.checked) {
		if (!currentDays.includes(dayValue)) {
			const daysArray = currentDays.split('').concat([dayValue]).sort();
			currentDays = daysArray.join('');
		}
	} else {
		currentDays = currentDays.replace(dayValue, '');
	}
	
	currentScheduleData.items[index].days = currentDays;
	checkbox.parentElement.classList.toggle('checked', checkbox.checked);
	updateTimelineView();
}

// Update schedule item
function updateScheduleItem(index, field, value) {
	if (!currentScheduleData || !currentScheduleData.items[index]) return;
	
	if (field === 'enabled' || field === 'progressBar') {
		currentScheduleData.items[index][field] = value;
	} else if (field === 'startHour' || field === 'startMin' || field === 'endHour' || field === 'endMin') {
		currentScheduleData.items[index][field] = parseInt(value);
	} else {
		currentScheduleData.items[index][field] = value;
	}
	
	updateTimelineView();
}

// Delete schedule item
function deleteScheduleItem(index) {
	if (!currentScheduleData) return;
	
	if (confirm('Delete this schedule item?')) {
		currentScheduleData.items.splice(index, 1);
		currentScheduleData.items.forEach((item, i) => item.index = i);
		renderScheduleItems();
		updateTimelineView();
	}
}

// Update timeline view - FIXED: Shows gaps and proportional spacing
function updateTimelineView() {
	const container = document.getElementById('timeline-view');
	const dayFilterSelect = document.getElementById('timeline-day-filter');
	const dateDisplay = document.getElementById('timeline-date-display');
	
	if (!currentScheduleData || currentScheduleData.items.length === 0) {
		container.innerHTML = '<p class="empty-message">No items to display</p>';
		return;
	}
	
	// [Keep existing day filter logic here - don't change]
	let dayFilter;
	if (currentScheduleData.type !== 'default' && currentScheduleData.date) {
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
		dayFilter = (scheduleDate.getDay() + 6) % 7;
	} else {
		if (dayFilterSelect) {
			dayFilterSelect.style.display = 'block';
		}
		if (dateDisplay) {
			dateDisplay.style.display = 'none';
			dateDisplay.classList.add('hidden');
		}
		dayFilter = parseInt(dayFilterSelect?.value || 0);
	}
	
	const dayItems = currentScheduleData.items.filter(item => 
		item.enabled && item.days.includes(dayFilter.toString())
	);
	
	if (dayItems.length === 0) {
		container.innerHTML = '<p class="empty-message">No items for this day</p>';
		return;
	}
	
	dayItems.sort((a, b) => {
		const aStart = a.startHour * 60 + a.startMin;
		const bStart = b.startHour * 60 + b.startMin;
		return aStart - bStart;
	});
	
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
	
	// FIXED: Calculate total schedule duration
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
	
	// FIXED: Better proportions
	const GAP_HEIGHT = 25; // Fixed gap height
	const totalGapHeight = gapCount * GAP_HEIGHT;
	
	// FIXED: Use remaining space for schedule items
	const MIN_CONTAINER_HEIGHT = 400; // Minimum readable height
	const AVAILABLE_HEIGHT = Math.max(500, totalScheduleMinutes * 2.5); // Increased from 1.5 to 2.5 // More generous space
	
	// Calculate pixels per minute for schedule items only
	const pixelsPerScheduleMinute = AVAILABLE_HEIGHT / totalScheduleMinutes;
	
	// Total container height
	const containerHeight = AVAILABLE_HEIGHT + totalGapHeight + 40;
	
	let timelineHTML = '';
	currentMinute = 0;
	let currentTopOffset = 20;
	
	dayItems.forEach((item, idx) => {
		const startMinutes = item.startHour * 60 + item.startMin;
		const endMinutes = item.endHour * 60 + item.endMin;

		// Declare variables needed for rendering
		const hasOverlap = overlaps.includes(item.index);
		const duration = endMinutes - startMinutes;
		const MIN_ITEM_HEIGHT = 40; // Minimum 40px for readability
		const calculatedHeight = duration * pixelsPerScheduleMinute;
		const itemHeight = Math.max(MIN_ITEM_HEIGHT, calculatedHeight);

		// Render gap - FIXED HEIGHT
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

		// Render schedule item - PROPORTIONAL TO SCHEDULE TIME
		
		timelineHTML += `
			<div class="timeline-item ${hasOverlap ? 'overlap' : ''}" 
				 style="top: ${currentTopOffset}px; height: ${itemHeight}px;"
				 onclick="selectScheduleItem(${item.index})">
				<div class="timeline-item-content">
					<span class="time">${String(item.startHour).padStart(2,'0')}:${String(item.startMin).padStart(2,'0')} - ${String(item.endHour).padStart(2,'0')}:${String(item.endMin).padStart(2,'0')}</span>
					<span class="name">${item.name}</span>
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
				<div class="gap-content">
					<span class="gap-text">FREE ${String(startHour).padStart(2,'0')}:${String(startMin).padStart(2,'0')} - 24:00 (${timeText})</span>
				</div>
			</div>
		`;
	}
	
	container.innerHTML = `
		<div class="timeline-container" style="height: ${containerHeight}px;">
			${timelineHTML}
		</div>
	`;
}

// Select schedule item for preview
async function selectScheduleItem(index) {
	document.getElementById('preview-item-select').value = index;
	await updateSchedulePreview();
}

// Update schedule preview - FIXED: 74% progress, no slider
async function updateSchedulePreview() {
	const itemIndex = document.getElementById('preview-item-select').value;
	
	if (!currentScheduleData || itemIndex === '' || !currentScheduleData.items[itemIndex]) {
		return;
	}
	
	const item = currentScheduleData.items[itemIndex];
	
	// Create or get schedule matrix emulator
	if (!scheduleMatrix) {
		const container = document.getElementById('matrix-container-schedule');
		if (container) {
			scheduleMatrix = new MatrixEmulator('matrix-container-schedule', 64, 32, 6);
		}
	}
	
	if (!scheduleMatrix) return;
	
	// Clear matrix
	scheduleMatrix.clear();
	
	// FIXED: Image and progress bar positioned on the right (x=23, 1px margin from right edge)
	// Right edge is at x=64, so x=23 gives us 64-23=41 pixels, leaving 40px for image/bar + 1px margin
	const IMAGE_X = 23;
	const IMAGE_Y = 2;
	const PROGRESS_X = 23;
	const PROGRESS_Y = 30;
	
	// Load and draw the schedule image (40x28)
	if (item.image && item.image.endsWith('.bmp')) {
		const imageData = await loadScheduleBMPImage(item.image);
		if (imageData) {
			scheduleMatrix.drawImage(imageData, IMAGE_X, IMAGE_Y);
		}
	}
	
	// Draw progress bar if enabled - FIXED: Always at 74%
	if (item.progressBar) {
		drawProgressBar(scheduleMatrix, 74, PROGRESS_X, PROGRESS_Y);
	}
	
	scheduleMatrix.render();
}

// Draw progress bar on schedule matrix - FIXED: Position parameters added
function drawProgressBar(matrix, progressPercent, x, y) {
	const PROGRESS_BAR_WIDTH = 40;
	const PROGRESS_BAR_HEIGHT = 2;
	
	const MINT = '#00FFAA';
	const LILAC = '#AA00FF';
	const WHITE = '#FFFFFF';
	
	// Draw background (MINT)
	matrix.fillRect(x, y, PROGRESS_BAR_WIDTH, PROGRESS_BAR_HEIGHT, MINT);
	
	// Draw filled portion (LILAC)
	const filledWidth = Math.floor((progressPercent / 100) * PROGRESS_BAR_WIDTH);
	if (filledWidth > 0) {
		matrix.fillRect(x, y, filledWidth, PROGRESS_BAR_HEIGHT, LILAC);
	}
	
	// Draw dividers at 0%, 25%, 50%, 75%, 100%
	const dividerPositions = [0, 10, 20, 30, 40];
	dividerPositions.forEach(pos => {
		matrix.setPixel(x + pos, y, WHITE);
		matrix.setPixel(x + pos, y + 1, WHITE);
	});
}

// Save schedule to GitHub - FIXED: Handles all modes correctly
async function saveSchedule() {
	if (!currentScheduleData) return;

	if (!validateUniqueNames()) {
		return;
	}
	
	let filename;
	
	if (currentScheduleData.type === 'default') {
		filename = 'default.csv';
	} else {
		// For date-specific schedules (both new and edit)
		const date = document.getElementById('schedule-date')?.value || currentScheduleData.date;
		if (!date) {
			showStatus('Please select a date', 'error');
			return;
		}
		filename = `${date}.csv`;
		currentScheduleData.date = date;
	}
	
	const config = loadConfig();
	
	try {
		// Generate CSV content
		const csvContent = generateScheduleCSV();
		const encodedContent = btoa(unescape(encodeURIComponent(csvContent)));
		
		// Get current SHA if updating existing file
		let sha = currentScheduleData.sha;
		if (!sha) {
			try {
				const getResponse = await fetch(
					`https://api.github.com/repos/${config.owner}/${config.repo}/contents/schedules/${filename}`,
					{
						headers: {
							'Authorization': `Bearer ${config.token}`,
							'Accept': 'application/vnd.github.v3+json'
						}
					}
				);
				
				if (getResponse.ok) {
					const getData = await getResponse.json();
					sha = getData.sha;
				}
			} catch (e) {
				console.log('File does not exist yet, will create new');
			}
		}
		
		// Save to GitHub
		const response = await fetch(
			`https://api.github.com/repos/${config.owner}/${config.repo}/contents/schedules/${filename}`,
			{
				method: 'PUT',
				headers: {
					'Authorization': `Bearer ${config.token}`,
					'Accept': 'application/vnd.github.v3+json',
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					message: `Update schedule: ${filename}`,
					content: encodedContent,
					sha: sha
				})
			}
		);
		
		if (!response.ok) {
			throw new Error(`GitHub API error: ${response.status}`);
		}
		
		showStatus('Schedule saved successfully!', 'success');
				
		// CRITICAL: Add delay then reload schedules to get fresh data from GitHub
		// This ensures we see the changes we just made
		setTimeout(async () => {
			await loadSchedules(); // Force refresh from GitHub
		}, 1000);
		
		closeScheduleEditor();
		
	} catch (error) {
		console.error('Error saving schedule:', error);
		showStatus('Failed to save schedule: ' + error.message, 'error');
	}
}

// Validate unique names - NEW FUNCTION
function validateUniqueNames() {
	if (!currentScheduleData || !currentScheduleData.items) return true;
	
	const names = currentScheduleData.items.map(item => item.name.trim().toLowerCase());
	const uniqueNames = new Set(names);
	
	if (names.length !== uniqueNames.size) {
		// Find duplicates
		const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
		const uniqueDuplicates = [...new Set(duplicates)];
		
		showStatus(`Duplicate names found: ${uniqueDuplicates.join(', ')}. Each item must have a unique name.`, 'error');
		return false;
	}
	
	return true;
}

// Generate CSV content
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

// Duplicate schedule
async function duplicateSchedule(filename) {
	const date = prompt('Enter date for new schedule (YYYY-MM-DD):');
	if (!date) return;
	
	const schedule = currentSchedules.find(s => s.name === filename);
	if (!schedule) return;
	
	try {
		const response = await fetch(schedule.url);
		const content = await response.text();
		
		currentScheduleData = {
			type: 'new-date',
			date: date,
			items: parseScheduleCSV(content),
			isNew: true
		};
		
		await saveSchedule();
		
	} catch (error) {
		showStatus('Failed to duplicate schedule', 'error');
	}
}

// Delete schedule
async function deleteSchedule(filename) {
	if (!confirm(`Delete ${filename}?`)) return;
	
	const config = loadConfig();
	const schedule = currentSchedules.find(s => s.name === filename);
	
	if (!schedule) return;
	
	try {
		const response = await fetch(
			`https://api.github.com/repos/${config.owner}/${config.repo}/contents/schedules/${filename}`,
			{
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${config.token}`,
					'Accept': 'application/vnd.github.v3+json',
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					message: `Delete schedule: ${filename}`,
					sha: schedule.sha
				})
			}
		);
		
		if (!response.ok) {
			throw new Error(`GitHub API error: ${response.status}`);
		}
		
		showStatus('Schedule deleted', 'success');
		loadSchedules();
		
	} catch (error) {
		showStatus('Failed to delete schedule', 'error');
	}
}

// Clear old schedules
async function clearOldSchedules() {
	const cutoffDate = new Date();
	cutoffDate.setDate(cutoffDate.getDate() - 30);
	
	const oldSchedules = currentSchedules.filter(s => 
		s.date && new Date(s.date) < cutoffDate
	);
	
	if (oldSchedules.length === 0) {
		showStatus('No old schedules to clear', 'error');
		return;
	}
	
	if (!confirm(`Delete ${oldSchedules.length} schedule(s) older than 30 days?`)) {
		return;
	}
	
	for (const schedule of oldSchedules) {
		try {
			await deleteSchedule(schedule.name);
		} catch (error) {
			console.error('Error deleting:', schedule.name);
		}
	}
	
	loadSchedules();
}

// Helper functions
function showSchedulesLoading() {
	document.getElementById('schedules-loading').classList.remove('hidden');
	document.getElementById('schedules-error').classList.add('hidden');
	document.getElementById('schedules-empty').classList.add('hidden');
}

function showSchedulesError(message) {
	document.getElementById('schedules-loading').classList.add('hidden');
	document.getElementById('schedules-error').classList.remove('hidden');
	document.getElementById('schedules-error').textContent = message;
	document.getElementById('schedules-empty').classList.add('hidden');
}

function showSchedulesEmpty() {
	document.getElementById('schedules-loading').classList.add('hidden');
	document.getElementById('schedules-error').classList.add('hidden');
	document.getElementById('schedules-empty').classList.remove('hidden');
}

function hideSchedulesMessages() {
	document.getElementById('schedules-loading').classList.add('hidden');
	document.getElementById('schedules-error').classList.add('hidden');
	document.getElementById('schedules-empty').classList.add('hidden');
}
