import React, { useState, useMemo } from 'react';
import { CurrencyCode, SalesRecord } from '../types';
import { DEFAULT_SALES_REP } from '../data/productCatalog';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { saveFileToPhoneStorage } from '../services/phoneStorageService';

export interface InvoiceCsvField {
  id: string;
  labelAr: string;
  labelEn: string;
  category: 'header' | 'table' | 'summary';
  defaultSelected: boolean;
}

export const INVOICE_CSV_AVAILABLE_FIELDS: InvoiceCsvField[] = [
  // Header Info
  { id: 'orderId', labelAr: 'رقم الفاتورة', labelEn: 'Invoice Number', category: 'header', defaultSelected: true },
  { id: 'date', labelAr: 'تاريخ الفاتورة', labelEn: 'Invoice Date', category: 'header', defaultSelected: true },
  { id: 'customerName', labelAr: 'اسم العميل / الصيدلية', labelEn: 'Customer Name', category: 'header', defaultSelected: true },
  { id: 'customerSegment', labelAr: 'شريحة / تصنيف العميل', labelEn: 'Customer Segment', category: 'header', defaultSelected: true },
  { id: 'salesRep', labelAr: 'المندوب الطبي', labelEn: 'Sales / Medical Rep', category: 'header', defaultSelected: true },
  { id: 'paymentType', labelAr: 'طريقة وشروط السداد', labelEn: 'Payment Terms', category: 'header', defaultSelected: true },
  { id: 'companyName', labelAr: 'اسم المنشأة والترويسة', labelEn: 'Company / Facility', category: 'header', defaultSelected: true },
  { id: 'currency', labelAr: 'العملة الرسمية', labelEn: 'Currency Code', category: 'header', defaultSelected: true },

  // Table Columns
  { id: 'index', labelAr: 'الرقم المتسلسل (#)', labelEn: 'Row Index (#)', category: 'table', defaultSelected: true },
  { id: 'itemName', labelAr: 'اسم الصنف الدوائي', labelEn: 'Product / Drug Name', category: 'table', defaultSelected: true },
  { id: 'genericName', labelAr: 'التركيبة والاسم العلمي', labelEn: 'Generic Formulation', category: 'table', defaultSelected: true },
  { id: 'category', labelAr: 'التصنيف العلاجي', labelEn: 'Medical Category', category: 'table', defaultSelected: true },
  { id: 'unit', labelAr: 'الوحدة (عبوة)', labelEn: 'Packaging Unit', category: 'table', defaultSelected: true },
  { id: 'quantity', labelAr: 'الكمية المباعة (عبوة)', labelEn: 'Quantity Sold', category: 'table', defaultSelected: true },
  { id: 'unitPrice', labelAr: 'سعر الوحدة', labelEn: 'Unit Price', category: 'table', defaultSelected: true },
  { id: 'totalSales', labelAr: 'إجمالي القيمة', labelEn: 'Total Amount', category: 'table', defaultSelected: true },
  { id: 'notes', labelAr: 'الملاحظات وإقرار التسليم', labelEn: 'Notes / Remarks', category: 'table', defaultSelected: true },

  // Summary
  { id: 'summaryTotals', labelAr: 'ملخص الفاتورة وإجمالي الصافي', labelEn: 'Summary Totals & Net', category: 'summary', defaultSelected: true },
];

const STORAGE_CSV_FIELDS_KEY = 'ahmedjam_invoice_csv_custom_fields_v1';

interface InvoiceCsvExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: SalesRecord | null;
  items: Array<{
    itemName: string;
    genericName?: string;
    category?: string;
    quantity: number;
    unitPrice: number;
    totalSales: number;
    notes?: string;
  }>;
  currency: CurrencyCode;
  activeSalesRep?: string;
  companyName?: string;
  onSuccess?: (msg: string) => void;
}

