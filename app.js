// Configuration storage key
const CONFIG_KEY = 'screeny_config';

// Global matrix emulator instance
let matrix = null;

// Image loading functionality
let availableImages = [];
let imageCache = {};

// Global variables for events management
let currentEvents = [];
let eventMatrix = null;
let editMatrix = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('SCREENY Manager loaded!');
    
    // Create pixelated background
    createPixelBackground();
    
    // Draw pixelated feature icons
    drawFeatureIcons();
    
    // Initialize landing matrix emulator
    matrix = new MatrixEmulator('matrix-container', 64, 32, 6); // Smaller pixel size for landing
    
    // Display "Hello!" centered on landing page
    displayHello(matrix);
    
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

// Draw pixelated feature icons
function drawFeatureIcons() {
    // Calendar icon
    const calendarCanvas = document.getElementById('calendar-icon');
    if (calendarCanvas) {
        const ctx = calendarCanvas.getContext('2d');
        const pixelSize = 6;
        
        // Calendar design (8x8 grid)
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
        
        // Clock design (8x8 grid)
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
        
        // Eye design (8x8 grid)
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
    const fontHeight = 6; // Typical height for tinybit font
    const lineSpacing = 2; // Space between lines
    
    if (name && name.length <= 12) {
        // Two-line greeting: "Hello!" and name
        const line1 = "Hello!";
        const line2 = name;
        
        // Calculate total height needed
        const totalHeight = (fontHeight * 2) + lineSpacing;
        
        // Center vertically - start position for first line
        const startY = Math.floor((32 - totalHeight) / 2);
        
        // Line positions
        const line1Y = startY;
        const line2Y = startY + fontHeight + lineSpacing;
        
        // Draw both lines in mint color
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
        
        // Calculate text width
        let textWidth = 0;
        for (let char of text.toUpperCase()) {
            const glyph = font.glyphs[char];
            if (glyph) {
                textWidth += glyph.width + 1;
            }
        }
        textWidth -= 1;
        
        // Center horizontally
        const x = Math.floor((64 - textWidth) / 2);
        
        // Center vertically (matrix height is 32)
        const y = Math.floor((32 - fontHeight) / 2);
        
        // Draw text in mint color
        matrix.drawTextWithFont(text, x, y, '#00FFAA', font);
    }
    
    matrix.render();
}

// Show main app (hide landing page)
function showApp() {
    document.getElementById('landing-page').style.display = 'none';
    document.getElementById('main-app').classList.remove('hidden');
    
    // Setup tabs
    setupTabs();
    
    // Initialize Events tab immediately (it's now the default)
    initializeEventsTab();
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
            
            // Initialize events tab if switching to it
            if (targetTab === 'events') {
                initializeEventsTab();
            }
        });
    });
}

// Form setup
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

// ==================== EVENTS CRUD FUNCTIONALITY ====================

// Global variables for events management
let currentEvents = [];
let eventMatrix = null;
let editMatrix = null;

// Initialize events tab when shown
function initializeEventsTab() {
    if (!eventMatrix) {
        eventMatrix = new MatrixEmulator('matrix-container-event', 64, 32, 6);
        editMatrix = new MatrixEmulator('matrix-container-edit', 64, 32, 6);
        
        // Setup event form handlers
        setupEventFormHandlers();
        
        // Setup settings form handler
        document.getElementById('settings-form').addEventListener('submit', handleSettingsSubmit);
        
        // Populate image dropdowns
        populateEventImageDropdowns();
        
        // Load events from GitHub
        loadEvents();
    }
}

