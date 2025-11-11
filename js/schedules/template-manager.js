// Template Manager Module - Manage schedule templates
import { fetchGitHubFile, deleteGitHubFile, saveGitHubFile } from '../core/api.js';
import { showStatus } from '../core/utils.js';
import { loadConfig } from '../core/config.js';
import { loadScheduleTemplates, scheduleTemplates } from './schedule-manager.js';
import { currentScheduleData, scheduleMatrix } from './schedule-editor.js';

let isTemplateMode = false;

export function openTemplateManager() {
	const modal = document.getElementById('template-manager-modal');
	if (modal) {
		modal.classList.remove('hidden');
		loadTemplateList();
	}
}

export function closeTemplateManager() {
	const modal = document.getElementById('template-manager-modal');
	if (modal) {
		modal.classList.add('hidden');
	}
}

async function loadTemplateList() {
	const loadingEl = document.getElementById('template-manager-loading');
	const errorEl = document.getElementById('template-manager-error');
	const emptyEl = document.getElementById('template-manager-empty');
	const listEl = document.getElementById('template-list');

	// Show loading
	loadingEl.classList.remove('hidden');
	errorEl.classList.add('hidden');
	emptyEl.classList.add('hidden');
	listEl.innerHTML = '';

	try {
		// Reload templates to get latest list
		await loadScheduleTemplates();

		// Hide loading
		loadingEl.classList.add('hidden');

		if (scheduleTemplates.length === 0) {
			emptyEl.classList.remove('hidden');
			return;
		}

		// Render template list
		renderTemplateList();

	} catch (error) {
		loadingEl.classList.add('hidden');
		errorEl.textContent = 'Failed to load templates: ' + error.message;
		errorEl.classList.remove('hidden');
	}
}

function renderTemplateList() {
	const listEl = document.getElementById('template-list');
	if (!listEl) return;

	const templatesHTML = scheduleTemplates.map(template => {
		return `
			<div class="template-card">
				<div class="template-info">
					<h4 class="template-name">${template.displayName}</h4>
					<p class="template-path">${template.path}</p>
				</div>
				<div class="template-actions">
					<button class="btn-pixel btn-primary btn-sm" onclick="window.templateManager.editTemplate('${template.name}')">
						✏️ Edit
					</button>
					<button class="btn-pixel btn-secondary btn-sm" onclick="window.templateManager.deleteTemplate('${template.name}', '${template.displayName}')">
						🗑️ Delete
					</button>
				</div>
			</div>
		`;
	}).join('');

	listEl.innerHTML = templatesHTML;
}

export async function editTemplate(templateName) {
	try {
		// Close template manager modal
		closeTemplateManager();

		// Load the template file
		const templatePath = `schedules/templates/${templateName}`;
		const { content, sha } = await fetchGitHubFile(templatePath);

		// Parse the CSV content
		const parsedItems = parseTemplateCSV(content);

		// Create a special schedule data object for template editing
		const templateData = {
			type: 'template',
			templateName: templateName,
			filename: templateName,
			sha: sha,
			items: parsedItems,
			isNew: false,
			isTemplate: true
		};

		// Store in window for global access (similar to other schedule data)
		window.currentTemplateData = templateData;

		// Store template mode flag
		isTemplateMode = true;

		// Show schedule editor
		const editorEl = document.getElementById('schedule-editor');
		if (editorEl) {
			editorEl.classList.remove('hidden');
		}

		// Hide schedule list
		const listSection = document.querySelector('.schedule-list-section');
		if (listSection) {
			listSection.classList.add('hidden');
		}

		// Update title
		const titleEl = document.getElementById('schedule-editor-title');
		if (titleEl) {
			titleEl.textContent = `Edit Template: ${templateName.replace('.csv', '')}`;
		}

		// Populate the editor
		await populateTemplateEditor(templateData);

		// Switch to Schedules tab if not already there
		const schedulesTab = document.querySelector('[data-tab="schedules"]');
		if (schedulesTab && !schedulesTab.classList.contains('active')) {
			schedulesTab.click();
		}

	} catch (error) {
		showStatus('Failed to load template: ' + error.message, 'error');
	}
}

