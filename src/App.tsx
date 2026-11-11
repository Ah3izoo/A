import React, { useEffect, useMemo, useState } from 'react';
import { AddSaleModal } from './components/AddSaleModal';
import { ApkBuildModal } from './components/ApkBuildModal';
import { ItemQuantityDonut } from './components/Charts/ItemQuantityDonut';
import { TimeSeriesChart } from './components/Charts/TimeSeriesChart';
import { TopCustomersChart } from './components/Charts/TopCustomersChart';
import { CustomerSalesTable } from './components/CustomerSalesTable';
import { DataSourceManager } from './components/DataSourceManager';
import { FilterBar } from './components/FilterBar';
import { InvoicePdfModal } from './components/InvoicePdfModal';
import { OfflineInvoicesModal } from './components/OfflineInvoicesModal';
import { AndroidBottomBar } from './components/AndroidBottomBar';
import { CloudSyncModal } from './components/CloudSyncModal';
import { ItemSalesTable } from './components/ItemSalesTable';
import { LookerStudioGuide } from './components/LookerStudioGuide';
import { Navbar } from './components/Navbar';
import { PriceManagerModal } from './components/PriceManagerModal';
import { Scorecards } from './components/Scorecards';
import { ThemeSelectorModal } from './components/ThemeSelectorModal';
import { ExcelExportModal } from './components/ExcelExportModal';
import { InvoiceCsvExportModal } from './components/InvoiceCsvExportModal';
import { AppSettingsModal } from './components/AppSettingsModal';
import { SalesRepManagerModal, SalesRepItem } from './components/SalesRepManagerModal';
import { AdminCredentialsModal } from './components/AdminCredentialsModal';
import { WarehouseManager } from './components/WarehouseManager';
import { KambalOrdersSection } from './components/KambalOrdersSection';
import { applyScreenSettingsToDOM, getScreenSettings } from './services/screenAdaptationService';
import {
  APP_NAME,
  DEFAULT_SALES_REP,
  MASTER_PRODUCT_CATALOG,
  SUPPLIER_LINE,
} from './data/productCatalog';
import { KAMBAL_CATALOG } from './data/kambalCatalog';
import {
  AppTab,
  CurrencyCode,
  CustomerSummary,
  FilterState,
  ItemSummary,
  ProductItem,
  SalesRecord,
  SavedOfflineInvoice,
  TimeSeriesPoint,
  ThemeColor,
  ThemeMode,
} from './types';
import { exportDetailedExcelReport, exportToCSV, ReportDimensionMode } from './utils/csvHelper';
import { formatCurrency, formatNumber } from './utils/formatters';
import {
  getOfflineInvoices,
  deleteOfflineInvoice,
  clearAllOfflineInvoices,
} from './utils/pdfHelper';

const STORAGE_KEY_SALES = 'looker_sales_ahmedjam_v11';
const STORAGE_KEY_PRICES = 'looker_prices_ahmedjam_v13_kambal';

