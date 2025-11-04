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
	
	// Get form values
	const topLine = document.getElementById('preview-top').value || '';
	const bottomLine = document.getElementById('preview-bottom').value || '';
	const colorName = document.getElementById('preview-color').value;
	const iconName = document.getElementById('preview-icon').value;
	
	const color = COLOR_MAP[colorName];
	
	// Clear matrix
	matrix.clear();
	
	// Draw icon (column 3: x=43 to x=63)
	const icon = SIMPLE_ICONS[iconName];
	if (icon) {
		matrix.drawImage(icon, 43, 0);
	}
	
	// Draw top text (column 1 area: x=2)
	if (topLine) {
		matrix.drawText(topLine, 2, 5, color);
	}
	
	// Draw bottom text (column 1 area: x=2)
	if (bottomLine) {
		matrix.drawText(bottomLine, 2, 22, color);
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