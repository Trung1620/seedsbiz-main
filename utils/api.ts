// utils/api.ts
import { getToken, setToken, clearToken, setOrg, getOrg, clearOrg } from "./storage";
import { Linking } from "react-native";

// ==================== TYPES ====================

export type Org = {
  id: string;
  name: string;
  code?: string;
  taxId?: string;
  address?: string;
  phone?: string;
  website?: string;
  description?: string;
  directorName?: string;
  businessLicense?: string;
  bankName?: string;
  bankAccount?: string;
  bankOwner?: string;
  role?: string;
};

export type User = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  avatar?: string;
  role?: string;
  status?: boolean;
  lastLoginAt?: string;
};

export type Warehouse = {
  id: string;
  name: string;
};

export type Variant = {
  id: string;
  productId: string;
  sku?: string;
  name?: string;
  color?: string;
  size?: string;
  priceVnd?: number;
  inStock?: number;
};

export type Product = {
  id: string;
  nameVi: string;
  nameEn?: string;
  sku?: string;
  barcode?: string;
  priceVnd?: number;
  costPriceVnd?: number;
  priceUsd?: number;
  unit?: string;
  weight?: number;
  size?: string;
  productionTime?: number;
  materialDetails?: any;
  images?: string[];
  inStock?: number;
  minStock?: number;
  location?: string;
  status?: string;
};

export type Material = {
  id: string;
  name: string;
  sku?: string;
  unit: string;
  price?: number;
  stock?: number;
  minStock?: number;
  supplier?: string;
  supplierId?: string;
  location?: string;
  image?: string;
  orgId?: string;
};

export type Category = {
  id: string;
  name: string;
  type: 'PRODUCT' | 'MATERIAL';
  description?: string;
  parentID?: string;
};

export type Artisan = {
  id: string;
  code?: string;
  name: string;
  phone: string;
  address?: string;
  age?: number | string;
  role?: string;
  skills?: string;
  dailyWage?: number;
  baseSalary?: number;
  dailyTarget?: number;
  debt?: number;
  isWorking?: boolean;
  image?: string;
  status?: 'ACTIVE' | 'RESIGNED';
  totalDaysWorked?: number;
  orgId?: string;
};

export type Supplier = {
  id: string;
  code?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
};

export type Customer = {
  id: string;
  code?: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  taxId?: string;
  zalo?: string;
  facebook?: string;
  birthday?: string;
  groupName?: 'RETAIL' | 'WHOLESALE' | 'AGENCY';
  totalSpent?: number;
  currentDebt?: number;
  note?: string;
  companyName?: string;
  image?: string;
};

export type Quote = {
  id: string;
  number: string;
  status: string;
  customerId?: string;
  customerName?: string;
  items?: any[];
  subTotal: number;
  discount: number;
  shippingFee: number;
  grandTotal: number;
  paymentMethod: string;
  paymentStatus: string;
  expiryDate?: string;
  notes?: string;
  createdAt: string;
};

export type ProductionOrder = {
  id: string;
  orderNumber: string;
  productId: string;
  artisanId?: string;
  quantity: number;
  status: string;
  laborCostPerUnit?: number;
  totalLaborCost?: number;
  totalMaterialCost?: number;
  startDate?: string;
  expectedEndDate?: string;
  actualEndDate?: string;
  note?: string;
};

export type Delivery = {
  id: string;
  quoteId: string;
  carrier?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  trackingNumber?: string;
  shippingCost?: number;
  receiptImage?: string;
  status: string;
};

export type Debt = {
  id: string;
  type: 'RECEIVABLE' | 'PAYABLE';
  referenceType: 'CUSTOMER' | 'ARTISAN' | 'SUPPLIER';
  referenceId: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  status: 'UNPAID' | 'PARTIAL' | 'PAID_OFF';
  note?: string;
  isAuto?: boolean;
  customer?: any;
  artisan?: any;
  supplier?: any;
};

export type Expense = {
  id: string;
  title: string;
  category: string;
  amount: number;
  paymentMethod: string;
  receiptImage?: string;
  expenseDate: string;
  createdBy?: string;
};

