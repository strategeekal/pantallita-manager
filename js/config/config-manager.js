/**
 * Configuration Manager Module
 * Handles loading, editing, and saving matrix configuration files
 */

import { fetchGitHubFile, saveGitHubFile } from '../core/api.js';

let configState = {
    matrix1: null,
    matrix2: null
};

// Configuration metadata for user-friendly labels
const configLabels = {
    'show_weather': 'Show Weather',
    'show_forecast': 'Show Forecast',
    'show_events': 'Show Events',
    'show_weekday_indicator': 'Show Weekday Indicator',
    'show_scheduled_displays': 'Show Scheduled Displays',
    'show_events_in_between_schedules': 'Show Events Between Schedules',
    'show_stocks': 'Show Investment Stocks',
    'stocks_respect_market_hours': 'Stocks: Only During Market Hours',
    'stocks_display_frequency': 'Stocks: Display Cycle Frequency',
    'stocks_market_close_grace_period': 'Stocks: After-Hours Grace Period',
    'show_transit': 'Show Public Transit',
    'transit_respect_commute_hours': 'Transit: Only During Commute Hours',
    'night_mode_minimal_display': 'Night Mode (Minimal Display)',
    'delayed_start': 'Delayed Start (Safety Feature)'
};

// Configuration descriptions for tooltips
const configDescriptions = {
    'show_weather': 'Display current weather information',
    'show_forecast': 'Display weather forecast',
    'show_events': 'Display upcoming events',
    'show_weekday_indicator': 'Show day of the week indicator',
    'show_scheduled_displays': 'Show scheduled display items',
    'show_events_in_between_schedules': 'Show events when no schedule is active',
    'show_stocks': 'Display investment stock ticker information',
    'stocks_respect_market_hours': 'On = Show stocks during market hours only',
    'stocks_display_frequency': 'Number of cycles between stock displays',
    'stocks_market_close_grace_period': 'Grace period to continue showing stocks after market closes',
    'show_transit': 'Display public transit arrival times',
    'transit_respect_commute_hours': 'On = Show transit during commute hours only',
    'night_mode_minimal_display': 'Enable minimal display mode during nighttime hours',
    'delayed_start': 'Enable delayed startup for safety'
};

// Configuration field types (boolean or number)
const configTypes = {
    'show_weather': 'boolean',
    'show_forecast': 'boolean',
    'show_events': 'boolean',
    'show_weekday_indicator': 'boolean',
    'show_scheduled_displays': 'boolean',
    'show_events_in_between_schedules': 'boolean',
    'show_stocks': 'boolean',
    'stocks_respect_market_hours': 'boolean',
    'stocks_display_frequency': 'number',
    'stocks_market_close_grace_period': 'number',
    'show_transit': 'boolean',
    'transit_respect_commute_hours': 'boolean',
    'night_mode_minimal_display': 'boolean',
    'delayed_start': 'boolean'
};

// Configuration ranges for numeric fields
const configRanges = {
    'stocks_display_frequency': { min: 1, max: 78, default: 3 },
    'stocks_market_close_grace_period': { min: 0, max: 120, default: 60, displayAsTime: true }
};

/**
 * Initialize the configuration manager
 */
export function init() {
    console.log('Initializing Configuration Manager...');

    // Load both configs when the configuration tab is activated
    loadConfig('matrix1');
    loadConfig('matrix2');
}

/**
 * Load configuration file from GitHub
 * @param {string} matrixName - 'matrix1' or 'matrix2'
 */