export const InvoiceCsvExportModal: React.FC<InvoiceCsvExportModalProps> = ({
  isOpen,
  onClose,
  record,
  items,
  currency,
  activeSalesRep,
  companyName = 'ahmed jam • Jamjoom Pharma',
  onSuccess,
}) => {
  // Selected fields
  const [selectedFields, setSelectedFields] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CSV_FIELDS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INVOICE_CSV_AVAILABLE_FIELDS.filter((f) => f.defaultSelected).map((f) => f.id);
  });

  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'table' | 'header'>('all');

  if (!isOpen || !record) return null;

  const currentRep = (activeSalesRep && activeSalesRep.trim())
    ? activeSalesRep
    : (record.salesRep && record.salesRep.trim())
    ? record.salesRep
    : DEFAULT_SALES_REP;

  const totalQuantity = items.reduce((s, it) => s + (it.quantity || 0), 0);
  const totalAmount = items.reduce((s, it) => s + (it.totalSales || 0), 0);

  const toggleField = (id: string) => {
    setSelectedFields((prev) => {
      const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id];
      try {
        localStorage.setItem(STORAGE_CSV_FIELDS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleSelectAll = () => {
    const all = INVOICE_CSV_AVAILABLE_FIELDS.map((f) => f.id);
    setSelectedFields(all);
    try {
      localStorage.setItem(STORAGE_CSV_FIELDS_KEY, JSON.stringify(all));
    } catch {}
  };

  const handleSelectMinimal = () => {
    const minimal = ['orderId', 'date', 'customerName', 'itemName', 'quantity', 'unitPrice', 'totalSales', 'summaryTotals'];
    setSelectedFields(minimal);
    try {
      localStorage.setItem(STORAGE_CSV_FIELDS_KEY, JSON.stringify(minimal));
    } catch {}
  };

  // Perform CSV Generation with chosen columns
  const handleExportCsv = async () => {
    if (selectedFields.length === 0) {
      alert('يرجى تحديد حقل أو عمود واحد على الأقل للتصدير');
      return;
    }

    setIsExporting(true);
    try {
      const bom = '\uFEFF';
      let csv = bom;

      // 1. Header Information Section
      const headerFieldsToExport: Array<[string, string]> = [];
      if (selectedFields.includes('orderId')) headerFieldsToExport.push(['رقم الفاتورة', record.orderId]);
      if (selectedFields.includes('date')) headerFieldsToExport.push(['تاريخ الفاتورة', record.date]);
      if (selectedFields.includes('customerName')) headerFieldsToExport.push(['العميل / الصيدلية', `"${(record.customerName || '').replace(/"/g, '""')}"`]);
      if (selectedFields.includes('customerSegment')) headerFieldsToExport.push(['تصنيف العميل', `"${(record.customerSegment || 'صيدليات مجتمعية').replace(/"/g, '""')}"`]);
      if (selectedFields.includes('salesRep')) headerFieldsToExport.push(['المندوب الطبي', `"${currentRep.replace(/"/g, '""')}"`]);
      if (selectedFields.includes('paymentType')) headerFieldsToExport.push(['طريقة وشروط السداد', `"${(record.paymentType || 'نقدي / تسليم فوري').replace(/"/g, '""')}"`]);
      if (selectedFields.includes('companyName')) headerFieldsToExport.push(['الشركة / المنشأة', `"${companyName.replace(/"/g, '""')}"`]);
      if (selectedFields.includes('currency')) headerFieldsToExport.push(['العملة', currency]);

      if (headerFieldsToExport.length > 0) {
        headerFieldsToExport.forEach(([label, val]) => {
          csv += `${label},${val}\r\n`;
        });
        csv += '\r\n';
      }

      // 2. Table Headers
      const tableHeaders: string[] = [];
      const tableFieldMap: Array<{ id: string; getValue: (it: any, idx: number) => string | number }> = [];

      if (selectedFields.includes('index')) {
        tableHeaders.push('#');
        tableFieldMap.push({ id: 'index', getValue: (_, idx) => idx + 1 });
      }
      if (selectedFields.includes('itemName')) {
        tableHeaders.push('اسم الصنف والمستحضر الدوائي');
        tableFieldMap.push({ id: 'itemName', getValue: (it) => `"${(it.itemName || '').replace(/"/g, '""')}"` });
      }
      if (selectedFields.includes('genericName')) {
        tableHeaders.push('التركيبة والاسم العلمي');
        tableFieldMap.push({ id: 'genericName', getValue: (it) => `"${(it.genericName || '').replace(/"/g, '""')}"` });
      }
      if (selectedFields.includes('category')) {
        tableHeaders.push('التصنيف العلاجي');
        tableFieldMap.push({ id: 'category', getValue: (it) => `"${(it.category || '').replace(/"/g, '""')}"` });
      }
      if (selectedFields.includes('unit')) {
        tableHeaders.push('الوحدة');
        tableFieldMap.push({ id: 'unit', getValue: () => 'عبوة' });
      }
      if (selectedFields.includes('quantity')) {
        tableHeaders.push('الكمية (عبوة)');
        tableFieldMap.push({ id: 'quantity', getValue: (it) => it.quantity });
      }
      if (selectedFields.includes('unitPrice')) {
        tableHeaders.push('سعر الوحدة');
        tableFieldMap.push({ id: 'unitPrice', getValue: (it) => it.unitPrice });
      }
      if (selectedFields.includes('totalSales')) {
        tableHeaders.push('إجمالي القيمة');
        tableFieldMap.push({ id: 'totalSales', getValue: (it) => it.totalSales });
      }
      if (selectedFields.includes('notes')) {
        tableHeaders.push('ملاحظات الصنف');
        tableFieldMap.push({ id: 'notes', getValue: (it) => `"${(it.notes || record.notes || '').replace(/"/g, '""')}"` });
      }

      if (tableHeaders.length > 0) {
        csv += tableHeaders.join(',') + '\r\n';

        items.forEach((item, idx) => {
          const row = tableFieldMap.map((f) => f.getValue(item, idx));
          csv += row.join(',') + '\r\n';
        });
      }

      // 3. Summary Totals Section
      if (selectedFields.includes('summaryTotals')) {
        csv += '\r\n';
        csv += `إجمالي عدد الأصناف المفوترة,${items.length}\r\n`;
        csv += `إجمالي الكمية المباعة,${totalQuantity} عبوة\r\n`;
        csv += `المجموع الفرعي,${totalAmount} ${currency}\r\n`;
        csv += `الخصم التجاري,0 ${currency}\r\n`;
        csv += `الصافي المطلوب سداده,${totalAmount} ${currency}\r\n`;
        if (record.notes) {
          csv += `ملاحظات عامة على الفاتورة,"${record.notes.replace(/"/g, '""')}"\r\n`;
        }
      }

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const safeCustomer = (record.customerName || 'Customer').replace(/[\s/\\?%*:|"<>]+/g, '_');
      const filename = `Invoice-${record.orderId}-${safeCustomer}.csv`;

      const res = await saveFileToPhoneStorage(filename, blob, 'text/csv;charset=utf-8;', 'csv');
      const successText = res.path
        ? `✓ تم تصدير وحفظ الفاتورة المخصصة (${selectedFields.length} عمود/حقل) في (${res.path}) بنجاح!`
        : `✓ تم تصدير وحفظ الفاتورة بصيغة CSV (${filename}) متوافقة مع Excel!`;

      if (onSuccess) onSuccess(successText);
      onClose();
    } catch (err: any) {
      console.error('Invoice CSV export error:', err);
      alert('تعذر تصدير الفاتورة: ' + (err?.message || 'خطأ غير معروف'));
    } finally {
      setIsExporting(false);
    }
  };

  const filteredFields = INVOICE_CSV_AVAILABLE_FIELDS.filter((f) => {
    if (activeTab === 'table') return f.category === 'table';
    if (activeTab === 'header') return f.category === 'header' || f.category === 'summary';
    return true;
  });

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border-2 border-sky-400 dark:border-sky-800 flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-sky-900 via-blue-950 to-slate-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500 text-white flex items-center justify-center text-xl font-bold shadow-xs shrink-0">
              📑
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base">
                تخصيص وتعديل الجداول والأعمدة في ملف CSV
              </h3>
              <p className="text-[11px] text-sky-200">
                اختر الحقول والبيانات التي تريد ظهورها في ملف الفاتورة رقم #{record.orderId}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Filter Controls & Presets */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          {/* Tabs */}
          <div className="flex rounded-xl bg-slate-200/80 dark:bg-slate-700 p-1 gap-1 font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              كافة البيانات ({INVOICE_CSV_AVAILABLE_FIELDS.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('table')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeTab === 'table'
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              أعمدة جدول الأصناف
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('header')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeTab === 'header'
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              الترويسة والإجماليات
            </button>
          </div>

          {/* Quick Select Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-[11px] font-bold text-sky-700 dark:text-sky-400 hover:underline cursor-pointer"
            >
              تحديد الكل ✓
            </button>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <button
              type="button"
              onClick={handleSelectMinimal}
              className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:underline cursor-pointer"
            >
              الحد الأدنى
            </button>
          </div>
        </div>

        {/* Fields Checkboxes List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>حدد الجداول والأعمدة المراد تضمينها في الملف ({selectedFields.length} محدد):</span>
            <span className="text-sky-600 dark:text-sky-400 font-mono">UTF-8 معتمد لـ Excel</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredFields.map((field) => {
              const isChecked = selectedFields.includes(field.id);
              return (
                <label
                  key={field.id}
                  onClick={() => toggleField(field.id)}
                  className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all select-none ${
                    isChecked
                      ? 'bg-sky-50/80 dark:bg-sky-950/40 border-sky-400 dark:border-sky-700 text-slate-900 dark:text-white font-bold shadow-2xs'
                      : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="rounded text-sky-600 focus:ring-0 cursor-pointer"
                    />
                    <span className="truncate">{field.labelAr}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {field.labelEn}
                  </span>
                </label>
              );
            })}
          </div>

          {/* Quick Preview Card */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-[11px]">
            <div className="font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>معاينة الأعمدة المتضمنة في الفاتورة:</span>
              <span className="text-slate-400 font-mono">{items.length} أصناف · {totalQuantity} عبوة</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {INVOICE_CSV_AVAILABLE_FIELDS.filter((f) => selectedFields.includes(f.id)).map((f) => (
                <span
                  key={f.id}
                  className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 text-sky-800 dark:text-sky-300 font-bold border border-sky-200 dark:border-sky-800"
                >
                  {f.labelAr}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 text-xs">
          <div className="text-[11px] text-slate-500 font-medium hidden sm:block">
            يتم حفظ التخصيص تلقائياً للمرات القادمة
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="button"
              disabled={isExporting || selectedFields.length === 0}
              onClick={handleExportCsv}
              className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white font-black rounded-xl shadow-md cursor-pointer active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>جارٍ تجهيز وحفظ CSV...</span>
                </>
              ) : (
                <>
                  <span>📥</span>
                  <span>تصدير ملف CSV المخصص</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
