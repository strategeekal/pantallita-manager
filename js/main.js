// Main App Entry Point - Coordinates all modules with mobile optimization
import { loadSettings, handleSettingsSubmit } from './core/config.js';
import { isMobileDevice } from './core/utils.js';
import { setupTabs, handleTabSwitch } from './ui/tabs.js';
import { showApp, scrollToAbout, createPixelBackground } from './ui/landing.js';
import { setupMobileTextPreview, updateMobileTextPreview } from './ui/mobile-preview.js';
import { loadAvailableImages } from './ui/rendering.js';

// Import events module
import * as eventsModule from './events/events-manager.js';

// Import schedules modules
import * as scheduleManager from './schedules/schedule-manager.js';
import * as scheduleEditor from './schedules/schedule-editor.js';
import * as timeline from './schedules/timeline.js';
import * as preview from './schedules/preview.js';

// Detect mobile at startup
const IS_MOBILE = isMobileDevice();

// Global modules exposure for onclick handlers
window.eventsModule = eventsModule;
window.schedulesModule = {
	...scheduleManager,
	...scheduleEditor,
	...timeline,
	...preview,
	initializeSchedules: scheduleManager.initializeSchedules,
	editSchedule: scheduleEditor.editSchedule,
	createNewSchedule: scheduleEditor.createNewSchedule,
	closeScheduleEditor: scheduleEditor.closeScheduleEditor,
	saveSchedule: scheduleEditor.saveSchedule,
	handleDateChange: scheduleEditor.handleDateChange,
	loadScheduleTemplate: scheduleEditor.loadScheduleTemplate,
	makeThisDefault: scheduleEditor.makeThisDefault,
	addScheduleItem: scheduleEditor.addScheduleItem,
	updateScheduleDays: scheduleEditor.updateScheduleDays,
	updateScheduleItem: scheduleEditor.updateScheduleItem,
	deleteScheduleItem: scheduleEditor.deleteScheduleItem,
	updateTimelineView: timeline.updateTimelineView,
	selectScheduleItem: timeline.selectScheduleItem,
	duplicateSchedule: scheduleManager.duplicateSchedule,
	deleteSchedule: scheduleManager.deleteSchedule,
	updateSchedulePreview: preview.updateSchedulePreview
};

// Expose landing functions globally
window.showApp = showApp;
window.scrollToAbout = scrollToAbout;

// Expose mobile preview functions
window.setupMobileTextPreview = setupMobileTextPreview;
window.updateMobileTextPreview = updateMobileTextPreview;

// Expose config functions globally for onclick handlers
window.handleSettingsSubmit = handleSettingsSubmit;
window.loadSettings = loadSettings;

// Expose schedule functions globally (additional to window.schedulesModule)
window.createNewSchedule = scheduleEditor.createNewSchedule;
window.closeScheduleEditor = scheduleEditor.closeScheduleEditor;
window.saveSchedule = scheduleEditor.saveSchedule;
window.addScheduleItem = scheduleEditor.addScheduleItem;
window.loadSchedules = scheduleManager.loadSchedules;
window.clearOldSchedules = scheduleManager.clearOldSchedules;
window.updateTimelineView = timeline.updateTimelineView;
window.updateSchedulePreview = preview.updateSchedulePreview;

// Expose event functions globally
window.loadEvents = eventsModule.loadEvents;
window.saveEvent = eventsModule.saveEvent;
window.clearPastEvents = eventsModule.clearPastEvents;

// Initialize app on page load
document.addEventListener('DOMContentLoaded', async () => {
	console.log('SCREENY Manager loaded!');
	console.log(`Device detected as: ${IS_MOBILE ? 'MOBILE' : 'DESKTOP'}`);

	// Create pixelated background
	createPixelBackground();

	// Setup tabs
	setupTabs();

	// Load available images
	await loadAvailableImages();

	// Auto-load events on startup
	if (eventsModule && eventsModule.loadEvents) {
		await eventsModule.loadEvents();
	}

	// Setup settings form
	const settingsForm = document.getElementById('settings-form');
	if (settingsForm) {
		settingsForm.addEventListener('submit', handleSettingsSubmit);
	}

	// Load matrix emulator for landing page (desktop only)
	if (!IS_MOBILE) {
		// Dynamically import matrix emulator only on desktop
		const { MatrixEmulator } = await import('./ui/matrix-emulator.js');
		window.MatrixEmulator = MatrixEmulator;

		// Create landing matrix
		const landingMatrix = new MatrixEmulator('matrix-container', 64, 32, 8);
		window.landingMatrix = landingMatrix;

		// Display hello message
		displayHello(landingMatrix);

		// Draw feature icons
		drawFeatureIcons();
	} else {
		// Mobile: Show simple text instead of matrix
		const matrixContainer = document.getElementById('matrix-container');
		if (matrixContainer) {
			matrixContainer.innerHTML = `
				<div style="background: #1a1a1a; padding: 40px; text-align: center; border: 4px solid #000;">
					<div style="color: #00FFAA; font-size: 2em; font-weight: bold; margin-bottom: 10px;">SCREENY</div>
					<div style="color: #FFFFFF; font-size: 1.2em;">LED Matrix Manager</div>
				</div>
			`;
		}
	}

	console.log(`Mobile optimization: ${IS_MOBILE ? 'ENABLED - Matrix emulator skipped' : 'DISABLED - Full features loaded'}`);
});

// Landing page display functions
function displayHello(matrix) {
	if (!matrix) return;

	matrix.clear();

	const topText = "HELLO";
	const bottomText = "WORLD!";
	const color = '#00FFAA';

	// Check if font is loaded
	if (!window.TINYBIT_FONT || !window.TINYBIT_FONT.glyphs) {
		console.warn('TINYBIT_FONT not loaded yet');
		// Draw a simple fallback pattern
		for (let y = 10; y < 25; y++) {
			for (let x = 5; x < 60; x += 3) {
				matrix.setPixel(x, y, color);
			}
		}
		matrix.render();
		return;
	}

	// Simple text rendering using TINYBIT_FONT bitmap format
	let x = 2;
	let y = 8;

	topText.split('').forEach(char => {
		if (window.TINYBIT_FONT.glyphs[char]) {
			const glyph = window.TINYBIT_FONT.glyphs[char];
			// Convert bitmap to pixels
			for (let row = 0; row < glyph.height; row++) {
				const byte = glyph.bitmap[row];
				for (let col = 0; col < glyph.width; col++) {
					const mask = 0x80 >> col;
					if (byte & mask) {
						matrix.setPixel(x + col, y + row, color);
					}
				}
			}
			x += glyph.width + 1;
		}
	});

	x = 2;
	y = 20;

	bottomText.split('').forEach(char => {
		if (window.TINYBIT_FONT.glyphs[char]) {
			const glyph = window.TINYBIT_FONT.glyphs[char];
			// Convert bitmap to pixels
			for (let row = 0; row < glyph.height; row++) {
				const byte = glyph.bitmap[row];
				for (let col = 0; col < glyph.width; col++) {
					const mask = 0x80 >> col;
					if (byte & mask) {
						matrix.setPixel(x + col, y + row, color);
					}
				}
			}
			x += glyph.width + 1;
		}
	});

	// Actually render the pixels to canvas
	matrix.render();
}

function drawFeatureIcons() {
	// Feature icon rendering would go here
	// Simplified for mobile optimization
}
