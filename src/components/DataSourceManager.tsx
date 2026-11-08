import React, { useRef, useState } from 'react';
import { CurrencyCode, SalesRecord } from '../types';
import { copyForGoogleSheets, exportDetailedExcelReport, exportToCSV, parseCSV } from '../utils/csvHelper';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { APP_NAME, DEFAULT_SALES_REP, SUPPLIER_LINE } from '../data/productCatalog';

interface DataSourceManagerProps {
  data: SalesRecord[];
  setData: React.Dispatch<React.SetStateAction<SalesRecord[]>>;
  onOpenAddModal: () => void;
  onOpenPriceModal: () => void;
  onViewInvoice: (record: SalesRecord) => void;
  onOpenCloudModal?: () => void;
  onOpenExcelModal?: () => void;
  currency: CurrencyCode;
}

export const DataSourceManager: React.FC<DataSourceManagerProps> = ({
  data,
  setData,
  onOpenAddModal,
  onOpenPriceModal,
  onViewInvoice,
  onOpenCloudModal,
  onOpenExcelModal,
  currency,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleCopySheets = async () => {
    const success = await copyForGoogleSheets(data);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        try {
          const parsed = parseCSV(text);
          if (parsed.length > 0) {
            setData((prev) => [...parsed, ...prev]);
            setImportNotice(`تم استيراد ${parsed.length} صفاً بنجاح ودمجها في مصدر البيانات.`);
          } else {
            setImportNotice('لم يتم العثور على صفوف صالحة. تأكد من ترويسة الأعمدة المطلوبة.');
          }
        } catch (err) {
          setImportNotice('حدث خطأ أثناء قراءة ملف CSV.');
        }
      }
    };
    reader.readAsText(file);
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteRecord = (id: string) => {
    setData((prev) => prev.filter((r) => r.id !== id));
  };

  const filteredRecords = data.filter(
    (r) =>
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.salesRep && r.salesRep.toLowerCase().includes(searchTerm.toLowerCase())) ||
      r.orderId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Actions Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs card-realistic transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                إدارة مصدر البيانات (Data Source Engine)
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full font-mono">
                {APP_NAME} · المندوب: {DEFAULT_SALES_REP}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              قاعدة بيانات مبيعات أصناف {APP_NAME} ({SUPPLIER_LINE}) مع المزامنة مع Cloud Firestore و Google Drive وطباعة الفواتير PDF وتصدير تقارير Excel المفصلة.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv,.txt,.tsv"
              className="hidden"
            />
            {onOpenCloudModal && (
              <button
                onClick={onOpenCloudModal}
                className="px-3 py-2 text-xs font-bold text-emerald-900 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-xl transition-all cursor-pointer border border-emerald-300 dark:border-emerald-800 flex items-center gap-1 active:scale-95 shadow-2xs"
                title="مزامنة مع Firebase و Google Drive"
              >
                <span>مزامنة سحابية ☁️</span>
              </button>
            )}
            <button
              onClick={() => data.length > 0 && onViewInvoice(data[0])}
              className="px-3 py-2 text-xs font-semibold text-purple-800 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-xl transition-all cursor-pointer border border-purple-300 dark:border-purple-800 flex items-center gap-1 active:scale-95 shadow-2xs"
            >
              <span>طباعة فاتورة PDF 📄</span>
            </button>
            <button
              onClick={onOpenPriceModal}
              className="px-3 py-2 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl transition-all cursor-pointer border border-blue-200 dark:border-blue-800 active:scale-95 shadow-2xs"
            >
              تعديل أسعار الأصناف
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer border border-slate-200 dark:border-slate-700 active:scale-95 shadow-2xs"
            >
              استيراد CSV
            </button>
            <button
              onClick={handleCopySheets}
              className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer border active:scale-95 shadow-2xs ${
                copySuccess
                  ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {copySuccess ? '✓ تم النسخ لـ Sheets' : 'نسخ لـ Google Sheets'}
            </button>
            <button
              onClick={() => exportToCSV(data)}
              className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer border border-slate-200 dark:border-slate-700 active:scale-95 shadow-2xs"
            >
              تحميل CSV
            </button>
            <button
              onClick={() => onOpenExcelModal ? onOpenExcelModal() : exportDetailedExcelReport(data)}
              className="px-3 py-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-xl transition-all cursor-pointer border border-emerald-300 dark:border-emerald-800 flex items-center gap-1 active:scale-95 shadow-2xs"
              title="تخصيص وتصدير تقرير إكسل مفصل وشامل لجميع الأصناف والطلبيات"
            >
              <span>تخصيص وتصدير Excel 📊</span>
            </button>
            <button
              onClick={() => {
                if (window.confirm(`هل أنت متأكد تماماً من حذف كافة فواتير المبيعات المسجلة (${data.length} سجل) بالكامل؟ لا يمكن التراجع عن هذا الإجراء.`)) {
                  setData([]);
                  setImportNotice('تم حذف وتفريغ كافة فواتير المبيعات بنجاح. يمكنك الآن إدخال فواتير جديدة.');
                }
              }}
              className="px-3 py-2 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-xl transition-all cursor-pointer border border-rose-300 dark:border-rose-800 active:scale-95 shadow-2xs"
              title="حذف جميع فواتير المبيعات والطلبيات الحالية"
            >
              <span>حذف كل الفواتير ({data.length}) 🗑️</span>
            </button>
            <button
              onClick={onOpenAddModal}
              className="btn-realistic-primary px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1"
            >
              + إضافة فاتورة
            </button>
          </div>
        </div>

        {importNotice && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-lg flex items-center justify-between">
            <span>{importNotice}</span>
            <button
              onClick={() => setImportNotice(null)}
              className="font-bold hover:text-blue-950 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* 2. Schema Blueprint Box */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 card-realistic transition-colors">
        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2.5 flex items-center justify-between">
          <span>هيكل وتوصيف الأعمدة لمصدر البيانات (Field Typing & Schema)</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
            مطابق لمواصفات Google Looker Studio
          </span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          <div className="bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-mono">Date</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">التاريخ</span>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 block mt-0.5 font-medium">نوع: Date (YYYY-MM-DD)</span>
          </div>
          <div className="bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-mono">Customer Name</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">اسم العميل</span>
            <span className="text-[10px] text-purple-600 dark:text-purple-400 block mt-0.5 font-medium">نوع: Text (بُعد أساسي)</span>
          </div>
          <div className="bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-mono">Item Name</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">الصنف / المنتج</span>
            <span className="text-[10px] text-purple-600 dark:text-purple-400 block mt-0.5 font-medium">نوع: Text (بُعد ثانوي)</span>
          </div>
          <div className="bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-mono">Quantity</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">الكمية المباعة</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-0.5 font-medium">نوع: Numeric (SUM)</span>
          </div>
          <div className="bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-mono">Unit Price</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">سعر الوحدة</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-0.5 font-medium">نوع: Currency (AVG)</span>
          </div>
          <div className="bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-mono">Total Sales</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">إجمالي المبيعات</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-0.5 font-medium">Qty × Price (SUM)</span>
          </div>
        </div>
      </div>

      {/* 3. Raw Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden card-realistic transition-colors">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              سجلات جدول البيانات الفعلي ({data.length} سجل)
            </h3>
          </div>
          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="تصفية السجلات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto ios-scroll max-h-[500px]">
          <table className="w-full text-right text-xs min-w-[720px]">
            <thead className="bg-slate-50 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 font-semibold sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center text-slate-400">#</th>
                <th className="py-2.5 px-3">رقم الفاتورة</th>
                <th className="py-2.5 px-3">التاريخ</th>
                <th className="py-2.5 px-3">المندوب</th>
                <th className="py-2.5 px-3">اسم العميل</th>
                <th className="py-2.5 px-3">الصنف / الدواء</th>
                <th className="py-2.5 px-3">الفئة</th>
                <th className="py-2.5 px-3 text-left">الكمية</th>
                <th className="py-2.5 px-3 text-left">سعر الوحدة</th>
                <th className="py-2.5 px-3 text-left">إجمالي المبيعات</th>
                <th className="py-2.5 px-3 text-center w-14">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400 dark:text-slate-500">
                    لا توجد سجلات مطابقة للبحث
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-2.5 px-3 text-center text-slate-400 dark:text-slate-500 tabular-numbers">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {r.orderId}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                      {r.date}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-blue-700 dark:text-blue-400 text-xs">
                      {r.salesRep || DEFAULT_SALES_REP}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                      {r.customerName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200">
                      <div>{r.itemName}</div>
                      {r.genericName && (
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{r.genericName}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                      {r.category}
                    </td>
                    <td className="py-2.5 px-3 text-left font-bold text-slate-800 dark:text-slate-200 tabular-numbers">
                      {formatNumber(r.quantity)}
                    </td>
                    <td className="py-2.5 px-3 text-left text-slate-700 dark:text-slate-300 tabular-numbers">
                      {formatCurrency(r.unitPrice, currency)}
                    </td>
                    <td className="py-2.5 px-3 text-left font-bold text-slate-900 dark:text-white tabular-numbers">
                      {formatCurrency(r.totalSales, currency)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onViewInvoice(r)}
                          className="px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 rounded-lg transition-colors cursor-pointer"
                          title="معاينة وطباعة الفاتورة كـ PDF"
                        >
                          PDF
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(r.id)}
                          className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors p-1 cursor-pointer"
                          title="حذف هذا الصف"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
