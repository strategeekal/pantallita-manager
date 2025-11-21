// Main App Entry Point - Coordinates all modules with mobile optimization
import { hasToken, getToken } from './core/config.js';
import { isMobileDevice } from './core/utils.js';
import { setupTabs, handleTabSwitch } from './ui/tabs.js';
import { showApp, scrollToAbout, createPixelBackground, handleTokenSubmit, logout } from './ui/landing.js';
import { setupMobileTextPreview, updateMobileTextPreview } from './ui/mobile-preview.js';
import { loadAvailableImages, availableImages, loadScheduleImages, availableScheduleImages } from './ui/rendering.js';
import { TINYBIT_FONT } from './ui/fonts.js';

// Import events module
import * as eventsModule from './events/events-manager.js';

// Import schedules modules
import * as scheduleManager from './schedules/schedule-manager.js';
import * as scheduleEditor from './schedules/schedule-editor.js';
import * as timeline from './schedules/timeline.js';
import * as preview from './schedules/preview.js';
import * as templateManager from './schedules/template-manager.js';

// Import validation module
import * as validator from './validation/validator.js';

// Import configuration module
import * as configManager from './config/config-manager.js';

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
	saveAsTemplate: scheduleEditor.saveAsTemplate,
	makeThisDefault: scheduleEditor.makeThisDefault,
	addScheduleItem: scheduleEditor.addScheduleItem,
	updateScheduleDays: scheduleEditor.updateScheduleDays,
	updateScheduleItem: scheduleEditor.updateScheduleItem,
	deleteScheduleItem: scheduleEditor.deleteScheduleItem,
	updateTimelineView: timeline.updateTimelineView,
	selectScheduleItem: timeline.selectScheduleItem,
	showEditPanel: timeline.showEditPanel,
	liveUpdateItem: timeline.liveUpdateItem,
	liveUpdateDays: timeline.liveUpdateDays,
	deleteScheduleItemFromPanel: timeline.deleteScheduleItemFromPanel,
	updateMobileDayIndicator: timeline.updateMobileDayIndicator,
	populateMobileEditPanel: timeline.populateMobileEditPanel,
	liveUpdateItemMobile: timeline.liveUpdateItemMobile,
	liveUpdateDaysMobile: timeline.liveUpdateDaysMobile,
	deleteScheduleItemFromPanelMobile: timeline.deleteScheduleItemFromPanelMobile,
	duplicateSchedule: scheduleManager.duplicateSchedule,
	deleteSchedule: scheduleManager.deleteSchedule,
	updateSchedulePreview: preview.updateSchedulePreview,
	get availableImages() { return availableScheduleImages; }
};

// Expose landing functions globally
window.showApp = showApp;
window.scrollToAbout = scrollToAbout;
window.handleTokenSubmit = handleTokenSubmit;
window.logout = logout;

// Expose mobile preview functions
window.setupMobileTextPreview = setupMobileTextPreview;
window.updateMobileTextPreview = updateMobileTextPreview;

// Expose image loading globally
window.loadAvailableImages = loadAvailableImages;
window.loadScheduleImages = loadScheduleImages;

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

// Expose template manager functions globally
window.templateManager = {
	openTemplateManager: templateManager.openTemplateManager,
	closeTemplateManager: templateManager.closeTemplateManager,
	editTemplate: templateManager.editTemplate,
	deleteTemplate: templateManager.deleteTemplate,
	updateTemplateItem: templateManager.updateTemplateItem,
	deleteTemplateItem: templateManager.deleteTemplateItem,
	addTemplateItem: templateManager.addTemplateItem,
	getCurrentTemplateData: templateManager.getCurrentTemplateData,
	saveAsNewTemplate: templateManager.saveAsNewTemplate
};

// Expose validation functions globally (already exposed in validator.js, but adding here for clarity)
window.validatorModule = validator;

// Initialize app on page load
document.addEventListener('DOMContentLoaded', async () => {
	console.log('SCREENY Manager loaded!');
	console.log(`Device detected as: ${IS_MOBILE ? 'MOBILE' : 'DESKTOP'}`);

	// Create pixelated background
	createPixelBackground();

	// Setup tabs
	setupTabs();

	// Pre-fill token if exists
	if (hasToken()) {
		const tokenInput = document.getElementById('landing-token-input');
		if (tokenInput) {
			tokenInput.value = getToken();
		}
		// Auto-show app if token exists
		await showApp();

		// Run silent validation after app loads to check for issues
		runAutoValidation();
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

// Run auto-validation on app load
async function runAutoValidation() {
	try {
		// Wait a bit for events/schedules to load
		await new Promise(resolve => setTimeout(resolve, 2000));

		await updateValidationBadge();
	} catch (error) {
		console.error('Auto-validation failed:', error);
	}
}

// Update the validation badge based on current validation results
async function updateValidationBadge() {
	try {
		const results = await validator.runSilentValidation();
		const badge = document.getElementById('validation-badge');

		if (!badge) return;

		const totalIssues = results.errors + results.warnings;

		if (totalIssues > 0) {
			badge.textContent = totalIssues;
			badge.classList.remove('hidden', 'warning');

			// Show red badge for errors, yellow for warnings only
			if (results.errors > 0) {
				badge.classList.add('pulse');
			} else {
				badge.classList.add('warning', 'pulse');
			}

			console.log(`Validation found ${results.errors} error(s) and ${results.warnings} warning(s)`);
		} else {
			badge.classList.add('hidden');
			badge.classList.remove('pulse', 'warning');
			console.log('Validation passed - no issues found');
		}
	} catch (error) {
		console.error('Failed to update validation badge:', error);
	}
}

// Expose updateValidationBadge globally so it can be called after data changes
window.updateValidationBadge = updateValidationBadge;

// Landing page display functions
function displayHello(matrix) {
	if (!matrix) return;

	matrix.clear();

	// Check for name parameter in URL
	const urlParams = new URLSearchParams(window.location.search);
	const name = urlParams.get('name');

	let topText = "HOLA";
	let bottomText = name && name.length <= 12 ? name.toUpperCase() : "";
	const topColor = '#00FFAA'; // Mint color
	const bottomColor = '#FF0088'; // Bugambilia color

	// Check if font is loaded
	if (!window.TINYBIT_FONT || !window.TINYBIT_FONT.glyphs) {
		console.warn('TINYBIT_FONT not loaded yet');
		// Draw a simple fallback pattern
		for (let y = 10; y < 25; y++) {
			for (let x = 5; x < 60; x += 3) {
				matrix.setPixel(x, y, topColor);
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
						matrix.setPixel(x + col, y + row, topColor);
					}
				}
			}
			x += glyph.width + 1;
		}
	});

	// Only render bottom text if there's a name
	if (bottomText) {
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
							matrix.setPixel(x + col, y + row, bottomColor);
						}
					}
				}
				x += glyph.width + 1;
			}
		});
	}

	// Actually render the pixels to canvas
	matrix.render();
}

function displayBye(matrix) {
	if (!matrix) return;

	matrix.clear();

	const text = "BYE";
	const color = '#FF0088'; // Bugambilia color

	// Check if font is loaded
	if (!window.TINYBIT_FONT || !window.TINYBIT_FONT.glyphs) {
		console.warn('TINYBIT_FONT not loaded yet');
		matrix.render();
		return;
	}

	// Center text vertically
	let x = 2;
	let y = 13; // Centered vertically for single line

	text.split('').forEach(char => {
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

	matrix.render();
}

// Expose display functions globally
window.displayBye = displayBye;

function drawFeatureIcons() {
	// Feature icon rendering would go here
	// Simplified for mobile optimization
}
