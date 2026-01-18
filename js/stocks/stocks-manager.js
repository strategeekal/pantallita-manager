/**
 * Stocks Manager Module
 * Handles loading, editing, and saving stock ticker information
 */

import { fetchGitHubFile, saveGitHubFile } from '../core/api.js';
import { updateCSVVersion } from '../config/config-manager.js';

let stocksData = [];
let stocksSha = null;
let stockReference = null;

/**
 * Load stock reference data
 */
async function loadStockReference() {
    if (stockReference) return stockReference;

    try {
        const response = await fetch('js/stocks/stock-reference.json');
        stockReference = await response.json();
        return stockReference;
    } catch (error) {
        console.error('Error loading stock reference:', error);
        return {};
    }
}

/**
 * Initialize the stocks manager
 */
export async function initializeStocks() {
    await loadStockReference();
    await loadStocks();
}

/**
 * Load stocks from GitHub
 */
export async function loadStocks() {
    const loadingEl = document.getElementById('stocks-loading');
    const errorEl = document.getElementById('stocks-error');
    const listEl = document.getElementById('stocks-list');
    const emptyEl = document.getElementById('stocks-empty');

    // Show loading state
    loadingEl.classList.remove('hidden');
    errorEl.classList.add('hidden');
    listEl.innerHTML = '';
    emptyEl.classList.add('hidden');

    try {
        const response = await fetchGitHubFile('stocks.csv');

        if (!response || !response.content) {
            throw new Error('stocks.csv file not found');
        }

        stocksSha = response.sha;
        stocksData = parseStocksCSV(response.content);

        loadingEl.classList.add('hidden');

        if (stocksData.length === 0) {
            emptyEl.classList.remove('hidden');
        } else {
            renderStocksList();
        }

        console.log(`Loaded ${stocksData.length} stocks`);

    } catch (error) {
        console.error('Error loading stocks:', error);
        loadingEl.classList.add('hidden');
        errorEl.textContent = `Failed to load stocks: ${error.message}`;
        errorEl.classList.remove('hidden');
    }
}

/**
 * Parse stocks CSV content
 * @param {string} content - CSV content
 * @returns {Array} Array of stock objects
 */
function parseStocksCSV(content) {
    const lines = content.trim().split('\n');
    const stocks = [];

    for (const line of lines) {
        const trimmedLine = line.trim();

        // Skip empty lines and comments
        if (!trimmedLine || trimmedLine.startsWith('#')) {
            continue;
        }

        // Parse: symbol,name,type,display_name,highlighted
        // Backward compatible with: symbol,name,type,display_name OR ticker,company_name
        const parts = trimmedLine.split(',').map(p => p.trim());

        if (parts.length >= 2) {
            if (parts.length >= 5) {
                // New format: symbol,name,type,display_name,highlighted
                stocks.push({
                    symbol: parts[0].toUpperCase(),
                    name: parts[1],
                    type: parts[2] || 'stock',
                    displayName: parts[3] || '',
                    highlighted: parts[4] === '1'
                });
            } else if (parts.length >= 4) {
                // Format: symbol,name,type,display_name
                stocks.push({
                    symbol: parts[0].toUpperCase(),
                    name: parts[1],
                    type: parts[2] || 'stock',
                    displayName: parts[3] || '',
                    highlighted: false
                });
            } else {
                // Old format: ticker,company_name (backward compatibility)
                stocks.push({
                    symbol: parts[0].toUpperCase(),
                    name: parts.slice(1).join(','), // Handle commas in names
                    type: 'stock',
                    displayName: '',
                    highlighted: false
                });
            }
        }
    }

    return stocks;
}

/**
 * Render the stocks list with timeline-style display organization
 */
