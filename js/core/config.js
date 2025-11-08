// Configuration management
const CONFIG_KEY = 'screeny_config';

export function loadConfig() {
	return JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}');
}

export function saveConfig(config) {
	localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export function handleSettingsSubmit(e) {
	e.preventDefault();

	const config = {
		token: document.getElementById('github-token').value,
		owner: document.getElementById('github-owner').value,
		repo: document.getElementById('github-repo').value
	};

	saveConfig(config);
	showStatus('Settings saved!', 'success');
}

export function loadSettings() {
	const config = loadConfig();

	if (config.token) document.getElementById('github-token').value = config.token;
	if (config.owner) document.getElementById('github-owner').value = config.owner;
	if (config.repo) document.getElementById('github-repo').value = config.repo;
}

function showStatus(message, type) {
	const status = document.getElementById('status');
	status.textContent = message;
	status.className = `status ${type}`;
	status.classList.remove('hidden');

	setTimeout(() => {
		status.classList.add('hidden');
	}, 3000);
}