function parseTemplateCSV(content) {
	const lines = content.split('\n').filter(line => {
		const trimmed = line.trim();
		return trimmed && !trimmed.startsWith('#');
	});

	return lines.map((line, index) => {
		const parts = line.split(',');
		if (parts.length < 9) return null;

		return {
			name: parts[0].trim(),
			enabled: parts[1].trim() === '1',
			days: parts[2].trim(),
			startHour: parseInt(parts[3].trim()),
			startMin: parseInt(parts[4].trim()),
			endHour: parseInt(parts[5].trim()),
			endMin: parseInt(parts[6].trim()),
			image: parts[7].trim(),
			progressBar: parts[8].trim() === '1',
			index: index
		};
	}).filter(item => item !== null);
}

async function populateTemplateEditor(templateData) {
	if (!templateData) return;

	const scheduleInfoForm = document.getElementById('schedule-info-form');
	if (!scheduleInfoForm) return;

	// Show template info (no date selector, just template name)
	scheduleInfoForm.innerHTML = `
		<div class="form-group">
			<p class="schedule-mode-info">Editing Template: ${templateData.templateName.replace('.csv', '')}</p>
			<small>Templates are day-agnostic schedules that can be applied to any date</small>
		</div>
	`;

	// Render schedule items
	renderTemplateItems(templateData);

	// Update timeline views
	const timelineModule = await import('./timeline.js');
	timelineModule.refreshTimelineViews();

	// Update preview
	const previewModule = await import('./preview.js');
	setTimeout(() => previewModule.updateSchedulePreview(), 50);

	// Override save button behavior for template mode
	updateSaveButtonForTemplate(templateData);
}

function renderTemplateItems(templateData) {
	const container = document.getElementById('schedule-items-list');
	if (!container || !templateData) return;

	if (templateData.items.length === 0) {
		container.innerHTML = '<p class="empty-message">No items yet. Click "Add Item" to create one.</p>';
		return;
	}

	// Import schedule images
	import('./schedule-manager.js').then(module => {
		const scheduleImages = module.scheduleImages;

		const itemsHTML = templateData.items.map((item, index) => {
			const imageOptions = scheduleImages.map(img =>
				`<option value="${img.name}" ${item.image === img.name ? 'selected' : ''}>${img.name}</option>`
			).join('');

			// For templates, show day checkboxes
			const daysHTML = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, dayIndex) => {
				const isChecked = item.days.includes(dayIndex.toString());
				return `
					<label class="day-checkbox ${isChecked ? 'checked' : ''}">
						<input type="checkbox"
							${isChecked ? 'checked' : ''}
							onchange="window.schedulesModule.updateScheduleDays(${index}, this)">
						${day}
					</label>
				`;
			}).join('');

			return `
				<div class="schedule-item">
					<div class="schedule-item-header">
						<input type="text"
							class="item-name-input"
							value="${item.name}"
							onchange="window.schedulesModule.updateScheduleItem(${index}, 'name', this.value)"
							placeholder="Item name">
						<label class="item-enabled">
							<input type="checkbox"
								${item.enabled ? 'checked' : ''}
								onchange="window.schedulesModule.updateScheduleItem(${index}, 'enabled', this.checked)">
							Enabled
						</label>
					</div>
					<div class="schedule-item-body">
						<div class="schedule-item-row">
							<span class="item-label">Days:</span>
							<div class="day-checkboxes">${daysHTML}</div>
						</div>
						<div class="schedule-item-row">
							<span class="item-label">Time:</span>
							<div class="time-inputs">
								<input type="number" class="time-input-large" min="0" max="23"
									value="${item.startHour}"
									onchange="window.schedulesModule.updateScheduleItem(${index}, 'startHour', parseInt(this.value))">
								<span class="time-separator">:</span>
								<input type="number" class="time-input-large" min="0" max="59"
									value="${item.startMin}"
									onchange="window.schedulesModule.updateScheduleItem(${index}, 'startMin', parseInt(this.value))">
								<span class="time-separator">to</span>
								<input type="number" class="time-input-large" min="0" max="23"
									value="${item.endHour}"
									onchange="window.schedulesModule.updateScheduleItem(${index}, 'endHour', parseInt(this.value))">
								<span class="time-separator">:</span>
								<input type="number" class="time-input-large" min="0" max="59"
									value="${item.endMin}"
									onchange="window.schedulesModule.updateScheduleItem(${index}, 'endMin', parseInt(this.value))">
							</div>
						</div>
						<div class="schedule-item-row">
							<span class="item-label">Image:</span>
							<select class="image-select" onchange="window.schedulesModule.updateScheduleItem(${index}, 'image', this.value)">
								<option value="">None</option>
								${imageOptions}
							</select>
						</div>
						<div class="schedule-item-row">
							<label class="progress-label">
								<input type="checkbox"
									${item.progressBar ? 'checked' : ''}
									onchange="window.schedulesModule.updateScheduleItem(${index}, 'progressBar', this.checked)">
								Show Progress Bar
							</label>
							<button class="btn-pixel btn-secondary btn-sm" onclick="window.schedulesModule.deleteScheduleItem(${index})">
								🗑️ Delete
							</button>
						</div>
					</div>
				</div>
			`;
		}).join('');

		container.innerHTML = itemsHTML;
	});
}

