// Landing Page Module - Handle landing page animations and transitions
import { saveToken, hasToken, getToken, clearToken } from '../core/config.js';
import { showStatus } from '../core/utils.js';

export async function handleTokenSubmit(event) {
	event.preventDefault();

	const tokenInput = document.getElementById('landing-token-input');
	const token = tokenInput.value.trim();

	if (!token) {
		showStatus('Please enter a valid GitHub token', 'error');
		return;
	}

	// Save token and show app
	saveToken(token);
	await showApp();
}

export async function logout() {
	if (!confirm('Are you sure you want to logout?')) {
		return;
	}

	// Clear token
	clearToken();

	// Hide main app
	const mainApp = document.querySelector('.main-app');
	const landingPage = document.querySelector('.landing-page');

	if (mainApp) mainApp.classList.add('hidden');
	if (landingPage) landingPage.classList.remove('hidden');

	// Recreate landing matrix and show "BYE"
	if (window.MatrixEmulator && !window.landingMatrix) {
		const landingMatrix = new window.MatrixEmulator('matrix-container', 64, 32, 8);
		window.landingMatrix = landingMatrix;

		// Show "BYE" message
		if (window.displayBye) {
			window.displayBye(landingMatrix);
		}
	} else if (window.landingMatrix && window.displayBye) {
		window.displayBye(window.landingMatrix);
	}

	// Clear token input
	const tokenInput = document.getElementById('landing-token-input');
	if (tokenInput) {
		tokenInput.value = '';
	}

	showStatus('Logged out successfully', 'success');
}

export async function showApp() {
	// Check if token exists
	if (!hasToken()) {
		showStatus('Please enter your GitHub token first', 'error');
		return;
	}

	const landingPage = document.querySelector('.landing-page');
	const mainApp = document.querySelector('.main-app');

	if (landingPage) landingPage.classList.add('hidden');
	if (mainApp) mainApp.classList.remove('hidden');

	// Clean up landing matrix on desktop
	if (window.landingMatrix) {
		window.landingMatrix.clear();
		const landingContainer = document.getElementById('matrix-container');
		if (landingContainer) {
			landingContainer.innerHTML = '';
		}
		window.landingMatrix = null;
	}

	// Load images after token is set
	if (window.loadAvailableImages) {
		await window.loadAvailableImages();
	}

	// Auto-load events when app starts
	if (window.eventsModule && window.eventsModule.loadEvents) {
		await window.eventsModule.loadEvents();
	}

	// Initialize schedules
	if (window.schedulesModule && window.schedulesModule.initializeSchedules) {
		await window.schedulesModule.initializeSchedules();
	}
}

export function scrollToAbout() {
	const aboutSection = document.querySelector('.about-section');
	if (aboutSection) {
		aboutSection.scrollIntoView({ behavior: 'smooth' });
	}
}

export function createPixelBackground() {
	const canvas = document.getElementById('pixel-background');
	if (!canvas) return;

	const ctx = canvas.getContext('2d');
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	const pixelSize = 20;
	const cols = Math.ceil(canvas.width / pixelSize);
	const rows = Math.ceil(canvas.height / pixelSize);

	function draw() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		for (let i = 0; i < cols; i++) {
			for (let j = 0; j < rows; j++) {
				const brightness = Math.random() * 30 + 10;
				ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
				ctx.fillRect(i * pixelSize, j * pixelSize, pixelSize - 2, pixelSize - 2);
			}
		}
	}

	draw();
	setInterval(draw, 3000);

	window.addEventListener('resize', () => {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
	});
}
