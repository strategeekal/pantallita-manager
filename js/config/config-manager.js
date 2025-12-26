/**
 * Configuration Manager Module
 * Handles loading, editing, and saving display configuration file
 */

import { fetchGitHubFile, saveGitHubFile } from '../core/api.js';

let configState = null;

// Configuration metadata for user-friendly labels
const configLabels = {
    'display_weather': 'Display Weather',
    'display_forecast': 'Display Forecast',
    'display_stocks': 'Display Stocks',
    'display_clock': 'Display Clock',
    'display_schedules': 'Display Schedules',
    'display_events': 'Display Events',
    'temperature_unit': 'Temperature Unit',
    'stocks_display_frequency': 'Stocks: Display Cycle Frequency',
    'stocks_respect_market_hours': 'Stocks: Only During Market Hours',
    'stocks_grace_period_minutes': 'Stocks: After-Hrs. Grace Period (min)',
    'show_weekday_indicator': 'Show Weekday Indicator',
    'display_transit': 'Display Transit',
    'transit_respect_commute_hours': 'Transit: Only During Commute Hours',
    'transit_display_frequency': 'Transit: Display Cycle Frequency'
};

// Configuration descriptions for tooltips
const configDescriptions = {
    'display_weather': 'Display current weather information',
    'display_forecast': 'Display weather forecast',
    'display_stocks': 'Display investment stock ticker information',
    'display_clock': 'Display clock',
    'display_schedules': 'Display scheduled items',
    'display_events': 'Display upcoming events',
    'temperature_unit': 'Temperature unit (F or C)',
    'stocks_display_frequency': 'Number of cycles between stock displays',
    'stocks_respect_market_hours': 'Show stocks during market hours only',
    'stocks_grace_period_minutes': '',  // Dynamic description
    'show_weekday_indicator': 'Show day of the week indicator',
    'display_transit': 'Display public transit arrival times',
    'transit_respect_commute_hours': 'Show transit during commute hours only',
    'transit_display_frequency': 'Number of cycles between transit displays'
};

// Configuration field types
const configTypes = {
    'display_weather': 'boolean',
    'display_forecast': 'boolean',
    'display_stocks': 'boolean',
    'display_clock': 'boolean',
    'display_schedules': 'boolean',
    'display_events': 'boolean',
    'temperature_unit': 'select',
    'stocks_display_frequency': 'number',
    'stocks_respect_market_hours': 'boolean',
    'stocks_grace_period_minutes': 'number',
    'show_weekday_indicator': 'boolean',
    'display_transit': 'boolean',
    'transit_respect_commute_hours': 'boolean',
    'transit_display_frequency': 'number',
    'stocks_csv_version': 'timestamp',
    'schedules_csv_version': 'timestamp',
    'transits_csv_version': 'timestamp',
    'ephemeral_events_csv_version': 'timestamp'
};

// Configuration ranges for numeric fields
const configRanges = {
    'stocks_display_frequency': { min: 1, max: 78 },
    'stocks_grace_period_minutes': { min: 0, max: 120, showTimeHelper: true },
    'transit_display_frequency': { min: 1, max: 78 }
};

// Select field options
const configSelectOptions = {
    'temperature_unit': ['F', 'C']
};

/**
 * Generate dynamic grace period description
 * @param {number} minutes - Grace period in minutes
 * @returns {string} Description text
 */
function getGracePeriodDescription(minutes) {
    const totalMinutes = minutes || 0;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    const now = new Date();
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Calculate the offset between ET and UTC
    const etHour = parseInt(now.toLocaleString('en-US', {
        timeZone: 'America/New_York',
        hour: '2-digit',
        hour12: false
    }));

    const utcHour = now.getUTCHours();
    const etOffset = utcHour - etHour;

    // Create a Date object for 4:00 PM ET
    const marketCloseUTC = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        16 + etOffset,
        0,
        0
    ));

    // Add grace period to get end time
    const endTime = new Date(marketCloseUTC);
    endTime.setMinutes(endTime.getMinutes() + totalMinutes);

    // Format the end time in user's local timezone
    const endTimeStr = endTime.toLocaleString('en-US', {
        timeZone: userTimeZone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    // Get timezone abbreviation
    const tzFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: userTimeZone,
        timeZoneName: 'short'
    });
    const tzParts = tzFormatter.formatToParts(endTime);
    const tzAbbr = tzParts.find(part => part.type === 'timeZoneName')?.value || '';

    // Build duration text
    let durationText = '';
    if (hours > 0 && mins > 0) {
        durationText = `${hours} hour${hours > 1 ? 's' : ''} ${mins} minutes`;
    } else if (hours > 0) {
        durationText = `${hours} hour${hours > 1 ? 's' : ''}`;
    } else if (mins > 0) {
        durationText = `${mins} minutes`;
    } else {
        durationText = '0 minutes';
    }

    return `Stocks will show until ${endTimeStr} ${tzAbbr} (${durationText} after market close)`;
}

/**
 * Initialize the configuration manager
 */
