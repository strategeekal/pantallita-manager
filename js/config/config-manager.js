/**
 * Configuration Manager Module
 * Handles loading, editing, and saving display configuration file
 */

import { fetchGitHubFile, saveGitHubFile } from '../core/api.js';
import { getConfigFilename, getDisplay, setDisplay } from '../core/config.js';

let configState = null;
let saveQueue = Promise.resolve(); // Queue for sequential saves
let configLoaded = false; // Track if config was successfully loaded
let loadInProgress = false; // Prevent concurrent loads
let availableDisplays = []; // List of available display config files

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
    'forecast_display_frequency': 'Forecast: Display Cycle Frequency',
    'display_transit': 'Display Transit',
    'transit_respect_commute_hours': 'Transit: Only During Commute Hours',
    'transit_display_frequency': 'Transit: Display Cycle Frequency',
    'weather_display_duration': 'Weather Duration (seconds)',
    'forecast_display_duration': 'Forecast Duration (seconds)',
    'stocks_display_duration': 'Stocks Duration (seconds)',
    'transit_display_duration': 'Transit Duration (seconds)',
    'display_order': 'Display Order'
};

// Mapping between display_order items and their toggle settings
const displayOrderMapping = {
    'weather': { toggle: 'display_weather', label: 'Weather', icon: '🌤️' },
    'forecast': { toggle: 'display_forecast', label: 'Forecast', icon: '📅' },
    'events': { toggle: 'display_events', label: 'Events', icon: '🎉' },
    'stocks': { toggle: 'display_stocks', label: 'Stocks', icon: '📈' },
    'transit': { toggle: 'display_transit', label: 'Transit', icon: '🚇' }
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
    'forecast_display_frequency': 'Number of cycles between forecast displays',
    'display_transit': 'Display public transit arrival times',
    'transit_respect_commute_hours': 'Show transit during commute hours only',
    'transit_display_frequency': 'Number of cycles between transit displays',
    'weather_display_duration': 'How long weather is displayed on screen',
    'forecast_display_duration': 'How long forecast is displayed on screen',
    'stocks_display_duration': 'How long stocks are displayed on screen',
    'transit_display_duration': 'How long transit info is displayed on screen',
    'display_order': 'Drag to reorder how displays cycle on your matrix'
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
    'forecast_display_frequency': 'number',
    'display_transit': 'boolean',
    'transit_respect_commute_hours': 'boolean',
    'transit_display_frequency': 'number',
    'stocks_csv_version': 'timestamp',
    'schedules_csv_version': 'timestamp',
    'transits_csv_version': 'timestamp',
    'ephemeral_events_csv_version': 'timestamp',
    'recurring_events_csv_version': 'timestamp',
    'weather_display_duration': 'number',
    'forecast_display_duration': 'number',
    'stocks_display_duration': 'number',
    'transit_display_duration': 'number',
    'display_order': 'order'
};