export default function App() {
  // 1. Data State with LocalStorage (All customer records deleted as requested)
  const [salesData, setSalesData] = useState<SalesRecord[]>(() => {
    try {
      // Clear past cache to guarantee all previous customer data is erased
      localStorage.removeItem('looker_sales_jamjoom_v7');
      localStorage.removeItem('looker_sales_ahmedjam_v8');
      localStorage.removeItem('looker_sales_ahmedjam_v9');
      localStorage.removeItem('looker_sales_ahmedjam_v10');
      const stored = localStorage.getItem(STORAGE_KEY_SALES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return [];
  });

  // 2. Product Catalog / Price List State with LocalStorage (v13: 125 Kambal & Jamjoom medicines in warehouse)
  const [catalog, setCatalog] = useState<ProductItem[]>(() => {
    try {
      const stored =
        localStorage.getItem(STORAGE_KEY_PRICES) ||
        localStorage.getItem('looker_prices_ahmedjam_v12');
      if (stored) {
        const parsed: ProductItem[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge with KAMBAL_CATALOG (125 items) while preserving user custom prices or stock
          const existingMap = new Map(parsed.map((p) => [p.productName.toLowerCase(), p]));
          const merged: ProductItem[] = KAMBAL_CATALOG.map((kItem) => {
            const match = existingMap.get(kItem.productName.toLowerCase());
            if (match) {
              return {
                ...kItem,
                currentPrice: match.currentPrice ?? kItem.currentPrice,
                warehouseStock: match.warehouseStock ?? 100,
              };
            }
            return {
              ...kItem,
              warehouseStock: 100,
            };
          });
          return merged;
        }
      }
    } catch {
      // fallback
    }
    return KAMBAL_CATALOG;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SALES, JSON.stringify(salesData));
    } catch {}
  }, [salesData]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PRICES, JSON.stringify(catalog));
    } catch {}
  }, [catalog]);

  // 3. Navigation & Modals UI state
  const [activeTab, setActiveTab] = useState<AppTab>('invoices');
  const [currency, setCurrency] = useState<CurrencyCode>('SDG');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceModalInitialDesigner, setInvoiceModalInitialDesigner] = useState(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [excelExportFormat, setExcelExportFormat] = useState<'xlsx' | 'xml-excel' | 'csv'>('xlsx');
  const [excelReportMode, setExcelReportMode] = useState<ReportDimensionMode>('detailed');
  const [csvModalTargetInvoice, setCsvModalTargetInvoice] = useState<{
    record: SalesRecord;
    items: Array<{
      itemName: string;
      genericName?: string;
      category?: string;
      quantity: number;
      unitPrice: number;
      totalSales: number;
      notes?: string;
    }>;
  } | null>(null);
  const [selectedInvoiceRecord, setSelectedInvoiceRecord] = useState<SalesRecord | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'screen' | 'storage'>('screen');

  const handleOpenInvoiceDesigner = () => {
    setSelectedInvoiceRecord(salesData[0] || null);
    setInvoiceModalInitialDesigner(true);
    setIsInvoiceModalOpen(true);
  };

  // 3a-1. Sales Rep Management State (Protected by Manager Credentials)
  const [isSalesRepModalOpen, setIsSalesRepModalOpen] = useState(false);
  const [isAdminCredsModalOpen, setIsAdminCredsModalOpen] = useState(false);
  const [activeSalesRep, setActiveSalesRep] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('ahmed_app_active_sales_rep');
      if (saved && saved.trim()) return saved;
    } catch {}
    return DEFAULT_SALES_REP;
  });

  const [salesReps, setSalesReps] = useState<SalesRepItem[]>(() => {
    try {
      const saved = localStorage.getItem('ahmed_app_sales_reps');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: 'rep-default',
        name: DEFAULT_SALES_REP,
        code: 'REP-01',
        phone: '',
        addedAt: new Date().toISOString(),
      },
    ];
  });

  const handleSetActiveSalesRep = (repName: string) => {
    setActiveSalesRep(repName);
    try {
      localStorage.setItem('ahmed_app_active_sales_rep', repName);
    } catch {}
  };

  const handleUpdateSalesReps = (reps: SalesRepItem[]) => {
    setSalesReps(reps);
    try {
      localStorage.setItem('ahmed_app_sales_reps', JSON.stringify(reps));
    } catch {}
  };

  const handleOpenSettings = (tab: 'screen' | 'storage' = 'screen') => {
    setSettingsInitialTab(tab);
    setIsSettingsModalOpen(true);
  };

  // 3a. Initialize mobile screen adaptation settings on mount
  useEffect(() => {
    try {
      applyScreenSettingsToDOM(getScreenSettings());
    } catch {}
  }, []);

  // 3b. Offline Invoices Vault State
  const [savedOfflineInvoices, setSavedOfflineInvoices] = useState<SavedOfflineInvoice[]>(() => {
    return getOfflineInvoices();
  });
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState(false);

  const refreshOfflineInvoices = () => {
    setSavedOfflineInvoices(getOfflineInvoices());
  };

  // 3c. Theme State - Manual toggle with balanced Black & White colors + LocalStorage persistence
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('looker_theme_mode');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {}
    if (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark';
    }
    return 'light';
  });

  const toggleThemeMode = () => {
    setThemeMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('looker_theme_mode', next);
      } catch {}
      return next;
    });
  };

  // Listen to device system changes automatically if user hasn't explicitly set a preference
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const syncTheme = (e: MediaQueryListEvent | MediaQueryList) => {
      try {
        const saved = localStorage.getItem('looker_theme_mode');
        if (!saved) {
          setThemeMode(e.matches ? 'dark' : 'light');
        }
      } catch {}
    };

    const listener = (e: MediaQueryListEvent) => syncTheme(e);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  // Apply dark mode class to documentElement
  useEffect(() => {
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeMode]);

  // 3d. Built-in Theme Color Palette State (Royal Blue, Emerald, Violet, Amber, Rose, Teal, Slate)
  const [themeColor, setThemeColor] = useState<ThemeColor>(() => {
    try {
      const saved = localStorage.getItem('looker_theme_color');
      if (saved && ['blue', 'emerald', 'violet', 'amber', 'rose', 'teal', 'slate'].includes(saved)) {
        return saved as ThemeColor;
      }
    } catch {}
    return 'blue';
  });
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  // Apply data-theme attribute on documentElement to change every color across the app dynamically
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeColor);
    try {
      localStorage.setItem('looker_theme_color', themeColor);
    } catch {}
  }, [themeColor]);

  // 4. Filter State
  const [filters, setFilters] = useState<FilterState>({
    dateRange: 'all',
    startDate: '',
    endDate: '',
    selectedCustomer: '',
    selectedCategory: '',
    selectedItem: '',
    selectedSalesRep: '',
    searchQuery: '',
  });

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      dateRange: 'all',
      startDate: '',
      endDate: '',
      selectedCustomer: '',
      selectedCategory: '',
      selectedItem: '',
      selectedSalesRep: '',
      searchQuery: '',
    });
  };

  // Lists for Dropdowns
  const customersList = useMemo(() => {
    const set = new Set<string>();
    salesData.forEach((s) => s.customerName && set.add(s.customerName));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ar'));
  }, [salesData]);

  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    salesData.forEach((s) => s.category && set.add(s.category));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ar'));
  }, [salesData]);

  const itemsList = useMemo(() => {
    const set = new Set<string>();
    catalog.forEach((p) => set.add(p.productName));
    salesData.forEach((s) => s.itemName && set.add(s.itemName));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ar'));
  }, [catalog, salesData]);

  const salesRepsList = useMemo(() => {
    const set = new Set<string>();
    set.add(DEFAULT_SALES_REP);
    salesData.forEach((s) => s.salesRep && set.add(s.salesRep));
    return Array.from(set);
  }, [salesData]);

  // Determine reference date for relative filters (today, or latest date if historical archive)
  const latestDateInDataset = useMemo(() => {
    const today = new Date();
    if (salesData.length === 0) return today;
    const sorted = [...salesData].sort((a, b) => b.date.localeCompare(a.date));
    const [y, m, d] = sorted[0].date.split('-').map(Number);
    const latest = new Date(y, (m || 1) - 1, d || 1);

    const diffDays = (today.getTime() - latest.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 60) {
      return latest;
    }
    return today;
  }, [salesData]);

  // Filtered dataset
  const filteredData = useMemo(() => {
    return salesData.filter((item) => {
      // 1. Sales Rep
      if (filters.selectedSalesRep && item.salesRep !== filters.selectedSalesRep) {
        return false;
      }
      // 2. Customer
      if (filters.selectedCustomer && item.customerName !== filters.selectedCustomer) {
        return false;
      }
      // 3. Category
      if (filters.selectedCategory && item.category !== filters.selectedCategory) {
        return false;
      }
      // 4. Item
      if (filters.selectedItem && item.itemName !== filters.selectedItem) {
        return false;
      }
      // 5. Search query
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const matches =
          item.customerName.toLowerCase().includes(q) ||
          item.itemName.toLowerCase().includes(q) ||
          (item.salesRep && item.salesRep.toLowerCase().includes(q)) ||
          (item.genericName && item.genericName.toLowerCase().includes(q)) ||
          (item.orderId && item.orderId.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // 6. Date Range
      if (filters.dateRange !== 'all') {
        const [iy, im, id] = item.date.split('-').map(Number);
        const itemDate = new Date(iy, (im || 1) - 1, id || 1, 12, 0, 0);
        const refDate = latestDateInDataset;

        if (filters.dateRange === 'today') {
          const todayStr = new Date().toISOString().split('T')[0];
          if (item.date !== todayStr) return false;
        } else if (filters.dateRange === 'thisWeek') {
          // Current week (starts Saturday) & past 7 days window for medical rep tracking
          const ref = new Date(refDate);
          const day = ref.getDay(); // 0 is Sun, 6 is Sat
          const diffToSat = (day + 1) % 7; // Sat: 0, Sun: 1, Mon: 2, etc.

          const startOfWeek = new Date(ref);
          startOfWeek.setDate(startOfWeek.getDate() - diffToSat);
          startOfWeek.setHours(0, 0, 0, 0);

          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(endOfWeek.getDate() + 6);
          endOfWeek.setHours(23, 59, 59, 999);

          const sevenDaysAgo = new Date(ref);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          sevenDaysAgo.setHours(0, 0, 0, 0);

          // Coverage combines the calendar week starting Saturday with the past 7 days
          const earliestDate = startOfWeek.getTime() < sevenDaysAgo.getTime() ? startOfWeek : sevenDaysAgo;

          if (itemDate < earliestDate || itemDate > endOfWeek) return false;
        } else if (filters.dateRange === '7days') {
          const past = new Date(refDate);
          past.setDate(past.getDate() - 7);
          past.setHours(0, 0, 0, 0);
          if (itemDate < past) return false;
        } else if (filters.dateRange === '30days') {
          const past = new Date(refDate);
          past.setDate(past.getDate() - 30);
          past.setHours(0, 0, 0, 0);
          if (itemDate < past) return false;
        } else if (filters.dateRange === '90days') {
          const past = new Date(refDate);
          past.setDate(past.getDate() - 90);
          past.setHours(0, 0, 0, 0);
          if (itemDate < past) return false;
        } else if (filters.dateRange === 'thisMonth') {
          if (
            itemDate.getFullYear() !== refDate.getFullYear() ||
            itemDate.getMonth() !== refDate.getMonth()
          ) {
            return false;
          }
        } else if (filters.dateRange === 'lastMonth') {
          const prevMonth = refDate.getMonth() === 0 ? 11 : refDate.getMonth() - 1;
          const prevYear =
            refDate.getMonth() === 0 ? refDate.getFullYear() - 1 : refDate.getFullYear();
          if (itemDate.getFullYear() !== prevYear || itemDate.getMonth() !== prevMonth) {
            return false;
          }
        } else if (filters.dateRange === 'custom') {
          if (filters.startDate && item.date < filters.startDate) return false;
          if (filters.endDate && item.date > filters.endDate) return false;
        }
      }

      return true;
    });
  }, [salesData, filters, latestDateInDataset]);

  // 5. Aggregated KPIs
  const totalRevenue = useMemo(() => {
    return filteredData.reduce((acc, r) => acc + (r.totalSales || 0), 0);
  }, [filteredData]);

  const totalQuantity = useMemo(() => {
    return filteredData.reduce((acc, r) => acc + (r.quantity || 0), 0);
  }, [filteredData]);

  const distinctCustomers = useMemo(() => {
    const set = new Set<string>();
    filteredData.forEach((r) => r.customerName && set.add(r.customerName));
    return set.size;
  }, [filteredData]);

  const orderCount = useMemo(() => {
    return filteredData.length;
  }, [filteredData]);

  const averageOrderValue = useMemo(() => {
    return orderCount > 0 ? totalRevenue / orderCount : 0;
  }, [totalRevenue, orderCount]);

  // 6. Customer Summaries
  const customerSummaries: CustomerSummary[] = useMemo(() => {
    const map = new Map<
      string,
      {
        totalSales: number;
        totalQuantity: number;
        orders: Set<string>;
        segment?: string;
      }
    >();

    filteredData.forEach((r) => {
      const name = r.customerName || 'غير محدد';
      const entry = map.get(name) || {
        totalSales: 0,
        totalQuantity: 0,
        orders: new Set<string>(),
        segment: r.customerSegment,
      };

      entry.totalSales += r.totalSales;
      entry.totalQuantity += r.quantity;
      entry.orders.add(r.orderId || r.id);
      if (r.customerSegment) entry.segment = r.customerSegment;

      map.set(name, entry);
    });

    const result: CustomerSummary[] = [];
    map.forEach((val, name) => {
      const orders = val.orders.size || 1;
      result.push({
        customerName: name,
        segment: val.segment,
        totalSales: val.totalSales,
        totalQuantity: val.totalQuantity,
        orderCount: orders,
        avgOrderValue: val.totalSales / orders,
        percentageOfTotal: totalRevenue > 0 ? val.totalSales / totalRevenue : 0,
      });
    });

    return result.sort((a, b) => b.totalSales - a.totalSales);
  }, [filteredData, totalRevenue]);

  // 7. Item Summaries
  const itemSummaries: ItemSummary[] = useMemo(() => {
    const map = new Map<
      string,
      {
        category: string;
        totalQuantity: number;
        totalSales: number;
      }
    >();

    filteredData.forEach((r) => {
      const name = r.itemName || 'صنف غير محدد';
      const entry = map.get(name) || {
        category: r.category || 'عام',
        totalQuantity: 0,
        totalSales: 0,
      };

      entry.totalQuantity += r.quantity;
      entry.totalSales += r.totalSales;
      map.set(name, entry);
    });

    const result: ItemSummary[] = [];
    map.forEach((val, name) => {
      const avgPrice = val.totalQuantity > 0 ? val.totalSales / val.totalQuantity : 0;
      result.push({
        itemName: name,
        category: val.category,
        totalQuantity: val.totalQuantity,
        avgUnitPrice: avgPrice,
        totalSales: val.totalSales,
        percentageOfTotal: totalRevenue > 0 ? val.totalSales / totalRevenue : 0,
      });
    });

    return result.sort((a, b) => b.totalSales - a.totalSales);
  }, [filteredData, totalRevenue]);

  // 8. Time Series Points
  const timeSeriesPoints: TimeSeriesPoint[] = useMemo(() => {
    const map = new Map<
      string,
      {
        sales: number;
        quantity: number;
        orders: number;
      }
    >();

    const sorted = [...filteredData].sort((a, b) => a.date.localeCompare(b.date));

    sorted.forEach((r) => {
      const key = r.date;
      const cur = map.get(key) || { sales: 0, quantity: 0, orders: 0 };
      cur.sales += r.totalSales;
      cur.quantity += r.quantity;
      cur.orders += 1;
      map.set(key, cur);
    });

    const result: TimeSeriesPoint[] = [];
    map.forEach((v, k) => {
      result.push({
        dateKey: k,
        label: k.slice(5),
        sales: v.sales,
        quantity: v.quantity,
        orders: v.orders,
      });
    });

    return result;
  }, [filteredData]);

  // Grouped Invoices for the dedicated Invoices Window
  const groupedInvoices = useMemo(() => {
    const map = new Map<
      string,
      {
        orderId: string;
        customerName: string;
        customerSegment?: string;
        date: string;
        salesRep: string;
        notes?: string;
        items: {
          itemName: string;
          genericName?: string;
          quantity: number;
          unitPrice: number;
          totalSales: number;
        }[];
        totalQuantity: number;
        totalAmount: number;
        firstRecord: SalesRecord;
      }
    >();

    filteredData.forEach((rec) => {
      const key = rec.orderId || rec.id;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          orderId: key,
          customerName: rec.customerName,
          customerSegment: rec.customerSegment,
          date: rec.date,
          salesRep: rec.salesRep,
          notes: rec.notes,
          items: [
            {
              itemName: rec.itemName,
              genericName: rec.genericName,
              quantity: rec.quantity,
              unitPrice: rec.unitPrice,
              totalSales: rec.totalSales,
            },
          ],
          totalQuantity: rec.quantity,
          totalAmount: rec.totalSales,
          firstRecord: rec,
        });
      } else {
        existing.items.push({
          itemName: rec.itemName,
          genericName: rec.genericName,
          quantity: rec.quantity,
          unitPrice: rec.unitPrice,
          totalSales: rec.totalSales,
        });
        existing.totalQuantity += rec.quantity;
        existing.totalAmount += rec.totalSales;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredData]);

  const handleDeleteInvoice = (orderId: string) => {
    if (window.confirm(`هل أنت متأكد من حذف الفاتورة رقم ${orderId}؟`)) {
      setSalesData((prev) => prev.filter((r) => r.orderId !== orderId));
      if (selectedInvoiceRecord?.orderId === orderId) {
        setSelectedInvoiceRecord(null);
      }
    }
  };

  // Quick export single invoice as CSV directly from invoice card
  const handleExportInvoiceCardCsv = async (inv: {
    orderId: string;
    customerName: string;
    date: string;
    customerSegment?: string;
    salesRep?: string;
    items: {
      itemName: string;
      genericName?: string;
      category?: string;
      quantity: number;
      unitPrice: number;
      totalSales: number;
    }[];
    totalAmount: number;
    totalQuantity: number;
    notes?: string;
  }) => {
    const bom = '\uFEFF';
    let csv = bom;
    csv += `رقم الفاتورة,${inv.orderId}\n`;
    csv += `تاريخ الفاتورة,${inv.date}\n`;
    csv += `العميل / الصيدلية,"${(inv.customerName || '').replace(/"/g, '""')}"\n`;
    csv += `تصنيف العميل,"${(inv.customerSegment || 'صيدليات مجتمعية').replace(/"/g, '""')}"\n`;
    csv += `المندوب الطبي,"${(inv.salesRep || activeSalesRep || DEFAULT_SALES_REP).replace(/"/g, '""')}"\n`;
    csv += `العملة,${currency}\n\n`;

    csv += '#,اسم الصنف والمستحضر الدوائي,التركيبة العلمية,التصنيف,الوحدة,الكمية (العبوات),سعر الوحدة,الإجمالي\n';
    inv.items.forEach((it, idx) => {
      const itemTitle = `"${(it.itemName || '').replace(/"/g, '""')}"`;
      const gen = `"${(it.genericName || '').replace(/"/g, '""')}"`;
      const cat = `"${(it.category || '').replace(/"/g, '""')}"`;
      csv += `${idx + 1},${itemTitle},${gen},${cat},عبوة,${it.quantity},${it.unitPrice},${it.totalSales}\n`;
    });

    csv += '\n';
    csv += `إجمالي عدد الأصناف,${inv.items.length}\n`;
    csv += `إجمالي الكمية المباعة,${inv.totalQuantity}\n`;
    csv += `الصافي المطلوب سداده,${inv.totalAmount} ${currency}\n`;
    if (inv.notes) {
      csv += `الملاحظات,"${inv.notes.replace(/"/g, '""')}"\n`;
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const safeCustomer = (inv.customerName || 'Customer').replace(/[\s/\\?%*:|"<>]+/g, '_');
    const filename = `Invoice-${inv.orderId}-${safeCustomer}.csv`;

    try {
      const { saveFileToPhoneStorage } = await import('./services/phoneStorageService');
      await saveFileToPhoneStorage(filename, blob, 'text/csv;charset=utf-8;', 'csv');
    } catch {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  // Add Sale handler (supports multiple items in a single invoice)
  const handleAddSale = (newRecs: Omit<SalesRecord, 'id'>[] | Omit<SalesRecord, 'id'>) => {
    const list = Array.isArray(newRecs) ? newRecs : [newRecs];
    const recs: SalesRecord[] = list.map((r, idx) => ({
      ...r,
      id: `rec-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
    }));
    setSalesData((prev) => [...recs, ...prev]);
  };

  // Save updated catalog prices (and optionally update existing sales records)
  const handleSaveCatalog = (updatedCatalog: ProductItem[], applyToExistingSales: boolean) => {
    setCatalog(updatedCatalog);

    if (applyToExistingSales) {
      const priceMap = new Map<string, number>();
      updatedCatalog.forEach((p) => {
        priceMap.set(p.productName.toLowerCase(), p.currentPrice);
      });

      setSalesData((prev) =>
        prev.map((rec) => {
          const newPrice = priceMap.get(rec.itemName.toLowerCase());
          if (newPrice !== undefined && newPrice !== rec.unitPrice) {
            return {
              ...rec,
              unitPrice: newPrice,
              totalSales: rec.quantity * newPrice,
            };
          }
          return rec;
        })
      );
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="min-h-screen w-full max-w-full text-slate-900 dark:text-slate-100 flex flex-col font-sans safe-top transition-colors"
      style={{
        background:
          themeMode === 'dark'
            ? '#080d1a'
            : 'linear-gradient(180deg, var(--theme-bg-gradient-from, #f0f7ff) 0%, var(--theme-bg-gradient-via, #f6faff) 35%, #ffffff 100%)',
      }}
    >
      {/* Top Bar Contract (1 line wordmark, 4-5 links, 1 action) */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currency={currency}
        setCurrency={setCurrency}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenPriceModal={() => setIsPriceModalOpen(true)}
        onOpenApkModal={() => setIsApkModalOpen(true)}
        onOpenInvoiceModal={() => {
          setSelectedInvoiceRecord(salesData[0] || null);
          setInvoiceModalInitialDesigner(false);
          setIsInvoiceModalOpen(true);
        }}
        onOpenInvoiceDesignerModal={handleOpenInvoiceDesigner}
        onOpenOfflineInvoicesModal={() => setIsOfflineModalOpen(true)}
        offlineCount={savedOfflineInvoices.length}
        onOpenCloudSyncModal={() => setIsCloudModalOpen(true)}
        themeMode={themeMode}
        onToggleThemeMode={toggleThemeMode}
        themeColor={themeColor}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
        onOpenSettingsModal={handleOpenSettings}
        onOpenSalesRepModal={() => setIsSalesRepModalOpen(true)}
        recordCount={salesData.length}
        salesRepName={activeSalesRep}
      />

      {/* Main Container with bottom padding for iOS/Android Bottom Bar */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-28 md:pb-8">
        {/* ================= AHMED APP INTERFACE HERO BANNER ================= */}
        <div
          className="mb-6 bg-white dark:bg-slate-900 rounded-2xl border p-4 sm:p-5 shadow-xs card-realistic transition-all relative overflow-hidden"
          style={{ borderColor: 'var(--theme-primary-border)' }}
        >
          {/* Subtle realistic top accent line */}
          <div
            className="absolute top-0 right-0 left-0 h-1"
            style={{ background: 'linear-gradient(90deg, var(--theme-gradient-start, #2563eb) 0%, var(--theme-gradient-end, #1d4ed8) 100%)' }}
          />
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Right Side: Official Brand Image & Medical Rep Details */}
            <div className="flex items-center gap-3.5 sm:gap-4.5">
              {/* Brand Logo & Avatar Badge with Dynamic Theme Styling */}
              <div
                style={{
                  background: 'linear-gradient(135deg, var(--theme-gradient-start, #2563eb) 0%, var(--theme-gradient-end, #1d4ed8) 100%)',
                }}
                className="text-white rounded-2xl p-2.5 sm:p-3 border border-white/20 shadow-md flex flex-col items-center justify-center shrink-0 w-24 sm:w-28 h-20 sm:h-24 transition-all duration-300"
              >
                <span className="font-black text-xl sm:text-2xl tracking-wider">AJ</span>
                <span className="text-[9px] font-bold text-white/90 uppercase tracking-widest mt-0.5">Ahmed App</span>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {APP_NAME}
                  </h1>
                  <span
                    className="text-xs font-bold px-2.5 py-0.5 rounded-full border transition-colors"
                    style={{
                      backgroundColor: 'var(--theme-primary-light)',
                      color: 'var(--theme-text-accent)',
                      borderColor: 'var(--theme-primary-border)',
                    }}
                  >
                    Jamjoom Pharma
                  </span>
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: 'var(--theme-primary-light)',
                      color: 'var(--theme-text-accent)',
                      borderColor: 'var(--theme-primary-border)',
                    }}
                  >
                    معتمد رسمياً ✓
                  </span>
                </div>
                <div className="mt-1 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 flex flex-wrap items-center gap-2">
                  <span className="text-slate-500 dark:text-slate-400 font-normal">المندوب الطبي:</span>
                  <span className="theme-text-primary font-black">{activeSalesRep}</span>
                  <button
                    type="button"
                    onClick={() => setIsSalesRepModalOpen(true)}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800 transition-colors flex items-center gap-1"
                    title="إدارة المناديب وتعيين مندوب التطبيق (خاص بالمدير العام)"
                  >
                    <span>👤</span>
                    <span>إدارة المناديب</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAdminCredsModalOpen(true)}
                    className="text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:underline cursor-pointer bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-700 transition-colors flex items-center gap-1"
                    title="تغيير اسم المستخدم وكلمة المرور للمدير العام (Admin)"
                  >
                    <span>🔐</span>
                    <span>بيانات المدير (Admin)</span>
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {SUPPLIER_LINE} · قائمة أسعار معتمدة ({catalog.length} صنفاً دوائياً)
                </p>
              </div>
            </div>

            {/* Left Side: Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
              {/* Quick Offline Invoices Vault Button */}
              <button
                onClick={() => setIsOfflineModalOpen(true)}
                style={{
                  backgroundColor: 'var(--theme-primary-light)',
                  color: 'var(--theme-text-accent)',
                  borderColor: 'var(--theme-primary-border)',
                }}
                className="px-3 py-2 text-xs font-bold border rounded-lg transition-all hover:brightness-105 cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title="استعراض وإدارة الفواتير المحفوظة أوفلاين في ذاكرة الهاتف"
              >
                <span>💾 فواتير أوفلاين</span>
                <span
                  className="px-1.5 py-0.2 rounded-full text-white text-[10px] font-bold"
                  style={{ backgroundColor: 'var(--theme-primary)' }}
                >
                  {savedOfflineInvoices.length}
                </span>
              </button>

              {/* Dedicated Button for PDF shape, dimensions & invoice customization */}
              <button
                type="button"
                onClick={handleOpenInvoiceDesigner}
                className="px-3 py-2 text-xs font-black bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 text-slate-950 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95 border border-amber-400/80 ring-1 ring-amber-400/30"
                title="التحكم الكامل بأبعاد ومقاسات PDF، وتصميم وشكل الفاتورة، وتحديد شكل الأعمدة وحجم الظهور"
              >
                <span className="text-sm">📐</span>
                <span>شكل وأبعاد الفاتورة (PDF)</span>
              </button>

              <button
                onClick={() => {
                  setSelectedInvoiceRecord(salesData[0] || null);
                  setInvoiceModalInitialDesigner(false);
                  setIsInvoiceModalOpen(true);
                }}
                style={{
                  backgroundColor: 'var(--theme-primary-light)',
                  color: 'var(--theme-text-accent)',
                  borderColor: 'var(--theme-primary-border)',
                }}
                className="px-3 py-2 text-xs font-bold border rounded-lg transition-all hover:brightness-105 cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title="تحميل وطباعة فواتير PDF ملء الشاشة"
              >
                <span>فواتير PDF 📄</span>
              </button>

              <button
                onClick={() => {
                  setExcelReportMode('allReports');
                  setExcelExportFormat('xlsx');
                  setIsExcelModalOpen(true);
                }}
                style={{
                  backgroundColor: 'var(--theme-primary-light)',
                  color: 'var(--theme-text-accent)',
                  borderColor: 'var(--theme-primary-border)',
                }}
                className="px-3 py-2 text-xs font-bold border rounded-lg transition-all hover:brightness-105 cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title="تصدير حزمة شاملة لكافة التقارير (المؤشرات + العملاء + الأصناف + التفصيلي) في ملف إكسل واحد"
              >
                <span>كل التقارير 📦</span>
              </button>

              <button
                onClick={() => {
                  setExcelReportMode('detailed');
                  setExcelExportFormat('xlsx');
                  setIsExcelModalOpen(true);
                }}
                style={{
                  backgroundColor: 'var(--theme-primary-light)',
                  color: 'var(--theme-text-accent)',
                  borderColor: 'var(--theme-primary-border)',
                }}
                className="px-3 py-2 text-xs font-bold border rounded-lg transition-all hover:brightness-105 cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title="تخصيص وتحديد بيانات وأعمدة ملف Excel قبل الحفظ والتصدير"
              >
                <span>تصدير Excel 📊</span>
              </button>

              <button
                onClick={() => setIsCloudModalOpen(true)}
                style={{
                  backgroundColor: 'var(--theme-primary-light)',
                  color: 'var(--theme-text-accent)',
                  borderColor: 'var(--theme-primary-border)',
                }}
                className="px-3 py-2 text-xs font-bold border rounded-lg transition-all hover:brightness-105 cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title="المزامنة السحابية مع Cloud Firestore و Google Drive"
              >
                <span>سحابي ☁️</span>
              </button>

              <button
                onClick={() => setIsPriceModalOpen(true)}
                className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                title="تعديل وتخصيص أسعار أصناف جمجوم فارما"
              >
                <span>الأسعار ({catalog.length} صنف)</span>
              </button>

              <button
                onClick={() => handleOpenSettings('screen')}
                style={{
                  backgroundColor: 'var(--theme-primary-light)',
                  color: 'var(--theme-text-accent)',
                  borderColor: 'var(--theme-primary-border)',
                }}
                className="px-3 py-2 text-xs font-bold border rounded-lg transition-all hover:brightness-105 cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title="ضبط ملاءمة الشاشة ونوع الأندرويد وأذونات تخزين الهاتف"
              >
                <span>⚙️ إعدادات الهاتف</span>
              </button>

              {salesData.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`هل أنت متأكد تماماً من رغبتك في حذف كل الفواتير (${salesData.length} سجل) بالكامل؟ لا يمكن التراجع عن هذا الإجراء.`)) {
                      setSalesData([]);
                      setSelectedInvoiceRecord(null);
                      clearAllOfflineInvoices();
                      refreshOfflineInvoices();
                    }
                  }}
                  className="px-3 py-2 text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-300 dark:border-rose-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  title="حذف جميع فواتير المبيعات المسجلة بالكامل"
                >
                  <span>🗑️ حذف كل الفواتير</span>
                </button>
              )}

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="btn-realistic-primary px-4 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>➕</span>
                <span>إضافة فاتورة</span>
              </button>
            </div>
          </div>
        </div>

        {/* Global Filter Bar (shown on invoices, customers, items, and analytics tabs) */}
        {activeTab !== 'dataSource' && activeTab !== 'lookerGuide' && activeTab !== 'warehouse' && (
          <FilterBar
            filters={filters}
            setFilters={setFilters}
            customersList={customersList}
            categoriesList={categoriesList}
            itemsList={itemsList}
            salesRepsList={salesRepsList}
            totalFiltered={filteredData.length}
            totalRecords={salesData.length}
            onReset={handleResetFilters}
            onExportCSV={() => {
              setExcelExportFormat('csv');
              setExcelReportMode('detailed');
              setIsExcelModalOpen(true);
            }}
            onExportExcel={() => {
              setExcelExportFormat('xlsx');
              setExcelReportMode('detailed');
              setIsExcelModalOpen(true);
            }}
            onPrint={handlePrint}
          />
        )}

        {/* ================= TAB 1: INVOICES & ORDERS WINDOW (الفواتير والطلبيات) ================= */}
        {activeTab === 'invoices' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Quick KPI Banner for Invoices */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">عدد الفواتير الصادرة</div>
                <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 tabular-numbers">
                  {formatNumber(groupedInvoices.length)} فاتورة
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">إجمالي المبيعات المحققة</div>
                <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 tabular-numbers">
                  {formatCurrency(totalRevenue, currency)}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">إجمالي العبوات المفوترة</div>
                <div className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 mt-1 tabular-numbers">
                  {formatNumber(totalQuantity)} عبوة
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">الصيدليات والعملاء</div>
                <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 tabular-numbers">
                  {formatNumber(distinctCustomers)} عميل
                </div>
              </div>
            </div>

            {/* Empty State Banner when no invoices exist */}
            {groupedInvoices.length === 0 ? (
              <div
                className="bg-white dark:bg-slate-900 border-2 rounded-2xl p-8 sm:p-12 text-center shadow-xs card-realistic animate-in fade-in duration-200"
                style={{ borderColor: 'var(--theme-primary-border)' }}
              >
                <div
                  className="w-16 h-16 mx-auto rounded-2xl border flex items-center justify-center text-3xl font-bold mb-3 shadow-xs"
                  style={{
                    backgroundColor: 'var(--theme-primary-light)',
                    borderColor: 'var(--theme-primary-border)',
                    color: 'var(--theme-primary)',
                  }}
                >
                  🧾
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  لا توجد فواتير مبيعات مسجلة حالياً
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 max-w-md mx-auto leading-relaxed">
                  ابدأ بإصدار أول فاتورة بيع جديدة. أي فاتورة تضيفها سيتم ربطها فورياً بالمخزن وخصم كمياتها تلقائياً.
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="btn-realistic-primary px-5 py-2.5 rounded-xl text-white text-xs sm:text-sm font-bold shadow-md cursor-pointer flex items-center gap-2"
                  >
                    <span>➕</span>
                    <span>إصدار أول فاتورة بيع</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('warehouse')}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span>📦</span>
                    <span>عرض أرصدة المستودع والمخزن</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Invoices Cards List */
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-1">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>قائمة الفواتير المعتمدة</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      {groupedInvoices.length} فاتورة
                    </span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(true)}
                      className="btn-realistic-primary px-3.5 py-1.5 text-xs font-black text-white rounded-lg shadow-xs flex items-center gap-1 cursor-pointer"
                    >
                      <span>➕</span>
                      <span>فاتورة جديدة</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3.5">
                  {groupedInvoices.map((inv) => (
                    <div
                      key={inv.orderId}
                      className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 shadow-2xs transition-all space-y-3"
                    >
                      {/* Invoice Card Top Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-mono font-bold text-xs tracking-wider">
                            #{inv.orderId}
                          </span>
                          <span className="text-sm font-black text-slate-900 dark:text-white">
                            {inv.customerName}
                          </span>
                          {inv.customerSegment && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {inv.customerSegment}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
                          <span>📅 {inv.date}</span>
                          <span>👤 {inv.salesRep}</span>
                        </div>
                      </div>

                      {/* Items Inside Invoice Summary */}
                      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 space-y-1.5">
                        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 pb-1 border-b border-slate-200/60 dark:border-slate-700">
                          محتويات الفاتورة ({inv.items.length} صنف · {formatNumber(inv.totalQuantity)} عبوة):
                        </div>
                        <div className="space-y-1 max-h-36 overflow-y-auto">
                          {inv.items.map((it, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                • {it.itemName}
                              </span>
                              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                <span className="tabular-numbers font-medium">{it.quantity} عبوة × {formatNumber(it.unitPrice)}</span>
                                <span className="font-black text-slate-900 dark:text-white tabular-numbers">
                                  {formatCurrency(it.totalSales, currency)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {inv.notes && (
                        <div className="text-xs text-slate-600 dark:text-slate-400 italic">
                          📝 ملاحظات: {inv.notes}
                        </div>
                      )}

                      {/* Footer Actions & Total */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">الإجمالي:</span>
                          <span className="text-lg sm:text-xl font-black text-blue-700 dark:text-blue-300 tabular-numbers">
                            {formatCurrency(inv.totalAmount, currency)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedInvoiceRecord(inv.firstRecord);
                              setInvoiceModalInitialDesigner(false);
                              setIsInvoiceModalOpen(true);
                            }}
                            className="btn-realistic-primary px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer flex items-center gap-1.5"
                            title="معاينة وطباعة وتصدير الفاتورة PDF وحفظها مباشرة"
                          >
                            <span>📄</span>
                            <span>معاينة وطباعة PDF</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExportInvoiceCardCsv(inv)}
                            className="px-3 py-2 text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 rounded-xl border border-sky-300 dark:border-sky-800 cursor-pointer transition-colors flex items-center gap-1 shadow-2xs"
                            title="تصدير هذه الفاتورة بصيغة CSV متوافقة مع Excel"
                          >
                            <span>📊</span>
                            <span>تصدير CSV</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteInvoice(inv.orderId)}
                            className="px-3 py-2 text-xs font-bold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-xl border border-rose-300 dark:border-rose-800 cursor-pointer transition-colors flex items-center gap-1"
                            title="حذف هذه الفاتورة"
                          >
                            <span>🗑️</span>
                            <span>حذف</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 1.5: KAMBAL ORDERS (طلبيات كمبال للأدوية) ================= */}
        {activeTab === 'kambalOrders' && (
          <div className="animate-in fade-in duration-200">
            <KambalOrdersSection
              salesData={salesData}
              onAddSalesRecords={handleAddSale}
              existingCustomers={customersList}
              activeSalesRep={activeSalesRep}
              currency={currency}
              onOpenInvoiceModalWithRecord={(rec) => {
                setSelectedInvoiceRecord(rec);
                setIsInvoiceModalOpen(true);
              }}
            />
          </div>
        )}

        {/* ================= TAB 2: WAREHOUSE & INVENTORY WINDOW (المخزن والمستودع) ================= */}
        {activeTab === 'warehouse' && (
          <div className="animate-in fade-in duration-200">
            <WarehouseManager
              catalog={catalog}
              onUpdateCatalog={setCatalog}
              salesData={salesData}
              currency={currency}
            />
          </div>
        )}

        {/* ================= TAB 3: CATALOG & PRICES WINDOW (الأصناف والأسعار) ================= */}
        {activeTab === 'items' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header with Quick Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>قائمة أسعار جمجوم فارما الرسمية</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {catalog.length} صنفاً معتمداً
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  الأسعار المحدثة مطابقة لقائمة Jamjoom pharma Saudi Arabia الرسمية
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPriceModalOpen(true)}
                  className="btn-realistic-primary px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <span>⚙️</span>
                  <span>تعديل الأسعار الرسمية</span>
                </button>
              </div>
            </div>

            {/* Item Sales Analysis Table */}
            <ItemSalesTable
              items={itemSummaries}
              currency={currency}
              selectedItem={filters.selectedItem}
              onSelectItem={(item) =>
                setFilters((prev) => ({ ...prev, selectedItem: item }))
              }
              onExportItems={() => {
                setExcelReportMode('byItem');
                setExcelExportFormat('xlsx');
                setIsExcelModalOpen(true);
              }}
            />
          </div>
        )}

        {/* ================= TAB 4: CUSTOMERS WINDOW (تحليل مبيعات العملاء) ================= */}
        {activeTab === 'customers' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <TopCustomersChart
              customers={customerSummaries}
              currency={currency}
              selectedCustomer={filters.selectedCustomer}
              onSelectCustomer={(c) =>
                setFilters((prev) => ({ ...prev, selectedCustomer: c }))
              }
            />

            <CustomerSalesTable
              customers={customerSummaries}
              currency={currency}
              selectedCustomer={filters.selectedCustomer}
              onSelectCustomer={(c) =>
                setFilters((prev) => ({ ...prev, selectedCustomer: c }))
              }
              onOpenInvoiceForCustomer={(customerName) => {
                const target = salesData.find((r) => r.customerName === customerName);
                if (target) {
                  setSelectedInvoiceRecord(target);
                  setIsInvoiceModalOpen(true);
                }
              }}
              onExportCustomers={() => {
                setExcelReportMode('byCustomer');
                setExcelExportFormat('xlsx');
                setIsExcelModalOpen(true);
              }}
            />
          </div>
        )}

        {/* ================= TAB 5: ANALYTICS & REPORTS WINDOW (الإحصائيات والتقارير) ================= */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* 1. Scorecards / KPIs */}
            <Scorecards
              totalRevenue={totalRevenue}
              totalQuantity={totalQuantity}
              distinctCustomers={distinctCustomers}
              orderCount={orderCount}
              averageOrderValue={averageOrderValue}
              currency={currency}
            />

            {/* Realistic Section Line Divider */}
            <div className="realistic-section-line" />

            {/* 2. Primary Charts Grid: Time Series + Donut */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <TimeSeriesChart data={timeSeriesPoints} currency={currency} />
              </div>
              <div className="lg:col-span-5">
                <ItemQuantityDonut
                  items={itemSummaries}
                  currency={currency}
                  selectedItem={filters.selectedItem}
                  onSelectItem={(item) =>
                    setFilters((prev) => ({ ...prev, selectedItem: item }))
                  }
                />
              </div>
            </div>

            {/* Category Performance Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs card-realistic transition-colors">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span>توزيع المبيعات حسب الفئات العلاجية (Category Breakdown)</span>
                  <span className="text-[10px] text-slate-400 font-mono">Category Dimension</span>
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">أصناف {APP_NAME}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                مساهمة كل قطاع علاجي في إجمالي المبيعات المحققة
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categoriesList.map((cat) => {
                  const catItems = filteredData.filter((r) => r.category === cat);
                  const catSales = catItems.reduce((s, r) => s + r.totalSales, 0);
                  const catQty = catItems.reduce((s, r) => s + r.quantity, 0);
                  const pct = totalRevenue > 0 ? (catSales / totalRevenue) * 100 : 0;
                  const isSelected = filters.selectedCategory === cat;

                  return (
                    <div
                      key={cat}
                      onClick={() =>
                        setFilters((p) => ({
                          ...p,
                          selectedCategory: isSelected ? '' : cat,
                        }))
                      }
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600 font-semibold shadow-xs'
                          : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{cat}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white tabular-numbers">
                            {formatCurrency(catSales, currency)}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            ({pct.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(4, pct)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                        <span>{catItems.length} فواتير مسجلة</span>
                        <span>{formatNumber(catQty)} عبوة مباعة</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 6: DATA SOURCE & BACKUP (إدارة البيانات) ================= */}
        {activeTab === 'dataSource' && (
          <DataSourceManager
            data={salesData}
            setData={setSalesData}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onOpenPriceModal={() => setIsPriceModalOpen(true)}
            onOpenCloudModal={() => setIsCloudModalOpen(true)}
            onOpenExcelModal={() => setIsExcelModalOpen(true)}
            onViewInvoice={(record) => {
              setSelectedInvoiceRecord(record);
              setIsInvoiceModalOpen(true);
            }}
            currency={currency}
          />
        )}

        {/* ================= TAB 7: LOOKER STUDIO GUIDE (دليل الربط) ================= */}
        {activeTab === 'lookerGuide' && <LookerStudioGuide />}
      </main>

      {/* Modal for adding a new sale entry */}
      <AddSaleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddSale}
        catalog={catalog}
        existingCustomers={customersList}
        existingCategories={categoriesList}
        currency={currency}
        activeSalesRep={activeSalesRep}
        salesData={salesData}
      />

      {/* Modal for Price Management & Customization */}
      <PriceManagerModal
        isOpen={isPriceModalOpen}
        onClose={() => setIsPriceModalOpen(false)}
        catalog={catalog}
        onSaveCatalog={handleSaveCatalog}
        currency={currency}
      />

      {/* Modal for APK Build and GitHub Actions */}
      <ApkBuildModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
      />

      {/* Modal for PDF Invoice Generation & Print */}
      <InvoicePdfModal
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          refreshOfflineInvoices();
        }}
        record={selectedInvoiceRecord}
        allRecords={salesData}
        onSelectRecord={setSelectedInvoiceRecord}
        onUpdateRecords={(updated) => {
          setSalesData(updated);
          if (updated.length === 0) {
            setSelectedInvoiceRecord(null);
          }
        }}
        onDeleteCurrentInvoice={(orderId) => {
          const remaining = salesData.filter((r) => r.orderId !== orderId);
          setSalesData(remaining);
          setSelectedInvoiceRecord(remaining[0] || null);
        }}
        onClearAllInvoices={() => {
          setSalesData([]);
          setSelectedInvoiceRecord(null);
          clearAllOfflineInvoices();
          refreshOfflineInvoices();
        }}
        catalog={catalog}
        currency={currency}
        activeSalesRep={activeSalesRep}
      />

      {/* Modal for Offline Invoices Saved in Mobile Storage */}
      <OfflineInvoicesModal
        isOpen={isOfflineModalOpen}
        onClose={() => {
          setIsOfflineModalOpen(false);
          refreshOfflineInvoices();
        }}
        savedInvoices={savedOfflineInvoices}
        onDeleteInvoice={(id) => {
          deleteOfflineInvoice(id);
          refreshOfflineInvoices();
        }}
        onClearAll={() => {
          clearAllOfflineInvoices();
          refreshOfflineInvoices();
        }}
        onOpenInvoicePreview={(inv) => {
          const matching = salesData.find((r) => r.orderId === inv.orderId);
          if (matching) {
            setSelectedInvoiceRecord(matching);
          } else {
            setSelectedInvoiceRecord({
              id: inv.id,
              orderId: inv.orderId,
              customerName: inv.customerName,
              date: inv.date,
              itemName: inv.items[0]?.itemName || 'صنف',
              genericName: inv.items[0]?.genericName,
              category: 'عام',
              quantity: inv.items[0]?.quantity || 1,
              unitPrice: inv.items[0]?.unitPrice || 0,
              totalSales: inv.totalAmount,
              salesRep: inv.salesRep,
            });
          }
          setIsOfflineModalOpen(false);
          setIsInvoiceModalOpen(true);
        }}
      />



      {/* Modal for Cloud Sync (Firebase & Google Drive) */}
      <CloudSyncModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
        salesData={salesData}
        onImportSalesData={(imported) => setSalesData(imported)}
        catalog={catalog}
      />

      {/* Built-in Theme Selector Modal */}
      <ThemeSelectorModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        themeColor={themeColor}
        setThemeColor={setThemeColor}
        themeMode={themeMode}
        onToggleThemeMode={toggleThemeMode}
      />

      {/* Custom Excel / CSV Export Modal with Field Selection */}
      <ExcelExportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        allRecords={salesData}
        filteredRecords={filteredData}
        currency={currency}
        customersList={customersList}
        initialFormat={excelExportFormat}
        initialReportMode={excelReportMode}
      />

      {/* Invoice Specific CSV Customizer Modal */}
      {csvModalTargetInvoice && (
        <InvoiceCsvExportModal
          isOpen={!!csvModalTargetInvoice}
          onClose={() => setCsvModalTargetInvoice(null)}
          record={csvModalTargetInvoice.record}
          items={csvModalTargetInvoice.items}
          currency={currency}
          activeSalesRep={activeSalesRep}
          companyName={APP_NAME}
        />
      )}

      {/* Clean Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-xs text-slate-500 dark:text-slate-400 no-print pb-24 md:pb-6 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-slate-200">{APP_NAME}</span>
            <span aria-hidden="true">·</span>
            <span>المندوب: {activeSalesRep}</span>
            <span aria-hidden="true">·</span>
            <span>{SUPPLIER_LINE} Price List</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400 dark:text-slate-500">
            <span>متوافق مع أجهزة أندرويد وشاشات اللمس و Looker Studio</span>
            <span aria-hidden="true">·</span>
            <span>قائمة أسعار معتمدة</span>
          </div>
        </div>
      </footer>

      {/* Sales Rep Manager Modal (Protected for manager) */}
      <SalesRepManagerModal
        isOpen={isSalesRepModalOpen}
        onClose={() => setIsSalesRepModalOpen(false)}
        activeSalesRep={activeSalesRep}
        onSetActiveSalesRep={handleSetActiveSalesRep}
        salesReps={salesReps}
        onUpdateSalesReps={handleUpdateSalesReps}
      />

      {/* Admin Credentials Manager Modal (Change Admin Username & Password) */}
      <AdminCredentialsModal
        isOpen={isAdminCredsModalOpen}
        onClose={() => setIsAdminCredsModalOpen(false)}
      />

      {/* App & Phone Settings Modal (Screen Adaptation & Phone Storage Permissions) */}
      <AppSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        initialTab={settingsInitialTab}
      />

      {/* Android Optimized Bottom Navigation Bar */}
      <AndroidBottomBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenInvoiceModal={() => {
          setSelectedInvoiceRecord(salesData[0] || null);
          setIsInvoiceModalOpen(true);
        }}
        onOpenOfflineModal={() => setIsOfflineModalOpen(true)}
        onOpenSettingsModal={() => handleOpenSettings('screen')}
        recordCount={salesData.length}
        offlineCount={savedOfflineInvoices.length}
      />
    </div>
  );
}
