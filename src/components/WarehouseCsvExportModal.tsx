import React, { useState } from 'react';
import { CurrencyCode, WarehouseItemStock } from '../types';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { saveFileToPhoneStorage } from '../services/phoneStorageService';

export interface WarehouseCsvField {
  id: string;
  labelAr: string;
  labelEn: string;
  defaultSelected: boolean;
}

export const WAREHOUSE_CSV_FIELDS: WarehouseCsvField[] = [
  { id: 'productId', labelAr: 'كود / رقم الصنف', labelEn: 'Product Code', defaultSelected: true },
  { id: 'productName', labelAr: 'اسم الصنف الدوائي', labelEn: 'Product Name', defaultSelected: true },
  { id: 'genericName', labelAr: 'الاسم العلمي والتركيبة', labelEn: 'Generic Formulation', defaultSelected: true },
  { id: 'category', labelAr: 'الفئة العلاجية', labelEn: 'Category', defaultSelected: true },
  { id: 'price', labelAr: 'سعر الوحدة الرسمي', labelEn: 'Unit Price', defaultSelected: true },
  { id: 'initialStock', labelAr: 'الكمية المدخلة بالمستودع', labelEn: 'Initial Stock', defaultSelected: true },
  { id: 'soldQuantity', labelAr: 'الكمية المباعة من الفواتير', labelEn: 'Sold Quantity', defaultSelected: true },
  { id: 'remainingStock', labelAr: 'الرصيد المتبقي الفعلي بالمخزن', labelEn: 'Remaining Stock', defaultSelected: true },
  { id: 'status', labelAr: 'حالة المخزون (متوفر / منخفض / نفد)', labelEn: 'Stock Status', defaultSelected: true },
  { id: 'totalSalesValue', labelAr: 'قيمة المبيعات المحققة', labelEn: 'Sales Value', defaultSelected: true },
  { id: 'remainingStockValue', labelAr: 'قيمة المخزون المتبقي', labelEn: 'Inventory Value', defaultSelected: true },
  { id: 'includeTotals', labelAr: 'إضافة سطر الإجماليات أسفل الجدول', labelEn: 'Totals Summary Row', defaultSelected: true },
];

const STORAGE_WAREHOUSE_CSV_FIELDS_KEY = 'ahmedjam_warehouse_csv_custom_fields_v1';

interface WarehouseCsvExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouseItems: WarehouseItemStock[];
  currency: CurrencyCode;
  onSuccess?: (msg: string) => void;
}