export async function loadConfig(matrixName) {
        const statusEl = document.getElementById(`${matrixName}-status`);
        const errorEl = document.getElementById(`${matrixName}-error`);
        const configEl = document.getElementById(`${matrixName}-config`);

        // Show loading state
        statusEl.classList.remove('hidden');
        errorEl.classList.add('hidden');
        errorEl.textContent = '';

        try {
            const filename = `${matrixName}_config.csv`;
            console.log(`Loading configuration file: ${filename}`);

            const response = await fetchGitHubFile(filename);

            if (!response || !response.content) {
                throw new Error('Configuration file not found');
            }

            // Parse the CSV content (content is already decoded by fetchGitHubFile)
            const parsedConfig = parseConfigCSV(response.content);

            // Store the parsed config
            configState[matrixName] = {
                settings: parsedConfig.settings,
                comments: parsedConfig.comments,
                sha: response.sha,
                rawContent: response.content
            };

            // Render the configuration UI
            renderConfigSettings(matrixName, parsedConfig.settings);

            // Hide loading, show success briefly
            statusEl.textContent = 'Loaded successfully';
            setTimeout(() => {
                statusEl.classList.add('hidden');
            }, 2000);

        } catch (error) {
            console.error(`Error loading ${matrixName} configuration:`, error);
            statusEl.classList.add('hidden');
            errorEl.textContent = `Failed to load configuration: ${error.message}`;
            errorEl.classList.remove('hidden');
            configEl.innerHTML = '<p class="error-message">Unable to load configuration settings.</p>';
        }
}

/**
 * Parse CSV configuration file
 * @param {string} content - Raw CSV content
 * @returns {Object} Parsed configuration with settings and comments
 */
function parseConfigCSV(content) {
        const lines = content.split('\n');
        const settings = [];
        const comments = [];
        let currentSection = 'General';

        for (const line of lines) {
            const trimmedLine = line.trim();

            // Skip empty lines
            if (!trimmedLine) {
                continue;
            }

            // Handle comment lines
            if (trimmedLine.startsWith('#')) {
                comments.push(trimmedLine);

                // Check if this comment defines a section
                const commentText = trimmedLine.substring(1).trim();
                if (commentText && !commentText.includes(':') && !commentText.toLowerCase().includes('format') && !commentText.toLowerCase().includes('boolean')) {
                    // This is likely a section header (e.g., "# Core displays")
                    currentSection = commentText;
                }
                continue;
            }

            // Parse setting line: setting,value
            const parts = trimmedLine.split(',');
            if (parts.length === 2) {
                const settingName = parts[0].trim();
                const settingValue = parts[1].trim();

                // Determine the type and parse value accordingly
                const fieldType = configTypes[settingName] || 'boolean';
                let parsedValue;

                if (fieldType === 'number') {
                    parsedValue = parseInt(settingValue, 10);
                    // Validate range if defined
                    if (configRanges[settingName]) {
                        const range = configRanges[settingName];
                        if (isNaN(parsedValue) || parsedValue < range.min || parsedValue > range.max) {
                            parsedValue = range.default;
                        }
                    }
                } else {
                    // Boolean type
                    parsedValue = settingValue === '1';
                }

                settings.push({
                    name: settingName,
                    value: parsedValue,
                    type: fieldType,
                    section: currentSection,
                    label: configLabels[settingName] || settingName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    description: configDescriptions[settingName] || '',
                    range: configRanges[settingName] || null
                });
            }
        }

        return { settings, comments };
}

/**
 * Render configuration settings as toggles
 * @param {string} matrixName - 'matrix1' or 'matrix2'
 * @param {Array} settings - Array of setting objects
 */