export function init() {
    console.log('Initializing Configuration Manager...');
    loadConfig();
}

/**
 * Load configuration file from GitHub
 */
export async function loadConfig() {
        const statusEl = document.getElementById('config-status');
        const errorEl = document.getElementById('config-error');
        const configEl = document.getElementById('config-settings');

        // Show loading state
        statusEl.classList.remove('hidden');
        errorEl.classList.add('hidden');
        errorEl.textContent = '';

        try {
            const filename = 'config.csv';
            console.log(`Loading configuration file: ${filename}`);

            const response = await fetchGitHubFile(filename);

            if (!response || !response.content) {
                throw new Error('Configuration file not found');
            }

            // Parse the CSV content
            const parsedConfig = parseConfigCSV(response.content);

            // Store the parsed config
            configState = {
                settings: parsedConfig.settings,
                comments: parsedConfig.comments,
                sha: response.sha,
                rawContent: response.content
            };

            // Render the configuration UI
            renderConfigSettings(parsedConfig.settings);

            // Hide loading, show success briefly
            statusEl.textContent = 'Loaded successfully';
            setTimeout(() => {
                statusEl.classList.add('hidden');
            }, 2000);

        } catch (error) {
            console.error('Error loading configuration:', error);
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
                if (commentText && !commentText.includes(':') && !commentText.toLowerCase().includes('format')) {
                    currentSection = commentText;
                }
                continue;
            }

            // Parse setting line: setting,value
            const parts = trimmedLine.split(',');
            if (parts.length === 2) {
                const settingName = parts[0].trim();
                const settingValue = parts[1].trim();

                // Skip unknown settings (not in configTypes) - they may be legacy or malformed
                if (!configTypes[settingName]) {
                    console.warn(`Unknown config setting (skipping): ${settingName}`);
                    continue;
                }

                // Determine the type and parse value accordingly
                const fieldType = configTypes[settingName];
                let parsedValue;

                if (fieldType === 'number') {
                    parsedValue = parseInt(settingValue, 10);
                } else if (fieldType === 'select') {
                    parsedValue = settingValue;
                } else if (fieldType === 'timestamp') {
                    parsedValue = settingValue;
                } else {
                    // Boolean type - handle both true/false strings and 1/0
                    parsedValue = settingValue === 'true' || settingValue === '1';
                }

                settings.push({
                    name: settingName,
                    value: parsedValue,
                    type: fieldType,
                    section: currentSection,
                    label: configLabels[settingName] || settingName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    description: configDescriptions[settingName] || '',
                    range: configRanges[settingName] || null,
                    options: configSelectOptions[settingName] || null
                });
            }
        }

        return { settings, comments };
}

/**
 * Render configuration settings
 * @param {Array} settings - Array of setting objects
 */
