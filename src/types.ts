export interface ProductItem {
  id: string;
  productName: string;
  genericName: string;
  category: string;
  defaultPrice: number; // Official price
  currentPrice: number; // Editable price
  boxCrt?: number; // Box per carton
  warehouseStock?: number; // Total warehouse supplied/initial stock
  minAlertStock?: number; // Minimum stock threshold (default 10)
}

export interface WarehouseItemStock {
  id: string;
  productId: string;
  productName: string;
  genericName: string;
  category: string;
  price: number;
  initialStock: number;
  soldQuantity: number;
  remainingStock: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  totalSalesValue: number;
  remainingStockValue: number;
}

export interface SalesRecord {
  id: string;
  orderId: string;
  date: string; // YYYY-MM-DD
  customerName: string;
  customerSegment?: 'مستشفيات' | 'سلاسل صيدليات' | 'صيدليات مجتمعية' | 'مراكز طبية' | 'شركات كبرى' | 'شركات ناشئة';
  itemName: string;
  genericName?: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalSales: number; // quantity * unitPrice
  salesRep: string; // e.g. "أحمد (ahmed jam)"
  boxCrt?: number;
  paymentType?: string; // e.g. "نقدي / تسليم فوري", "آجل", "كاش", "تحويل بنكي", "شيك مصرفي", or custom/empty
  notes?: string;
}

export interface FilterState {
  dateRange: 'all' | 'today' | 'thisWeek' | '7days' | '30days' | '90days' | 'thisMonth' | 'lastMonth' | 'custom';
  startDate: string;
  endDate: string;
  selectedCustomer: string;
  selectedCategory: string;
  selectedItem: string;
  selectedSalesRep: string;
  searchQuery: string;
}

export interface CustomerSummary {
  customerName: string;
  segment?: string;
  totalSales: number;
  totalQuantity: number;
  orderCount: number;
  avgOrderValue: number;
  percentageOfTotal: number;
}

export interface ItemSummary {
  itemName: string;
  category: string;
  totalQuantity: number;
  avgUnitPrice: number;
  totalSales: number;
  percentageOfTotal: number;
}

export interface CategorySummary {
  category: string;
  totalSales: number;
  totalQuantity: number;
  percentage: number;
}

export interface TimeSeriesPoint {
  dateKey: string; // YYYY-MM or YYYY-MM-DD
  label: string;
  sales: number;
  quantity: number;
  orders: number;
}

export type CurrencyCode = 'SDG' | 'SAR' | 'USD' | 'AED' | 'EGP' | 'EUR';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  nameAr: string;
  rateFromSAR: number;
}

export type ThemeColor = 'blue' | 'emerald' | 'violet' | 'amber' | 'rose' | 'teal' | 'slate';
export type ThemeMode = 'light' | 'dark';

export interface SavedOfflineInvoice {
  id: string;
  orderId: string;
  customerName: string;
  date: string;
  salesRep: string;
  items: Array<{
    itemName: string;
    genericName?: string;
    quantity: number;
    unitPrice: number;
    totalSales: number;
  }>;
  totalQuantity: number;
  totalAmount: number;
  currency: CurrencyCode;
  savedAt: string;
  format: 'a4' | 'a5' | 'a3' | 'letter' | 'thermal80' | 'thermal58' | 'compact';
  paymentType?: string;
  pdfDataUri?: string;
}

export type AndroidVersionProfile =
  | 'auto'
  | 'android15'
  | 'android14'
  | 'android13'
  | 'android12'
  | 'android11'
  | 'android10'
  | 'legacy';

export type ScreenDensity = 'compact' | 'standard' | 'comfortable';

export interface ScreenSettings {
  androidVersion: AndroidVersionProfile;
  scale: number; // 85, 90, 95, 100, 105, 110
  density: ScreenDensity;
  edgeToEdge: boolean;
  notchPadding: boolean;
  bottomBarExtraPadding: boolean;
  hapticFeedback: boolean;
  fullWidthTables: boolean;
}

export type StoragePermissionState = 'granted' | 'prompt' | 'denied' | 'unsupported';

export interface PhoneStorageConfig {
  permissionState: StoragePermissionState;
  directoryName: string | null;
  lastAccessTime: string | null;
  autoSaveToFolder: boolean;
  defaultFormat: 'pdf' | 'excel' | 'both';
}

export type AppTab =
  | 'invoices'
  | 'kambalOrders'
  | 'warehouse'
  | 'items'
  | 'customers'
  | 'analytics'
  | 'dataSource'
  | 'lookerGuide';

