// Tabs Module - Handle tab switching and initialization

import { loadSettings } from '../core/config.js';
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

	// Load settings initially
	loadSettings();
}

export async function handleTabSwitch(targetTab) {
	// Update tab buttons
	document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
	document.querySelector(`[data-tab="${targetTab}"]`).classList.add('active');

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
	} else if (targetTab === 'view-events') {
		if (window.eventsModule && window.eventsModule.initializeEvents) {
			await window.eventsModule.initializeEvents();
		}
	}

	// Clean up matrix on desktop when leaving editor tab
	if (targetTab !== 'add-event' && editorMatrix) {
		editorMatrix.clear();

		const editorContainer = document.getElementById('matrix-container-editor');
		if (editorContainer) {
			editorContainer.innerHTML = '';
		}

		editorMatrix = null;
	}
}

export async function initializeEditorTab() {
	// Setup event form handlers only once
	if (!editorTabInitialized) {
		// Initialize color preview square on first load
		if (window.eventsModule && window.eventsModule.initializeColorPreview) {
			window.eventsModule.initializeColorPreview();
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
}

function setupEventFormHandlers() {
	// Input handlers for live preview
	const inputs = [
		'editor-event-top',
		'editor-event-bottom',
		'editor-event-color',
		'editor-event-image'
	];

	inputs.forEach(id => {
		const element = document.getElementById(id);
		if (element) {
			element.addEventListener('input', updateEditorPreview);
		}
	});
}

async function updateEditorPreview() {
	const topLine = document.getElementById('editor-event-top').value || '';
	const bottomLine = document.getElementById('editor-event-bottom').value || '';
	const colorName = document.getElementById('editor-event-color').value;
	const iconName = document.getElementById('editor-event-image').value;

	if (isMobileDevice()) {
		// Update mobile text preview
		if (window.updateMobileTextPreview) {
			await window.updateMobileTextPreview(topLine, bottomLine, colorName, iconName);
		}
	} else {
		// Update desktop matrix emulator
		if (editorMatrix && window.renderEventOnMatrix) {
			await window.renderEventOnMatrix(editorMatrix, topLine, bottomLine, colorName, iconName);
		}
	}
}