function updateSaveButtonForTemplate(templateData) {
	// Find the save button and replace its onclick handler
	const saveButtons = document.querySelectorAll('.schedule-actions .btn-primary');
	saveButtons.forEach(btn => {
		if (btn.textContent.includes('Save Schedule')) {
			btn.onclick = () => saveTemplate(templateData);
		}
	});
}

async function saveTemplate(templateData) {
	if (!templateData || !templateData.isTemplate) return;

	try {
		const csvContent = generateTemplateCSV(templateData);
		const templatePath = `schedules/templates/${templateData.templateName}`;

		await saveGitHubFile(templatePath, csvContent, templateData.sha);

		showStatus('Template saved successfully!', 'success');

		// Reload templates
		await loadScheduleTemplates();

		// Close editor and return to schedule list
		setTimeout(() => {
			closeTemplateEditor();
		}, 1000);

	} catch (error) {
		showStatus('Failed to save template: ' + error.message, 'error');
	}
}

function generateTemplateCSV(templateData) {
	const header = `# Format: name,enabled,days,start_hour,start_min,end_hour,end_min,image,progressbar
# enabled: 1=true, 0=false
# days: 0-6 for Mon-Sun (e.g., "01234" = Mon-Fri)
# progressbar: 1=true, 0=false
`;

	const lines = templateData.items.map(item =>
		`${item.name},${item.enabled ? 1 : 0},${item.days},${item.startHour},${item.startMin},${item.endHour},${item.endMin},${item.image},${item.progressBar ? 1 : 0}`
	);

	return header + lines.join('\n');
}

function closeTemplateEditor() {
	const editorEl = document.getElementById('schedule-editor');
	if (editorEl) {
		editorEl.classList.add('hidden');
	}

	const listSection = document.querySelector('.schedule-list-section');
	if (listSection) {
		listSection.classList.remove('hidden');
	}

	// Reset template mode
	isTemplateMode = false;

	// Clean up schedule matrix
	if (window.scheduleMatrix) {
		window.scheduleMatrix.clear();
		const container = document.getElementById('matrix-container-schedule');
		if (container) {
			container.innerHTML = '';
		}
		window.scheduleMatrix = null;
	}
}

export async function deleteTemplate(templateName, displayName) {
	if (!confirm(`Are you sure you want to delete the template "${displayName}"?\n\nThis action cannot be undone.`)) {
		return;
	}

	try {
		const templatePath = `schedules/templates/${templateName}`;

		// Get the file SHA first (needed for deletion)
		const { sha } = await fetchGitHubFile(templatePath);

		// Delete the template
		await deleteGitHubFile(templatePath, sha);

		showStatus('Template deleted successfully!', 'success');

		// Reload the template list
		await loadTemplateList();

		// Reload templates in schedule manager
		await loadScheduleTemplates();

	} catch (error) {
		showStatus('Failed to delete template: ' + error.message, 'error');
	}
}

export { isTemplateMode };
