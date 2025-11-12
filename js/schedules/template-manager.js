// Template Manager Module - Manage schedule templates
import { fetchGitHubFile, deleteGitHubFile, saveGitHubFile } from '../core/api.js';
import { showStatus, parseCSV, formatImageName } from '../core/utils.js';
import { loadScheduleTemplates, scheduleTemplates } from './schedule-manager.js';

// Import schedule editor to get access to its internal functions
import * as scheduleEditorModule from './schedule-editor.js';

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

		// Load the template file using the same approach as editSchedule
		const templatePath = `schedules/templates/${templateName}`;
		const { content, sha } = await fetchGitHubFile(templatePath);

		// Parse using the same CSV parser
		const lines = parseCSV(content);
		const parsedItems = lines.map((line, index) => {
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

		// Call the internal function to set currentScheduleData
		// We need to use a special approach here since we can't directly set the module variable
		// Instead, we'll use the window object to communicate with schedule-editor
		window.__editingTemplate = {
			templateName: templateName,
			sha: sha
		};

		// Set up the schedule data similar to how editSchedule does it
		// We'll use type 'template' to distinguish from regular schedules
		const templateData = {
			type: 'template',
			templateName: templateName,
			filename: templateName,
			sha: sha,
			items: parsedItems,
			isNew: false
		};

		// Import and call the schedule editor's internal setup
		const scheduleEditorInternal = await import('./schedule-editor.js');

		// We need to directly manipulate the module's internal state
		// Since we can't export a setter, we'll use a workaround
		// Store the template data globally for the save override to access
		window.__currentTemplateData = templateData;

		// Show the schedule editor UI
		const editorEl = document.getElementById('schedule-editor');
		if (editorEl) {
			editorEl.classList.remove('hidden');
		}

		// Hide schedule list
		const listSection = document.querySelector('.schedule-list-section');
		if (listSection) {
			listSection.classList.add('hidden');
		}

		// Update title with formatted name
		const titleEl = document.getElementById('schedule-editor-title');
		if (titleEl) {
			const formattedName = formatImageName(templateName.replace('.csv', ''));
			titleEl.textContent = `Edit Template: ${formattedName}`;
		}

		// Populate the editor form
		const scheduleInfoForm = document.getElementById('schedule-info-form');
		if (scheduleInfoForm) {
			const formattedName = formatImageName(templateName.replace('.csv', ''));
			scheduleInfoForm.innerHTML = `
				<div class="form-group">
					<p class="schedule-mode-info">Editing Template: ${formattedName}</p>
					<small>Templates are day-agnostic and can be loaded into any schedule</small>
				</div>
			`;
		}

		// Use the existing renderScheduleItems by temporarily setting currentScheduleData
		// This is a hack, but necessary given the module structure
		const originalSaveSchedule = window.saveSchedule;

		// Override the save function to save to templates directory
		window.saveSchedule = async function() {
			await saveTemplateFromEditor();
		};

		// Manually populate the schedule items list using the template data
		populateTemplateItems(templateData);

		// Update the button labels for template editing
		updateButtonsForTemplateMode();

		// Import timeline and preview modules
		const { refreshTimelineViews } = await import('./timeline.js');
		const { updateSchedulePreview } = await import('./preview.js');

		// Update timeline and preview
		refreshTimelineViews();
		setTimeout(() => updateSchedulePreview(), 50);

		// Switch to Schedules tab if not already there
		const schedulesTab = document.querySelector('[data-tab="schedules"]');
		if (schedulesTab && !schedulesTab.classList.contains('active')) {
			schedulesTab.click();
		}

		// Store original save function for cleanup
		window.__originalSaveSchedule = originalSaveSchedule;

	} catch (error) {
		showStatus('Failed to load template: ' + error.message, 'error');
	}
}

