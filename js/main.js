// Main App Entry Point - Coordinates all modules with mobile optimization
import { loadSettings, handleSettingsSubmit } from './core/config.js';
import { isMobileDevice } from './core/utils.js';
import { setupTabs, handleTabSwitch } from './ui/tabs.js';
import { showApp, scrollToAbout, createPixelBackground } from './ui/landing.js';
import { setupMobileTextPreview, updateMobileTextPreview } from './ui/mobile-preview.js';

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

// Initialize app on page load
document.addEventListener('DOMContentLoaded', async () => {
	console.log('SCREENY Manager loaded!');
	console.log(`Device detected as: ${IS_MOBILE ? 'MOBILE' : 'DESKTOP'}`);

	// Create pixelated background
	createPixelBackground();

	// Setup tabs
	setupTabs();

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

	// Simple text rendering (assuming TINYBIT_FONT is available)
	let x = 2;
	let y = 8;

	topText.split('').forEach(char => {
		if (window.TINYBIT_FONT && window.TINYBIT_FONT.glyphs[char]) {
			const glyph = window.TINYBIT_FONT.glyphs[char];
			for (let row = 0; row < glyph.length; row++) {
				for (let col = 0; col < glyph[row].length; col++) {
					if (glyph[row][col] === 1) {
						matrix.setPixel(x + col, y + row, color);
					}
				}
			}
			x += glyph[0].length + 1;
		}
	});

	x = 2;
	y = 20;

	bottomText.split('').forEach(char => {
		if (window.TINYBIT_FONT && window.TINYBIT_FONT.glyphs[char]) {
			const glyph = window.TINYBIT_FONT.glyphs[char];
			for (let row = 0; row < glyph.length; row++) {
				for (let col = 0; col < glyph[row].length; col++) {
					if (glyph[row][col] === 1) {
						matrix.setPixel(x + col, y + row, color);
					}
				}
			}
			x += glyph[0].length + 1;
		}
	});
}

function drawFeatureIcons() {
	// Feature icon rendering would go here
	// Simplified for mobile optimization
}
