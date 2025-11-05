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
    
    // Load available images from GitHub
    loadAvailableImages();
    
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

async function updatePreview() {
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
    
    // Load and draw icon
    let icon = null;
    
    if (availableImages.length > 0 && iconName.endsWith('.bmp')) {
        // Load real BMP from GitHub
        icon = await loadBMPImage(iconName);
    } else {
        // Use placeholder icon
        icon = SIMPLE_ICONS[iconName];
    }
    
    if (icon) {
        matrix.drawImage(icon, EVENT_IMAGE_X, EVENT_IMAGE_Y);
    }
    
    // Calculate bottom-aligned text positions using TINYBIT font
    const positions = matrix.calculateBottomAlignedPositions(
        TINYBIT_FONT,
        topLine,
        bottomLine,
        32
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
    
    console.log('Loading image:', imageName);
    
    // Check cache first
    if (imageCache[imageName]) {
        console.log('Using cached image:', imageName);
        return imageCache[imageName];
    }
    
    // Find image info
    const imageInfo = availableImages.find(img => img.name === imageName);
    if (!imageInfo) {
        console.error('Image not found in availableImages:', imageName);
        return null;
    }
    
    console.log('Fetching from URL:', imageInfo.url);
    
    try {
        // Fetch the BMP file
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
        const height = Math.abs(dataView.getInt32(22, true)); // Handle negative height
        const bitsPerPixel = dataView.getUint16(28, true);
        const compression = dataView.getUint32(30, true);
        
        console.log('BMP Info:', { 
            imageName, 
            width, 
            height, 
            bitsPerPixel, 
            compression,
            dataOffset
        });
        
        // Validate dimensions
        if (width !== 25 || height !== 28) {
            console.warn('Unexpected dimensions! Expected 25x28, got', width, 'x', height);
        }
        
        // Parse color palette for 8-bit BMPs
        let palette = [];
        if (bitsPerPixel === 8) {
            const paletteSize = dataView.getUint32(46, true) || 256; // Number of colors
            console.log('Reading', paletteSize, 'color palette entries');
            
            // Palette starts at byte 54 (after 40-byte info header + 14-byte file header)
            for (let i = 0; i < paletteSize; i++) {
                const paletteIndex = 54 + (i * 4);
                const b = dataView.getUint8(paletteIndex);
                const g = dataView.getUint8(paletteIndex + 1);
                const r = dataView.getUint8(paletteIndex + 2);
                // 4th byte is reserved (usually 0)
                palette.push({ r, g, b });
            }
            
            console.log('First 5 palette colors:', palette.slice(0, 5));
        }
        
        // Create 2D array for pixels (28 rows × 25 cols)
        const pixels = Array(28).fill(null).map(() => Array(25).fill('transparent'));
        
        // BMP stores pixels bottom-to-top
        let pixelsSet = 0;
        
        for (let row = 0; row < 28; row++) {
            for (let col = 0; col < 25; col++) {
                // Calculate position in BMP data (bottom-to-top)
                const bmpRow = (27 - row);  // Flip vertically
                
                let r, g, b;
                
                if (bitsPerPixel === 8) {
                    // 8-bit indexed color
                    // Row padding: rows are padded to 4-byte boundaries
                    const rowSize = Math.floor((width * bitsPerPixel + 31) / 32) * 4;
                    const pixelIndex = dataOffset + (bmpRow * rowSize) + col;
                    
                    const colorIndex = dataView.getUint8(pixelIndex);
                    
                    if (colorIndex < palette.length) {
                        r = palette[colorIndex].r;
                        g = palette[colorIndex].g;
                        b = palette[colorIndex].b;
                    } else {
                        console.warn('Color index out of range:', colorIndex);
                        r = g = b = 0;
                    }
                    
                } else if (bitsPerPixel === 24) {
                    // 24-bit RGB
                    const rowSize = Math.floor((width * 24 + 31) / 32) * 4;
                    const pixelIndex = dataOffset + (bmpRow * rowSize) + (col * 3);
                    
                    b = dataView.getUint8(pixelIndex);
                    g = dataView.getUint8(pixelIndex + 1);
                    r = dataView.getUint8(pixelIndex + 2);
                    
                } else if (bitsPerPixel === 16) {
                    // 16-bit RGB565
                    const rowSize = Math.floor((width * 16 + 31) / 32) * 4;
                    const pixelIndex = dataOffset + (bmpRow * rowSize) + (col * 2);
                    
                    const pixel = dataView.getUint16(pixelIndex, true);
                    r = ((pixel >> 11) & 0x1F) * 8;
                    g = ((pixel >> 5) & 0x3F) * 4;
                    b = (pixel & 0x1F) * 8;
                    
                } else {
                    console.error('Unsupported BMP format:', bitsPerPixel, 'bits per pixel');
                    return null;
                }
                
                // Check if pixel is black (treat as transparent)
                // Use threshold for near-black pixels
                if (r < 10 && g < 10 && b < 10) {
                    pixels[row][col] = 'transparent';
                } else {
                    pixels[row][col] = `rgb(${r},${g},${b})`;
                    pixelsSet++;
                }
            }
        }
        
        console.log('Pixels set:', pixelsSet, 'out of', 25 * 28);
        console.log('Sample pixel colors:', pixels[10].slice(10, 15));
        
        // Cache the result
        imageCache[imageName] = pixels;
        
        return pixels;
        
    } catch (error) {
        console.error('Error loading BMP:', error);
        console.error('Error stack:', error.stack);
        return null;
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