export const WarehouseCsvExportModal: React.FC<WarehouseCsvExportModalProps> = ({
  isOpen,
  onClose,
  warehouseItems,
  currency,
  onSuccess,
}) => {
  const [selectedFields, setSelectedFields] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_WAREHOUSE_CSV_FIELDS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return WAREHOUSE_CSV_FIELDS.filter((f) => f.defaultSelected).map((f) => f.id);
  });

  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const toggleField = (id: string) => {
    setSelectedFields((prev) => {
      const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id];
      try {
        localStorage.setItem(STORAGE_WAREHOUSE_CSV_FIELDS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleSelectAll = () => {
    const all = WAREHOUSE_CSV_FIELDS.map((f) => f.id);
    setSelectedFields(all);
    try {
      localStorage.setItem(STORAGE_WAREHOUSE_CSV_FIELDS_KEY, JSON.stringify(all));
    } catch {}
  };

  const handleSelectEssential = () => {
    const essential = ['productId', 'productName', 'price', 'initialStock', 'soldQuantity', 'remainingStock', 'status', 'includeTotals'];
    setSelectedFields(essential);
    try {
      localStorage.setItem(STORAGE_WAREHOUSE_CSV_FIELDS_KEY, JSON.stringify(essential));
    } catch {}
  };

  const handleExport = async () => {
    if (selectedFields.length === 0) {
      alert('يرجى تحديد عمود واحد على الأقل للتصدير');
      return;
    }

    setIsExporting(true);
    try {
      const bom = '\uFEFF';
      const headers: string[] = [];
      const mappers: Array<(it: WarehouseItemStock) => string | number> = [];

      if (selectedFields.includes('productId')) {
        headers.push('كود / رقم الصنف');
        mappers.push((it) => `"${it.productId}"`);
      }
      if (selectedFields.includes('productName')) {
        headers.push('اسم الصنف الدوائي');
        mappers.push((it) => `"${it.productName.replace(/"/g, '""')}"`);
      }
      if (selectedFields.includes('genericName')) {
        headers.push('الاسم العلمي والتركيبة');
        mappers.push((it) => `"${it.genericName.replace(/"/g, '""')}"`);
      }
      if (selectedFields.includes('category')) {
        headers.push('الفئة العلاجية');
        mappers.push((it) => `"${it.category.replace(/"/g, '""')}"`);
      }
      if (selectedFields.includes('price')) {
        headers.push('سعر الوحدة');
        mappers.push((it) => it.price);
      }
      if (selectedFields.includes('initialStock')) {
        headers.push('الكمية المدخلة بالمستودع');
        mappers.push((it) => it.initialStock);
      }
      if (selectedFields.includes('soldQuantity')) {
        headers.push('الكمية المباعة من الفواتير');
        mappers.push((it) => it.soldQuantity);
      }
      if (selectedFields.includes('remainingStock')) {
        headers.push('الرصيد المتبقي بالمخزن');
        mappers.push((it) => it.remainingStock);
      }
      if (selectedFields.includes('status')) {
        headers.push('حالة المخزون');
        mappers.push((it) =>
          `"${it.status === 'out_of_stock' ? 'نفد من المستودع' : it.status === 'low_stock' ? 'مخزون منخفض' : 'متوفر'}"`
        );
      }
      if (selectedFields.includes('totalSalesValue')) {
        headers.push('قيمة المبيعات');
        mappers.push((it) => it.totalSalesValue);
      }
      if (selectedFields.includes('remainingStockValue')) {
        headers.push('قيمة المخزون المتبقي');
        mappers.push((it) => it.remainingStockValue);
      }

      const rows = warehouseItems.map((it) => mappers.map((fn) => fn(it)).join(','));

      let summaryRow = '';
      if (selectedFields.includes('includeTotals') && warehouseItems.length > 0) {
        const totalInitial = warehouseItems.reduce((acc, it) => acc + it.initialStock, 0);
        const totalSold = warehouseItems.reduce((acc, it) => acc + it.soldQuantity, 0);
        const totalRem = warehouseItems.reduce((acc, it) => acc + Math.max(0, it.remainingStock), 0);
        const totalVal = warehouseItems.reduce((acc, it) => acc + it.remainingStockValue, 0);
        const totalSales = warehouseItems.reduce((acc, it) => acc + it.totalSalesValue, 0);

        const summaryCells: string[] = [];
        if (selectedFields.includes('productId')) summaryCells.push('"الإجمالي الكلي"');
        if (selectedFields.includes('productName')) summaryCells.push(`"عدد الأصناف: ${warehouseItems.length}"`);
        if (selectedFields.includes('genericName')) summaryCells.push('""');
        if (selectedFields.includes('category')) summaryCells.push('""');
        if (selectedFields.includes('price')) summaryCells.push('""');
        if (selectedFields.includes('initialStock')) summaryCells.push(String(totalInitial));
        if (selectedFields.includes('soldQuantity')) summaryCells.push(String(totalSold));
        if (selectedFields.includes('remainingStock')) summaryCells.push(String(totalRem));
        if (selectedFields.includes('status')) summaryCells.push('""');
        if (selectedFields.includes('totalSalesValue')) summaryCells.push(String(totalSales));
        if (selectedFields.includes('remainingStockValue')) summaryCells.push(String(totalVal));

        summaryRow = '\r\n' + summaryCells.join(',');
      }

      const csvContent = bom + [headers.join(','), ...rows].join('\r\n') + summaryRow;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const filename = `تقرير_مخزون_المستودع_المخصص_${new Date().toISOString().split('T')[0]}.csv`;

      const res = await saveFileToPhoneStorage(filename, blob, 'text/csv;charset=utf-8;', 'csv');
      const text = res.path
        ? `✓ تم حفظ تقرير جرد المخزن المخصص في (${res.path}) بنجاح!`
        : `✓ تم تنزيل تقرير جرد المخزن (${filename}) بنجاح!`;

      if (onSuccess) onSuccess(text);
      onClose();
    } catch (e: any) {
      console.error('Warehouse CSV error:', e);
      alert('تعذر تصدير تقرير المخزن: ' + (e?.message || 'خطأ غير معروف'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border-2 border-emerald-400 dark:border-emerald-800 flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-xl font-bold shadow-xs shrink-0">
              📦
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base">
                تخصيص وتعديل أعمدة وجداول جرد المستودع (CSV)
              </h3>
              <p className="text-[11px] text-emerald-200">
                حدد الجداول والبيانات التي تريد ظهورها في ملف جرد المخزن
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

        {/* Toolbar Selection */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-300">
            الأعمدة المحددة: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{selectedFields.length}</strong> من {WAREHOUSE_CSV_FIELDS.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              تحديد كافة الأعمدة ✓
            </button>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <button
              type="button"
              onClick={handleSelectEssential}
              className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:underline cursor-pointer"
            >
              الأعمدة الأساسية
            </button>
          </div>
        </div>

        {/* Fields Grid */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {WAREHOUSE_CSV_FIELDS.map((field) => {
              const isChecked = selectedFields.includes(field.id);
              return (
                <label
                  key={field.id}
                  onClick={() => toggleField(field.id)}
                  className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all select-none ${
                    isChecked
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 text-slate-900 dark:text-white font-bold shadow-2xs'
                      : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="rounded text-emerald-600 focus:ring-0 cursor-pointer"
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
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 text-xs">
          <div className="text-[11px] text-slate-500 font-medium hidden sm:block">
            ملف CSV متوافق 100% مع Excel وبترميز عربي معتمد
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
              onClick={handleExport}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black rounded-xl shadow-md cursor-pointer active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>جارٍ تجهيز ملف CSV...</span>
                </>
              ) : (
                <>
                  <span>📥</span>
                  <span>تصدير جرد المخزن المخصص</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