function renderConfigSettings(settings) {
        const configEl = document.getElementById('config-settings');

        if (!settings || settings.length === 0) {
            configEl.innerHTML = '<p class="info-message">No configuration settings found.</p>';
            return;
        }

        // Group settings by section (exclude timestamp fields from UI)
        const sections = {};
        settings.forEach(setting => {
            // Skip timestamp fields - they're metadata, not user settings
            if (setting.type === 'timestamp') {
                return;
            }
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

            sectionSettings.forEach((setting) => {
                const settingId = `config-${setting.name}`;

                if (setting.type === 'number') {
                    // Render number input
                    const min = setting.range ? setting.range.min : 0;
                    const max = setting.range ? setting.range.max : 100;

                    // Generate dynamic description for grace period
                    let description = setting.description;
                    let onInputHandler = '';

                    if (setting.name === 'stocks_grace_period_minutes') {
                        description = getGracePeriodDescription(setting.value);
                        onInputHandler = `oninput="window.configManager.updateGracePeriodDescription('${settingId}', parseInt(this.value))"`;
                    }

                    html += `
                        <div class="config-setting">
                            <div class="config-setting-info">
                                <label for="${settingId}" class="config-label">${setting.label}</label>
                                ${description ? `<span class="config-description" id="${settingId}-description">${description}</span>` : ''}
                            </div>
                            <div class="config-number-input">
                                <input type="number"
                                       id="${settingId}"
                                       class="number-input"
                                       value="${setting.value}"
                                       min="${min}"
                                       max="${max}"
                                       ${onInputHandler}
                                       onchange="window.configManager.updateSetting('${setting.name}', parseInt(this.value))">
                            </div>
                        </div>
                    `;
                } else if (setting.type === 'select') {
                    // Render select dropdown
                    const options = setting.options || [];
                    const optionsHtml = options.map(opt =>
                        `<option value="${opt}" ${setting.value === opt ? 'selected' : ''}>${opt}</option>`
                    ).join('');

                    html += `
                        <div class="config-setting">
                            <div class="config-setting-info">
                                <label for="${settingId}" class="config-label">${setting.label}</label>
                                ${setting.description ? `<span class="config-description">${setting.description}</span>` : ''}
                            </div>
                            <div class="config-select">
                                <select id="${settingId}"
                                        class="select-input"
                                        onchange="window.configManager.updateSetting('${setting.name}', this.value)">
                                    ${optionsHtml}
                                </select>
                            </div>
                        </div>
                    `;
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
                                       onchange="window.configManager.updateSetting('${setting.name}', this.checked)">
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
 * @param {string} settingName - Name of the setting
 * @param {*} value - New value
 */
export function updateSetting(settingName, value) {
        if (!configState || !configState.settings) {
            console.error('Configuration state not found');
            return;
        }

        // Update the setting in the state
        const setting = configState.settings.find(s => s.name === settingName);
        if (setting) {
            setting.value = value;
            console.log(`Updated setting: ${settingName} = ${value}`);
        }
}

/**
 * Update grace period description text in real-time
 * @param {string} settingId - ID of the setting input
 * @param {number} minutes - Minutes value
 */
export function updateGracePeriodDescription(settingId, minutes) {
    const descriptionEl = document.getElementById(`${settingId}-description`);
    if (descriptionEl) {
        descriptionEl.textContent = getGracePeriodDescription(minutes);
    }
}

/**
 * Save configuration file to GitHub
 */
export async function saveConfig() {
        const statusEl = document.getElementById('config-status');
        const errorEl = document.getElementById('config-error');
        const statusElBottom = document.getElementById('config-status-bottom');
        const errorElBottom = document.getElementById('config-error-bottom');

        if (!configState || !configState.settings) {
            errorEl.textContent = 'No configuration loaded to save';
            errorEl.classList.remove('hidden');
            if (errorElBottom) {
                errorElBottom.textContent = 'No configuration loaded to save';
                errorElBottom.classList.remove('hidden');
            }
            return;
        }

        // Show saving state
        statusEl.textContent = 'Saving...';
        statusEl.classList.remove('hidden');
        errorEl.classList.add('hidden');
        if (statusElBottom) {
            statusElBottom.textContent = 'Saving...';
            statusElBottom.classList.remove('hidden');
        }
        if (errorElBottom) {
            errorElBottom.classList.add('hidden');
        }

        try {
            // Build the CSV content
            const csvContent = buildConfigCSV(configState);

            // Save to GitHub
            const filename = 'config.csv';

            const result = await saveGitHubFile(
                filename,
                csvContent,
                configState.sha
            );

            // Update the SHA for future saves
            if (result && result.content && result.content.sha) {
                configState.sha = result.content.sha;
            }

            // Show success message
            statusEl.textContent = '✓ Saved successfully';
            if (statusElBottom) {
                statusElBottom.textContent = '✓ Saved successfully';
            }
            setTimeout(() => {
                statusEl.classList.add('hidden');
                if (statusElBottom) {
                    statusElBottom.classList.add('hidden');
                }
            }, 3000);

            console.log(`Configuration saved successfully: ${filename}`);

        } catch (error) {
            console.error('Error saving configuration:', error);
            statusEl.classList.add('hidden');
            errorEl.textContent = `Failed to save: ${error.message}`;
            errorEl.classList.remove('hidden');
            if (statusElBottom) {
                statusElBottom.classList.add('hidden');
            }
            if (errorElBottom) {
                errorElBottom.textContent = `Failed to save: ${error.message}`;
                errorElBottom.classList.remove('hidden');
            }
        }
}

/**
 * Build CSV content from configuration state
 * @param {Object} configData - Configuration data with settings and comments
 * @returns {string} CSV content
 */
function buildConfigCSV(configData) {
        let csv = '';

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
                } else if (setting.type === 'select') {
                    value = setting.value;
                } else if (setting.type === 'timestamp') {
                    value = setting.value;
                } else {
                    // Boolean - use true/false strings
                    value = setting.value ? 'true' : 'false';
                }
                csv += `${setting.name},${value}\n`;
            });

            csv += '\n';
        }

        return csv.trim() + '\n';
}

/**
 * Reload configuration (discard unsaved changes)
 */
export function reloadConfig() {
    loadConfig();
}

/**
 * Update CSV file version timestamp
 * @param {string} csvType - Type of CSV file ('stocks', 'schedules', 'transits', 'ephemeral_events')
 */
export async function updateCSVVersion(csvType) {
    if (!configState || !configState.settings) {
        console.error('Configuration state not found');
        return;
    }

    const versionKey = `${csvType}_csv_version`;
    const timestamp = new Date().toISOString();

    // Update the timestamp in the settings
    const setting = configState.settings.find(s => s.name === versionKey);
    if (setting) {
        setting.value = timestamp;
        console.log(`Updated CSV version: ${versionKey} = ${timestamp}`);

        // Auto-save the config to persist the timestamp
        await saveConfig();
    } else {
        console.warn(`CSV version key not found: ${versionKey}`);
    }
}

// Expose to window for onclick handlers
if (typeof window !== 'undefined') {
    window.configManager = {
        init,
        loadConfig,
        saveConfig,
        reloadConfig,
        updateSetting,
        updateGracePeriodDescription,
        updateCSVVersion
    };
}