// Setup event form handlers
function setupEventFormHandlers() {
    // Character counters for add form
    document.getElementById('event-top').addEventListener('input', (e) => {
        const count = e.target.value.length;
        document.getElementById('event-top-count').textContent = `${count}/12`;
        updateEventPreview();
    });
    
    document.getElementById('event-bottom').addEventListener('input', (e) => {
        const count = e.target.value.length;
        document.getElementById('event-bottom-count').textContent = `${count}/12`;
        updateEventPreview();
    });
    
    // Character counters for edit form
    document.getElementById('edit-event-top').addEventListener('input', (e) => {
        const count = e.target.value.length;
        document.getElementById('edit-event-top-count').textContent = `${count}/12`;
        updateEditEventPreview();
    });
    
    document.getElementById('edit-event-bottom').addEventListener('input', (e) => {
        const count = e.target.value.length;
        document.getElementById('edit-event-bottom-count').textContent = `${count}/12`;
        updateEditEventPreview();
    });
    
    // Update preview on changes
    document.getElementById('event-image').addEventListener('change', updateEventPreview);
    document.getElementById('event-color').addEventListener('change', (e) => {
        const colorHex = COLOR_MAP[e.target.value];
        document.getElementById('event-color-preview').style.background = colorHex;
        updateEventPreview();
    });
    
    document.getElementById('edit-event-image').addEventListener('change', updateEditEventPreview);
    document.getElementById('edit-event-color').addEventListener('change', (e) => {
        const colorHex = COLOR_MAP[e.target.value];
        document.getElementById('edit-event-color-preview').style.background = colorHex;
        updateEditEventPreview();
    });
    
    // Toggle time fields
    document.getElementById('event-has-time').addEventListener('change', (e) => {
        document.getElementById('event-time-fields').classList.toggle('hidden', !e.target.checked);
    });
    
    document.getElementById('edit-event-has-time').addEventListener('change', (e) => {
        document.getElementById('edit-event-time-fields').classList.toggle('hidden', !e.target.checked);
    });
}

// Populate image dropdowns with available images
function populateEventImageDropdowns() {
    const addSelect = document.getElementById('event-image');
    const editSelect = document.getElementById('edit-event-image');
    const editColorSelect = document.getElementById('edit-event-color');
    
    if (availableImages.length > 0) {
        const options = availableImages.map(img => 
            `<option value="${img.name}">${img.name}</option>`
        ).join('');
        
        addSelect.innerHTML = '<option value="">Select an image...</option>' + options;
        editSelect.innerHTML = '<option value="">Select an image...</option>' + options;
    }
    
    // Populate edit color dropdown
    editColorSelect.innerHTML = `
        <option value="MINT">Mint</option>
        <option value="BUGAMBILIA">Bugambilia</option>
        <option value="LILAC">Lilac</option>
        <option value="RED">Red</option>
        <option value="GREEN">Green</option>
        <option value="BLUE">Blue</option>
        <option value="ORANGE">Orange</option>
        <option value="YELLOW">Yellow</option>
        <option value="PURPLE">Purple</option>
        <option value="PINK">Pink</option>
        <option value="AQUA">Aqua</option>
        <option value="WHITE">White</option>
    `;
}

// Update event preview
async function updateEventPreview() {
    if (!eventMatrix) return;
    
    const topLine = document.getElementById('event-top').value || '';
    const bottomLine = document.getElementById('event-bottom').value || '';
    const colorName = document.getElementById('event-color').value;
    const iconName = document.getElementById('event-image').value;
    
    await renderEventOnMatrix(eventMatrix, topLine, bottomLine, colorName, iconName);
}

