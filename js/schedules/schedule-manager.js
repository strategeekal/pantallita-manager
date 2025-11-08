// Schedule Manager Module - List, load, save, delete schedules
import { listGitHubDirectory, fetchGitHubFile, saveGitHubFile, deleteGitHubFile } from '../core/api.js';
import { showStatus } from '../core/utils.js';
import { loadConfig } from '../core/config.js';

let currentSchedules = [];
let scheduleImages = [];

export { currentSchedules, scheduleImages };

export async function initializeSchedules() {
	await loadSchedules();
	await loadScheduleImages();
}

export async function loadSchedules() {
	const config = loadConfig();

	if (!config.token || !config.owner || !config.repo) {
		showSchedulesError('Please configure GitHub settings first');
		return;
	}

	showSchedulesLoading();

	try {
		const files = await listGitHubDirectory('schedules');
		currentSchedules = files
			.filter(f => f.name.endsWith('.csv'))
			.map(f => ({
				name: f.name,
				url: f.download_url,
				sha: f.sha,
				isDefault: f.name === 'default.csv',
				date: f.name === 'default.csv' ? null : f.name.replace('.csv', '')
			}))
			.sort((a, b) => {
				if (a.isDefault) return -1;
				if (b.isDefault) return 1;
				return new Date(a.date) - new Date(b.date);
			});

		displaySchedules();

	} catch (error) {
		if (error.message.includes('404')) {
			showSchedulesEmpty();
			currentSchedules = [];
		} else {
			showSchedulesError('Failed to load schedules: ' + error.message);
		}
	}
}

function displaySchedules() {
	const listContainer = document.getElementById('schedules-list');

	hideSchedulesMessages();

	if (currentSchedules.length === 0) {
		showSchedulesEmpty();
		return;
	}

	const schedulesHTML = currentSchedules.map(schedule => {
		const displayName = schedule.isDefault ? 'Default Schedule' : `Schedule for ${schedule.date}`;
		const isPast = schedule.date && new Date(schedule.date) < new Date();

		return `
			<div class="schedule-card ${isPast ? 'past-schedule' : ''}">
				<div class="schedule-info">
					<h4>${displayName}</h4>
					<p>${schedule.name}</p>
				</div>
				<div class="schedule-actions">
					<button class="btn-pixel btn-primary btn-sm" onclick="window.schedulesModule.editSchedule('${schedule.name}')">✏️ Edit</button>
					<button class="btn-pixel btn-secondary btn-sm" onclick="window.schedulesModule.duplicateSchedule('${schedule.name}')">📋 Copy</button>
					${!schedule.isDefault ? `<button class="btn-pixel btn-secondary btn-sm" onclick="window.schedulesModule.deleteSchedule('${schedule.name}')">🗑️</button>` : ''}
				</div>
			</div>
		`;
	}).join('');

	listContainer.innerHTML = schedulesHTML;
}

export async function loadScheduleImages() {
	const config = loadConfig();

	if (!config.token || !config.owner || !config.repo) {
		return;
	}

	try {
		const files = await listGitHubDirectory('img/schedules');
		scheduleImages = files
			.filter(f => f.name.endsWith('.bmp'))
			.map(f => ({
				name: f.name,
				url: f.download_url,
				sha: f.sha
			}));

	} catch (error) {
		// Silently fail if no schedule images directory
		scheduleImages = [];
	}
}

export async function duplicateSchedule(filename) {
	const date = prompt('Enter date for new schedule (YYYY-MM-DD):');
	if (!date) return;

	const schedule = currentSchedules.find(s => s.name === filename);
	if (!schedule) return;

	try {
		const { content } = await fetchGitHubFile(`schedules/${filename}`);
		const newFilename = `${date}.csv`;

		await saveGitHubFile(`schedules/${newFilename}`, content);
		showStatus('Schedule duplicated successfully!', 'success');
		await loadSchedules();
	} catch (error) {
		showStatus('Failed to duplicate schedule: ' + error.message, 'error');
	}
}

export async function deleteSchedule(filename) {
	if (!confirm(`Delete schedule ${filename}? This cannot be undone.`)) return;

	const schedule = currentSchedules.find(s => s.name === filename);
	if (!schedule) return;

	try {
		await deleteGitHubFile(`schedules/${filename}`, schedule.sha);
		showStatus('Schedule deleted successfully!', 'success');
		await loadSchedules();
	} catch (error) {
		showStatus('Failed to delete schedule: ' + error.message, 'error');
	}
}

export async function clearOldSchedules() {
	if (!confirm('Delete all past schedules? This cannot be undone.')) return;

	try {
		const now = new Date();
		const toDelete = currentSchedules.filter(s => {
			if (s.isDefault) return false;
			return s.date && new Date(s.date) < now;
		});

		for (const schedule of toDelete) {
			await deleteGitHubFile(`schedules/${schedule.name}`, schedule.sha);
		}

		showStatus(`Deleted ${toDelete.length} past schedule(s)`, 'success');
		await loadSchedules();
	} catch (error) {
		showStatus('Failed to clear old schedules: ' + error.message, 'error');
	}
}

function showSchedulesLoading() {
	document.getElementById('schedules-loading').classList.remove('hidden');
	hideSchedulesError();
	hideSchedulesEmpty();
}

function showSchedulesError(message) {
	const errorEl = document.getElementById('schedules-error');
	errorEl.textContent = message;
	errorEl.classList.remove('hidden');
	hideSchedulesLoading();
	hideSchedulesEmpty();
}

function showSchedulesEmpty() {
	document.getElementById('schedules-empty').classList.remove('hidden');
	hideSchedulesLoading();
	hideSchedulesError();
}

function hideSchedulesLoading() {
	document.getElementById('schedules-loading').classList.add('hidden');
}

function hideSchedulesError() {
	document.getElementById('schedules-error').classList.add('hidden');
}

function hideSchedulesEmpty() {
	document.getElementById('schedules-empty').classList.add('hidden');
}

function hideSchedulesMessages() {
	hideSchedulesLoading();
	hideSchedulesError();
	hideSchedulesEmpty();
}
