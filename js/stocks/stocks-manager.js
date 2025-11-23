/**
 * Stocks Manager Module
 * Handles loading, editing, and saving stock ticker information
 */

import { fetchGitHubFile, saveGitHubFile } from '../core/api.js';

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

        // Parse: ticker,company_name
        const parts = trimmedLine.split(',');
        if (parts.length >= 2) {
            stocks.push({
                ticker: parts[0].trim().toUpperCase(),
                companyName: parts.slice(1).join(',').trim() // Handle commas in company names
            });
        }
    }

    return stocks;
}

/**
 * Render the stocks list with cycle grouping and drag-and-drop
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
    const cycleSize = 3;

    stocksData.forEach((stock, index) => {
        const cycleNumber = Math.floor(index / cycleSize) + 1;
        const positionInCycle = (index % cycleSize) + 1;

        html += `
            <div class="stock-card"
                 draggable="true"
                 data-index="${index}"
                 ondragstart="window.stocksModule.handleDragStart(event)"
                 ondragover="window.stocksModule.handleDragOver(event)"
                 ondragleave="window.stocksModule.handleDragLeave(event)"
                 ondrop="window.stocksModule.handleDrop(event)"
                 ondragend="window.stocksModule.handleDragEnd(event)">
                <div class="stock-drag-handle" title="Drag to reorder">⋮⋮</div>
                <div class="stock-cycle-badge">Cycle ${cycleNumber}</div>
                <div class="stock-info">
                    <div class="stock-ticker">${stock.ticker}</div>
                    <div class="stock-company">${stock.companyName}</div>
                </div>
                <div class="stock-actions">
                    <button class="btn-pixel btn-small btn-secondary" onclick="window.stocksModule.editStock(${index})">✏️</button>
                    <button class="btn-pixel btn-small btn-danger" onclick="window.stocksModule.deleteStock(${index})">🗑️</button>
                </div>
            </div>
        `;

        // Add cycle separator after every 3 stocks (except the last group)
        if ((index + 1) % cycleSize === 0 && index < stocksData.length - 1) {
            html += '<div class="cycle-row-separator"></div>';
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
    document.getElementById('stock-ticker').value = '';
    document.getElementById('stock-company-name').value = '';
    document.getElementById('stock-ticker').dataset.editIndex = '';
    document.getElementById('stock-editor-modal').classList.remove('hidden');
    document.getElementById('stock-ticker').focus();
}

/**
 * Edit existing stock
 * @param {number} index - Stock index
 */
export function editStock(index) {
    const stock = stocksData[index];
    if (!stock) return;

    document.getElementById('stock-editor-title').textContent = 'Edit Stock';
    document.getElementById('stock-ticker').value = stock.ticker;
    document.getElementById('stock-company-name').value = stock.companyName;
    document.getElementById('stock-ticker').dataset.editIndex = index;
    document.getElementById('stock-editor-modal').classList.remove('hidden');
    document.getElementById('stock-ticker').focus();
}

/**
 * Close stock editor dialog
 */
export function closeStockEditor() {
    document.getElementById('stock-editor-modal').classList.add('hidden');
    document.getElementById('stock-ticker').value = '';
    document.getElementById('stock-company-name').value = '';
    document.getElementById('stock-ticker').dataset.editIndex = '';

    // Clear status
    const statusEl = document.getElementById('fetch-status');
    statusEl.classList.add('hidden');
}

/**
 * Save stock (add or update)
 */
export async function saveStock() {
    const ticker = document.getElementById('stock-ticker').value.trim().toUpperCase();
    const companyName = document.getElementById('stock-company-name').value.trim();
    const editIndex = document.getElementById('stock-ticker').dataset.editIndex;

    if (!ticker) {
        alert('Please enter a stock ticker');
        return;
    }

    if (!companyName) {
        alert('Please enter a company name');
        return;
    }

    const stockObj = {
        ticker,
        companyName
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

    if (!confirm(`Delete ${stock.ticker} (${stock.companyName})?`)) {
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
 * Build CSV content from stocks data with cycle comments
 * @returns {string} CSV content
 */
function buildStocksCSV() {
    let csv = '# Stock Tickers\n';
    csv += '# Format: ticker,company_name\n';
    csv += '# Stocks are displayed in cycles of 3 on the matrix\n';
    csv += '\n';

    const cycleSize = 3;

    stocksData.forEach((stock, index) => {
        // Add cycle comment at the start of each cycle
        if (index % cycleSize === 0) {
            const cycleNumber = Math.floor(index / cycleSize) + 1;
            csv += `# Cycle ${cycleNumber} (stocks ${index + 1}-${Math.min(index + cycleSize, stocksData.length)})\n`;
        }

        csv += `${stock.ticker},${stock.companyName}\n`;

        // Add blank line after each cycle except the last
        if ((index + 1) % cycleSize === 0 && index < stocksData.length - 1) {
            csv += '\n';
        }
    });

    return csv;
}

/**
 * Fetch company name from ticker using local reference and validate with Twelve Data API
 * @param {string} ticker - Stock ticker symbol
 */
export async function fetchCompanyName(ticker) {
    const companyNameInput = document.getElementById('stock-company-name');
    const statusEl = document.getElementById('fetch-status');

    if (!ticker || ticker.length < 1) {
        return;
    }

    ticker = ticker.trim().toUpperCase();

    try {
        statusEl.textContent = 'Looking up...';
        statusEl.classList.remove('hidden', 'error');

        // First try local reference
        const reference = await loadStockReference();
        let companyName = reference[ticker];
        let foundInLocal = !!companyName;

        if (foundInLocal) {
            companyNameInput.value = companyName;
            statusEl.textContent = 'Validating with Twelve Data...';
        }

        // Validate with Twelve Data API
        try {
            // Twelve Data API - Symbol Search endpoint (free tier)
            // Note: Replace with your API key or use the free tier endpoint
            const apiUrl = `https://api.twelvedata.com/symbol_search?symbol=${ticker}&outputsize=1`;
            const response = await fetch(apiUrl);

            if (response.ok) {
                const data = await response.json();

                if (data.data && data.data.length > 0) {
                    const stockInfo = data.data[0];

                    // If we didn't find in local reference, use API data
                    if (!foundInLocal && stockInfo.instrument_name) {
                        companyName = stockInfo.instrument_name;
                        companyNameInput.value = companyName;
                    }

                    // Show success with validation
                    statusEl.textContent = `✓ Validated: ${stockInfo.symbol} (${stockInfo.exchange || 'Stock'})`;
                    statusEl.classList.remove('error');
                    setTimeout(() => {
                        statusEl.classList.add('hidden');
                    }, 3000);
                } else {
                    throw new Error('Ticker not found in Twelve Data');
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