function populateTemplateItems(templateData) {
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
				`<option value="${img.name}" ${item.image === img.name ? 'selected' : ''}>${formatImageName(img.name)}</option>`
			).join('');

			return `
				<div class="schedule-item">
					<div class="schedule-item-header">
						<input type="text"
							class="item-name-input"
							value="${item.name}"
							onchange="window.templateManager.updateTemplateItem(${index}, 'name', this.value)"
							placeholder="Item name">
						<label class="item-enabled">
							<input type="checkbox"
								${item.enabled ? 'checked' : ''}
								onchange="window.templateManager.updateTemplateItem(${index}, 'enabled', this.checked)">
							Enabled
						</label>
					</div>
					<div class="schedule-item-body">
						<div class="schedule-item-row">
							<span class="item-label">Time:</span>
							<div class="time-inputs">
								<input type="number" class="time-input-large" min="0" max="23"
									value="${item.startHour}"
									onchange="window.templateManager.updateTemplateItem(${index}, 'startHour', parseInt(this.value))">
								<span class="time-separator">:</span>
								<input type="number" class="time-input-large" min="0" max="59"
									value="${item.startMin}"
									onchange="window.templateManager.updateTemplateItem(${index}, 'startMin', parseInt(this.value))">
								<span class="time-separator">to</span>
								<input type="number" class="time-input-large" min="0" max="23"
									value="${item.endHour}"
									onchange="window.templateManager.updateTemplateItem(${index}, 'endHour', parseInt(this.value))">
								<span class="time-separator">:</span>
								<input type="number" class="time-input-large" min="0" max="59"
									value="${item.endMin}"
									onchange="window.templateManager.updateTemplateItem(${index}, 'endMin', parseInt(this.value))">
							</div>
						</div>
						<div class="schedule-item-row">
							<span class="item-label">Image:</span>
							<select class="image-select" onchange="window.templateManager.updateTemplateItem(${index}, 'image', this.value)">
								<option value="">None</option>
								${imageOptions}
							</select>
						</div>
						<div class="schedule-item-row">
							<label class="progress-label">
								<input type="checkbox"
									${item.progressBar ? 'checked' : ''}
									onchange="window.templateManager.updateTemplateItem(${index}, 'progressBar', this.checked)">
								Show Progress Bar
							</label>
							<button class="btn-pixel btn-secondary btn-sm" onclick="window.templateManager.deleteTemplateItem(${index})">
								🗑️ Delete
							</button>
						</div>
					</div>
				</div>
			`;
		}).join('');

		container.innerHTML = itemsHTML;

		// Update preview selector
		updatePreviewSelector();
	});
}

function updatePreviewSelector() {
	const selector = document.getElementById('preview-item-select');
	if (!selector || !window.__currentTemplateData) return;

	const templateData = window.__currentTemplateData;
	const currentValue = selector.value;

	// Clear and populate selector
	selector.innerHTML = templateData.items.map((item, index) =>
		`<option value="${index}">${item.name}</option>`
	).join('');

	// Restore previous selection if it still exists, otherwise select first item
	if (currentValue !== '' && templateData.items[currentValue]) {
		selector.value = currentValue;
	} else if (templateData.items.length > 0) {
		selector.value = '0';
	}
}

export function updateTemplateItem(index, field, value) {
	if (!window.__currentTemplateData || !window.__currentTemplateData.items[index]) return;

	window.__currentTemplateData.items[index][field] = value;

	if (['startHour', 'startMin', 'endHour', 'endMin', 'enabled', 'days'].includes(field)) {
		import('./timeline.js').then(module => module.refreshTimelineViews());
	}

	// Update preview selector when name changes
	if (field === 'name') {
		updatePreviewSelector();
	}

	// Update preview when image or progress bar changes
	if (['image', 'progressBar'].includes(field)) {
		import('./preview.js').then(module => module.updateSchedulePreview());
	}
}

export function deleteTemplateItem(index) {
	if (!window.__currentTemplateData) return;

	if (!confirm('Delete this item?')) return;

	window.__currentTemplateData.items.splice(index, 1);
	window.__currentTemplateData.items.forEach((item, i) => item.index = i);

	populateTemplateItems(window.__currentTemplateData);

	import('./timeline.js').then(module => module.refreshTimelineViews());
	import('./preview.js').then(module => {
		setTimeout(() => module.updateSchedulePreview(), 50);
	});
}

export function addTemplateItem() {
	if (!window.__currentTemplateData) {
		window.__currentTemplateData = {
			type: 'template',
			items: []
		};
	}

	// Calculate default times based on existing items
	let startHour = 8;
	let startMin = 0;

	if (window.__currentTemplateData.items.length > 0) {
		// Find the latest end time from existing items
		const latestItem = window.__currentTemplateData.items.reduce((latest, item) => {
			const latestTime = latest.endHour * 60 + latest.endMin;
			const currentTime = item.endHour * 60 + item.endMin;
			return currentTime > latestTime ? item : latest;
		});

		startHour = latestItem.endHour;
		startMin = latestItem.endMin;
	}

	// Calculate end time (15 minutes after start)
	let endMin = startMin + 15;
	let endHour = startHour;

	if (endMin >= 60) {
		endMin -= 60;
		endHour += 1;
	}

	const newItem = {
		name: 'New Item',
		enabled: true,
		days: '', // Templates are day-agnostic
		startHour: startHour,
		startMin: startMin,
		endHour: endHour,
		endMin: endMin,
		image: '',
		progressBar: false,
		index: window.__currentTemplateData.items.length
	};

	window.__currentTemplateData.items.push(newItem);
	populateTemplateItems(window.__currentTemplateData);

	import('./timeline.js').then(module => module.refreshTimelineViews());
	import('./preview.js').then(module => {
		setTimeout(() => module.updateSchedulePreview(), 50);
	});
}