function renderStocksList() {
    const listEl = document.getElementById('stocks-list');

    if (stocksData.length === 0) {
        document.getElementById('stocks-empty').classList.remove('hidden');
        listEl.innerHTML = '';
        return;
    }

    document.getElementById('stocks-empty').classList.add('hidden');

    let html = '<div class="stocks-grid">';

    // Calculate display cycles dynamically
    let displayNumber = 1;
    let regularStockBuffer = [];

    stocksData.forEach((stock, index) => {
        const displayLabel = stock.displayName || stock.symbol;
        const typeBadgeClass = stock.type === 'stock' ? 'stock-type-badge-stock' : 'stock-type-badge-other';
        const cardClass = stock.highlighted ? 'stock-card stock-card-highlighted' : 'stock-card';
        const starIcon = stock.highlighted ? '⭐ ' : '';

        // Determine badge text
        let badgeText;
        if (stock.highlighted) {
            badgeText = 'HIGHLIGHTED';
        } else {
            // Calculate which cycle this stock belongs to
            const regularIndex = regularStockBuffer.length;
            const cycleNumber = Math.floor(regularIndex / 3) + 1;
            badgeText = `Cycle ${cycleNumber}`;
        }

        html += `
            <div class="${cardClass}"
                 draggable="true"
                 data-index="${index}"
                 ondragstart="window.stocksModule.handleDragStart(event)"
                 ondragover="window.stocksModule.handleDragOver(event)"
                 ondragleave="window.stocksModule.handleDragLeave(event)"
                 ondrop="window.stocksModule.handleDrop(event)"
                 ondragend="window.stocksModule.handleDragEnd(event)">
                <div class="stock-drag-handle" title="Drag to reorder">⋮⋮</div>
                <div class="stock-cycle-badge ${stock.highlighted ? 'stock-highlighted-badge' : ''}">${badgeText}</div>
                <div class="stock-info">
                    <div class="stock-ticker">
                        ${starIcon}${displayLabel}
                        <span class="stock-type-badge ${typeBadgeClass}">${stock.type.toUpperCase()}</span>
                    </div>
                    <div class="stock-company">${stock.name}</div>
                </div>
                <div class="stock-actions">
                    <button class="btn-pixel btn-small btn-primary" onclick="window.stocksModule.editStock(${index})">✏️</button>
                    <button class="btn-pixel btn-small btn-calm" onclick="window.stocksModule.deleteStock(${index})">🗑️</button>
                </div>
            </div>
        `;

        // Track regular stocks for cycle calculation
        if (!stock.highlighted) {
            regularStockBuffer.push(stock);
        }
    });

    html += '</div>';
    listEl.innerHTML = html;
}

/**
 * Move stock up in the list
 * @param {number} index - Stock index
 */
export async function moveStockUp(index) {
    if (index <= 0) return;

    // Swap with previous item
    [stocksData[index - 1], stocksData[index]] = [stocksData[index], stocksData[index - 1]];

    await saveStocksToGitHub();
    renderStocksList();
}

/**
 * Move stock down in the list
 * @param {number} index - Stock index
 */
export async function moveStockDown(index) {
    if (index >= stocksData.length - 1) return;

    // Swap with next item
    [stocksData[index], stocksData[index + 1]] = [stocksData[index + 1], stocksData[index]];

    await saveStocksToGitHub();
    renderStocksList();
}

// Drag and drop state
let draggedIndex = null;
let draggedElement = null;

/**
 * Handle drag start event
 * @param {DragEvent} event
 */
export function handleDragStart(event) {
    draggedIndex = parseInt(event.currentTarget.dataset.index);
    draggedElement = event.currentTarget;
    event.currentTarget.classList.add('dragging');
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', draggedIndex.toString()); // Use text/plain for better compatibility
}

/**
 * Handle drag over event
 * @param {DragEvent} event
 */
export function handleDragOver(event) {
    event.preventDefault(); // Required to allow drop
    event.stopPropagation();

    const target = event.currentTarget;
    const targetIndex = parseInt(target.dataset.index);

    // Don't highlight if dragging over self
    if (draggedIndex === targetIndex) {
        return false;
    }

    // Remove drag-over from all other cards
    document.querySelectorAll('.stock-card').forEach(card => {
        if (card !== target) {
            card.classList.remove('drag-over');
        }
    });

    // Add drag-over to current target
    target.classList.add('drag-over');

    event.dataTransfer.dropEffect = 'move';
    return false;
}

/**
 * Handle drag leave event
 * @param {DragEvent} event
 */