// Configuration ranges for numeric fields
const configRanges = {
    'stocks_display_frequency': { min: 1, max: 78 },
    'stocks_grace_period_minutes': { min: 0, max: 120, showTimeHelper: true },
    'forecast_display_frequency': { min: 1, max: 78 },
    'transit_display_frequency': { min: 1, max: 78 },
    'weather_display_duration': { min: 30, max: 900 },
    'forecast_display_duration': { min: 30, max: 900 },
    'stocks_display_duration': { min: 30, max: 900 },
    'transit_display_duration': { min: 30, max: 900 }
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
export async function init() {
    console.log('Initializing Configuration Manager...');

    // First, detect available display config files
    await detectAvailableDisplays();

    // Then load the config for the selected display
    await loadConfig();
}

/**
 * Detect available display config files in the repo
 * Looks for files matching pattern: config_display*.csv or config.csv
 */
async function detectAvailableDisplays() {
    try {
        const { loadConfig: loadAppConfig } = await import('../core/config.js');
        const appConfig = loadAppConfig();

        if (!appConfig.token || !appConfig.owner || !appConfig.repo) {
            console.warn('GitHub not configured, cannot detect displays');
            availableDisplays = ['1']; // Default to single display
            return;
        }

        // Fetch root directory contents
        const response = await fetch(
            `https://api.github.com/repos/${appConfig.owner}/${appConfig.repo}/contents/`,
            {
                headers: {
                    'Authorization': `Bearer ${appConfig.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        if (!response.ok) {
            console.warn('Could not fetch repo contents, defaulting to single display');
            availableDisplays = ['1'];
            return;
        }

        const files = await response.json();

        // Find all config_display*.csv files
        const configFiles = files
            .filter(f => f.name.match(/^config_display(\d+)\.csv$/))
            .map(f => {
                const match = f.name.match(/^config_display(\d+)\.csv$/);
                return match ? match[1] : null;
            })
            .filter(Boolean)
            .sort((a, b) => parseInt(a) - parseInt(b));

        // Also check for legacy config.csv (treat as display 1 if no display-specific configs)
        const hasLegacyConfig = files.some(f => f.name === 'config.csv');

        if (configFiles.length > 0) {
            availableDisplays = configFiles;
            console.log(`Detected ${configFiles.length} display config(s):`, availableDisplays);
        } else if (hasLegacyConfig) {
            // Legacy single config.csv - treat as one display
            availableDisplays = ['1'];
            console.log('Found legacy config.csv, using single display mode');
        } else {
            availableDisplays = ['1'];
            console.log('No config files found, defaulting to single display');
        }

        // Validate current display selection
        const currentDisplay = getDisplay();
        if (!availableDisplays.includes(currentDisplay)) {
            console.log(`Current display ${currentDisplay} not available, switching to ${availableDisplays[0]}`);
            setDisplay(availableDisplays[0]);
        }

        // Render the display selector UI
        renderDisplaySelector();

    } catch (error) {
        console.error('Error detecting displays:', error);
        availableDisplays = ['1'];
    }
}

/**
 * Render the display selector UI based on available displays
 */
function renderDisplaySelector() {
    const container = document.querySelector('.display-selector-container');
    if (!container) return;

    // Hide selector if only one display
    if (availableDisplays.length <= 1) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'flex';

    // Build toggle buttons
    const toggleContainer = container.querySelector('.display-toggle');
    if (!toggleContainer) return;

    const currentDisplay = getDisplay();

    toggleContainer.innerHTML = availableDisplays.map(displayNum => `
        <button
            id="display-btn-${displayNum}"
            class="display-btn ${displayNum === currentDisplay ? 'active' : ''}"
            onclick="window.configManager.switchDisplay('${displayNum}')"
        >Display ${displayNum}</button>
    `).join('');
}

/**
 * Get the list of available displays
 * @returns {string[]} Array of display numbers
 */
export function getAvailableDisplays() {
    return [...availableDisplays];
}

/**
 * Check if config is loaded
 * @returns {boolean} True if config was loaded successfully
 */
export function isConfigLoaded() {
    return configLoaded;
}

/**
 * Load configuration file from GitHub
 * @param {boolean} forceReload - Force reload even if already loaded
 */
export async function loadConfig(forceReload = false) {
        // Prevent concurrent loads
        if (loadInProgress) {
            console.log('Config load already in progress, skipping...');
            return;
        }

        // Skip if already loaded (unless force reload)
        if (configLoaded && !forceReload) {
            console.log('Config already loaded');
            return;
        }

        const statusEl = document.getElementById('config-status');
        const errorEl = document.getElementById('config-error');
        const configEl = document.getElementById('config-settings');

        // Elements might not exist yet if tab hasn't been rendered
        if (!statusEl || !errorEl || !configEl) {
            console.log('Config UI elements not ready, will retry when tab is opened');
            return;
        }

        loadInProgress = true;

        // Show loading state
        statusEl.classList.remove('hidden');
        errorEl.classList.add('hidden');
        errorEl.textContent = '';

        try {
            let filename = getConfigFilename();
            console.log(`Loading configuration file: ${filename} (Display ${getDisplay()})`);

            let response = await fetchGitHubFile(filename);

            // If display-specific config not found, try legacy config.csv
            if (!response || !response.content) {
                console.log(`${filename} not found, trying legacy config.csv...`);
                filename = 'config.csv';
                response = await fetchGitHubFile(filename);
            }

            if (!response || !response.content) {
                throw new Error('Configuration file not found');
            }

            // Store the actual filename used (for saving)
            configState = configState || {};
            configState.filename = filename;

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

            // Mark as loaded
            configLoaded = true;

            // Update display selector UI
            updateDisplaySelectorUI();

            // Hide loading, show success briefly
            statusEl.textContent = 'Loaded successfully';
            setTimeout(() => {
                statusEl.classList.add('hidden');
            }, 2000);

            console.log('Configuration loaded successfully');

        } catch (error) {
            console.error('Error loading configuration:', error);
            configLoaded = false;
            statusEl.classList.add('hidden');
            errorEl.textContent = `Failed to load configuration: ${error.message}`;
            errorEl.classList.remove('hidden');
            configEl.innerHTML = '<p class="error-message">Unable to load configuration settings. <button class="btn-pixel btn-secondary" onclick="window.configManager.loadConfig(true)" style="margin-left: 10px;">Retry</button></p>';
        } finally {
            loadInProgress = false;
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

            // Parse setting line: setting,value (or setting,value1,value2,... for order type)
            const parts = trimmedLine.split(',');
            if (parts.length >= 2) {
                const settingName = parts[0].trim();

                // Skip unknown settings (not in configTypes) - they may be legacy or malformed
                if (!configTypes[settingName]) {
                    console.warn(`Unknown config setting (skipping): ${settingName}`);
                    continue;
                }

                // Determine the type and parse value accordingly
                const fieldType = configTypes[settingName];
                let parsedValue;

                if (fieldType === 'number') {
                    parsedValue = parseInt(parts[1].trim(), 10);
                } else if (fieldType === 'select') {
                    parsedValue = parts[1].trim();
                } else if (fieldType === 'timestamp') {
                    parsedValue = parts[1].trim();
                } else if (fieldType === 'order') {
                    // Order type: comma-separated list after the setting name
                    parsedValue = parts.slice(1).map(p => p.trim()).filter(p => p);
                } else {
                    // Boolean type - handle both true/false strings and 1/0
                    const settingValue = parts[1].trim();
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
                } else if (setting.type === 'order') {
                    // Render draggable order boxes
                    html += `
                        <div class="config-setting config-setting-order">
                            <div class="config-setting-info">
                                <label class="config-label">${setting.label}</label>
                                ${setting.description ? `<span class="config-description">${setting.description}</span>` : ''}
                            </div>
                            <div class="config-order-container" id="${settingId}-container">
                                ${renderOrderItems(setting.value, settingId)}
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
 * Render order items as draggable boxes
 * @param {Array} orderArray - Array of display keys in order
 * @param {string} settingId - The setting element ID
 * @returns {string} HTML string
 */
function renderOrderItems(orderArray, settingId) {
    let html = '';

    orderArray.forEach((item, index) => {
        const mapping = displayOrderMapping[item];
        if (!mapping) return;

        const isEnabled = isDisplayEnabled(mapping.toggle);
        const disabledClass = isEnabled ? '' : 'order-item-disabled';
        const disabledTitle = isEnabled ? '' : ' (disabled)';

        html += `
            <div class="order-item ${disabledClass}"
                 draggable="true"
                 data-key="${item}"
                 data-index="${index}"
                 data-setting-id="${settingId}"
                 ondragstart="window.configManager.handleOrderDragStart(event)"
                 ondragover="window.configManager.handleOrderDragOver(event)"
                 ondragleave="window.configManager.handleOrderDragLeave(event)"
                 ondrop="window.configManager.handleOrderDrop(event)"
                 ondragend="window.configManager.handleOrderDragEnd(event)">
                <span class="order-item-handle">⋮⋮</span>
                <span class="order-item-icon">${mapping.icon}</span>
                <span class="order-item-label">${mapping.label}${disabledTitle}</span>
                <span class="order-item-position">${index + 1}</span>
            </div>
        `;
    });

    return html;
}

/**
 * Check if a display toggle is enabled
 * @param {string} toggleName - The toggle setting name
 * @returns {boolean} True if enabled
 */
function isDisplayEnabled(toggleName) {
    if (!configState || !configState.settings) return true;
    const setting = configState.settings.find(s => s.name === toggleName);
    return setting ? setting.value : true;
}

/**
 * Re-render the order items (called after toggle changes)
 */
function refreshOrderDisplay() {
    const orderSetting = configState?.settings?.find(s => s.type === 'order');
    if (!orderSetting) return;

    const settingId = `config-${orderSetting.name}`;
    const container = document.getElementById(`${settingId}-container`);
    if (container) {
        container.innerHTML = renderOrderItems(orderSetting.value, settingId);
    }
}

// Order drag and drop state
let orderDraggedIndex = null;
let orderDraggedElement = null;
let orderSettingId = null;

/**
 * Handle drag start for order items
 * @param {DragEvent} event
 */
export function handleOrderDragStart(event) {
    orderDraggedIndex = parseInt(event.currentTarget.dataset.index);
    orderDraggedElement = event.currentTarget;
    orderSettingId = event.currentTarget.dataset.settingId;
    event.currentTarget.classList.add('order-item-dragging');
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', orderDraggedIndex.toString());
}

/**
 * Handle drag over for order items
 * @param {DragEvent} event
 */
export function handleOrderDragOver(event) {
    event.preventDefault();
    event.stopPropagation();

    const target = event.currentTarget;
    const targetIndex = parseInt(target.dataset.index);

    if (orderDraggedIndex === targetIndex) {
        return false;
    }

    // Remove drag-over from siblings
    const container = target.parentElement;
    container.querySelectorAll('.order-item').forEach(item => {
        if (item !== target) {
            item.classList.remove('order-item-drag-over');
        }
    });

    target.classList.add('order-item-drag-over');
    event.dataTransfer.dropEffect = 'move';
    return false;
}

/**
 * Handle drag leave for order items
 * @param {DragEvent} event
 */
export function handleOrderDragLeave(event) {
    event.currentTarget.classList.remove('order-item-drag-over');
}

/**
 * Handle drop for order items
 * @param {DragEvent} event
 */
export function handleOrderDrop(event) {
    event.preventDefault();
    event.stopPropagation();

    const dropIndex = parseInt(event.currentTarget.dataset.index);

    if (orderDraggedIndex !== null && orderDraggedIndex !== dropIndex) {
        // Find the order setting
        const orderSetting = configState?.settings?.find(s => s.type === 'order');
        if (orderSetting && Array.isArray(orderSetting.value)) {
            // Move the item
            const draggedItem = orderSetting.value[orderDraggedIndex];
            orderSetting.value.splice(orderDraggedIndex, 1);
            orderSetting.value.splice(dropIndex, 0, draggedItem);

            // Re-render the order items
            const container = document.getElementById(`${orderSettingId}-container`);
            if (container) {
                container.innerHTML = renderOrderItems(orderSetting.value, orderSettingId);
            }

            console.log('Updated display order:', orderSetting.value.join(','));
        }
    }

    return false;
}

/**
 * Handle drag end for order items
 * @param {DragEvent} event
 */
export function handleOrderDragEnd(event) {
    if (orderDraggedElement) {
        orderDraggedElement.classList.remove('order-item-dragging');
    }

    // Remove drag-over from all items
    document.querySelectorAll('.order-item').forEach(item => {
        item.classList.remove('order-item-drag-over');
    });

    orderDraggedIndex = null;
    orderDraggedElement = null;
    orderSettingId = null;
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

            // If this is a display toggle, refresh the order display
            if (settingName.startsWith('display_')) {
                refreshOrderDisplay();
            }
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

            // Save to GitHub (use the filename that was loaded, or display-specific)
            const filename = configState.filename || getConfigFilename();

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

        console.log('buildConfigCSV: Building CSV from configState');
        console.log(`buildConfigCSV: Total settings: ${configData.settings.length}`);

        // Log timestamp values before building
        const timestampSettings = configData.settings.filter(s => s.type === 'timestamp');
        console.log('buildConfigCSV: Timestamp settings:');
        timestampSettings.forEach(s => {
            console.log(`  ${s.name} = ${s.value}`);
        });

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
                } else if (setting.type === 'order') {
                    // Order type - comma-separated list
                    value = Array.isArray(setting.value) ? setting.value.join(',') : setting.value;
                } else {
                    // Boolean - use true/false strings
                    value = setting.value ? 'true' : 'false';
                }
                csv += `${setting.name},${value}\n`;
            });

            csv += '\n';
        }

        console.log('buildConfigCSV: CSV built successfully');
        return csv.trim() + '\n';
}

/**
 * Reload configuration (discard unsaved changes)
 */
export function reloadConfig() {
    loadConfig();
}

/**
 * Wait for config to be loaded
 * @returns {Promise} Resolves when config is loaded
 */
async function waitForConfig() {
    const maxWait = 5000; // 5 seconds max
    const checkInterval = 100; // Check every 100ms
    let elapsed = 0;

    while (!configState || !configState.settings) {
        if (elapsed >= maxWait) {
            throw new Error('Config failed to load within 5 seconds');
        }
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        elapsed += checkInterval;
    }
}

/**
 * Update CSV file version timestamp in ALL display config files
 * Since data files (stocks, events, schedules) are shared, all displays need to know about changes
 * @param {string} csvType - Type of CSV file ('stocks', 'schedules', 'transits', 'ephemeral_events')
 */
export async function updateCSVVersion(csvType) {
    const versionKey = `${csvType}_csv_version`;
    const timestamp = new Date().toISOString();

    console.log(`updateCSVVersion(${csvType}): Updating ${versionKey} in all display configs`);

    // Update current display's config (in memory)
    if (configState && configState.settings) {
        let setting = configState.settings.find(s => s.name === versionKey);
        if (setting) {
            setting.value = timestamp;
        } else {
            configState.settings.push({ name: versionKey, value: timestamp, type: 'timestamp', section: 'CSV Versions' });
        }
    }

    // Queue saves to prevent concurrent saves
    saveQueue = saveQueue.then(async () => {
        try {
            // Save current display's config
            if (configState && configState.settings) {
                console.log(`  Saving timestamp to current display config...`);
                await saveConfig();
            }

            // Update ALL other display config files
            const currentDisplay = getDisplay();
            const otherDisplays = availableDisplays.filter(d => d !== currentDisplay);

            for (const displayNum of otherDisplays) {
                const filename = `config_display${displayNum}.csv`;
                console.log(`  Updating timestamp in ${filename}...`);
                await updateTimestampInOtherConfig(filename, versionKey, timestamp);
            }

        } catch (error) {
            console.error(`  Failed to update CSV version:`, error);
        }
    });
}

/**
 * Update a timestamp in another display's config file
 * @param {string} filename - Config filename to update
 * @param {string} versionKey - The timestamp key to update
 * @param {string} timestamp - The new timestamp value
 */
async function updateTimestampInOtherConfig(filename, versionKey, timestamp) {
    try {
        // Fetch the other config file
        const response = await fetchGitHubFile(filename);

        if (!response || !response.content) {
            console.warn(`  Could not fetch ${filename} - file may not exist yet`);
            return;
        }

        // Parse it
        const parsedConfig = parseConfigCSV(response.content);

        // Update or add the timestamp
        let setting = parsedConfig.settings.find(s => s.name === versionKey);
        if (setting) {
            setting.value = timestamp;
        } else {
            parsedConfig.settings.push({ name: versionKey, value: timestamp, type: 'timestamp', section: 'CSV Versions' });
        }

        // Build and save
        const csvContent = buildConfigCSV({ settings: parsedConfig.settings, comments: parsedConfig.comments });

        await saveGitHubFile(filename, csvContent, response.sha);

        console.log(`  ✓ Updated ${versionKey} in ${filename}`);

    } catch (error) {
        // Don't fail the whole operation if we can't update the other config
        console.warn(`  Could not update ${filename}:`, error.message);
    }
}

/**
 * Switch to a different display and reload config
 * @param {string} displayNum - Display number (e.g., '1', '2', '3')
 */
export async function switchDisplay(displayNum) {
    // Validate against available displays
    if (!availableDisplays.includes(displayNum)) {
        console.error('Invalid display number:', displayNum, '- Available:', availableDisplays);
        return;
    }

    const currentDisplay = getDisplay();
    if (currentDisplay === displayNum) {
        console.log(`Already on Display ${displayNum}`);
        return;
    }

    console.log(`Switching from Display ${currentDisplay} to Display ${displayNum}`);

    // Update the display setting
    setDisplay(displayNum);

    // Reset config state to force reload
    configState = null;
    configLoaded = false;

    // Reload config for new display
    await loadConfig(true);

    // Update the display selector UI
    updateDisplaySelectorUI();
}

/**
 * Get the current display number
 * @returns {string} Current display number ('1' or '2')
 */
export function getCurrentDisplay() {
    return getDisplay();
}

/**
 * Update the display selector UI to reflect current state
 */
export function updateDisplaySelectorUI() {
    const currentDisplay = getDisplay();

    // Update button states
    const btn1 = document.getElementById('display-btn-1');
    const btn2 = document.getElementById('display-btn-2');

    if (btn1 && btn2) {
        btn1.classList.toggle('active', currentDisplay === '1');
        btn2.classList.toggle('active', currentDisplay === '2');
    }

    // Update the display indicator text if it exists
    const indicator = document.getElementById('current-display-indicator');
    if (indicator) {
        indicator.textContent = `Display ${currentDisplay}`;
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
        updateCSVVersion,
        isConfigLoaded,
        switchDisplay,
        getCurrentDisplay,
        updateDisplaySelectorUI,
        getAvailableDisplays,
        handleOrderDragStart,
        handleOrderDragOver,
        handleOrderDragLeave,
        handleOrderDrop,
        handleOrderDragEnd
    };
}