export type SalesReportData = {
  summary: {
    confirmed: number;
    confirmedCount: number;
    count: number;
    revenue: number;
    netSales: number;
    grossProfit: number;
    totalCount: number;
    totalCollected: number;
  };
  revenueByDay: { date: string; amount: number }[];
  topProducts: any[];
  quotes: Quote[];
  analysis?: any;
};

export type InventoryReportData = {
  summary: {
    totalQty: number;
    totalSkus: number;
    warehouses: { name: string; totalQty: number; items: number }[];
  };
  stockBalances: any[];
};

export type DebtsReportData = {
  summary: {
    totalReceivableRemaining: number;
    overdueCount: number;
  };
  debts: {
    customerName: string;
    remaining: number;
    dueDate: string;
    isOverdue: boolean;
    type: string;
  }[];
};

export type ProfitLossReportData = {
  income: { totalRevenue: number };
  cost: { costOfGoodsSold: number };
  profit: { grossProfit: number; grossMarginPercent: number };
};

// ==================== HELPERS ====================

const isValidId = (id?: string) => id ? /^[0-9a-fA-F]{24}$/.test(id) : false;

export const BASE_URL = __DEV__ 
  ? "http://192.168.1.120:3000" 
  : (process.env.EXPO_PUBLIC_API_BASE_URL || "http://192.168.1.120:3000");