export function handleDragLeave(event) {
    event.currentTarget.classList.remove('drag-over');
}

/**
 * Handle drop event
 * @param {DragEvent} event
 */
export async function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();

    const dropIndex = parseInt(event.currentTarget.dataset.index);

    if (draggedIndex !== null && draggedIndex !== dropIndex) {
        // Move the dragged item to the new position
        const draggedStock = stocksData[draggedIndex];
        stocksData.splice(draggedIndex, 1);
        stocksData.splice(dropIndex, 0, draggedStock);

        await saveStocksToGitHub();
        renderStocksList();
    }

    return false;
}

/**
 * Handle drag end event
 * @param {DragEvent} event
 */
export function handleDragEnd(event) {
    // Remove dragging class
    if (draggedElement) {
        draggedElement.classList.remove('dragging');
    }

    // Remove drag-over class from all cards
    document.querySelectorAll('.stock-card').forEach(card => {
        card.classList.remove('drag-over');
    });

    draggedIndex = null;
    draggedElement = null;
}

/**
 * Open add stock dialog
 */
export function openAddStockDialog() {
    document.getElementById('stock-editor-title').textContent = 'Add New Stock';
    document.getElementById('stock-symbol').value = '';
    document.getElementById('stock-name').value = '';
    document.getElementById('stock-type').value = 'stock';
    document.getElementById('stock-display-name').value = '';
    document.getElementById('stock-highlighted').checked = false;
    document.getElementById('stock-symbol').dataset.editIndex = '';
    document.getElementById('stock-editor-modal').classList.remove('hidden');
    document.getElementById('stock-symbol').focus();
}

/**
 * Edit existing stock
 * @param {number} index - Stock index
 */
export function editStock(index) {
    const stock = stocksData[index];
    if (!stock) return;

    document.getElementById('stock-editor-title').textContent = 'Edit Stock';
    document.getElementById('stock-symbol').value = stock.symbol;
    document.getElementById('stock-name').value = stock.name;
    document.getElementById('stock-type').value = stock.type || 'stock';
    document.getElementById('stock-display-name').value = stock.displayName || '';
    document.getElementById('stock-highlighted').checked = stock.highlighted || false;
    document.getElementById('stock-symbol').dataset.editIndex = index;
    document.getElementById('stock-editor-modal').classList.remove('hidden');
    document.getElementById('stock-symbol').focus();
}

/**
 * Close stock editor dialog
 */
export function closeStockEditor() {
    document.getElementById('stock-editor-modal').classList.add('hidden');
    document.getElementById('stock-symbol').value = '';
    document.getElementById('stock-name').value = '';
    document.getElementById('stock-type').value = 'stock';
    document.getElementById('stock-display-name').value = '';
    document.getElementById('stock-highlighted').checked = false;
    document.getElementById('stock-symbol').dataset.editIndex = '';

    // Clear status
    const statusEl = document.getElementById('fetch-status');
    statusEl.classList.add('hidden');
}

/**
 * Save stock (add or update)
 */
export async function saveStock() {
    const symbol = document.getElementById('stock-symbol').value.trim().toUpperCase();
    const name = document.getElementById('stock-name').value.trim();
    const type = document.getElementById('stock-type').value.trim();
    const displayName = document.getElementById('stock-display-name').value.trim();
    const highlighted = document.getElementById('stock-highlighted').checked;
    const editIndex = document.getElementById('stock-symbol').dataset.editIndex;

    // Validation
    if (!symbol) {
        alert('Please enter a symbol');
        document.getElementById('stock-symbol').focus();
        return;
    }

    if (!name) {
        alert('Please enter a name. Use the 🔍 Lookup button to auto-fetch.');
        document.getElementById('stock-name').focus();
        return;
    }

    if (!type) {
        alert('Please select a type (Stock, Forex, Commodity, or Crypto)');
        document.getElementById('stock-type').focus();
        return;
    }

    // Validate type is one of the allowed values
    const validTypes = ['stock', 'forex', 'commodity', 'crypto'];
    if (!validTypes.includes(type)) {
        alert('Invalid type. Please select: Stock, Forex, Commodity, or Crypto');
        document.getElementById('stock-type').focus();
        return;
    }

    const stockObj = {
        symbol,
        name,
        type,
        displayName,
        highlighted
    };

    if (editIndex !== '') {
        // Update existing stock
        stocksData[parseInt(editIndex)] = stockObj;
    } else {
        // Add new stock
        stocksData.push(stockObj);
    }

    // Save to GitHub
    await saveStocksToGitHub();

    closeStockEditor();
    renderStocksList();
}

