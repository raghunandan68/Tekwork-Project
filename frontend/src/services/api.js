import { supabase } from './supabaseClient';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
  };
}

async function authHeadersNoContentType() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
  };
}

async function request(path, options = {}) {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  if (!res.ok) {
    let detail = await res.text();
    try {
      const json = JSON.parse(detail);
      detail = json.detail || json.message || detail;
    } catch {
      /* keep raw text */
    }
    throw new Error(typeof detail === 'string' ? detail : `API error ${res.status}`);
  }

  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function uploadFile(path, file) {
  const headers = await authHeadersNoContentType();
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!res.ok) {
    let detail = await res.text();
    try {
      const json = JSON.parse(detail);
      detail = json.detail || json.message || detail;
    } catch { /* keep raw text */ }
    throw new Error(typeof detail === 'string' ? detail : `Upload error ${res.status}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ── Auth ─────────────────────────────────────────────────────────────────────
export function seedDemoData() {
  return request('/auth/seed-demo', { method: 'POST' });
}

export function getMe() {
  return request('/auth/me');
}

// ── Dashboard ──────────────────────────────────────────────────────────────
export function getDashboardSummary() {
  return request('/dashboard/summary');
}

export function getSalesTrend() {
  return request('/dashboard/sales-trend');
}

export function getCategoryDistribution() {
  return request('/dashboard/category-distribution');
}

// ── Products ───────────────────────────────────────────────────────────────
export function getProducts(search = '') {
  const qs = search ? `?search=${encodeURIComponent(search)}` : '';
  return request(`/products${qs}`);
}

export function createProduct(data) {
  return request('/products', { method: 'POST', body: JSON.stringify(data) });
}

export function updateProduct(id, data) {
  return request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteProduct(id) {
  return request(`/products/${id}`, { method: 'DELETE' });
}

export function uploadProducts(file) {
  return uploadFile('/products/upload', file);
}

// ── Categories ─────────────────────────────────────────────────────────────
export function getCategories() {
  return request('/products/categories');
}

export function addCategory(name) {
  return request('/products/categories', { method: 'POST', body: JSON.stringify({ name }) });
}

// ── Inventory ──────────────────────────────────────────────────────────────
export function getInventorySummary() {
  return request('/inventory/summary');
}

export function getStockLevels() {
  return request('/inventory/stock-levels');
}

export function addStock(productId, quantity) {
  return request(`/inventory/${productId}/add-stock`, {
    method: 'POST',
    body: JSON.stringify({ quantity }),
  });
}

// ── Transactions ───────────────────────────────────────────────────────────
export function getTransactions() {
  return request('/transactions');
}

export function createTransaction(data) {
  return request('/transactions', { method: 'POST', body: JSON.stringify(data) });
}

export function uploadTransactions(file) {
  return uploadFile('/transactions/upload', file);
}

// ── Analysis ───────────────────────────────────────────────────────────────
export function getAnalysisSummary() {
  return request('/analysis/summary');
}

export function getAssociationRules() {
  return request('/analysis/association-rules');
}

export function runAnalysis() {
  return request('/analysis/run', { method: 'POST' });
}

// ── Shelves ────────────────────────────────────────────────────────────────
export function getShelfZones() {
  return request('/shelves/zones');
}

export function updateZoneProducts(zoneId, products) {
  return request(`/shelves/zones/${zoneId}`, {
    method: 'PUT',
    body: JSON.stringify({ products }),
  });
}

// ── Recommendations ────────────────────────────────────────────────────────
export function getCrossSellRecs() {
  return request('/recommendations/cross-sell');
}

export function getRestockRecs() {
  return request('/recommendations/restock');
}

export function getShelfPlacementRecs() {
  return request('/recommendations/shelf-placement');
}

// ── Analytics ──────────────────────────────────────────────────────────────
export function getRevenueTrend() {
  return request('/analytics/revenue-trend');
}

export function getTopProducts() {
  return request('/analytics/top-products');
}

export function getCategorySales() {
  return request('/analytics/category-sales');
}

export function getLiftHeatmap() {
  return request('/analytics/lift-heatmap');
}

export function getInventoryReport() {
  return request('/analytics/inventory-report');
}
