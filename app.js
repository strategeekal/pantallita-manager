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
    }
}

// Initialize editor tab (for add/edit)
function initializeEditorTab() {
    console.log('Initializing editor tab, isMobile:', isMobile, 'already initialized:', editorTabInitialized);
    
    // Only initialize once
    if (editorTabInitialized && !isEditMode) {
        console.log('Editor tab already initialized, skipping');
        return;
    }
    
    // Setup event form handlers only once
    if (!editorTabInitialized) {
        setupEventFormHandlers();
        populateImageDropdown();
        editorTabInitialized = true;
    }
    
    // On mobile, skip the heavy emulator entirely
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
    } else {
        // Clear form for new event (but only if already initialized)
        if (editorTabInitialized) {
            clearEventForm();
        }
    }
    
    // Update preview (mobile will show text, desktop will show matrix)
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
