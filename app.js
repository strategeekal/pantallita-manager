// Configuration storage key
const CONFIG_KEY = 'screeny_config';

// Global matrix emulator instance
let matrix = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
	console.log('SCREENY Manager loaded!');
	
	// Initialize matrix emulator
	matrix = new MatrixEmulator('matrix-container', 64, 32, 8);
	
	// Setup tabs
	setupTabs();
	
	// Setup forms
	setupForms();
	
	// Load saved settings
	loadSettings();
	
	// Show initial preview
	updatePreview();
});

// Tab switching
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
		});
	});
}

// Form setup
function setupForms() {
	// Settings form
	document.getElementById('settings-form').addEventListener('submit', handleSettingsSubmit);
	
	// Character counters
	document.getElementById('preview-top').addEventListener('input', (e) => {
		const count = e.target.value.length;
		document.getElementById('top-count').textContent = `${count}/12`;
		updatePreview();
	});
	
	document.getElementById('preview-bottom').addEventListener('input', (e) => {
		const count = e.target.value.length;
		document.getElementById('bottom-count').textContent = `${count}/12`;
		updatePreview();
	});
	
	// Color preview
	document.getElementById('preview-color').addEventListener('change', (e) => {
		const colorName = e.target.value;
		const colorHex = COLOR_MAP[colorName];
		document.getElementById('color-preview').style.background = colorHex;
		updatePreview();
	});
	
	// Update preview on icon change
	document.getElementById('preview-icon').addEventListener('change', updatePreview);
}

// Update matrix preview
function updatePreview() {
    if (!matrix) return;
    
    // Constants matching your SCREENY code
    const TEXT_MARGIN = 2;
    const EVENT_IMAGE_X = 37;  // For 25px wide images
    const EVENT_IMAGE_Y = 2;
    
    // Get form values
    const topLine = document.getElementById('preview-top').value || '';
    const bottomLine = document.getElementById('preview-bottom').value || '';
    const colorName = document.getElementById('preview-color').value;
    const iconName = document.getElementById('preview-icon').value;
    
    const color = COLOR_MAP[colorName];
    
    // Clear matrix
    matrix.clear();
    
    // Draw icon at correct position (x=37, y=2)
    const icon = SIMPLE_ICONS[iconName];
    if (icon) {
        matrix.drawImage(icon, EVENT_IMAGE_X, EVENT_IMAGE_Y);
    }
    
    // Calculate bottom-aligned text positions using TINYBIT font
    // This matches your Python code exactly!
    const positions = matrix.calculateBottomAlignedPositions(
        TINYBIT_FONT,
        topLine,
        bottomLine,
        32  // Display height
    );
    
    // Draw text using actual tinybit6-16 font
    if (topLine) {
        matrix.drawTextWithFont(topLine, TEXT_MARGIN, positions.line1Y, color, TINYBIT_FONT);
    }
    
    if (bottomLine) {
        matrix.drawTextWithFont(bottomLine, TEXT_MARGIN, positions.line2Y, color, TINYBIT_FONT);
    }
    
    // Render
    matrix.render();
}

// Clear preview
function clearPreview() {
	document.getElementById('preview-top').value = '';
	document.getElementById('preview-bottom').value = '';
	document.getElementById('top-count').textContent = '0/12';
	document.getElementById('bottom-count').textContent = '0/12';
	
	if (matrix) {
		matrix.clear();
	}
}

// Settings management
function loadSettings() {
	const config = loadConfig();
	if (config.token)
	if (config.token) document.getElementById('github-token').value = config.token;
	if (config.owner) document.getElementById('github-owner').value = config.owner;
	if (config.repo) document.getElementById('github-repo').value = config.repo;
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

// Image loading functionality
let availableImages = [];
let imageCache = {};

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
        
        // Update dropdown
        updateImageDropdown();
        
    } catch (error) {
        console.error('Error loading images:', error);
    }
}

// Update image dropdown with available images
function updateImageDropdown() {
    const select = document.getElementById('preview-icon');
    
    if (availableImages.length === 0) {
        // Use placeholder icons
        select.innerHTML = `
            <option value="halloween">Halloween 🎃 (placeholder)</option>
            <option value="heart">Heart ❤️ (placeholder)</option>
            <option value="star">Star ⭐ (placeholder)</option>
            <option value="sun">Sun ☀️ (placeholder)</option>
            <option value="cloud">Cloud ☁️ (placeholder)</option>
        `;
    } else {
        // Use real images from GitHub
        select.innerHTML = availableImages.map(img => 
            `<option value="${img.name}">${img.name}</option>`
        ).join('');
    }
}

// Load and parse BMP image from GitHub
async function loadBMPImage(imageName) {
    const config = loadConfig();
    
    // Check cache first
    if (imageCache[imageName]) {
        return imageCache[imageName];
    }
    
    // Find image info
    const imageInfo = availableImages.find(img => img.name === imageName);
    if (!imageInfo) {
        console.error('Image not found:', imageName);
        return null;
    }
    
    try {
        // Fetch the BMP file
        const response = await fetch(imageInfo.url);
        const arrayBuffer = await response.arrayBuffer();
        const dataView = new DataView(arrayBuffer);
        
        // Parse BMP header
        const fileSize = dataView.getUint32(2, true);
        const dataOffset = dataView.getUint32(10, true);
        const width = dataView.getInt32(18, true);
        const height = dataView.getInt32(22, true);
        const bitsPerPixel = dataView.getUint16(28, true);
        
        console.log('BMP Info:', { imageName, width, height, bitsPerPixel, dataOffset });
        
        // Create 2D array for pixels (28 rows × 25 cols)
        const pixels = Array(28).fill(null).map(() => Array(25).fill('transparent'));
        
        // BMP stores pixels bottom-to-top, so we need to flip
        for (let row = 0; row < 28; row++) {
            for (let col = 0; col < 25; col++) {
                // Calculate position in BMP data (bottom-to-top)
                const bmpRow = (27 - row);  // Flip vertically
                const pixelIndex = dataOffset + (bmpRow * width + col) * (bitsPerPixel / 8);
                
                if (bitsPerPixel === 24) {
                    // 24-bit BMP (BGR format)
                    const b = dataView.getUint8(pixelIndex);
                    const g = dataView.getUint8(pixelIndex + 1);
                    const r = dataView.getUint8(pixelIndex + 2);
                    
                    // Check if pixel is black (transparent in your case?)
                    if (r === 0 && g === 0 && b === 0) {
                        pixels[row][col] = 'transparent';
                    } else {
                        pixels[row][col] = `rgb(${r},${g},${b})`;
                    }
                } else if (bitsPerPixel === 16) {
                    // 16-bit BMP (RGB565 format)
                    const pixel = dataView.getUint16(pixelIndex, true);
                    const r = ((pixel >> 11) & 0x1F) * 8;
                    const g = ((pixel >> 5) & 0x3F) * 4;
                    const b = (pixel & 0x1F) * 8;
                    
                    if (r === 0 && g === 0 && b === 0) {
                        pixels[row][col] = 'transparent';
                    } else {
                        pixels[row][col] = `rgb(${r},${g},${b})`;
                    }
                }
            }
        }
        
        // Cache the result
        imageCache[imageName] = pixels;
        
        return pixels;
        
    } catch (error) {
        console.error('Error loading BMP:', error);
        return null;
    }
}