export function getPublicFileUrl(path?: any) {
  if (!path) return null;
  if (typeof path !== 'string') return path;
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

async function readJson(res: Response) {
  const text = await res.text();
  let json: any = {};
  try { json = text ? JSON.parse(text) : {}; } catch { return { raw: text }; }
  if (!res.ok) {
    const err: any = new Error(json.error || `Request failed with status ${res.status}`);
    err.status = res.status;
    err.payload = json;
    throw err;
  }
  return json;
}

export async function authedFetch(path: string, init: RequestInit = {}) {
  const token = await getToken();
  const url = `${BASE_URL}${path}`;
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
    headers.set("x-auth-token", token);
  }

  const activeOrg = await getOrg();
  if (isValidId(activeOrg?.id)) {
    headers.set("x-org-id", activeOrg!.id);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(url, { ...init, headers, signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.status === 401) { await clearToken(); await clearOrg(); }
    return res;
  } catch (error: any) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// ==================== FUNCTIONS ====================

// Auth
export async function login(email: string, pass: string) {
  const res = await fetch(`${BASE_URL}/api/auth-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: pass }),
  });
  const data = await readJson(res);
  if (data?.token) await setToken(data.token);
  return data;
}

export async function me() {
  const res = await authedFetch("/api/auth-me");
  return await readJson(res);
}

export async function updateProfile(data: any) {
  const res = await authedFetch("/api/auth-me", { method: "PATCH", body: JSON.stringify(data) });
  return await readJson(res);
}

// Orgs
export async function listMyOrgs(): Promise<Org[]> {
  const res = await authedFetch("/api/orgs/me");
  const data = await readJson(res);
  return Array.isArray(data) ? data : (data?.orgs || []);
}

export async function createOrg(data: any) {
  const res = await authedFetch("/api/orgs", { method: "POST", body: JSON.stringify(data) });
  return await readJson(res);
}

// Products
export async function listProducts(params?: any) {
  const query = new URLSearchParams(params).toString();
  const res = await authedFetch(`/api/products${query ? `?${query}` : ""}`);
  const data = await readJson(res);
  return data?.products || data?.items || [];
}

export async function createProduct(data: any) {
  const res = await authedFetch("/api/products", { method: "POST", body: JSON.stringify(data) });
  return await readJson(res);
}

export async function getProduct(id: string) {
  const res = await authedFetch(`/api/products/${id}`);
  return await readJson(res);
}

export const getProductById = getProduct;

export async function updateProduct(id: string, data: any) {
  const res = await authedFetch(`/api/products/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  return await readJson(res);
}

// Materials
export async function listMaterials() {
  const res = await authedFetch("/api/materials");
  return await readJson(res);
}

export async function createMaterial(data: any) {
  const res = await authedFetch("/api/materials", { method: "POST", body: JSON.stringify(data) });
  return await readJson(res);
}

export async function deleteMaterial(id: string) {
  const res = await authedFetch(`/api/materials/${id}`, { method: "DELETE" });
  return await readJson(res);
}

// Categories
export async function listCategories(params?: { type?: 'PRODUCT' | 'MATERIAL' }) {
  const query = new URLSearchParams(params as any).toString();
  const res = await authedFetch(`/api/categories${query ? `?${query}` : ""}`);
  return await readJson(res);
}

// Artisans
export async function listArtisans(orgId: string): Promise<Artisan[]> {
  const res = await authedFetch(`/api/artisans?orgId=${orgId}`);
  const data = await readJson(res);
  return data?.artisans || data || [];
}

export async function createArtisan(data: any) {
  const res = await authedFetch("/api/artisans", { method: "POST", body: JSON.stringify(data) });
  return await readJson(res);
}

export async function updateArtisan(id: string, data: any) {
  const res = await authedFetch(`/api/artisans/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  return await readJson(res);
}

export async function deleteArtisan(id: string) {
  const res = await authedFetch(`/api/artisans/${id}`, { method: "DELETE" });
  return await readJson(res);
}

export async function createArtisanTransaction(data: any) {
  const res = await authedFetch("/api/artisan-transactions", { method: "POST", body: JSON.stringify(data) });
  return await readJson(res);
}

export async function submitAttendance(data: any) {
  const res = await authedFetch("/api/artisan-attendance", { method: "POST", body: JSON.stringify(data) });
  return await readJson(res);
}

// Suppliers
export async function listSuppliers() {
  const res = await authedFetch("/api/suppliers");
  return await readJson(res);
}

export async function createSupplier(data: any) {
  const res = await authedFetch("/api/suppliers", { method: "POST", body: JSON.stringify(data) });
  return await readJson(res);
}

export async function updateSupplier(id: string, data: any) {
  const res = await authedFetch(`/api/suppliers/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  return await readJson(res);
}

export async function deleteSupplier(id: string) {
  const res = await authedFetch(`/api/suppliers/${id}`, { method: "DELETE" });
  return await readJson(res);
}

// Customers
export async function listCustomers(params?: any) {
  const query = new URLSearchParams(params).toString();
  const res = await authedFetch(`/api/customers${query ? `?${query}` : ""}`);
  const data = await readJson(res);
  return data?.items || data || [];
}

export async function createCustomer(data: any) {
  const res = await authedFetch("/api/customers", { method: "POST", body: JSON.stringify(data) });
  return await readJson(res);
}

export async function updateCustomer(id: string, data: any) {
  const res = await authedFetch(`/api/customers/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  return await readJson(res);
}

export async function deleteCustomer(id: string) {
  const res = await authedFetch(`/api/customers/${id}`, { method: "DELETE" });
  return await readJson(res);
}

// Production
export async function listProductionOrders() {
  const res = await authedFetch("/api/production");
  return await readJson(res);
}

export async function createProductionOrder(data: any) {
  const res = await authedFetch("/api/production", { method: "POST", body: JSON.stringify(data) });
  return await readJson(res);
}

// Debts
export async function listDebts(params?: any) {
  const query = new URLSearchParams(params).toString();
  const res = await authedFetch(`/api/debts${query ? `?${query}` : ""}`);
  return await readJson(res);
}

export async function createDebt(data: any) {
  const res = await authedFetch("/api/debts", { method: "POST", body: JSON.stringify(data) });
  return await readJson(res);
}

export async function updateDebt(id: string, data: { paidAmount?: number; status?: string; note?: string }) {
  const res = await authedFetch(`/api/debts/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  return await readJson(res);
}

export async function deleteDebt(id: string) {
  const res = await authedFetch(`/api/debts/${id}`, { method: "DELETE" });
  return await readJson(res);
}

export async function listQuotes(options?: { orgId?: string; q?: string }): Promise<Quote[]> {
  let url = "/api/quotes";
  const params = new URLSearchParams();
  if (options?.orgId) params.append("orgId", options.orgId);
  if (options?.q) params.append("q", options.q);
  const queryString = params.toString();
  if (queryString) url += `?${queryString}`;
  
  const res = await authedFetch(url);
  const data = await readJson(res);
  return data?.items || [];
}

export async function listQuotesByOrg(orgId: string): Promise<Quote[]> {
  return listQuotes({ orgId });
}

export async function createQuote(data: any): Promise<Quote> {
  const res = await authedFetch("/api/quotes", { method: "POST", body: JSON.stringify(data) });
  return await readJson(res);
}

// Expenses
export async function listExpenses(params?: any) {
  const query = new URLSearchParams(params).toString();
  const res = await authedFetch(`/api/expenses${query ? `?${query}` : ""}`);
  return await readJson(res);
}

export async function createExpense(data: any) {
  const res = await authedFetch("/api/expenses", { method: "POST", body: JSON.stringify(data) });
  return await readJson(res);
}

// Warehouses & Variants
export async function listWarehouses() {
  const res = await authedFetch("/api/warehouses");
  const data = await readJson(res);
  return data?.rows || data?.items || data || [];
}

export async function listVariants() {
  const res = await authedFetch("/api/variants");
  const data = await readJson(res);
  return data?.items || data || [];
}

export async function createStockMove(payload: any) {
  const res = await authedFetch("/api/inventory-move", { method: "POST", body: JSON.stringify(payload) });
  return await readJson(res);
}

// Deliveries (standalone — tạo thủ công, không gắn quote)
export async function createDelivery(data: any) {
  const res = await authedFetch("/api/deliveries", { method: "POST", body: JSON.stringify(data) });
  return await readJson(res);
}

export async function updateDelivery(id: string, data: any) {
  const res = await authedFetch(`/api/deliveries/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  return await readJson(res);
}

export async function deleteDelivery(id: string) {
  const res = await authedFetch(`/api/deliveries/${id}`, { method: "DELETE" });
  return await readJson(res);
}

// Analytics
export async function getDashboardStats(orgId: string, from?: string, to?: string) {
  const query = new URLSearchParams({ orgId });
  if (from) query.set("from", from);
  if (to) query.set("to", to);
  const res = await authedFetch(`/api/analytics-dashboard?${query.toString()}`);
  return await readJson(res);
}

export async function getSalesReport(orgId: string, from?: string, to?: string): Promise<SalesReportData> {
  const query = new URLSearchParams({ orgId });
  if (from) query.set("from", from);
  if (to) query.set("to", to);
  const res = await authedFetch(`/api/report-sales?${query.toString()}`);
  return await readJson(res);
}

export async function getInventoryReport(orgId: string, warehouseId?: string): Promise<InventoryReportData> {
  const query = new URLSearchParams({ orgId });
  if (warehouseId) query.set("warehouseId", warehouseId);
  const res = await authedFetch(`/api/report-inventory?${query.toString()}`);
  return await readJson(res);
}

export async function getDebtsReport(orgId: string, type?: string, status?: string): Promise<DebtsReportData> {
  const query = new URLSearchParams({ orgId });
  if (type) query.set("type", type);
  if (status) query.set("status", status);
  const res = await authedFetch(`/api/report-debts?${query.toString()}`);
  return await readJson(res);
}

export async function getProfitLossReport(orgId: string, from?: string, to?: string): Promise<ProfitLossReportData> {
  const query = new URLSearchParams({ orgId });
  if (from) query.set("from", from);
  if (to) query.set("to", to);
  const res = await authedFetch(`/api/report-profit-loss?${query.toString()}`);
  return await readJson(res);
}

// Utilities
export async function openUrl(url: string) {
  try {
    if (await Linking.canOpenURL(url)) await Linking.openURL(url);
  } catch (e) { console.error(e); }
}