function updateButtonsForTemplateMode() {
	// Find the save button and change its text
	const saveButtons = document.querySelectorAll('.schedule-actions .btn-primary');
	saveButtons.forEach(btn => {
		if (btn.textContent.includes('Save Schedule')) {
			btn.innerHTML = '💾 Save Template';
		}
	});

	// Find the "Save as Template" button and change it to "Save as New Template"
	const saveAsButtons = document.querySelectorAll('.schedule-actions .btn-secondary');
	saveAsButtons.forEach(btn => {
		if (btn.textContent.includes('Save as Template')) {
			btn.innerHTML = '📄 Save as New Template';
			btn.onclick = () => saveAsNewTemplate();
		}
	});
}

async function saveTemplateFromEditor() {
	if (!window.__currentTemplateData) return;

	const templateData = window.__currentTemplateData;

	try {
		const csvContent = generateTemplateCSV(templateData);
		const templatePath = `schedules/templates/${templateData.templateName}`;

		await saveGitHubFile(templatePath, csvContent, templateData.sha);

		showStatus('Template saved successfully!', 'success');

		// Update the SHA for future saves
		const { sha } = await fetchGitHubFile(templatePath);
		templateData.sha = sha;
		window.__editingTemplate.sha = sha;

		// Reload templates
		await loadScheduleTemplates();

		// Close editor and go back to schedules list after a short delay
		setTimeout(() => {
			closeTemplateEditor();
		}, 1000);

	} catch (error) {
		showStatus('Failed to save template: ' + error.message, 'error');
	}
}

export async function saveAsNewTemplate() {
	if (!window.__currentTemplateData) return;

	const templateData = window.__currentTemplateData;

	const newTemplateName = prompt('Enter new template name (will be saved as schedules/templates/[name].csv):');
	if (!newTemplateName) return;

	// Clean up the name (remove .csv if user added it, replace spaces with dashes)
	const cleanName = newTemplateName.replace('.csv', '').replace(/\s+/g, '-').toLowerCase();
	if (!cleanName) {
		showStatus('Invalid template name', 'error');
		return;
	}

	try {
		// Check if template already exists
		let sha = null;
		try {
			const response = await fetchGitHubFile(`schedules/templates/${cleanName}.csv`);
			sha = response.sha;
			if (!confirm(`Template "${cleanName}" already exists. Overwrite?`)) {
				return;
			}
		} catch (e) {
			// Template doesn't exist yet - that's fine
		}

		const csvContent = generateTemplateCSV(templateData);
		await saveGitHubFile(`schedules/templates/${cleanName}.csv`, csvContent, sha);

		showStatus('Template saved successfully!', 'success');

		// Reload templates
		await loadScheduleTemplates();

		// Close editor and go back to schedules list after a short delay
		setTimeout(() => {
			closeTemplateEditor();
		}, 1000);

	} catch (error) {
		showStatus('Failed to save template: ' + error.message, 'error');
	}
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
	window.__currentTemplateData = null;
	window.__editingTemplate = null;

	// Restore original save function
	if (window.__originalSaveSchedule) {
		window.saveSchedule = window.__originalSaveSchedule;
		window.__originalSaveSchedule = null;
	}

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

function generateTemplateCSV(templateData) {
	const header = `# Format: name,enabled,days,start_hour,start_min,end_hour,end_min,image,progressbar
# enabled: 1=true, 0=false
# days: Templates are day-agnostic (empty field). Days are assigned when loaded into schedules.
# progressbar: 1=true, 0=false
`;

	const lines = templateData.items.map(item =>
		`${item.name},${item.enabled ? 1 : 0},,${item.startHour},${item.startMin},${item.endHour},${item.endMin},${item.image},${item.progressBar ? 1 : 0}`
	);

	return header + lines.join('\n');
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

// Function to get current template data for timeline/preview modules
export function getCurrentTemplateData() {
	return window.__currentTemplateData;
}