/**
 * Delete a stock
 * @param {number} index - Stock index
 */
export async function deleteStock(index) {
    const stock = stocksData[index];
    if (!stock) return;

    if (!confirm(`Delete ${stock.symbol} (${stock.name})?`)) {
        return;
    }

    stocksData.splice(index, 1);
    await saveStocksToGitHub();
    renderStocksList();
}

/**
 * Save stocks to GitHub
 */
async function saveStocksToGitHub() {
    const statusEl = document.getElementById('stocks-status');

    try {
        statusEl.textContent = 'Saving...';
        statusEl.classList.remove('hidden');

        const csvContent = buildStocksCSV();
        const result = await saveGitHubFile('stocks.csv', csvContent, stocksSha);

        if (result && result.content && result.content.sha) {
            stocksSha = result.content.sha;
        }

        // Update CSV version timestamp in config
        await updateCSVVersion('stocks');

        statusEl.textContent = '✓ Saved successfully';
        setTimeout(() => {
            statusEl.classList.add('hidden');
        }, 2000);

    } catch (error) {
        console.error('Error saving stocks:', error);
        statusEl.textContent = `Failed to save: ${error.message}`;
        statusEl.classList.remove('hidden');
    }
}

/**
 * Build CSV content from stocks data with display sequence
 * @returns {string} CSV content
 */
function buildStocksCSV() {
    let csv = '# Stock Tickers\n';
    csv += '# Format: symbol,name,type,display_name,highlighted\n';
    csv += '# Regular stocks displayed in cycles of 3, highlighted stocks shown individually\n';
    csv += '# Display sequence follows CSV order: 3-stock group → highlighted → 3-stock group → ...\n';
    csv += '\n';

    let displayNumber = 1;
    let regularStockBuffer = [];

    stocksData.forEach((stock, index) => {
        // Add display comment
        if (stock.highlighted) {
            csv += `# Display ${displayNumber}: Individual (highlighted)\n`;
            displayNumber++;
        } else {
            // Check if starting a new 3-stock cycle
            if (regularStockBuffer.length % 3 === 0) {
                const cycleNumber = Math.floor(regularStockBuffer.length / 3) + 1;
                csv += `# Display ${displayNumber}: Cycle ${cycleNumber} (3 stocks)\n`;
                displayNumber++;
            }
            regularStockBuffer.push(stock);
        }

        const highlightedValue = stock.highlighted ? '1' : '0';
        csv += `${stock.symbol},${stock.name},${stock.type},${stock.displayName},${highlightedValue}\n`;

        // Add blank line between display groups
        if (stock.highlighted || (regularStockBuffer.length % 3 === 0 && index < stocksData.length - 1)) {
            csv += '\n';
        }
    });

    return csv;
}

/**
 * Map Twelve Data instrument type to our type system
 * @param {object} stockInfo - Stock info from Twelve Data API
 * @returns {string} Type: stock, forex, commodity, or crypto
 */
function detectStockType(stockInfo) {
    const instrumentType = (stockInfo.instrument_type || '').toLowerCase();
    const symbol = (stockInfo.symbol || '').toUpperCase();
    const exchange = (stockInfo.exchange || '').toLowerCase();

    // Check for crypto
    if (instrumentType.includes('crypto') || exchange.includes('crypto') ||
        symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('USD') && exchange === '') {
        return 'crypto';
    }

    // Check for forex (currency pairs)
    if (instrumentType.includes('forex') || instrumentType.includes('currency') ||
        (symbol.length === 6 && /^[A-Z]{6}$/.test(symbol))) {
        return 'forex';
    }

    // Check for commodities
    if (instrumentType.includes('commodity') || instrumentType.includes('future') ||
        ['GC', 'SI', 'CL', 'NG', 'HG'].includes(symbol.substring(0, 2))) {
        return 'commodity';
    }

    // Default to stock
    return 'stock';
}

