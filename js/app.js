/**
 * Expense & Budget Visualizer
 * Single JS file — no frameworks, no build tools.
 * Persists data in localStorage.
 */

'use strict';

/* =========================================================
   Constants & Storage Keys
   ========================================================= */
const STORAGE_KEYS = {
  TRANSACTIONS: 'ebv_transactions',
  CUSTOM_CATEGORIES: 'ebv_custom_categories',
  THEME: 'ebv_theme',
};

const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Fun'];

/** Palette used for pie chart segments (loops if more than 12 categories). */
const CHART_COLORS = [
  '#4f63d2', '#f6ad55', '#68d391', '#fc8181', '#63b3ed',
  '#b794f4', '#f6e05e', '#76e4f7', '#fbb6ce', '#9ae6b4',
  '#fbd38d', '#90cdf4',
];

/* =========================================================
   State
   ========================================================= */
/** @type {{ id: string, name: string, amount: number, category: string }[]} */
let transactions = [];

/** @type {string[]} */
let customCategories = [];

/** @type {'light' | 'dark'} */
let currentTheme = 'light';

/** @type {string} Current sort criterion */
let currentSort = 'default';

/** @type {Chart|null} Chart.js instance */
let chartInstance = null;

/* =========================================================
   DOM References
   ========================================================= */
const dom = {
  body: document.body,
  themeToggle: document.getElementById('theme-toggle'),
  themeIcon: document.getElementById('theme-icon'),

  balanceDisplay: document.getElementById('balance-display'),

  transactionForm: document.getElementById('transaction-form'),
  itemNameInput: document.getElementById('item-name'),
  amountInput: document.getElementById('amount'),
  categorySelect: document.getElementById('category'),
  formError: document.getElementById('form-error'),

  customCategoryInput: document.getElementById('custom-category-input'),
  addCategoryBtn: document.getElementById('add-category-btn'),
  categoryError: document.getElementById('category-error'),

  sortSelect: document.getElementById('sort-select'),
  transactionList: document.getElementById('transaction-list'),
  emptyState: document.getElementById('empty-state'),

  spendingChart: document.getElementById('spending-chart'),
  chartEmpty: document.getElementById('chart-empty'),
};

/* =========================================================
   Utility helpers
   ========================================================= */

/**
 * Generate a simple unique id.
 * @returns {string}
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/**
 * Format a number as a USD currency string.
 * @param {number} value
 * @returns {string}
 */
function formatCurrency(value) {
  return '$' + value.toFixed(2);
}

/**
 * Escape HTML to prevent XSS when inserting user input into the DOM.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(str).replace(/[&<>"']/g, (ch) => map[ch]);
}

/* =========================================================
   Local Storage
   ========================================================= */
function saveTransactions() {
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
}

function loadTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    transactions = raw ? JSON.parse(raw) : [];
  } catch {
    transactions = [];
  }
}

function saveCustomCategories() {
  localStorage.setItem(STORAGE_KEYS.CUSTOM_CATEGORIES, JSON.stringify(customCategories));
}

function loadCustomCategories() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_CATEGORIES);
    customCategories = raw ? JSON.parse(raw) : [];
  } catch {
    customCategories = [];
  }
}

function saveTheme() {
  localStorage.setItem(STORAGE_KEYS.THEME, currentTheme);
}

function loadTheme() {
  const saved = localStorage.getItem(STORAGE_KEYS.THEME);
  currentTheme = saved === 'dark' ? 'dark' : 'light';
}

/* =========================================================
   Theme
   ========================================================= */
function applyTheme() {
  if (currentTheme === 'dark') {
    dom.body.classList.add('dark-mode');
    dom.body.classList.remove('light-mode');
    dom.themeIcon.textContent = '☀️';
    dom.themeToggle.setAttribute('aria-label', 'Switch to light mode');
  } else {
    dom.body.classList.add('light-mode');
    dom.body.classList.remove('dark-mode');
    dom.themeIcon.textContent = '🌙';
    dom.themeToggle.setAttribute('aria-label', 'Switch to dark mode');
  }

  // Refresh chart colours for dark/light backgrounds
  if (chartInstance) {
    updateChart();
  }
}

function toggleTheme() {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  saveTheme();
  applyTheme();
}

/* =========================================================
   Category Dropdown
   ========================================================= */

/**
 * Build the full category list (defaults + custom) and repopulate the select.
 * Preserves the currently selected value when possible.
 */
