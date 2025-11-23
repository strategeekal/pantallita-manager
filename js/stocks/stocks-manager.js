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
 * Render the stocks list with cycle grouping
 */
function renderStocksList() {
    const listEl = document.getElementById('stocks-list');

    if (stocksData.length === 0) {
        document.getElementById('stocks-empty').classList.remove('hidden');
        listEl.innerHTML = '';
        return;
    }

    document.getElementById('stocks-empty').classList.add('hidden');

    let html = '';
    const cycleSize = 3;

    stocksData.forEach((stock, index) => {
        const cycleNumber = Math.floor(index / cycleSize) + 1;
        const positionInCycle = (index % cycleSize) + 1;

        // Add cycle header at the start of each cycle
        if (index % cycleSize === 0) {
            html += `
                <div class="cycle-header">
                    <span class="cycle-badge">Cycle ${cycleNumber}</span>
                    <span class="cycle-info">Stocks shown together on display</span>
                </div>
            `;
        }

        const canMoveUp = index > 0;
        const canMoveDown = index < stocksData.length - 1;

        html += `
            <div class="stock-card ${index % cycleSize === cycleSize - 1 ? 'cycle-last' : ''}">
                <div class="stock-order">
                    <span class="order-number">${index + 1}</span>
                </div>
                <div class="stock-info">
                    <div class="stock-ticker">${stock.ticker}</div>
                    <div class="stock-company">${stock.companyName}</div>
                </div>
                <div class="stock-actions">
                    <div class="stock-reorder">
                        <button
                            class="btn-pixel btn-small btn-secondary"
                            onclick="window.stocksModule.moveStockUp(${index})"
                            ${!canMoveUp ? 'disabled' : ''}
                            title="Move up"
                        >↑</button>
                        <button
                            class="btn-pixel btn-small btn-secondary"
                            onclick="window.stocksModule.moveStockDown(${index})"
                            ${!canMoveDown ? 'disabled' : ''}
                            title="Move down"
                        >↓</button>
                    </div>
                    <button class="btn-pixel btn-small btn-secondary" onclick="window.stocksModule.editStock(${index})">✏️</button>
                    <button class="btn-pixel btn-small btn-danger" onclick="window.stocksModule.deleteStock(${index})">🗑️</button>
                </div>
            </div>
        `;

        // Add visual separator between cycles
        if ((index + 1) % cycleSize === 0 && index < stocksData.length - 1) {
            html += '<div class="cycle-separator"></div>';
        }
    });

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
 * Fetch company name from ticker using local reference file
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

        // Load reference if not already loaded
        const reference = await loadStockReference();

        if (reference[ticker]) {
            companyNameInput.value = reference[ticker];
            statusEl.textContent = '✓ Found in database';
            statusEl.classList.remove('error');
            setTimeout(() => {
                statusEl.classList.add('hidden');
            }, 2000);
        } else {
            throw new Error('Ticker not found in database');
        }

    } catch (error) {
        console.error('Error fetching company name:', error);
        statusEl.textContent = '⚠️ Not found - please enter manually';
        statusEl.classList.add('error');
        companyNameInput.focus();
        setTimeout(() => {
            statusEl.classList.add('hidden');
        }, 3000);
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
        moveStockDown
    };
}
