import React, { useState } from 'react';
import { CurrencyCode, ProductItem, SalesRecord } from '../types';
import { DEFAULT_SALES_REP } from '../data/productCatalog';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { saveInvoiceToOfflineVault } from '../utils/pdfHelper';

export interface InvoiceItemEntry {
  id: string;
  productId: string;
  itemName: string;
  genericName: string;
  category: string;
  quantity: number;
  unitPrice: number;
}

interface AddSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (records: Omit<SalesRecord, 'id'>[]) => void;
  catalog: ProductItem[];
  existingCustomers: string[];
  existingCategories: string[];
  currency?: CurrencyCode;
  activeSalesRep?: string;
  salesData?: SalesRecord[];
}

const CUSTOMER_SEGMENTS = [
  'صيدليات مجتمعية',
  'سلاسل صيدليات',
  'مستشفيات',
  'مراكز طبية',
  'عيادات خاصة',
  'شركات وموزعين',
] as const;

export const AddSaleModal: React.FC<AddSaleModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  catalog,
  existingCustomers,
  currency = 'SDG',
  activeSalesRep,
  salesData = [],
}) => {
  const today = new Date().toISOString().split('T')[0];

  const firstProduct = catalog[0] || {
    id: 'p1',
    productName: 'Acretin 0.05 cream',
    genericName: 'Tretinoin 0.05%',
    category: 'الجلدية والتجميل',
    currentPrice: 11981,
    defaultPrice: 11981,
  };

  const createDefaultItem = (index = 0): InvoiceItemEntry => {
    const prod = catalog[index % catalog.length] || firstProduct;
    return {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      productId: prod.id,
      itemName: prod.productName,
      genericName: prod.genericName,
      category: prod.category,
      quantity: 10,
      unitPrice: prod.currentPrice,
    };
  };

  const [orderId, setOrderId] = useState(() => `INV-${Date.now().toString().slice(-5)}`);
  const [date, setDate] = useState(today);
  const [customerName, setCustomerName] = useState('');
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const customerInputRef = React.useRef<HTMLInputElement>(null);
  const [customerSegment, setCustomerSegment] = useState<string>('صيدليات مجتمعية');
  const [salesRep, setSalesRep] = useState(activeSalesRep || DEFAULT_SALES_REP);
  const [paymentType, setPaymentType] = useState<string>('نقدي / تسليم فوري');
  const [customPayment, setCustomPayment] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Filtered customer suggestions
  const customerSuggestions = React.useMemo(() => {
    if (!existingCustomers || existingCustomers.length === 0) return [];
    const query = customerName.trim().toLowerCase();
    if (!query) return existingCustomers.slice(0, 12);
    return existingCustomers
      .filter((c) => c.toLowerCase().includes(query))
      .slice(0, 12);
  }, [existingCustomers, customerName]);

  // Synchronize default sales rep when opening or switching rep
  React.useEffect(() => {
    if (activeSalesRep) {
      setSalesRep(activeSalesRep);
    }
  }, [activeSalesRep, isOpen]);

  // Multi-item state
  const [items, setItems] = useState<InvoiceItemEntry[]>([createDefaultItem(0)]);

  // Active search row id: which row is currently searching for a product
  const [activeSearchRowId, setActiveSearchRowId] = useState<string | null>(null);
  const [rowSearchQuery, setRowSearchQuery] = useState('');
  const [rowShowAll, setRowShowAll] = useState(false);

  // Quick-add search bar state
  const [quickSearchQuery, setQuickSearchQuery] = useState('');
  const [quickSearchShowAll, setQuickSearchShowAll] = useState(false);

  // Pre-calculate sold quantities from existing invoices
  const soldQuantityMap = React.useMemo(() => {
    const map = new Map<string, number>();
    salesData.forEach((rec) => {
      const key = (rec.itemName || '').trim().toLowerCase();
      map.set(key, (map.get(key) || 0) + (rec.quantity || 0));
    });
    return map;
  }, [salesData]);

  const getItemStockInfo = (prodId: string, itemName: string) => {
    const prod = catalog.find((p) => p.id === prodId || p.productName.toLowerCase() === itemName.trim().toLowerCase());
    const totalStock = prod?.warehouseStock ?? 100;
    const sold = soldQuantityMap.get(itemName.trim().toLowerCase()) || 0;
    const remaining = totalStock - sold;
    return { totalStock, sold, remaining };
  };

  if (!isOpen) return null;

  // Search filter helper: only returns products if query is typed OR if user explicitly clicked "عرض كل الأصناف"
  const filterProductsForSearch = (query: string, allowAll: boolean) => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return allowAll ? catalog : [];
    }
    return catalog.filter((p) => {
      const name = (p.productName || '').toLowerCase();
      const generic = (p.genericName || '').toLowerCase();
      const cat = (p.category || '').toLowerCase();
      return name.includes(q) || generic.includes(q) || cat.includes(q);
    });
  };

  // Handle adding a new item line (auto opens search for this new item so user doesn't scroll)
  const handleAddItem = (autoOpenSearch = true) => {
    const existingProductIds = new Set(items.map((it) => it.productId));
    const nextProduct = catalog.find((p) => !existingProductIds.has(p.id)) || catalog[0] || firstProduct;
    const newItemId = `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    setItems((prev) => [
      ...prev,
      {
        id: newItemId,
        productId: nextProduct.id,
        itemName: nextProduct.productName,
        genericName: nextProduct.genericName,
        category: nextProduct.category,
        quantity: 10,
        unitPrice: nextProduct.currentPrice,
      },
    ]);

    if (autoOpenSearch) {
      setActiveSearchRowId(newItemId);
      setRowSearchQuery('');
      setRowShowAll(false);
    }
  };

  // Quick add product directly from search
  const handleQuickAddProduct = (prod: ProductItem) => {
    const newItemId = `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setItems((prev) => [
      ...prev,
      {
        id: newItemId,
        productId: prod.id,
        itemName: prod.productName,
        genericName: prod.genericName,
        category: prod.category,
        quantity: 10,
        unitPrice: prod.currentPrice,
      },
    ]);
    setQuickSearchQuery('');
    setQuickSearchShowAll(false);
  };

  // Handle selecting a product from search for an existing row
  const handleSelectProduct = (itemId: string, prod: ProductItem) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === itemId) {
          return {
            ...it,
            productId: prod.id,
            itemName: prod.productName,
            genericName: prod.genericName,
            category: prod.category,
            unitPrice: prod.currentPrice,
          };
        }
        return it;
      })
    );
    setActiveSearchRowId(null);
    setRowSearchQuery('');
    setRowShowAll(false);
  };

  // Handle removing an item line
  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Handle product selection change
  const handleProductChange = (itemId: string, selectedProdId: string) => {
    const prod = catalog.find((p) => p.id === selectedProdId);
    if (!prod) return;

    setItems((prev) =>
      prev.map((it) => {
        if (it.id === itemId) {
          return {
            ...it,
            productId: prod.id,
            itemName: prod.productName,
            genericName: prod.genericName,
            category: prod.category,
            unitPrice: prod.currentPrice,
          };
        }
        return it;
      })
    );
  };

  // Handle quantity change
  const handleQuantityChange = (itemId: string, newQty: number) => {
    const validQty = Math.max(1, isNaN(newQty) ? 1 : newQty);
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, quantity: validQty } : it))
    );
  };

  // Handle unit price change
  const handleUnitPriceChange = (itemId: string, newPrice: number) => {
    const validPrice = Math.max(0, isNaN(newPrice) ? 0 : newPrice);
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, unitPrice: validPrice } : it))
    );
  };

  // Summary calculations
  const totalUnits = items.reduce((sum, it) => sum + (it.quantity || 0), 0);
  const grandTotal = items.reduce((sum, it) => sum + (it.quantity * it.unitPrice || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setError('يرجى إدخال اسم العميل أو الصيدلية');
      return;
    }

    if (items.length === 0) {
      setError('يجب إضافة صنف واحد على الأقل في الفاتورة');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.itemName.trim()) {
        setError(`يرجى تحديد الصنف رقم ${i + 1}`);
        return;
      }
      if (it.quantity <= 0) {
        setError(`الكمية للصنف (${it.itemName}) يجب أن تكون أكبر من صفر`);
        return;
      }
      if (it.unitPrice < 0) {
        setError(`سعر الصنف (${it.itemName}) لا يمكن أن يكون سالباً`);
        return;
      }
    }

    const finalOrderId = orderId.trim() || `INV-${Date.now().toString().slice(-5)}`;
    const finalPaymentType =
      paymentType === 'custom'
        ? (customPayment.trim() || 'نقدي')
        : paymentType === 'none'
        ? 'hidden'
        : paymentType;

    // Prepare SalesRecord entries for all items sharing this orderId
    const recordsToAdd: Omit<SalesRecord, 'id'>[] = items.map((it) => ({
      orderId: finalOrderId,
      date,
      customerName: customerName.trim(),
      customerSegment: customerSegment as any,
      itemName: it.itemName.trim(),
      genericName: it.genericName.trim(),
      category: it.category.trim() || 'عام',
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      totalSales: it.quantity * it.unitPrice,
      salesRep: salesRep.trim() || DEFAULT_SALES_REP,
      paymentType: finalPaymentType,
      notes: notes.trim(),
    }));

    // Auto save to offline vault
    saveInvoiceToOfflineVault({
      id: `offline-${finalOrderId}-${Date.now()}`,
      orderId: finalOrderId,
      customerName: customerName.trim(),
      date,
      salesRep: salesRep.trim() || DEFAULT_SALES_REP,
      paymentType: finalPaymentType,
      items: items.map((it) => ({
        itemName: it.itemName,
        genericName: it.genericName,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        totalSales: it.quantity * it.unitPrice,
      })),
      totalQuantity: totalUnits,
      totalAmount: grandTotal,
      currency,
      savedAt: new Date().toISOString(),
      format: 'a4',
    });

    onAdd(recordsToAdd);
    onClose();

    // Reset for next invoice
    setOrderId(`INV-${Date.now().toString().slice(-5)}`);
    setCustomerName('');
    setNotes('');
    setItems([createDefaultItem(0)]);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl border-2 border-blue-200 dark:border-slate-700 overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Android Drag Indicator Pill */}
        <div className="w-12 h-1.5 bg-slate-400 dark:bg-slate-600 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-blue-50 via-sky-50 to-white dark:from-slate-800 dark:via-slate-850 dark:to-slate-900 border-b-2 border-blue-200 dark:border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-lg font-bold shadow-sm">
              🧾
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  إنشاء فاتورة مبيعات جديدة (New Sales Invoice)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white shadow-2xs">
                  {items.length} {items.length === 1 ? 'صنف' : 'أصناف'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold mt-0.5">
                يمكنك إضافة أي عدد ترغب به من الأصناف الدوائية في الفاتورة الواحدة
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-base cursor-pointer transition-colors"
            aria-label="إغلاق النافذة"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/70 border-2 border-rose-400 dark:border-rose-800 rounded-xl text-xs sm:text-sm text-rose-800 dark:text-rose-200 font-bold flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Customer & Invoice Details */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-300 pb-2 border-b border-slate-200 dark:border-slate-700">
              <span>📋 بيانات العميل والفاتورة</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Order ID */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  رقم الفاتورة (Invoice #) *
                </label>
                <input
                  type="text"
                  required
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="w-full text-xs font-bold font-mono bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  تاريخ الفاتورة (Date) *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs font-bold bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Customer Name - Completely unblocked typing + custom suggestion dropdown */}
              <div className="sm:col-span-2 relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    اسم العميل أو الصيدلية (Customer Name) *
                  </label>
                  {existingCustomers.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowCustomerSuggestions((v) => !v)}
                      className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>🏥 الصيدليات السابقة ({existingCustomers.length})</span>
                    </button>
                  )}
                </div>

                <div className="relative">
                  <input
                    ref={customerInputRef}
                    type="text"
                    required
                    autoComplete="off"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      if (!showCustomerSuggestions && existingCustomers.length > 0) {
                        setShowCustomerSuggestions(true);
                      }
                      if (error) setError('');
                    }}
                    onFocus={() => {
                      if (existingCustomers.length > 0) {
                        setShowCustomerSuggestions(true);
                      }
                    }}
                    placeholder="اكتب اسم الصيدلية أو المستشفى بحرية تامة..."
                    className="w-full text-xs sm:text-sm font-bold bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 pl-8 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-600"
                  />
                  {customerName && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerName('');
                        setShowCustomerSuggestions(true);
                        customerInputRef.current?.focus();
                      }}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold p-1 cursor-pointer"
                      title="مسح اسم الصيدلية"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Floating Suggestions Dropdown */}
                {showCustomerSuggestions && existingCustomers.length > 0 && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setShowCustomerSuggestions(false)}
                    />
                    <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white dark:bg-slate-800 border-2 border-blue-400 dark:border-blue-600 rounded-xl shadow-xl max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700 animate-in fade-in duration-100">
                      <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900/80 text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                        <span>اختر من الصيدليات السابقة أو واصل الكتابة:</span>
                        <button
                          type="button"
                          onClick={() => setShowCustomerSuggestions(false)}
                          className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                        >
                          إغلاق ✕
                        </button>
                      </div>
                      {customerSuggestions.length > 0 ? (
                        customerSuggestions.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => {
                              setCustomerName(c);
                              setShowCustomerSuggestions(false);
                            }}
                            className="w-full text-right px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 hover:bg-blue-50 dark:hover:bg-slate-700/80 transition-colors flex items-center justify-between cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5">
                              <span>🏥</span>
                              <span>{c}</span>
                            </span>
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">اختيار</span>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                          لا توجد صيدلية سابقة بهذا الاسم — كتابة "{customerName}" كصيدلية جديدة.
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Customer Segment */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  تصنيف العميل (Customer Segment)
                </label>
                <select
                  value={customerSegment}
                  onChange={(e) => setCustomerSegment(e.target.value)}
                  className="w-full text-xs font-bold bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 cursor-pointer"
                >
                  {CUSTOMER_SEGMENTS.map((seg) => (
                    <option key={seg} value={seg} className="dark:bg-slate-900 text-slate-900 dark:text-white">
                      {seg}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sales Rep */}
              <div className="sm:col-span-1">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  مندوب المبيعات (Medical Rep) *
                </label>
                <input
                  type="text"
                  required
                  value={salesRep}
                  onChange={(e) => setSalesRep(e.target.value)}
                  className="w-full text-xs font-bold bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-blue-900 dark:text-blue-300 focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Payment Terms (نقدي / آجل / كاش / إلخ) */}
              <div className="sm:col-span-1">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  طريقة وشروط السداد
                </label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="w-full text-xs font-bold bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 cursor-pointer"
                >
                  <option value="نقدي / تسليم فوري">💵 نقدي / تسليم فوري</option>
                  <option value="آجل">⏳ بيع آجل (Credit)</option>
                  <option value="كاش">💰 كاش (Cash)</option>
                  <option value="تحويل بنكي">🏦 تحويل بنكي</option>
                  <option value="شيك مصرفي">📝 شيك مصرفي</option>
                  <option value="none">🗑️ بدون / إخفاء من الفاتورة</option>
                  <option value="custom">✏️ نص مخصص...</option>
                </select>
                {paymentType === 'custom' && (
                  <input
                    type="text"
                    value={customPayment}
                    onChange={(e) => setCustomPayment(e.target.value)}
                    placeholder="اكتب شرط السداد المخصص..."
                    className="w-full mt-1.5 text-xs font-bold bg-white dark:bg-slate-900 border border-amber-400 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-none"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Multiple Items in this Invoice with Search-Only Selection */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-1 gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  💊 الأصناف والكميات في هذه الفاتورة ({items.length} صنف)
                </span>
                <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full">
                  إجمالي العبوات: {formatNumber(totalUnits)} عبوة
                </span>
              </div>

              {/* Add Item Button */}
              <button
                type="button"
                onClick={() => handleAddItem(true)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all self-start sm:self-auto"
              >
                <span>➕</span>
                <span>إضافة صنف آخر للفاتورة</span>
              </button>
            </div>

            {/* Quick-Search Direct Add Bar */}
            <div className="p-3 bg-blue-50/80 dark:bg-slate-800/80 rounded-xl border-2 border-blue-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                  <span>⚡</span>
                  <span>بحث سريع لإضافة صنف مباشر للفاتورة (دون الحاجة لتصفح كل الأصناف):</span>
                </label>
                {!quickSearchShowAll ? (
                  <button
                    type="button"
                    onClick={() => setQuickSearchShowAll(true)}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    📋 عرض كافة الأصناف ({catalog.length})
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setQuickSearchShowAll(false)}
                    className="text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 cursor-pointer"
                  >
                    إخفاء القائمة الكاملة ✕
                  </button>
                )}
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={quickSearchQuery}
                  onChange={(e) => setQuickSearchQuery(e.target.value)}
                  placeholder="🔍 اكتب اسم الصنف الدوائي أو التركيبة للبحث الفوري (مثال: Acretin أو Panadol أو قطرة)..."
                  className="w-full text-xs sm:text-sm font-bold bg-white dark:bg-slate-900 border-2 border-blue-300 dark:border-blue-600 rounded-lg px-3 py-2 pl-8 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-600 shadow-2xs"
                />
                {quickSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setQuickSearchQuery('')}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold p-1 cursor-pointer"
                    title="مسح البحث"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Quick Search Results - Only shows if query is typed or if showAll is true */}
              {(quickSearchQuery.trim().length > 0 || quickSearchShowAll) && (
                <div className="bg-white dark:bg-slate-900 rounded-lg border-2 border-blue-400 dark:border-blue-600 shadow-lg max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in duration-100">
                  {(() => {
                    const results = filterProductsForSearch(quickSearchQuery, quickSearchShowAll);
                    if (results.length === 0) {
                      return (
                        <div className="p-3 text-center text-xs text-slate-500 dark:text-slate-400">
                          لا يوجد صنف يطابق "{quickSearchQuery}".
                        </div>
                      );
                    }
                    return results.slice(0, quickSearchShowAll ? 150 : 20).map((prod) => {
                      const pSold = soldQuantityMap.get(prod.productName.trim().toLowerCase()) || 0;
                      const pRemain = (prod.warehouseStock ?? 100) - pSold;
                      return (
                        <div
                          key={prod.id}
                          className="p-2.5 hover:bg-blue-50 dark:hover:bg-slate-800/80 flex items-center justify-between gap-2 text-xs transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-slate-900 dark:text-white truncate">
                              {prod.productName}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                              {prod.genericName && <span>{prod.genericName}</span>}
                              <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded text-[10px]">
                                {prod.category}
                              </span>
                              <span className={pRemain <= 0 ? 'text-rose-600 font-bold' : 'text-emerald-600'}>
                                متبقي: {pRemain} عبوة
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                              {formatNumber(prod.currentPrice)} {currency}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQuickAddProduct(prod)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md text-xs cursor-pointer active:scale-95 transition-all shadow-2xs"
                            >
                              + إضافة للفاتورة
                            </button>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>

            {/* List of item rows */}
            <div className="space-y-3">
              {items.map((item, index) => {
                const itemTotal = item.quantity * item.unitPrice;
                const { totalStock, sold, remaining } = getItemStockInfo(item.productId, item.itemName);
                const isOutOfStock = remaining <= 0;
                const isLowStock = remaining > 0 && remaining <= 10;
                const isOverRequested = item.quantity > remaining && remaining > 0;
                const isRowSearching = activeSearchRowId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-800/90 border-2 shadow-2xs transition-colors space-y-3 ${
                      isOutOfStock
                        ? 'border-rose-300 dark:border-rose-800 bg-rose-50/20 dark:bg-rose-950/20'
                        : isOverRequested
                        ? 'border-amber-300 dark:border-amber-700 bg-amber-50/20 dark:bg-amber-950/20'
                        : 'border-blue-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                          الصنف {index + 1}
                        </span>
                        {item.genericName && (
                          <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                            {item.genericName}
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                          {item.category}
                        </span>

                        {/* Real-time warehouse remaining indicator */}
                        <span
                          className={`text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                            isOutOfStock
                              ? 'bg-rose-100 dark:bg-rose-950/90 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                              : isLowStock
                              ? 'bg-amber-100 dark:bg-amber-950/90 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                              : 'bg-emerald-100 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                          }`}
                          title={`المخزون الإجمالي: ${totalStock} | المباع: ${sold} | المتبقي: ${remaining}`}
                        >
                          <span>{isOutOfStock ? '❌' : isLowStock ? '⚠️' : '📦'}</span>
                          <span>المتبقي بالمخزن: {remaining} عبوة</span>
                        </span>
                      </div>

                      {/* Delete button (only if more than 1 item) */}
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="px-2.5 py-1 text-[11px] font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-md border border-rose-300 dark:border-rose-800 cursor-pointer transition-colors flex items-center gap-1"
                          title="حذف هذا الصنف من الفاتورة"
                        >
                          <span>🗑️</span>
                          <span>حذف الصنف</span>
                        </button>
                      )}
                    </div>

                    {/* Interactive Product Search Selector Panel */}
                    {isRowSearching ? (
                      <div className="p-3 bg-blue-50/90 dark:bg-slate-900/90 rounded-xl border-2 border-blue-500 dark:border-blue-500 space-y-2.5 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                              🔍
                            </span>
                            <span className="text-xs font-bold text-blue-900 dark:text-blue-200">
                              البحث عن الصنف الدوائي بالاسم أو التركيبة:
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSearchRowId(null);
                              setRowSearchQuery('');
                              setRowShowAll(false);
                            }}
                            className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white px-2 py-0.5 rounded cursor-pointer"
                          >
                            ✕ إلغاء
                          </button>
                        </div>

                        {/* Search Input Bar */}
                        <div className="relative">
                          <input
                            type="text"
                            autoFocus
                            value={rowSearchQuery}
                            onChange={(e) => setRowSearchQuery(e.target.value)}
                            placeholder="اكتب اسم الدواء أو التركيبة (مثال: Acretin, Panadol, Omeprazole)..."
                            className="w-full text-xs sm:text-sm font-bold bg-white dark:bg-slate-800 border-2 border-blue-400 dark:border-blue-500 rounded-lg px-3 py-2 pl-8 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          {rowSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setRowSearchQuery('')}
                              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold p-1 cursor-pointer"
                              title="مسح البحث"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {/* Search guidance and 'Show all items' button */}
                        {!rowSearchQuery.trim() && !rowShowAll ? (
                          <div className="p-3 bg-white/80 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 text-center space-y-2">
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                              💡 اكتب حرفين أو أكثر للبحث الفوري دون الحاجة للمرور بكل الأصناف.
                            </p>
                            <button
                              type="button"
                              onClick={() => setRowShowAll(true)}
                              className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/60 hover:bg-blue-200 text-blue-800 dark:text-blue-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                            >
                              📋 عرض كافة الأصناف ({catalog.length} صنف)
                            </button>
                          </div>
                        ) : (
                          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700 shadow-sm">
                            <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                              <span>نتائج البحث المباشر:</span>
                              {rowShowAll && (
                                <button
                                  type="button"
                                  onClick={() => setRowShowAll(false)}
                                  className="text-blue-600 dark:text-blue-400 cursor-pointer"
                                >
                                  إخفاء القائمة ✕
                                </button>
                              )}
                            </div>
                            {(() => {
                              const matches = filterProductsForSearch(rowSearchQuery, rowShowAll);
                              if (matches.length === 0) {
                                return (
                                  <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                                    لا يوجد صنف يطابق "{rowSearchQuery}". جرب البحث باسم التركيبة أو جزء من الاسم.
                                  </div>
                                );
                              }
                              return matches.slice(0, rowShowAll ? 150 : 25).map((p) => {
                                const pSold = soldQuantityMap.get(p.productName.trim().toLowerCase()) || 0;
                                const pRemain = (p.warehouseStock ?? 100) - pSold;
                                return (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => handleSelectProduct(item.id, p)}
                                    className="w-full text-right p-2.5 hover:bg-blue-50 dark:hover:bg-slate-700/80 transition-colors flex items-center justify-between gap-2 cursor-pointer"
                                  >
                                    <div className="min-w-0">
                                      <div className="font-bold text-xs text-slate-900 dark:text-white">
                                        {p.productName}
                                      </div>
                                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                                        {p.genericName && <span>{p.genericName}</span>}
                                        <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.2 rounded text-[10px]">
                                          {p.category}
                                        </span>
                                        <span className={pRemain <= 0 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                                          متبقي: {pRemain} عبوة
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                                        {formatNumber(p.currentPrice)} {currency}
                                      </span>
                                      <span className="px-2.5 py-1 bg-blue-600 text-white rounded text-[11px] font-bold">
                                        اختيار ✓
                                      </span>
                                    </div>
                                  </button>
                                );
                              });
                            })()}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Display Selected Medicine with Search Button */
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                        {/* Selected Product Card + Search Button */}
                        <div className="sm:col-span-6">
                          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center justify-between">
                            <span>الصنف الدوائي المحدد *</span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              (استخدم زر البحث للتغيير)
                            </span>
                          </label>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-50 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                              {item.itemName}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveSearchRowId(item.id);
                                setRowSearchQuery('');
                                setRowShowAll(false);
                              }}
                              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0 transition-transform active:scale-95"
                              title="اضغط للبحث عن صنف آخر بالاسم"
                            >
                              <span>🔍</span>
                              <span>زر البحث</span>
                            </button>
                          </div>
                        </div>

                        {/* Quantity */}
                        <div className="sm:col-span-3">
                          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                            الكمية بالعبوة (Quantity) *
                          </label>
                          <div className="flex items-center">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              className="w-8 h-9 rounded-r-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-bold flex items-center justify-center cursor-pointer border-y-2 border-r-2 border-slate-300 dark:border-slate-600"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              required
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value))}
                              className="w-full text-center text-xs sm:text-sm font-black font-mono bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 tabular-numbers"
                            />
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              className="w-8 h-9 rounded-l-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-bold flex items-center justify-center cursor-pointer border-y-2 border-l-2 border-slate-300 dark:border-slate-600"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Unit Price (Locked to Manager Price List) */}
                        <div className="sm:col-span-3">
                          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center justify-between">
                            <span>سعر العبوة ({currency}) *</span>
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">🔒 معتمد</span>
                          </label>
                          <input
                            type="number"
                            readOnly
                            required
                            value={item.unitPrice}
                            title="السعر معتمد من قائمة أسعار المدير (تغيير الأسعار مقتصر على المدير فقط)"
                            className="w-full text-left text-xs sm:text-sm font-black font-mono bg-slate-100 dark:bg-slate-800/80 border-2 border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 cursor-not-allowed tabular-numbers"
                          />
                        </div>
                      </div>
                    )}

                    {/* Stock Alert Warning if order quantity exceeds warehouse remaining */}
                    {isOverRequested && (
                      <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-[11px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                        <span>⚠️</span>
                        <span>
                          تنبيه: الكمية المطلوبة ({item.quantity} عبوة) تفوق المتبقي بالمستودع ({remaining} عبوة). سيصبح رصيد المخزن سالباً إذا تم التأكيد.
                        </span>
                      </div>
                    )}

                    {isOutOfStock && (
                      <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-[11px] font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                        <span>❌</span>
                        <span>
                          هذا الصنف نفذ بالكامل من المستودع (المتبقي: {remaining} عبوة). يرجى تعزيز رصيد المخزن من قسم المستودع.
                        </span>
                      </div>
                    )}

                    {/* Line item subtotal badge */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700/80 text-xs">
                      <span className="text-slate-600 dark:text-slate-300 font-semibold">
                        حساب الصنف: {item.quantity} عبوة × {formatNumber(item.unitPrice)}
                      </span>
                      <span className="font-black text-blue-700 dark:text-blue-300 text-sm tabular-numbers">
                        {formatCurrency(itemTotal, currency)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Add Button below items list */}
            <button
              type="button"
              onClick={() => handleAddItem(true)}
              className="w-full py-2.5 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-800 hover:border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-bold text-xs sm:text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <span>➕</span>
              <span>إضافة صنف دوائي آخر إلى هذه الفاتورة</span>
            </button>
          </div>

          {/* Section 3: Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              ملاحظات أو شروط الطلبية (اختياري)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: تسليم خلال 24 ساعة، دفعة نقدية، مستعجل..."
              className="w-full text-xs font-medium bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* Section 4: Live Calculated Invoice Grand Total Banner */}
          <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-blue-100 flex items-center gap-2">
                <span>الإجمالي الكلي للفاتورة (Grand Total)</span>
                <span className="px-2 py-0.2 bg-white/20 rounded text-[11px]">
                  {items.length} صنف · {formatNumber(totalUnits)} عبوة
                </span>
              </div>
              <div className="text-xs text-blue-200 mt-0.5">
                جاهزة للحفظ والإصدار والطباعة بتنسيق PDF أو إيصال حراري
              </div>
            </div>

            <div className="text-2xl sm:text-3xl font-black tabular-numbers text-right sm:text-left">
              {formatCurrency(grandTotal, currency)}
            </div>
          </div>

          {/* Section 5: Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer border border-slate-300 dark:border-slate-600"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="btn-realistic-primary px-7 py-2.5 text-xs sm:text-sm font-black text-white rounded-xl shadow-md transition-transform cursor-pointer flex items-center gap-2"
            >
              <span>✓</span>
              <span>حفظ الفاتورة ({items.length} صنف)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
