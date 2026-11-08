import React, { useState } from 'react';
import { SavedOfflineInvoice } from '../types';
import { formatCurrency, formatNumber } from '../utils/formatters';

interface OfflineInvoicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedInvoices: SavedOfflineInvoice[];
  onDeleteInvoice: (id: string) => void;
  onOpenInvoicePreview: (invoice: SavedOfflineInvoice) => void;
  onClearAll: () => void;
}

export const OfflineInvoicesModal: React.FC<OfflineInvoicesModalProps> = ({
  isOpen,
  onClose,
  savedInvoices,
  onDeleteInvoice,
  onOpenInvoicePreview,
  onClearAll,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filtered = savedInvoices.filter((inv) => {
    const q = searchTerm.toLowerCase();
    return (
      inv.orderId.toLowerCase().includes(q) ||
      inv.customerName.toLowerCase().includes(q) ||
      inv.date.includes(q)
    );
  });

  const totalVaultAmount = savedInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

  const handleExportOfflineCsv = (inv: SavedOfflineInvoice) => {
    const bom = '\uFEFF';
    let csv = bom;
    csv += `رقم الفاتورة,${inv.orderId}\n`;
    csv += `تاريخ الفاتورة,${inv.date}\n`;
    csv += `العميل / الصيدلية,"${(inv.customerName || '').replace(/"/g, '""')}"\n`;
    csv += `المندوب الطبي,"${(inv.salesRep || '').replace(/"/g, '""')}"\n`;
    csv += `العملة,${inv.currency}\n\n`;

    csv += '#,اسم الصنف,التركيبة العلمية,الوحدة,الكمية,سعر الوحدة,الإجمالي\n';
    inv.items.forEach((it, idx) => {
      csv += `${idx + 1},"${(it.itemName || '').replace(/"/g, '""')}","${(it.genericName || '').replace(/"/g, '""')}",عبوة,${it.quantity},${it.unitPrice},${it.totalSales}\n`;
    });
    csv += '\n';
    csv += `إجمالي الأصناف,${inv.items.length}\n`;
    csv += `إجمالي الكمية,${inv.totalQuantity}\n`;
    csv += `الصافي المطلوب سداده,${inv.totalAmount} ${inv.currency}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const filename = `Invoice-${inv.orderId}-${inv.customerName.replace(/[\s/\\?%*:|"<>]+/g, '_')}.csv`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full sm:max-w-3xl rounded-t-3xl sm:rounded-2xl shadow-2xl border-2 border-blue-200 dark:border-slate-700 flex flex-col overflow-hidden max-h-[94vh] text-slate-900 dark:text-slate-100">
        {/* Mobile Drag Indicator */}
        <div className="w-12 h-1.5 bg-slate-400 dark:bg-slate-600 rounded-full mx-auto my-2.5 sm:hidden" />

        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b-2 border-blue-200 dark:border-slate-700 flex items-center justify-between bg-gradient-to-r from-blue-50 via-sky-50 to-white dark:from-slate-800 dark:via-slate-850 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-lg font-bold shadow-sm">
              💾
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  أرشيف الفواتير المحفوظة أوفلاين على الهاتف
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-600 text-white shadow-2xs">
                  {savedInvoices.length} فواتير
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold mt-0.5">
                مخزنة محلياً في ذاكرة الجهاز للوصول والمراجعة والطباعة بدون اتصال إنترنت
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

        {/* Toolbar & Search */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/90 border-b-2 border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="البحث برقم الفاتورة أو اسم الصيدلية/العميل أو التاريخ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
            <div className="text-slate-800 dark:text-slate-200 font-bold bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
              إجمالي القيمة:{' '}
              <span className="font-black text-blue-700 dark:text-blue-300 tabular-numbers">
                {formatNumber(totalVaultAmount)} SDG
              </span>
            </div>

            {savedInvoices.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('هل أنت متأكد من تفريغ وحذف جميع الفواتير المحفوظة أوفلاين من الذاكرة؟')) {
                    onClearAll();
                  }
                }}
                className="text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/60 px-2.5 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 font-bold cursor-pointer transition-colors"
              >
                تفريغ الأرشيف 🗑️
              </button>
            )}
          </div>
        </div>

        {/* Invoices List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-600 dark:text-slate-400 space-y-2">
              <div className="text-4xl mb-2">📭</div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {searchTerm ? 'لا توجد فواتير مطابقة لبحثك' : 'لا توجد فواتير محفوظة أوفلاين حالياً'}
              </p>
              <p className="text-xs max-w-sm mx-auto font-medium">
                عند إنشاء أي فاتورة جديدة أو تحميل PDF، يتم تخزين نسخة منها هنا تلقائياً لفتحها وطباعتها في أي وقت دون اتصال بالإنترنت.
              </p>
            </div>
          ) : (
            filtered.map((inv) => (
              <div
                key={inv.id}
                className="bg-white dark:bg-slate-800 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/80">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-black text-xs bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-200 px-2.5 py-1 rounded-md border border-blue-300 dark:border-blue-800">
                      {inv.orderId}
                    </span>
                    <span className="font-black text-sm text-slate-900 dark:text-white">
                      {inv.customerName}
                    </span>
                    <span className="text-[11px] bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded font-bold">
                      {inv.format === 'thermal80' ? '🧾 إيصال حراري' : '📄 فاتورة A4'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-blue-700 dark:text-blue-300 tabular-numbers">
                      {formatCurrency(inv.totalAmount, inv.currency)}
                    </span>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 font-mono">
                      ({inv.totalQuantity} عبوة)
                    </span>
                  </div>
                </div>

                {/* Items summary */}
                <div className="text-xs text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/80 p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <div className="font-extrabold text-blue-950 dark:text-blue-200 flex items-center justify-between">
                    <span>الأصناف المشمولة في الفاتورة ({inv.items.length}):</span>
                    <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      التاريخ: {inv.date}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {inv.items.map((it, idx) => (
                      <span
                        key={idx}
                        className="bg-white dark:bg-slate-800 px-2.5 py-1 rounded-md text-xs border border-slate-300 dark:border-slate-600 font-bold text-slate-900 dark:text-white shadow-2xs"
                      >
                        {it.itemName} ({it.quantity} عبوة)
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card footer */}
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-1">
                  <span className="font-semibold text-[11px]">
                    المندوب: {inv.salesRep}
                  </span>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenInvoicePreview(inv)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors cursor-pointer text-xs flex items-center gap-1 shadow-2xs"
                    >
                      <span>📄</span>
                      <span>معاينة وطباعة</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportOfflineCsv(inv)}
                      className="px-2.5 py-1.5 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 rounded-lg font-bold transition-colors cursor-pointer text-xs flex items-center gap-1 shadow-2xs"
                      title="تنزيل الفاتورة كملف CSV"
                    >
                      <span>📊</span>
                      <span>تصدير CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteInvoice(inv.id)}
                      className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg border border-rose-200 dark:border-rose-900 cursor-pointer"
                      title="حذف من الأرشيف"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-850 border-t-2 border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
          <span>فواتير أوفلاين آمنة ومحفوظة محلياً 100%</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg transition-colors cursor-pointer font-bold"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
