// Tabs Module - Handle tab switching and initialization

import { isMobileDevice } from '../core/utils.js';

let editorMatrix = null;
let editorTabInitialized = false;

export { editorMatrix, editorTabInitialized };

export function setupTabs() {
	const tabs = document.querySelectorAll('.tab');

	tabs.forEach(tab => {
		tab.addEventListener('click', () => {
			const targetTab = tab.dataset.tab;
			handleTabSwitch(targetTab);
		});
	});
}

export async function handleTabSwitch(targetTab) {
	// Update tab buttons (only if the button exists in nav)
	document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
	const targetButton = document.querySelector(`[data-tab="${targetTab}"]`);
	if (targetButton) {
		targetButton.classList.add('active');
	}

	// Update tab content
	document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
	document.getElementById(`${targetTab}-tab`).classList.add('active');

	// Tab-specific initialization
	if (targetTab === 'add-event') {
		// Clear form if not editing (check if we're coming from an edit action)
		if (window.eventsModule && !window.eventsModule.isEditing()) {
			window.eventsModule.clearEventForm();
		}
		await initializeEditorTab();
	} else if (targetTab === 'schedules') {
		if (window.schedulesModule && window.schedulesModule.initializeSchedules) {
			await window.schedulesModule.initializeSchedules();
		}
	} else if (targetTab === 'events') {
		if (window.eventsModule && window.eventsModule.initializeEvents) {
			await window.eventsModule.initializeEvents();
		}
	} else if (targetTab === 'configuration') {
		// Load config if it wasn't loaded successfully at startup
		if (window.configManager && window.configManager.isConfigLoaded && !window.configManager.isConfigLoaded()) {
			await window.configManager.loadConfig(true);
		}
	} else if (targetTab === 'stocks') {
		if (window.stocksModule && window.stocksModule.initializeStocks) {
			await window.stocksModule.initializeStocks();
		}
	} else if (targetTab === 'transits') {
		if (window.transitsManager && window.transitsManager.init) {
			window.transitsManager.init();
		}
	}

	// Clean up when leaving editor tab
	if (targetTab !== 'add-event' && editorMatrix) {
		editorMatrix.clear();

		const editorContainer = document.getElementById('matrix-container-editor');
		if (editorContainer) {
			editorContainer.innerHTML = '';
		}

		editorMatrix = null;
		window.editorMatrix = null;

		// Clear form and reset editing state when leaving without saving
		if (window.eventsModule && window.eventsModule.clearEventForm) {
			window.eventsModule.clearEventForm();
		}
	}
}

export async function initializeEditorTab() {
	// Setup event form handlers only once
	if (!editorTabInitialized) {
		// Initialize color preview square and form handlers on first load
		if (window.eventsModule && window.eventsModule.initializeColorPreview) {
			window.eventsModule.initializeColorPreview();
		}
		// Initialize form handlers once
		if (window.eventsModule && window.eventsModule.initializeEventFormHandlers) {
			window.eventsModule.initializeEventFormHandlers();
		}
		editorTabInitialized = true;
	}

	// Always recreate preview (it gets cleared when leaving tab)
	if (isMobileDevice()) {
		// Mobile: Use lightweight text preview
		if (window.setupMobileTextPreview) {
			window.setupMobileTextPreview();
		}
	} else {
		// Desktop: Create emulator if it doesn't exist
		if (!editorMatrix && window.MatrixEmulator) {
			editorMatrix = new window.MatrixEmulator('matrix-container-editor', 64, 32, 6);
			window.editorMatrix = editorMatrix;
		}
	}

	// Trigger preview update after matrix is ready - use requestAnimationFrame for proper timing
	requestAnimationFrame(() => {
		if (window.eventsModule && window.eventsModule.triggerPreviewUpdate) {
			window.eventsModule.triggerPreviewUpdate();
		}
	});
}

// Event form handlers are now managed in events-manager.js

// Expose functions globally
window.initializeEditorTab = initializeEditorTab;
window.handleTabSwitch = handleTabSwitch;
