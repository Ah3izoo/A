import React, { useState, useMemo } from 'react';
import { ProductItem, SalesRecord, CurrencyCode, WarehouseItemStock } from '../types';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { exportToCSV } from '../utils/csvHelper';
import { saveFileToPhoneStorage } from '../services/phoneStorageService';
import { WarehouseCsvExportModal } from './WarehouseCsvExportModal';

interface WarehouseManagerProps {
  catalog: ProductItem[];
  onUpdateCatalog: (updatedCatalog: ProductItem[]) => void;
  salesData: SalesRecord[];
  currency: CurrencyCode;
  onOpenAddInvoiceWithProduct?: (productId: string) => void;
}

export const WarehouseManager: React.FC<WarehouseManagerProps> = ({
  catalog,
  onUpdateCatalog,
  salesData,
  currency,
  onOpenAddInvoiceWithProduct,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  
  // Stock Adjustment Modal
  const [selectedProductForStock, setSelectedProductForStock] = useState<ProductItem | null>(null);
  const [addQtyAmount, setAddQtyAmount] = useState<number>(50);
  const [newExactStock, setNewExactStock] = useState<number>(100);
  const [modalMode, setModalMode] = useState<'add' | 'set'>('add');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showClearAllStockModal, setShowClearAllStockModal] = useState<boolean>(false);
  const [isWarehouseCsvModalOpen, setIsWarehouseCsvModalOpen] = useState<boolean>(false);

  // Clear / Zero out all quantities in the warehouse
  const handleClearAllStock = () => {
    const updated = catalog.map((item) => ({
      ...item,
      warehouseStock: 0,
    }));
    onUpdateCatalog(updated);
    setShowClearAllStockModal(false);
    showToast('✓ تم تصفير وحذف جميع كميات المخزن بنجاح! الرصيد الحالي أصبح 0 عبوة لجميع الأصناف.');
  };

  // Compute sold quantities per product from all sales records
  const soldQuantitiesMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const record of salesData) {
      const current = map.get(record.itemName) || 0;
      map.set(record.itemName, current + (record.quantity || 0));
    }
    return map;
  }, [salesData]);

  // Build complete warehouse items with real-time stock computation
  const warehouseItems: WarehouseItemStock[] = useMemo(() => {
    return catalog.map((item) => {
      const sold = soldQuantitiesMap.get(item.productName) || 0;
      const initialStock = item.warehouseStock ?? 100;
      const remainingStock = Math.max(0, initialStock - sold);
      const minAlert = item.minAlertStock ?? 10;
      
      let status: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
      if (initialStock - sold <= 0) {
        status = 'out_of_stock';
      } else if (remainingStock <= minAlert) {
        status = 'low_stock';
      }

      return {
        id: item.id,
        productId: item.id,
        productName: item.productName,
        genericName: item.genericName,
        category: item.category,
        price: item.currentPrice,
        initialStock,
        soldQuantity: sold,
        remainingStock: initialStock - sold, // Can show negative if oversold
        status,
        totalSalesValue: sold * item.currentPrice,
        remainingStockValue: Math.max(0, initialStock - sold) * item.currentPrice,
      };
    });
  }, [catalog, soldQuantitiesMap]);

  // Overall Warehouse KPIs
  const totalInitialUnits = useMemo(() => warehouseItems.reduce((acc, it) => acc + it.initialStock, 0), [warehouseItems]);
  const totalSoldUnits = useMemo(() => warehouseItems.reduce((acc, it) => acc + it.soldQuantity, 0), [warehouseItems]);
  const totalRemainingUnits = useMemo(() => warehouseItems.reduce((acc, it) => acc + Math.max(0, it.remainingStock), 0), [warehouseItems]);
  const totalRemainingValue = useMemo(() => warehouseItems.reduce((acc, it) => acc + it.remainingStockValue, 0), [warehouseItems]);
  const outOfStockCount = useMemo(() => warehouseItems.filter((it) => it.remainingStock <= 0).length, [warehouseItems]);
  const lowStockCount = useMemo(() => warehouseItems.filter((it) => it.status === 'low_stock').length, [warehouseItems]);

  // Distinct categories
  const categories = useMemo(() => {
    const set = new Set(catalog.map((c) => c.category));
    return Array.from(set);
  }, [catalog]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return warehouseItems.filter((item) => {
      const matchesSearch =
        item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      
      const matchesStatus =
        stockStatusFilter === 'all' ||
        item.status === stockStatusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [warehouseItems, searchQuery, selectedCategory, stockStatusFilter]);

  // Show Toast helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Quick Stock Adjustment Handler
  const handleQuickAddStock = (productId: string, amount: number) => {
    const updated = catalog.map((item) => {
      if (item.id === productId) {
        const currentStock = item.warehouseStock ?? 100;
        return { ...item, warehouseStock: Math.max(0, currentStock + amount) };
      }
      return item;
    });
    onUpdateCatalog(updated);
    showToast(`✓ تم إضافة ${amount} عبوة إلى رصيد المخزن بنجاح!`);
  };

  // Open modal for detailed stock update
  const handleOpenStockModal = (item: ProductItem, mode: 'add' | 'set') => {
    setSelectedProductForStock(item);
    setModalMode(mode);
    setNewExactStock(item.warehouseStock ?? 100);
    setAddQtyAmount(50);
  };

  // Save Modal Stock Update
  const handleSaveModalStock = () => {
    if (!selectedProductForStock) return;
    const updated = catalog.map((item) => {
      if (item.id === selectedProductForStock.id) {
        let newStock = item.warehouseStock ?? 100;
        if (modalMode === 'add') {
          newStock = Math.max(0, newStock + Number(addQtyAmount));
        } else {
          newStock = Math.max(0, Number(newExactStock));
        }
        return { ...item, warehouseStock: newStock };
      }
      return item;
    });
    onUpdateCatalog(updated);
    showToast(
      modalMode === 'add'
        ? `✓ تم توريد إضافة (+${addQtyAmount}) إلى مخزن ${selectedProductForStock.productName}!`
        : `✓ تم تحديث رصيد مخزن ${selectedProductForStock.productName} إلى (${newExactStock}) عبوة!`
    );
    setSelectedProductForStock(null);
  };

  // Export Warehouse Report to CSV / Excel
  const handleExportWarehouseCSV = () => {
    const headers = [
      'رقم الصنف',
      'اسم الصنف',
      'الاسم العلمي',
      'الفئة',
      'سعر الوحدة',
      'الكمية المدخلة بالمستودع',
      'الكمية المباعة من الفواتير',
      'الرصيد المتبقي بالمخزن',
      'حالة المخزون',
      'قيمة المبيعات',
      'قيمة المخزون المتبقي',
    ];

    const rows = warehouseItems.map((it) => [
      `"${it.productId}"`,
      `"${it.productName.replace(/"/g, '""')}"`,
      `"${it.genericName.replace(/"/g, '""')}"`,
      `"${it.category.replace(/"/g, '""')}"`,
      it.price,
      it.initialStock,
      it.soldQuantity,
      it.remainingStock,
      `"${it.status === 'out_of_stock' ? 'نفد من المستودع' : it.status === 'low_stock' ? 'مخزون منخفض' : 'متوفر'}"`,
      it.totalSalesValue,
      it.remainingStockValue,
    ]);

    const BOM = '\uFEFF';
    const csvContent = BOM + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const filename = `تقرير_مخزون_المستودع_جمجوم_${new Date().toISOString().split('T')[0]}.csv`;
    
    // Use the native-aware save helper or fallback
    saveFileToPhoneStorage(filename, blob, 'text/csv;charset=utf-8;', 'csv')
      .then((res: { path?: string }) => {
        showToast(`✓ تم حفظ تقرير جرد المخزن في (${res.path || 'المستندات'}) بنجاح!`);
      })
      .catch(() => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast(`✓ تم تنزيل تقرير المخزن (${filename}) بنجاح`);
      });
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-black text-xs shadow-lg animate-in fade-in slide-in-from-top-3 duration-200 flex items-center gap-2">
          <span>📦</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Title */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xs card-realistic flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">📦</span>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              إدارة المخزون والمستودع والربط بالفواتير
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
              ربط تلقائي فوري
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold leading-relaxed">
            يتم خصم أي طلبية مبيعات مسجلة تلقائياً من رصيد المستودع، لمعرفة الكميات المباعة والرصيد المتبقي بدقة متناهية.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setIsWarehouseCsvModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title="تخصيص وتعديل الجداول والأعمدة وتصدير ملف CSV لجرد المستودع"
          >
            <span>📊</span>
            <span>تخصيص وتصدير جرد المخزن (CSV/Excel)</span>
          </button>
          <button
            type="button"
            onClick={() => setShowClearAllStockModal(true)}
            className="px-3.5 py-2 text-xs font-black rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
            title="تصفير وحذف جميع كميات الأصناف الحالية في المخزن دفعة واحدة"
          >
            <span>🗑️</span>
            <span>تصفير وحذف كافة كميات المخزن</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Total Items */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-3.5 shadow-xs card-realistic">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold mb-1">
            أصناف المستودع
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            {catalog.length} <span className="text-xs font-normal text-slate-400">صنف</span>
          </div>
        </div>

        {/* 2. Total Supplied */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-3.5 shadow-xs card-realistic">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold mb-1">
            إجمالي المدخل بالمخزن
          </div>
          <div className="text-xl font-black text-blue-600 dark:text-blue-400">
            {formatNumber(totalInitialUnits)} <span className="text-xs font-normal text-slate-400">عبوة</span>
          </div>
        </div>

        {/* 3. Total Sold */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-3.5 shadow-xs card-realistic">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold mb-1">
            إجمالي الكميات المباعة
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
            {formatNumber(totalSoldUnits)} <span className="text-xs font-normal text-slate-400">عبوة</span>
          </div>
        </div>

        {/* 4. Total Remaining */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-3.5 shadow-xs card-realistic">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold mb-1">
            الرصيد المتبقي الفعلي
          </div>
          <div className="text-xl font-black text-purple-600 dark:text-purple-400">
            {formatNumber(totalRemainingUnits)} <span className="text-xs font-normal text-slate-400">عبوة</span>
          </div>
        </div>

        {/* 5. Remaining Inventory Value */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-3.5 shadow-xs card-realistic">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold mb-1">
            قيمة المخزون المتبقي
          </div>
          <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
            {formatCurrency(totalRemainingValue, currency)}
          </div>
        </div>

        {/* 6. Alerts */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-3.5 shadow-xs card-realistic">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold mb-1">
            تنبيهات النواقص
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-xl font-black ${outOfStockCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
              {outOfStockCount}
            </span>
            <span className="text-xs text-rose-500 font-bold">نفد</span>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className={`text-xl font-black ${lowStockCount > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
              {lowStockCount}
            </span>
            <span className="text-xs text-amber-500 font-bold">منخفض</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs card-realistic flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث باسم الصنف، التركيبة، أو الفئة العلاجية..."
            className="w-full pl-3 pr-9 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </div>

        {/* Category Selector */}
        <div className="w-full md:w-56 shrink-0">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold cursor-pointer"
          >
            <option value="all">كافة الفئات العلاجية ({categories.length})</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 shrink-0">
          <button
            type="button"
            onClick={() => setStockStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
              stockStatusFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            الكل ({warehouseItems.length})
          </button>
          <button
            type="button"
            onClick={() => setStockStatusFilter('in_stock')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
              stockStatusFilter === 'in_stock'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
            }`}
          >
            متوفر ({warehouseItems.filter((i) => i.status === 'in_stock').length})
          </button>
          <button
            type="button"
            onClick={() => setStockStatusFilter('low_stock')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
              stockStatusFilter === 'low_stock'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50'
            }`}
          >
            منخفض ({lowStockCount})
          </button>
          <button
            type="button"
            onClick={() => setStockStatusFilter('out_of_stock')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
              stockStatusFilter === 'out_of_stock'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50'
            }`}
          >
            نفد ({outOfStockCount})
          </button>
        </div>
      </div>

      {/* Main Stock Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden card-realistic">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-black">
                <th className="py-3.5 px-4">الصنف والتركيبة (المنتج)</th>
                <th className="py-3.5 px-3">الفئة العلاجية</th>
                <th className="py-3.5 px-3 text-left">السعر الرسمي</th>
                <th className="py-3.5 px-3 text-center bg-blue-50/50 dark:bg-blue-950/20">رصيد المخزن الكلي</th>
                <th className="py-3.5 px-3 text-center bg-emerald-50/50 dark:bg-emerald-950/20">الكمية المباعة</th>
                <th className="py-3.5 px-4 text-center bg-purple-50/60 dark:bg-purple-950/30">المتبقي في المستودع</th>
                <th className="py-3.5 px-3 text-center">حالة التوفر</th>
                <th className="py-3.5 px-4 text-center">إدارة الرصيد السريع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500 font-bold">
                    لا توجد أصناف مطابقة للبحث أو الفلتر المختار
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const percentSold = item.initialStock > 0
                    ? Math.min(100, (item.soldQuantity / item.initialStock) * 100)
                    : 0;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Product Name */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full shrink-0"
                            style={{
                              backgroundColor:
                                item.remainingStock <= 0
                                  ? '#ef4444'
                                  : item.remainingStock <= 10
                                  ? '#f59e0b'
                                  : '#10b981',
                            }}
                          />
                          <div>
                            <div className="font-black text-sm text-slate-900 dark:text-white">
                              {item.productName}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                              {item.genericName}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {item.category}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-3 text-left font-bold text-slate-800 dark:text-slate-200 tabular-numbers">
                        {formatCurrency(item.price, currency)}
                      </td>

                      {/* Initial / Supplied Stock */}
                      <td className="py-3.5 px-3 text-center bg-blue-50/30 dark:bg-blue-950/10 font-black text-blue-700 dark:text-blue-300 tabular-numbers">
                        {formatNumber(item.initialStock)} <span className="text-[10px] text-slate-400 font-normal">عبوة</span>
                      </td>

                      {/* Sold Qty */}
                      <td className="py-3.5 px-3 text-center bg-emerald-50/30 dark:bg-emerald-950/10 font-black text-emerald-700 dark:text-emerald-400 tabular-numbers">
                        {formatNumber(item.soldQuantity)} <span className="text-[10px] text-slate-400 font-normal">عبوة</span>
                      </td>

                      {/* Remaining Stock with Mini Progress Bar */}
                      <td className="py-3.5 px-4 text-center bg-purple-50/30 dark:bg-purple-950/10">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`font-black text-sm tabular-numbers ${
                              item.remainingStock <= 0
                                ? 'text-rose-600 dark:text-rose-400 font-black'
                                : item.remainingStock <= 10
                                ? 'text-amber-600 dark:text-amber-400 font-black'
                                : 'text-purple-700 dark:text-purple-300'
                            }`}
                          >
                            {formatNumber(item.remainingStock)} عبوة
                          </span>
                          {/* Progress bar */}
                          <div className="w-20 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1" title={`تم بيع ${percentSold.toFixed(0)}% من مخزون هذا الصنف`}>
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                item.remainingStock <= 0
                                  ? 'bg-rose-600'
                                  : item.remainingStock <= 10
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.max(5, 100 - percentSold)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-3 text-center">
                        {item.remainingStock <= 0 ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse">
                            نفد من المخزن
                          </span>
                        ) : item.status === 'low_stock' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            مخزون منخفض ⚠️
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            متوفر بالمستودع ✓
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Quick +10 */}
                          <button
                            type="button"
                            onClick={() => handleQuickAddStock(item.id, 10)}
                            className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-md font-bold text-[11px] transition-colors cursor-pointer"
                            title="إضافة 10 عبوات للمخزن فوراً"
                          >
                            +10
                          </button>
                          {/* Quick +50 */}
                          <button
                            type="button"
                            onClick={() => handleQuickAddStock(item.id, 50)}
                            className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-md font-bold text-[11px] transition-colors cursor-pointer"
                            title="إضافة 50 عبوة للمخزن فوراً"
                          >
                            +50
                          </button>
                          {/* Edit / Set stock modal */}
                          <button
                            type="button"
                            onClick={() => {
                              const found = catalog.find((c) => c.id === item.id);
                              if (found) handleOpenStockModal(found, 'set');
                            }}
                            className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-md font-bold text-[11px] transition-colors cursor-pointer"
                            title="تعديل رصيد الصنف يدوياً أو إضافة توريد جديد"
                          >
                            تعديل ⚙️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {selectedProductForStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border-2 border-blue-200 dark:border-slate-700 overflow-hidden text-slate-900 dark:text-slate-100">
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-blue-50 to-white dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-white">
                  إدارة رصيد المستودع: {selectedProductForStock.productName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                  {selectedProductForStock.genericName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProductForStock(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Mode Toggle */}
              <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 gap-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setModalMode('add')}
                  className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                    modalMode === 'add'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  ➕ إضافة توريد / شحنة جديدة
                </button>
                <button
                  type="button"
                  onClick={() => setModalMode('set')}
                  className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                    modalMode === 'set'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  ✏️ ضبط الرصيد الإجمالي
                </button>
              </div>

              {/* Current Status Info */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-bold">
                <span className="text-slate-600 dark:text-slate-400">الرصيد الكلي الحالي:</span>
                <span className="font-black text-blue-600 dark:text-blue-400">
                  {selectedProductForStock.warehouseStock ?? 100} عبوة
                </span>
              </div>

              {modalMode === 'add' ? (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    الكمية المراد إضافتها إلى المستودع (عبوة):
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={addQtyAmount}
                    onChange={(e) => setAddQtyAmount(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-black text-sm text-center"
                  />
                  {/* Preset Buttons */}
                  <div className="flex items-center justify-center gap-2">
                    {[10, 25, 50, 100, 200].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAddQtyAmount(preset)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
                          addQtyAmount === preset
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        +{preset}
                      </button>
                    ))}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium text-center">
                    سيصبح إجمالي المستودع بعد الإضافة: <strong>{(selectedProductForStock.warehouseStock ?? 100) + Number(addQtyAmount)}</strong> عبوة
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    تعديل الرصيد الكلي بالمخزن مباشرة إلى:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newExactStock}
                    onChange={(e) => setNewExactStock(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-black text-sm text-center"
                  />
                  {/* Presets */}
                  <div className="flex items-center justify-center gap-2">
                    {[0, 50, 100, 200, 500, 1000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setNewExactStock(preset)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
                          newExactStock === preset
                            ? 'bg-blue-600 text-white border-blue-600'
                            : preset === 0
                            ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {preset === 0 ? 'تصفير (0)' : preset}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedProductForStock(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveModalStock}
                className="btn-realistic-primary px-5 py-2 rounded-xl text-white text-xs font-black shadow-xs cursor-pointer"
              >
                حفظ التعديل في المخزن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Warehouse Stock Confirmation Modal */}
      {showClearAllStockModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border-2 border-rose-500 overflow-hidden text-slate-900 dark:text-slate-100">
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center text-2xl shrink-0 font-black shadow-xs">
                  ⚠️
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-rose-700 dark:text-rose-400">
                    تأكيد تصفير وحذف كافة كميات المخزن
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    إجراء شامل لإعادة ضبط رصيد المستودع
                  </p>
                </div>
              </div>

              <div className="bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-xl p-3.5 text-xs text-rose-900 dark:text-rose-200 leading-relaxed font-semibold">
                هل أنت متأكد من رغبتك في حذف وتصفير جميع كميات الأصناف الحالية في المخزن؟
                <div className="mt-2 text-slate-700 dark:text-slate-300 font-normal">
                  • سيتم تعيين رصيد المستودع لجميع الأصناف الـ (<strong>{catalog.length}</strong> صنف) إلى <strong>0 عبوة</strong>.
                  <br />
                  • لن يتم حذف بيانات الأسعار أو الفواتير التاريخية.
                  <br />
                  • يمكنك إضافة وتوريد كميات جديدة في أي وقت لاحقاً.
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowClearAllStockModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  إلغاء وتراجع
                </button>
                <button
                  type="button"
                  onClick={handleClearAllStock}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-md active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <span>🗑️</span>
                  <span>نعم، حذف وتصفير كافة الكميات (0)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warehouse CSV Export Customization Modal */}
      <WarehouseCsvExportModal
        isOpen={isWarehouseCsvModalOpen}
        onClose={() => setIsWarehouseCsvModalOpen(false)}
        warehouseItems={warehouseItems}
        currency={currency}
        onSuccess={(msg) => showToast(msg)}
      />
    </div>
  );
};
