// Configuration storage key
const CONFIG_KEY = 'screeny_config';

// Global matrix emulator instances
let landingMatrix = null;
let previewMatrix = null;

// Image loading functionality
let availableImages = [];
let imageCache = {};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('SCREENY Manager loaded!');
    
    // Create pixelated background
    createPixelBackground();
    
    // Initialize landing matrix emulator
    landingMatrix = new MatrixEmulator('matrix-container', 64, 32, 6); // Smaller pixel size for landing
    
    // Display "Hello!" centered on landing page
    displayHello(landingMatrix);
    
    // Load saved settings
    loadSettings();
    
    // Load available images from GitHub (silently, don't show errors on landing)
    loadAvailableImages();
});

// Create pixelated background similar to the reference image
function createPixelBackground() {
    const canvas = document.getElementById('pixel-background');
    const ctx = canvas.getContext('2d');
    
    // Set canvas to full window size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const pixelSize = 20; // Size of each "pixel" in the background
    const cols = Math.ceil(canvas.width / pixelSize);
    const rows = Math.ceil(canvas.height / pixelSize);
    
    // Base colors - shades of blue similar to the reference image
    const baseColors = [
        { r: 10, g: 30, b: 80 },    // Dark blue
        { r: 20, g: 50, b: 120 },   // Medium dark blue
        { r: 30, g: 70, b: 150 },   // Medium blue
        { r: 50, g: 100, b: 180 },  // Light medium blue
        { r: 80, g: 130, b: 200 },  // Light blue
        { r: 100, g: 160, b: 220 }  // Lightest blue
    ];
    
    // Draw pixelated background
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            // Create variation using perlin-like noise simulation
            const noiseValue = Math.sin(col * 0.1) * Math.cos(row * 0.1);
            const colorIndex = Math.floor((noiseValue + 1) * 0.5 * (baseColors.length - 1));
            const baseColor = baseColors[Math.max(0, Math.min(colorIndex, baseColors.length - 1))];
            
            // Add some randomness
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

// Display "Hello!" centered on the matrix
function displayHello(matrix) {
    if (!matrix) return;
    
    matrix.clear();
    
    const text = "Hello!";
    const font = TINYBIT_FONT;
    
    // Calculate text width
    let textWidth = 0;
    for (let char of text.toUpperCase()) {
        const glyph = font.glyphs[char];
        if (glyph) {
            textWidth += glyph.width + 1; // +1 for character spacing
        }
    }
    textWidth -= 1; // Remove last spacing
    
    // Center horizontally
    const x = Math.floor((64 - textWidth) / 2);
    
    // Center vertically (matrix height is 32)
    const y = Math.floor((32 - 6) / 2); // 6 is approximate font height
    
    // Draw text in cyan/mint color
    matrix.drawTextWithFont(text, x, y, '#00FFAA', font);
    
    matrix.render();
}

// Show main app (hide landing page)
function showApp() {
    document.getElementById('landing-page').style.display = 'none';
    document.getElementById('main-app').classList.remove('hidden');
    
    // Initialize preview matrix if not already done
    if (!previewMatrix) {
        previewMatrix = new MatrixEmulator('matrix-container-preview', 64, 32, 8);
        
        // Setup forms and tabs
        setupTabs();
        setupForms();
        updatePreview();
    }
}

// Scroll to about section
function scrollToAbout() {
    document.getElementById('about-section').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
}

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
    document.getElementById('preview-icon').addEventListener('change', () => {
        console.log('Icon dropdown changed');
        updatePreview();
    });
}

// Update matrix preview
async function updatePreview() {
    if (!previewMatrix) return;
    
    console.log('updatePreview called');
    
    // Constants matching your SCREENY code
    const TEXT_MARGIN = 2;
    const EVENT_IMAGE_X = 37;
    const EVENT_IMAGE_Y = 2;
    
    // Get form values
    const topLine = document.getElementById('preview-top').value || '';
    const bottomLine = document.getElementById('preview-bottom').value || '';
    const colorName = document.getElementById('preview-color').value;
    const iconName = document.getElementById('preview-icon').value;
    
    console.log('Selected icon:', iconName);
    console.log('Available images count:', availableImages.length);
    
    const bottomColor = COLOR_MAP[colorName];
    const topColor = COLOR_MAP['WHITE']; // Top line is always white
    
    // Clear matrix
    previewMatrix.clear();
    
    // Load and draw icon
    let icon = null;
    
    if (availableImages.length > 0 && iconName.endsWith('.bmp')) {
        console.log('Loading BMP image:', iconName);
        icon = await loadBMPImage(iconName);
        console.log('Image loaded:', icon ? 'success' : 'failed');
    } else {
        console.log('Using placeholder icon:', iconName);
        icon = SIMPLE_ICONS[iconName];
    }
    
    if (icon) {
        console.log('Drawing image at', EVENT_IMAGE_X, EVENT_IMAGE_Y);
        console.log('Icon dimensions:', icon.length, 'x', icon[0]?.length);
        previewMatrix.drawImage(icon, EVENT_IMAGE_X, EVENT_IMAGE_Y);
    } else {
        console.warn('No icon to draw!');
    }
    
    // Calculate bottom-aligned text positions
    const positions = previewMatrix.calculateBottomAlignedPositions(
        TINYBIT_FONT,
        topLine,
        bottomLine,
        32
    );
    
    // Draw text - TOP LINE IN WHITE, BOTTOM LINE IN SELECTED COLOR
    if (topLine) {
        previewMatrix.drawTextWithFont(topLine, TEXT_MARGIN, positions.line1Y, topColor, TINYBIT_FONT);
    }
    
    if (bottomLine) {
        previewMatrix.drawTextWithFont(bottomLine, TEXT_MARGIN, positions.line2Y, bottomColor, TINYBIT_FONT);
    }
    
    // Render
    previewMatrix.render();
}

// Clear preview
function clearPreview() {
    document.getElementById('preview-top').value = '';
    document.getElementById('preview-bottom').value = '';
    document.getElementById('top-count').textContent = '0/12';
    document.getElementById('bottom-count').textContent = '0/12';
    
    if (previewMatrix) {
        previewMatrix.clear();
        previewMatrix.render();
    }
}

// Settings management
function loadSettings() {
    const config = loadConfig();
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

// Load list of available images from GitHub
async function loadAvailableImages() {
    const config = loadConfig();
    
    if (!config.token || !config.owner || !config.repo) {
        console.log('GitHub not configured - using placeholder icons');
        updateImageDropdown();
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
            updateImageDropdown();
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
        updateImageDropdown();
    }
}

// Update image dropdown with available images
function updateImageDropdown() {
    const select = document.getElementById('preview-icon');
    
    if (!select) return; // May not exist on landing page
    
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

// Load and parse BMP image from GitHub (simplified for 8-bit only)
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
        // Palette starts at byte 54
        for (let i = 0; i < paletteSize; i++) {
            const paletteIndex = 54 + (i * 4);
            const b = dataView.getUint8(paletteIndex);
            const g = dataView.getUint8(paletteIndex + 1);
            const r = dataView.getUint8(paletteIndex + 2);
            palette.push({ r, g, b });
        }
        
        // Create 2D array for pixels (height × width)
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