function renderConfigSettings(matrixName, settings) {
        const configEl = document.getElementById(`${matrixName}-config`);

        if (!settings || settings.length === 0) {
            configEl.innerHTML = '<p class="info-message">No configuration settings found.</p>';
            return;
        }

        // Group settings by section
        const sections = {};
        settings.forEach(setting => {
            if (!sections[setting.section]) {
                sections[setting.section] = [];
            }
            sections[setting.section].push(setting);
        });

        // Build the HTML
        let html = '';

        for (const [sectionName, sectionSettings] of Object.entries(sections)) {
            html += `<div class="config-section">`;
            html += `<h4 class="config-section-title">${sectionName}</h4>`;

            sectionSettings.forEach((setting, index) => {
                const settingId = `${matrixName}-${setting.name}`;

                if (setting.type === 'number') {
                    // Check if this should be displayed as time (hours/minutes)
                    if (setting.range && setting.range.displayAsTime) {
                        // Convert total minutes to hours and minutes
                        const totalMinutes = setting.value || 0;
                        const hours = Math.floor(totalMinutes / 60);
                        const minutes = totalMinutes % 60;

                        html += `
                            <div class="config-setting">
                                <div class="config-setting-info">
                                    <label class="config-label">${setting.label}</label>
                                    ${setting.description ? `<span class="config-description">${setting.description}</span>` : ''}
                                </div>
                                <div class="config-time-input">
                                    <div class="time-input-group">
                                        <input type="number"
                                               id="${settingId}-hours"
                                               class="time-number-input"
                                               value="${hours}"
                                               min="0"
                                               max="2"
                                               placeholder="0"
                                               onchange="window.configManager.updateTimeSettingFromInputs('${matrixName}', '${setting.name}', '${settingId}')">
                                        <label class="time-unit-label">hours</label>
                                    </div>
                                    <div class="time-input-group">
                                        <input type="number"
                                               id="${settingId}-minutes"
                                               class="time-number-input"
                                               value="${minutes}"
                                               min="0"
                                               max="59"
                                               placeholder="0"
                                               onchange="window.configManager.updateTimeSettingFromInputs('${matrixName}', '${setting.name}', '${settingId}')">
                                        <label class="time-unit-label">minutes</label>
                                    </div>
                                </div>
                            </div>
                        `;
                    } else {
                        // Render regular number input
                        const min = setting.range ? setting.range.min : 0;
                        const max = setting.range ? setting.range.max : 100;

                        html += `
                            <div class="config-setting">
                                <div class="config-setting-info">
                                    <label for="${settingId}" class="config-label">${setting.label}</label>
                                    ${setting.description ? `<span class="config-description">${setting.description}</span>` : ''}
                                </div>
                                <div class="config-number-input">
                                    <input type="number"
                                           id="${settingId}"
                                           class="number-input"
                                           value="${setting.value}"
                                           min="${min}"
                                           max="${max}"
                                           onchange="window.configManager.updateSetting('${matrixName}', '${setting.name}', parseInt(this.value))">
                                </div>
                            </div>
                        `;
                    }
                } else {
                    // Render toggle for boolean
                    const checked = setting.value ? 'checked' : '';

                    html += `
                        <div class="config-setting">
                            <div class="config-setting-info">
                                <label for="${settingId}" class="config-label">${setting.label}</label>
                                ${setting.description ? `<span class="config-description">${setting.description}</span>` : ''}
                            </div>
                            <div class="config-toggle">
                                <input type="checkbox"
                                       id="${settingId}"
                                       class="toggle-checkbox"
                                       ${checked}
                                       onchange="window.configManager.updateSetting('${matrixName}', '${setting.name}', this.checked)">
                                <label for="${settingId}" class="toggle-label">
                                    <span class="toggle-inner"></span>
                                    <span class="toggle-switch"></span>
                                </label>
                            </div>
                        </div>
                    `;
                }
            });

            html += `</div>`;
        }

        configEl.innerHTML = html;
}

/**
 * Update a setting value
 * @param {string} matrixName - 'matrix1' or 'matrix2'
 * @param {string} settingName - Name of the setting
 * @param {boolean} value - New value
 */
export function updateSetting(matrixName, settingName, value) {
        if (!configState[matrixName] || !configState[matrixName].settings) {
            console.error(`Configuration state not found for ${matrixName}`);
            return;
        }

        // Update the setting in the state
        const setting = configState[matrixName].settings.find(s => s.name === settingName);
        if (setting) {
            setting.value = value;
            console.log(`Updated ${matrixName} setting: ${settingName} = ${value}`);
        }
}

/**
 * Update a time-based setting from hours and minutes inputs
 * @param {string} matrixName - 'matrix1' or 'matrix2'
 * @param {string} settingName - Name of the setting
 * @param {string} settingId - Base ID of the input elements
 */