// Update edit event preview
async function updateEditEventPreview() {
    if (!editMatrix) return;
    
    const topLine = document.getElementById('edit-event-top').value || '';
    const bottomLine = document.getElementById('edit-event-bottom').value || '';
    const colorName = document.getElementById('edit-event-color').value;
    const iconName = document.getElementById('edit-event-image').value;
    
    await renderEventOnMatrix(editMatrix, topLine, bottomLine, colorName, iconName);
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
    
    listContainer.innerHTML = sortedEvents.map(event => {
        const eventDate = new Date(event.date);
        const isPast = eventDate < today;
        
        const month = eventDate.toLocaleString('default', { month: 'short' }).toUpperCase();
        const day = eventDate.getDate();
        const year = eventDate.getFullYear();
        
        const timeInfo = event.startHour !== null && event.endHour !== null
            ? `<span class="event-time">Time: ${event.startHour}:00 - ${event.endHour}:00</span>`
            : '<span class="event-time">All Day</span>';
        
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
                    <p>${timeInfo}</p>
                </div>
                <div class="event-actions">
                    <button class="btn-pixel btn-primary" onclick="editEvent(${event.index})">✏️ Edit</button>
                    <button class="btn-pixel btn-secondary" onclick="deleteEvent(${event.index})">🗑️ Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

// Add new event
async function addEvent() {
    const date = document.getElementById('event-date').value;
    const topLine = document.getElementById('event-top').value;
    const bottomLine = document.getElementById('event-bottom').value;
    const image = document.getElementById('event-image').value;
    const color = document.getElementById('event-color').value;
    const hasTime = document.getElementById('event-has-time').checked;
    const startHour = hasTime ? document.getElementById('event-start-hour').value : '';
    const endHour = hasTime ? document.getElementById('event-end-hour').value : '';
    
    // Validation
    if (!date || !topLine || !bottomLine || !image || !color) {
        showStatus('Please fill in all required fields', 'error');
        return;
    }
    
    // Create event object
    const newEvent = {
        date,
        topLine,
        bottomLine,
        image,
        color,
        startHour: hasTime && startHour ? parseInt(startHour) : null,
        endHour: hasTime && endHour ? parseInt(endHour) : null
    };
    
    // Add to current events
    currentEvents.push(newEvent);
    
    // Save to GitHub
    await saveEventsToGitHub();
    
    // Clear form
    clearEventForm();
    
    showStatus('Event added successfully!', 'success');
}

// Clear event form
function clearEventForm() {
    document.getElementById('event-date').value = '';
    document.getElementById('event-top').value = '';
    document.getElementById('event-bottom').value = '';
    document.getElementById('event-image').value = '';
    document.getElementById('event-color').value = 'MINT';
    document.getElementById('event-has-time').checked = false;
    document.getElementById('event-time-fields').classList.add('hidden');
    document.getElementById('event-start-hour').value = '';
    document.getElementById('event-end-hour').value = '';
    document.getElementById('event-top-count').textContent = '0/12';
    document.getElementById('event-bottom-count').textContent = '0/12';
    
    if (eventMatrix) {
        eventMatrix.clear();
        eventMatrix.render();
    }
}

// Edit event
function editEvent(index) {
    const event = currentEvents[index];
    
    document.getElementById('edit-event-index').value = index;
    document.getElementById('edit-event-date').value = event.date;
    document.getElementById('edit-event-top').value = event.topLine;
    document.getElementById('edit-event-bottom').value = event.bottomLine;
    document.getElementById('edit-event-image').value = event.image;
    document.getElementById('edit-event-color').value = event.color;
    
    const hasTime = event.startHour !== null && event.endHour !== null;
    document.getElementById('edit-event-has-time').checked = hasTime;
    document.getElementById('edit-event-time-fields').classList.toggle('hidden', !hasTime);
    
    if (hasTime) {
        document.getElementById('edit-event-start-hour').value = event.startHour;
        document.getElementById('edit-event-end-hour').value = event.endHour;
    }
    
    document.getElementById('edit-event-top-count').textContent = `${event.topLine.length}/12`;
    document.getElementById('edit-event-bottom-count').textContent = `${event.bottomLine.length}/12`;
    
    const colorHex = COLOR_MAP[event.color];
    document.getElementById('edit-event-color-preview').style.background = colorHex;
    
    // Show modal
    document.getElementById('edit-event-modal').classList.remove('hidden');
    
    // Update preview
    updateEditEventPreview();
}

// Save edited event
async function saveEditedEvent() {
    const index = parseInt(document.getElementById('edit-event-index').value);
    const date = document.getElementById('edit-event-date').value;
    const topLine = document.getElementById('edit-event-top').value;
    const bottomLine = document.getElementById('edit-event-bottom').value;
    const image = document.getElementById('edit-event-image').value;
    const color = document.getElementById('edit-event-color').value;
    const hasTime = document.getElementById('edit-event-has-time').checked;
    const startHour = hasTime ? document.getElementById('edit-event-start-hour').value : '';
    const endHour = hasTime ? document.getElementById('edit-event-end-hour').value : '';
    
    // Validation
    if (!date || !topLine || !bottomLine || !image || !color) {
        showStatus('Please fill in all required fields', 'error');
        return;
    }
    
    // Update event
    currentEvents[index] = {
        date,
        topLine,
        bottomLine,
        image,
        color,
        startHour: hasTime && startHour ? parseInt(startHour) : null,
        endHour: hasTime && endHour ? parseInt(endHour) : null,
        index
    };
    
    // Save to GitHub
    await saveEventsToGitHub();
    
    // Close modal
    closeEditModal();
    
    showStatus('Event updated successfully!', 'success');
}

// Close edit modal
function closeEditModal() {
    document.getElementById('edit-event-modal').classList.add('hidden');
}

// Delete event
async function deleteEvent(index) {
    if (!confirm('Are you sure you want to delete this event?')) {
        return;
    }
    
    currentEvents.splice(index, 1);
    
    // Reindex remaining events
    currentEvents.forEach((event, i) => {
        event.index = i;
    });
    
    await saveEventsToGitHub();
    
    showStatus('Event deleted successfully!', 'success');
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
        showStatus('Failed to save events: ' + error.message, 'error');
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