/**
 * Fetch company name from symbol using local reference and validate with Twelve Data API
 * @param {string} symbol - Stock ticker symbol
 */
export async function fetchCompanyName(symbol) {
    const nameInput = document.getElementById('stock-name');
    const typeSelect = document.getElementById('stock-type');
    const statusEl = document.getElementById('fetch-status');

    if (!symbol || symbol.length < 1) {
        return;
    }

    symbol = symbol.trim().toUpperCase();

    try {
        statusEl.textContent = 'Looking up...';
        statusEl.classList.remove('hidden', 'error');

        // First try local reference
        const reference = await loadStockReference();
        let companyName = reference[symbol];
        let foundInLocal = !!companyName;

        if (foundInLocal) {
            nameInput.value = companyName;
            statusEl.textContent = 'Validating with Twelve Data...';
        }

        // Validate with Twelve Data API
        try {
            // Twelve Data API - Symbol Search endpoint (free tier)
            // Note: Replace with your API key or use the free tier endpoint
            const apiUrl = `https://api.twelvedata.com/symbol_search?symbol=${symbol}&outputsize=1`;
            const response = await fetch(apiUrl);

            if (response.ok) {
                const data = await response.json();

                if (data.data && data.data.length > 0) {
                    const stockInfo = data.data[0];

                    // If we didn't find in local reference, use API data
                    if (!foundInLocal && stockInfo.instrument_name) {
                        companyName = stockInfo.instrument_name;
                        nameInput.value = companyName;
                    }

                    // Auto-detect and set type
                    const detectedType = detectStockType(stockInfo);
                    const currentType = typeSelect.value;

                    // Auto-populate type if it's still default
                    if (currentType === 'stock' || !currentType) {
                        typeSelect.value = detectedType;
                    }

                    // Build validation message
                    let typeInfo = '';
                    if (detectedType !== currentType && currentType !== 'stock') {
                        typeInfo = ` ⚠️ Detected as ${detectedType}`;
                    }

                    // Show success with validation and free tier reminder
                    const instrumentInfo = stockInfo.instrument_type || stockInfo.exchange || detectedType;
                    statusEl.textContent = `✓ Validated: ${stockInfo.symbol} (${instrumentInfo})${typeInfo} • Note: Free tier has limited symbols`;
                    statusEl.classList.remove('error');
                    setTimeout(() => {
                        statusEl.classList.add('hidden');
                    }, 5000);
                } else {
                    throw new Error('Symbol not found in Twelve Data');
                }
            } else if (response.status === 429) {
                // Rate limit hit - still OK if we found it locally
                if (foundInLocal) {
                    statusEl.textContent = '✓ Found (validation rate limited)';
                    statusEl.classList.remove('error');
                    setTimeout(() => {
                        statusEl.classList.add('hidden');
                    }, 3000);
                } else {
                    throw new Error('Rate limit - please try again later');
                }
            } else {
                throw new Error('API validation failed');
            }
        } catch (apiError) {
            // If API fails but we found it locally, that's OK
            if (foundInLocal) {
                statusEl.textContent = '✓ Found in local database';
                statusEl.classList.remove('error');
                setTimeout(() => {
                    statusEl.classList.add('hidden');
                }, 2000);
            } else {
                // Both local and API failed
                throw apiError;
            }
        }

    } catch (error) {
        console.error('Error fetching company name:', error);
        statusEl.textContent = '⚠️ Not found - enter manually or check ticker';
        statusEl.classList.add('error');
        companyNameInput.focus();
        setTimeout(() => {
            statusEl.classList.add('hidden');
        }, 4000);
    }
}

// Expose functions globally
if (typeof window !== 'undefined') {
    window.stocksModule = {
        initializeStocks,
        loadStocks,
        openAddStockDialog,
        editStock,
        closeStockEditor,
        saveStock,
        deleteStock,
        fetchCompanyName,
        moveStockUp,
        moveStockDown,
        handleDragStart,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        handleDragEnd
    };
}