function renderCategoryDropdown() {
  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories];
  const previousValue = dom.categorySelect.value;

  // Remove all options except the placeholder (index 0)
  while (dom.categorySelect.options.length > 1) {
    dom.categorySelect.remove(1);
  }

  allCategories.forEach((cat) => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    dom.categorySelect.appendChild(option);
  });

  // Restore selection if still valid
  if (previousValue && allCategories.includes(previousValue)) {
    dom.categorySelect.value = previousValue;
  }
}

function addCustomCategory(name) {
  const trimmed = name.trim();

  if (!trimmed) {
    showError(dom.categoryError, 'Category name cannot be empty.');
    return;
  }

  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories];
  if (allCategories.map((c) => c.toLowerCase()).includes(trimmed.toLowerCase())) {
    showError(dom.categoryError, 'That category already exists.');
    return;
  }

  clearError(dom.categoryError);
  customCategories.push(trimmed);
  saveCustomCategories();
  renderCategoryDropdown();
  dom.customCategoryInput.value = '';
  dom.customCategoryInput.focus();
}

/* =========================================================
   Validation helpers
   ========================================================= */
function showError(el, message) {
  el.textContent = message;
}

function clearError(el) {
  el.textContent = '';
}

function markInputError(input) {
  input.classList.add('input-error');
}

function clearInputError(input) {
  input.classList.remove('input-error');
}

/* =========================================================
   Transactions — CRUD
   ========================================================= */

/**
 * Validate the add-transaction form.
 * @returns {{ valid: boolean, name?: string, amount?: number, category?: string }}
 */
function validateTransactionForm() {
  const name = dom.itemNameInput.value.trim();
  const amountRaw = dom.amountInput.value.trim();
  const category = dom.categorySelect.value;

  let valid = true;
  const errors = [];

  clearInputError(dom.itemNameInput);
  clearInputError(dom.amountInput);
  clearInputError(dom.categorySelect);

  if (!name) {
    markInputError(dom.itemNameInput);
    errors.push('Item name is required.');
    valid = false;
  }

  const amount = parseFloat(amountRaw);
  if (!amountRaw || isNaN(amount) || amount <= 0) {
    markInputError(dom.amountInput);
    errors.push('Amount must be a number greater than 0.');
    valid = false;
  }

  if (!category) {
    markInputError(dom.categorySelect);
    errors.push('Please select a category.');
    valid = false;
  }

  if (!valid) {
    showError(dom.formError, errors[0]);
  }

  return valid ? { valid: true, name, amount, category } : { valid: false };
}

function addTransaction(name, amount, category) {
  const transaction = {
    id: generateId(),
    name,
    amount,
    category,
  };
  transactions.push(transaction);
  saveTransactions();
  refreshUI();
}

function deleteTransaction(id) {
  transactions = transactions.filter((t) => t.id !== id);
  saveTransactions();
  refreshUI();
}

/* =========================================================
   Sorting
   ========================================================= */

/**
 * Return a sorted copy of transactions based on currentSort.
 * Does NOT mutate the source array.
 * @returns {typeof transactions}
 */
function getSortedTransactions() {
  const copy = [...transactions];

  switch (currentSort) {
    case 'amount-desc':
      return copy.sort((a, b) => b.amount - a.amount);
    case 'amount-asc':
      return copy.sort((a, b) => a.amount - b.amount);
    case 'category-az':
      return copy.sort((a, b) => a.category.localeCompare(b.category));
    case 'default':
    default:
      return copy.reverse(); // latest first (original insertion order reversed)
  }
}

/* =========================================================
   Balance
   ========================================================= */
function updateBalance() {
  const total = transactions.reduce((sum, t) => sum + t.amount, 0);
  dom.balanceDisplay.textContent = formatCurrency(total);
}

/* =========================================================
   Transaction List Rendering
   ========================================================= */
function renderTransactionList() {
  const sorted = getSortedTransactions();
  dom.transactionList.innerHTML = '';

  if (sorted.length === 0) {
    dom.emptyState.classList.remove('hidden');
    return;
  }

  dom.emptyState.classList.add('hidden');

  sorted.forEach((t) => {
    const li = document.createElement('li');
    li.className = 'transaction-item';
    li.dataset.id = t.id;

    li.innerHTML = `
      <div class="transaction-info">
        <p class="transaction-name">${escapeHtml(t.name)}</p>
        <p class="transaction-category">${escapeHtml(t.category)}</p>
      </div>
      <span class="transaction-amount">${formatCurrency(t.amount)}</span>
      <button
        class="btn btn-danger delete-btn"
        data-id="${escapeHtml(t.id)}"
        aria-label="Delete ${escapeHtml(t.name)}"
      >Delete</button>
    `;

    dom.transactionList.appendChild(li);
  });
}

