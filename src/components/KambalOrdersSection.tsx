import React, { useState, useMemo, useRef } from 'react';
import { CurrencyCode, ProductItem, SalesRecord } from '../types';
import { KAMBAL_CATALOG, KAMBAL_COMPANIES, KambalProductItem } from '../data/kambalCatalog';
import { DEFAULT_SALES_REP } from '../data/productCatalog';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { saveInvoiceToOfflineVault } from '../utils/pdfHelper';

interface KambalOrderItem {
  id: string;
  productId: string;
  productName: string;
  genericName: string;
  category: string;
  company: string;
  companyAr: string;
  quantity: number;
  unitPrice: number;
}

interface KambalOrdersSectionProps {
  salesData: SalesRecord[];
  onAddSalesRecords: (records: Omit<SalesRecord, 'id'>[]) => void;
  existingCustomers: string[];
  activeSalesRep: string;
  currency: CurrencyCode;
  onOpenInvoiceModalWithRecord?: (record: SalesRecord) => void;
}

export const KambalOrdersSection: React.FC<KambalOrdersSectionProps> = ({
  salesData,
  onAddSalesRecords,
  existingCustomers,
  activeSalesRep,
  currency,
  onOpenInvoiceModalWithRecord,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Active view: 'newOrder' | 'catalog' | 'history'
  const [activeSubTab, setActiveSubTab] = useState<'newOrder' | 'catalog' | 'history'>('newOrder');

  // Form State
  const [orderId, setOrderId] = useState(() => `KMB-${Date.now().toString().slice(-5)}`);
  const [date, setDate] = useState(todayStr);
  const [customerName, setCustomerName] = useState('');
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const customerInputRef = useRef<HTMLInputElement>(null);
  const [customerSegment, setCustomerSegment] = useState('صيدليات مجتمعية');
  const [salesRep, setSalesRep] = useState(activeSalesRep || DEFAULT_SALES_REP);
  const [paymentType, setPaymentType] = useState('نقدي / تسليم فوري');
  const [notes, setNotes] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Search-Only Item Selector State ("ويمكن اختيار الصنف باستعمال البحث فقط")
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Selected items in current Kambal order
  const [orderItems, setOrderItems] = useState<KambalOrderItem[]>([]);

  // Filtered customer suggestions
  const customerSuggestions = useMemo(() => {
    if (!existingCustomers || existingCustomers.length === 0) return [];
    const query = customerName.trim().toLowerCase();
    if (!query) return existingCustomers.slice(0, 10);
    return existingCustomers
      .filter((c) => c.toLowerCase().includes(query))
      .slice(0, 10);
  }, [existingCustomers, customerName]);

  // Live search results strictly matching query across Kambal 125 items
  const searchResults = useMemo(() => {
    let list = KAMBAL_CATALOG;
    if (selectedCompanyFilter !== 'all') {
      if (selectedCompanyFilter === 'eipico') list = list.filter((p) => p.company === 'Eipico Egypt');
      else if (selectedCompanyFilter === 'jamjoom') list = list.filter((p) => p.company === 'Jamjoom Pharma Saudi Arabia');
      else if (selectedCompanyFilter === 'dar_aldawa') list = list.filter((p) => p.company === 'Dar ALdawa Jordan');
      else if (selectedCompanyFilter === 'intas') list = list.filter((p) => p.company === 'Intas Pharma INDIA');
      else if (selectedCompanyFilter === 'pharco') list = list.filter((p) => p.company === 'Pharco Pharmaceuticals');
      else if (selectedCompanyFilter === 'julphar') list = list.filter((p) => p.company === 'Julphar UAE');
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      // If no query typed, show empty or top list when in catalog mode
      return activeSubTab === 'catalog' ? list : [];
    }

    return list.filter((p) => {
      return (
        p.productName.toLowerCase().includes(q) ||
        p.genericName.toLowerCase().includes(q) ||
        p.company.toLowerCase().includes(q) ||
        p.companyAr.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedCompanyFilter, activeSubTab]);

  // Add medicine to order
  const handleAddItemToOrder = (prod: KambalProductItem) => {
    setOrderItems((prev) => {
      const existing = prev.find((it) => it.productId === prod.id);
      if (existing) {
        // Increase quantity
        return prev.map((it) =>
          it.productId === prod.id ? { ...it, quantity: it.quantity + 1 } : it
        );
      }
      return [
        ...prev,
        {
          id: `kmb-item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          productId: prod.id,
          productName: prod.productName,
          genericName: prod.genericName,
          category: prod.category,
          company: prod.company,
          companyAr: prod.companyAr,
          quantity: 10,
          unitPrice: prod.currentPrice,
        },
      ];
    });

    setSuccessMessage(`تمت إضافة صنف (${prod.productName}) إلى الطلبية`);
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  const handleUpdateItemQty = (id: string, delta: number) => {
    setOrderItems((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          const nextQty = Math.max(1, it.quantity + delta);
          return { ...it, quantity: nextQty };
        }
        return it;
      })
    );
  };

  const handleSetItemQty = (id: string, qty: number) => {
    const validQty = Math.max(1, isNaN(qty) ? 1 : qty);
    setOrderItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, quantity: validQty } : it))
    );
  };

  const handleSetItemPrice = (id: string, price: number) => {
    const validPrice = Math.max(0, isNaN(price) ? 0 : price);
    setOrderItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, unitPrice: validPrice } : it))
    );
  };

  const handleRemoveItem = (id: string) => {
    setOrderItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Order totals
  const totalUnits = orderItems.reduce((sum, it) => sum + it.quantity, 0);
  const totalAmount = orderItems.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);

  // Submit and save Kambal order
  const handleSubmitOrder = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    if (!customerName.trim()) {
      setErrorMessage('يرجى إدخال اسم الصيدلية أو العميل لإتمام الطلبية');
      customerInputRef.current?.focus();
      return;
    }

    if (orderItems.length === 0) {
      setErrorMessage('يرجى اختيار صنف واحد على الأقل عبر شريط البحث أدناه');
      searchInputRef.current?.focus();
      return;
    }

    const finalOrderId = orderId.trim() || `KMB-${Date.now().toString().slice(-5)}`;

    // Convert order items to SalesRecord entries
    const recordsToAdd: Omit<SalesRecord, 'id'>[] = orderItems.map((it) => ({
      orderId: finalOrderId,
      date,
      customerName: customerName.trim(),
      customerSegment: customerSegment as any,
      itemName: it.productName,
      genericName: it.genericName,
      category: `${it.companyAr} - ${it.category}`,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      totalSales: it.quantity * it.unitPrice,
      salesRep: salesRep.trim() || DEFAULT_SALES_REP,
      paymentType,
      notes: notes.trim() ? `[طلبية كمبال] ${notes.trim()}` : '[طلبية كمبال - كشف أسعار نوفمبر 2026]',
    }));

    // Auto save to offline vault
    saveInvoiceToOfflineVault({
      id: `kambal-offline-${finalOrderId}-${Date.now()}`,
      orderId: finalOrderId,
      customerName: customerName.trim(),
      date,
      salesRep: salesRep.trim() || DEFAULT_SALES_REP,
      paymentType,
      items: orderItems.map((it) => ({
        itemName: it.productName,
        genericName: it.genericName,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        totalSales: it.quantity * it.unitPrice,
      })),
      totalQuantity: totalUnits,
      totalAmount,
      currency,
      savedAt: new Date().toISOString(),
      format: 'a4',
    });

    onAddSalesRecords(recordsToAdd);

    setSuccessMessage(`✅ تم اعتماد وحفظ طلبية كمبال (${finalOrderId}) للصيدلية: ${customerName} بنجاح!`);
    
    // Reset order
    setOrderId(`KMB-${Date.now().toString().slice(-5)}`);
    setOrderItems([]);
    setNotes('');
    setSearchQuery('');
  };

  // Kambal historical orders from existing salesData
  const kambalHistoryRecords = useMemo(() => {
    return salesData.filter((r) => {
      const isKmb =
        (r.orderId && r.orderId.startsWith('KMB')) ||
        (r.notes && r.notes.includes('كمبال')) ||
        KAMBAL_CATALOG.some(
          (kp) => kp.productName.toLowerCase() === (r.itemName || '').trim().toLowerCase()
        );
      return isKmb;
    });
  }, [salesData]);

  // Group historical records by orderId
  const groupedOrders = useMemo(() => {
    const map = new Map<string, SalesRecord[]>();
    kambalHistoryRecords.forEach((r) => {
      const key = r.orderId || 'no-id';
      const arr = map.get(key) || [];
      arr.push(r);
      map.set(key, arr);
    });
    return Array.from(map.entries()).map(([orderIdKey, items]) => {
      const first = items[0];
      const totalAmount = items.reduce((s, it) => s + (it.totalSales || 0), 0);
      const totalQty = items.reduce((s, it) => s + (it.quantity || 0), 0);
      return {
        orderId: orderIdKey,
        customerName: first.customerName,
        date: first.date,
        salesRep: first.salesRep,
        paymentType: first.paymentType,
        itemsCount: items.length,
        totalQty,
        totalAmount,
        firstRecord: first,
        items,
      };
    });
  }, [kambalHistoryRecords]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-4 sm:p-6 text-white shadow-lg border border-blue-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-2xl shadow-inner">
              🏢
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black tracking-tight">
                  قسم طلبيات كمبال للأدوية (Kambal Orders)
                </h1>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold px-2 py-0.5 rounded-full">
                  كشف نوفمبر 2026
                </span>
              </div>
              <p className="text-xs sm:text-sm text-blue-200 mt-1">
                نظام مخصص لإصدار طلبيات شركة كمبال العالمية (125 صنف دوائي معتمد عبر البحث الفوري)
              </p>
            </div>
          </div>

          {/* Sub-tab Navigation */}
          <div className="flex items-center gap-1.5 bg-white/10 p-1 rounded-xl backdrop-blur-xs border border-white/10 shrink-0">
            <button
              type="button"
              onClick={() => setActiveSubTab('newOrder')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'newOrder'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-blue-100 hover:bg-white/10'
              }`}
            >
              <span>✍️</span>
              <span>إنشاء طلبية كمبال</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('catalog')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'catalog'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-blue-100 hover:bg-white/10'
              }`}
            >
              <span>📋</span>
              <span>كشف الأسعار (125 صنف)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'history'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-blue-100 hover:bg-white/10'
              }`}
            >
              <span>📦</span>
              <span>الطلبيات السابقة ({groupedOrders.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alert Banners */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/70 border-2 border-emerald-400 dark:border-emerald-700 rounded-xl text-xs sm:text-sm text-emerald-800 dark:text-emerald-200 font-bold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <span>🎉</span>
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            إغلاق ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/70 border-2 border-rose-400 dark:border-rose-700 rounded-xl text-xs sm:text-sm text-rose-800 dark:text-rose-200 font-bold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-xs text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
          >
            إغلاق ✕
          </button>
        </div>
      )}

      {/* VIEW 1: NEW KAMBAL ORDER */}
      {activeSubTab === 'newOrder' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Order Details & Basket (Right 7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Pharmacy & Invoice Information */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-blue-200 dark:border-slate-700 p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 font-black text-sm text-blue-900 dark:text-blue-300">
                  <span>🏥 بيانات الصيدلية والطلبية</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                  {orderId}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Customer Name - Completely Unblocked Typing */}
                <div className="sm:col-span-2 relative">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      اسم الصيدلية أو المستشفى (Customer / Pharmacy Name) *
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
                        if (errorMessage) setErrorMessage(null);
                      }}
                      onFocus={() => {
                        if (existingCustomers.length > 0) {
                          setShowCustomerSuggestions(true);
                        }
                      }}
                      placeholder="اكتب اسم الصيدلية بحرية تامة وبدون قيود..."
                      className="w-full text-xs sm:text-sm font-bold bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 pl-8 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 transition-all"
                    />
                    {customerName && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerName('');
                          setShowCustomerSuggestions(true);
                          customerInputRef.current?.focus();
                        }}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
                        title="مسح اسم الصيدلية"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Customer Suggestions Dropdown */}
                  {showCustomerSuggestions && existingCustomers.length > 0 && (
                    <>
                      <div
                        className="fixed inset-0 z-20"
                        onClick={() => setShowCustomerSuggestions(false)}
                      />
                      <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white dark:bg-slate-800 border-2 border-blue-400 dark:border-blue-600 rounded-xl shadow-2xl max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700 animate-in fade-in duration-100">
                        <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900/90 text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center justify-between">
                          <span>اختر من الصيدليات المسجلة سابقاً:</span>
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
                              className="w-full text-right px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-between cursor-pointer"
                            >
                              <span className="flex items-center gap-1.5">
                                <span>🏥</span>
                                <span>{c}</span>
                              </span>
                              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">اختيار</span>
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-xs text-slate-500">
                            لا توجد صيدلية سابقة بهذا الاسم — كتابة "{customerName}" كصيدلية جديدة.
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تاريخ الطلبية *
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                {/* Medical Rep */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    المندوب الطبي *
                  </label>
                  <input
                    type="text"
                    value={salesRep}
                    onChange={(e) => setSalesRep(e.target.value)}
                    className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-blue-900 dark:text-blue-300 focus:outline-none focus:border-blue-600"
                  />
                </div>

                {/* Payment Terms */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    شروط السداد
                  </label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value)}
                    className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 cursor-pointer"
                  >
                    <option value="نقدي / تسليم فوري">💵 نقدي / تسليم فوري</option>
                    <option value="آجل">⏳ بيع آجل (Credit)</option>
                    <option value="كاش">💰 كاش (Cash)</option>
                    <option value="تحويل بنكي">🏦 تحويل بنكي</option>
                    <option value="شيك مصرفي">📝 شيك مصرفي</option>
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ملاحظات الطلبية
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="ملاحظات التسليم أو التوصيل..."
                    className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Selected Items in Order */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-blue-200 dark:border-slate-700 p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 font-black text-sm text-slate-900 dark:text-white">
                  <span>🛒 الأصناف المختارة في الطلبية</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white">
                    {orderItems.length} صنف
                  </span>
                </div>
                {orderItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setOrderItems([])}
                    className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-bold cursor-pointer"
                  >
                    إفراغ السلة 🗑️
                  </button>
                )}
              </div>

              {orderItems.length === 0 ? (
                <div className="py-10 text-center text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                  <span className="text-3xl block">🔍</span>
                  <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">
                    لم تقم بإضافة أي أصناف بعد!
                  </p>
                  <p className="text-xs text-slate-400">
                    استخدم محرك البحث على اليسار لاختيار أصناف كمبال وإضافتها بنقرة واحدة
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 space-y-3">
                  {orderItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                            {item.productName}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold shrink-0">
                            {item.companyAr}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 mr-7">
                          {item.genericName}
                        </p>
                      </div>

                      {/* Quantity & Price Controls */}
                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        {/* Qty Stepper */}
                        <div className="flex items-center border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQty(item.id, -1)}
                            className="px-2 py-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleSetItemQty(item.id, parseInt(e.target.value) || 1)}
                            className="w-12 text-center text-xs font-bold text-slate-900 dark:text-white bg-transparent border-none focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQty(item.id, 1)}
                            className="px-2 py-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs"
                          >
                            +
                          </button>
                        </div>

                        {/* Price & Total */}
                        <div className="text-left min-w-[90px]">
                          <div className="text-xs font-black text-blue-700 dark:text-blue-400 tabular-numbers">
                            {formatCurrency(item.quantity * item.unitPrice, currency)}
                          </div>
                          <div className="text-[10px] text-slate-400 tabular-numbers">
                            {formatNumber(item.unitPrice)} للعبوة
                          </div>
                        </div>

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 hover:bg-rose-100 text-xs font-bold flex items-center justify-center cursor-pointer transition-colors"
                          title="حذف الصنف"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Order Footer Summary */}
              {orderItems.length > 0 && (
                <div className="pt-4 border-t-2 border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-blue-50/50 dark:bg-slate-800/80 p-4 rounded-xl">
                  <div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 font-bold">
                      إجمالي كميات الطلبية: <span className="text-blue-700 font-black">{totalUnits} عبوة</span>
                    </div>
                    <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">
                      القيمة الإجمالية: <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(totalAmount, currency)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSubmitOrder()}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center gap-2"
                    >
                      <span>💾 اعتماد وحفظ طلبية كمبال</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search-Only Selection Panel (Left 5 cols) - "ويمكن اختيار الصنف باستعمال البحث فقط" */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-blue-400 dark:border-blue-600 p-4 sm:p-5 shadow-md sticky top-20">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 font-black text-sm text-blue-900 dark:text-blue-300">
                  <span>🔍 محرك البحث عن أصناف كمبال</span>
                </div>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  125 صنف دوائي
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
                ابحث باسم الدواء التجاري أو المادة العلمية أو الشركة المصنعة لاختيار الصنف فوراً:
              </p>

              {/* Search Bar Input */}
              <div className="relative mb-3">
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  🔍
                </span>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث هنا: Ator, Flumox, Elica, Cetal, Paracetamol..."
                  className="w-full text-xs sm:text-sm font-bold bg-slate-50 dark:bg-slate-800 border-2 border-blue-500 rounded-xl pr-9 pl-8 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Company Filter Quick Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 text-xs">
                {KAMBAL_COMPANIES.map((comp) => (
                  <button
                    key={comp.id}
                    type="button"
                    onClick={() => setSelectedCompanyFilter(comp.id)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCompanyFilter === comp.id
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {comp.nameAr.split('(')[0].trim()} ({comp.count})
                  </button>
                ))}
              </div>

              {/* Live Search Results List */}
              <div className="max-h-[55vh] overflow-y-auto space-y-2 pr-1">
                {searchQuery.trim() === '' ? (
                  <div className="py-8 text-center text-slate-400 space-y-2">
                    <span className="text-2xl block">⌨️</span>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      ابدأ بكتابة اسم الصنف للبحث
                    </p>
                    <p className="text-[11px] text-slate-400">
                      يتم تصفية وإظهار الأدوية فور كتابة أول حرف
                    </p>
                    {/* Quick suggestion tags */}
                    <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
                      {['Ator', 'Flumox', 'Elica', 'Cetal', 'Ciprocin', 'MEBO', 'Epicotil'].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setSearchQuery(tag)}
                          className="px-2 py-0.5 text-[11px] font-semibold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-md hover:bg-blue-100 cursor-pointer"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">
                    <span className="text-xl block mb-1">❌</span>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      لم يتم العثور على أي صنف يطابق "{searchQuery}"
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      تأكد من كتابة الاسم باللغة الإنجليزية أو جزء منه
                    </p>
                  </div>
                ) : (
                  searchResults.map((prod) => {
                    const isAlreadyAdded = orderItems.some((it) => it.productId === prod.id);
                    return (
                      <div
                        key={prod.id}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          isAlreadyAdded
                            ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700'
                            : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                              {prod.productName}
                            </span>
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
                              {prod.companyAr}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {prod.genericName}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-numbers">
                              {formatCurrency(prod.currentPrice, currency)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {prod.category}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddItemToOrder(prod)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black shrink-0 transition-all cursor-pointer flex items-center gap-1 shadow-2xs ${
                            isAlreadyAdded
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          <span>{isAlreadyAdded ? '✓ أضف المزيد' : '+ اختيار الصنف'}</span>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: FULL KAMBAL 125 CATALOG VIEWER */}
      {activeSubTab === 'catalog' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                كشف أسعار أصناف شركة كمبال للأدوية (نوفمبر 2026)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                إجمالي 125 صنفاً دوائياً رسمياً مع أسعار الجملة بالجنيه السوداني (W.Price)
              </p>
            </div>

            {/* Search Input in Catalog View */}
            <div className="w-full sm:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث في الكشف (125 صنف)..."
                className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* Company Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {KAMBAL_COMPANIES.map((comp) => (
              <button
                key={comp.id}
                type="button"
                onClick={() => setSelectedCompanyFilter(comp.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCompanyFilter === comp.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {comp.nameAr}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">اسم الصنف الدوائي (Product Name)</th>
                  <th className="p-3">الاسم العلمي (Generic Name)</th>
                  <th className="p-3">الشركة المصنعة</th>
                  <th className="p-3">التصنيف</th>
                  <th className="p-3">سعر الجملة (W.Price)</th>
                  <th className="p-3 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {searchResults.map((prod, idx) => (
                  <tr
                    key={prod.id}
                    className="hover:bg-blue-50/50 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-black text-slate-900 dark:text-white">
                      {prod.productName}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">
                      {prod.genericName}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-[11px] border border-blue-200 dark:border-blue-900">
                        {prod.companyAr}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{prod.category}</td>
                    <td className="p-3 font-black text-emerald-600 dark:text-emerald-400 tabular-numbers">
                      {formatCurrency(prod.currentPrice, currency)}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          handleAddItemToOrder(prod);
                          setActiveSubTab('newOrder');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-2xs"
                      >
                        + أضف للطلبية
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: HISTORICAL ORDERS */}
      {activeSubTab === 'history' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                سجل طلبيات كمبال السابقة ({groupedOrders.length} طلبية)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                كافة فواتير وطلبيات أصناف كمبال المسجلة في النظام
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveSubTab('newOrder')}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <span>+ طلبية كمبال جديدة</span>
            </button>
          </div>

          {groupedOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <span className="text-3xl block">📋</span>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                لا توجد طلبيات كمبال مسجلة حتى الآن
              </p>
              <p className="text-xs text-slate-400">
                انقر على "إنشاء طلبية كمبال" للبدء بإصدار أول فاتورة
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3">رقم الطلبية</th>
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">الصيدلية / العميل</th>
                    <th className="p-3">عدد الأصناف</th>
                    <th className="p-3">إجمالي الكمية</th>
                    <th className="p-3">القيمة الإجمالية</th>
                    <th className="p-3">المندوب</th>
                    <th className="p-3 text-center">معاينة / PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {groupedOrders.map((ord) => (
                    <tr
                      key={ord.orderId}
                      className="hover:bg-blue-50/50 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <td className="p-3 font-mono font-bold text-blue-700 dark:text-blue-400">
                        {ord.orderId}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{ord.date}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">
                        {ord.customerName}
                      </td>
                      <td className="p-3">{ord.itemsCount} صنف</td>
                      <td className="p-3 tabular-numbers">{ord.totalQty} عبوة</td>
                      <td className="p-3 font-black text-emerald-600 dark:text-emerald-400 tabular-numbers">
                        {formatCurrency(ord.totalAmount, currency)}
                      </td>
                      <td className="p-3 text-slate-500">{ord.salesRep}</td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (onOpenInvoiceModalWithRecord && ord.firstRecord) {
                              onOpenInvoiceModalWithRecord(ord.firstRecord);
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                        >
                          📄 الفاتورة
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