export function updateTimeSettingFromInputs(matrixName, settingName, settingId) {
        const hoursInput = document.getElementById(`${settingId}-hours`);
        const minutesInput = document.getElementById(`${settingId}-minutes`);

        if (!hoursInput || !minutesInput) {
            console.error(`Time inputs not found for ${settingId}`);
            return;
        }

        // Get hours and minutes values
        const hours = parseInt(hoursInput.value) || 0;
        const minutes = parseInt(minutesInput.value) || 0;

        // Validate ranges
        const validHours = Math.max(0, Math.min(2, hours));
        const validMinutes = Math.max(0, Math.min(59, minutes));

        // Update inputs if they were out of range
        if (hours !== validHours) hoursInput.value = validHours;
        if (minutes !== validMinutes) minutesInput.value = validMinutes;

        // Convert to total minutes
        const totalMinutes = (validHours * 60) + validMinutes;

        // Update the setting
        updateSetting(matrixName, settingName, totalMinutes);
}

/**
 * Save configuration file to GitHub
 * @param {string} matrixName - 'matrix1' or 'matrix2'
 */
export async function saveConfig(matrixName) {
        const statusEl = document.getElementById(`${matrixName}-status`);
        const errorEl = document.getElementById(`${matrixName}-error`);

        if (!configState[matrixName] || !configState[matrixName].settings) {
            errorEl.textContent = 'No configuration loaded to save';
            errorEl.classList.remove('hidden');
            return;
        }

        // Show saving state
        statusEl.textContent = 'Saving...';
        statusEl.classList.remove('hidden');
        errorEl.classList.add('hidden');

        try {
            // Build the CSV content
            const csvContent = buildConfigCSV(configState[matrixName]);

            // Save to GitHub
            const filename = `${matrixName}_config.csv`;

            const result = await saveGitHubFile(
                filename,
                csvContent,
                configState[matrixName].sha
            );

            // Update the SHA for future saves (returned by saveGitHubFile)
            if (result && result.content && result.content.sha) {
                configState[matrixName].sha = result.content.sha;
            }

            // Show success message
            statusEl.textContent = '✓ Saved successfully';
            setTimeout(() => {
                statusEl.classList.add('hidden');
            }, 3000);

            console.log(`Configuration saved successfully: ${filename}`);

        } catch (error) {
            console.error(`Error saving ${matrixName} configuration:`, error);
            statusEl.classList.add('hidden');
            errorEl.textContent = `Failed to save: ${error.message}`;
            errorEl.classList.remove('hidden');
        }
}

/**
 * Build CSV content from configuration state
 * @param {Object} configData - Configuration data with settings and comments
 * @returns {string} CSV content
 */
function buildConfigCSV(configData) {
        let csv = '';

        // Add the standard header comments
        csv += '# Display Configuration for Pantallita\n';
        csv += '# Format: setting,value\n';
        csv += '# Boolean values: 1 = True, 0 = False\n';
        csv += '# This file can be overridden by GitHub remote config at startup\n';
        csv += '\n';

        // Group settings by section
        const sections = {};
        configData.settings.forEach(setting => {
            if (!sections[setting.section]) {
                sections[setting.section] = [];
            }
            sections[setting.section].push(setting);
        });

        // Build CSV with sections
        for (const [sectionName, sectionSettings] of Object.entries(sections)) {
            csv += `# ${sectionName}\n`;

            sectionSettings.forEach(setting => {
                let value;
                if (setting.type === 'number') {
                    value = setting.value;
                } else {
                    value = setting.value ? '1' : '0';
                }
                csv += `${setting.name},${value}\n`;
            });

            csv += '\n';
        }

        return csv.trim() + '\n';
}

/**
 * Reload configuration (discard unsaved changes)
 * @param {string} matrixName - 'matrix1' or 'matrix2'
 */
export function reloadConfig(matrixName) {
    loadConfig(matrixName);
}

// Expose to window for onclick handlers
if (typeof window !== 'undefined') {
    window.configManager = {
        init,
        loadConfig,
        saveConfig,
        updateSetting,
        updateTimeSettingFromInputs,
        reloadConfig
    };
}