/* =========================================================
   Chart
   ========================================================= */

/**
 * Aggregate transactions into category totals.
 * @returns {{ labels: string[], data: number[], colors: string[] }}
 */
function aggregateByCategory() {
  /** @type {Record<string, number>} */
  const totals = {};

  transactions.forEach((t) => {
    totals[t.category] = (totals[t.category] || 0) + t.amount;
  });

  const labels = Object.keys(totals);
  const data = labels.map((l) => totals[l]);
  const colors = labels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);

  return { labels, data, colors };
}

function updateChart() {
  const { labels, data, colors } = aggregateByCategory();

  const isEmpty = data.length === 0;

  if (isEmpty) {
    dom.chartEmpty.classList.remove('hidden');
  } else {
    dom.chartEmpty.classList.add('hidden');
  }

  if (chartInstance) {
    if (isEmpty) {
      chartInstance.data.labels = [];
      chartInstance.data.datasets[0].data = [];
      chartInstance.data.datasets[0].backgroundColor = [];
      chartInstance.update('none');
      return;
    }

    chartInstance.data.labels = labels;
    chartInstance.data.datasets[0].data = data;
    chartInstance.data.datasets[0].backgroundColor = colors;
    chartInstance.update();
    return;
  }

  // First initialisation
  const isDark = currentTheme === 'dark';
  const legendColor = isDark ? '#a0aec0' : '#4a5568';

  chartInstance = new Chart(dom.spendingChart, {
    type: 'pie',
    data: {
      labels: isEmpty ? [] : labels,
      datasets: [
        {
          data: isEmpty ? [] : data,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: isDark ? '#1a1d27' : '#ffffff',
          hoverOffset: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: legendColor,
            padding: 16,
            font: {
              size: 13,
              family: "'Segoe UI', system-ui, sans-serif",
            },
            usePointStyle: true,
            pointStyleWidth: 12,
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const total = ctx.dataset.data.reduce((s, v) => s + v, 0);
              const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
              return ` ${ctx.label}: ${formatCurrency(ctx.parsed)} (${pct}%)`;
            },
          },
        },
      },
    },
  });
}

/* =========================================================
   Master UI refresh
   ========================================================= */
function refreshUI() {
  updateBalance();
  renderTransactionList();
  updateChart();
}

/* =========================================================
   Event Listeners
   ========================================================= */
function attachEventListeners() {
  // Theme toggle
  dom.themeToggle.addEventListener('click', toggleTheme);

  // Add transaction form submit
  dom.transactionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    clearError(dom.formError);

    const result = validateTransactionForm();
    if (!result.valid) return;

    addTransaction(result.name, result.amount, result.category);

    // Reset form
    dom.transactionForm.reset();
    clearInputError(dom.itemNameInput);
    clearInputError(dom.amountInput);
    clearInputError(dom.categorySelect);
    clearError(dom.formError);
    dom.itemNameInput.focus();
  });

  // Clear inline errors on input
  dom.itemNameInput.addEventListener('input', () => clearInputError(dom.itemNameInput));
  dom.amountInput.addEventListener('input', () => clearInputError(dom.amountInput));
  dom.categorySelect.addEventListener('change', () => clearInputError(dom.categorySelect));

  // Delete transaction (event delegation on the list)
  dom.transactionList.addEventListener('click', (e) => {
    const btn = e.target.closest('.delete-btn');
    if (!btn) return;
    const id = btn.dataset.id;
    if (id) deleteTransaction(id);
  });

  // Sort
  dom.sortSelect.addEventListener('change', () => {
    currentSort = dom.sortSelect.value;
    renderTransactionList();
  });

  // Add custom category — button click
  dom.addCategoryBtn.addEventListener('click', () => {
    addCustomCategory(dom.customCategoryInput.value);
  });

  // Add custom category — Enter key in input
  dom.customCategoryInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomCategory(dom.customCategoryInput.value);
    }
  });

  // Clear custom category error on input
  dom.customCategoryInput.addEventListener('input', () => clearError(dom.categoryError));
}

/* =========================================================
   Initialisation
   ========================================================= */
function init() {
  loadTheme();
  loadTransactions();
  loadCustomCategories();

  applyTheme();
  renderCategoryDropdown();
  refreshUI();
  attachEventListeners();
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
