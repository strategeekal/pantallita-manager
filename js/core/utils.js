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

// Parse schedule filename: "2026-02-01.csv" or "2026-02-01_to_2026-02-05.csv"
// Returns: { startDate, endDate, isRange, isDefault }
export function parseScheduleFilename(filename) {
	if (filename === 'default.csv') {
		return { startDate: null, endDate: null, isRange: false, isDefault: true };
	}

	const baseName = filename.replace('.csv', '');
	const rangeMatch = baseName.match(/^(\d{4}-\d{2}-\d{2})_to_(\d{4}-\d{2}-\d{2})$/);

	if (rangeMatch) {
		return {
			startDate: rangeMatch[1],
			endDate: rangeMatch[2],
			isRange: true,
			isDefault: false
		};
	}

	// Single date format
	return {
		startDate: baseName,
		endDate: baseName,
		isRange: false,
		isDefault: false
	};
}

// Count days between two dates (inclusive)
export function getDaysBetweenDates(startDate, endDate) {
	const start = new Date(startDate + 'T00:00:00');
	const end = new Date(endDate + 'T00:00:00');
	const diffTime = Math.abs(end - start);
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	return diffDays + 1; // inclusive
}

// Generate date info for checkboxes
// Returns: [{ dateStr, label: "2/1", dayOfWeek: 5 }, ...]
export function generateDateRangeInfo(startDate, endDate) {
	const dates = [];
	const current = new Date(startDate + 'T00:00:00');
	const end = new Date(endDate + 'T00:00:00');

	while (current <= end) {
		const dateStr = current.toISOString().split('T')[0];
		const month = current.getMonth() + 1;
		const day = current.getDate();
		// Convert JS day (0=Sunday) to schedule day (0=Monday)
		const dayOfWeek = (current.getDay() + 6) % 7;

		dates.push({
			dateStr,
			label: `${month}/${day}`,
			dayOfWeek
		});

		current.setDate(current.getDate() + 1);
	}

	return dates;
}

// Generate filename from dates
// Returns: "2026-02-01.csv" or "2026-02-01_to_2026-02-05.csv"
export function formatScheduleFilename(startDate, endDate) {
	if (!startDate) return null;
	if (!endDate || startDate === endDate) {
		return `${startDate}.csv`;
	}
	return `${startDate}_to_${endDate}.csv`;
}
