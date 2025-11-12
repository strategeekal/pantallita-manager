// Utility functions

export function showStatus(message, type) {
	const status = document.getElementById('status');
	status.textContent = message;
	status.className = `status ${type}`;
	status.classList.remove('hidden');

	setTimeout(() => {
		status.classList.add('hidden');
	}, 3000);
}

export function isMobileDevice() {
	return window.innerWidth <= 768 ||
	       /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function parseCSV(content) {
	return content.split('\n').filter(line => {
		const trimmed = line.trim();
		return trimmed && !trimmed.startsWith('#');
	});
}

export function formatDate(dateStr) {
	const date = new Date(dateStr + 'T00:00:00');
	return date.toLocaleDateString('en-US', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
}

export function getDayOfWeek(dateStr) {
	const date = new Date(dateStr + 'T00:00:00');
	// Convert JS day (0=Sunday) to schedule day (0=Monday) and return name
	const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
	const scheduleDayOfWeek = (date.getDay() + 6) % 7;
	return dayNames[scheduleDayOfWeek];
}

export function formatImageName(filename) {
	if (!filename) return '';

	// Remove .bmp extension
	let name = filename.replace(/\.bmp$/i, '');

	// Replace underscores and dashes with spaces
	name = name.replace(/[_-]/g, ' ');

	// Capitalize each word
	name = name.split(' ')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(' ');

	return name;
}

export function debounce(func, wait) {
	let timeout;
	return function executedFunction(...args) {
		const later = () => {
			clearTimeout(timeout);
			func(...args);
		};
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
}
