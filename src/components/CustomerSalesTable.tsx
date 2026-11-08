import React, { useState } from 'react';
import { CurrencyCode, CustomerSummary } from '../types';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';

interface CustomerSalesTableProps {
  customers: CustomerSummary[];
  currency: CurrencyCode;
  selectedCustomer: string;
  onSelectCustomer: (name: string) => void;
  onOpenInvoiceForCustomer?: (name: string) => void;
  onExportCustomers?: () => void;
}

type SortField = 'customerName' | 'totalSales' | 'totalQuantity' | 'orderCount' | 'avgOrderValue';
type SortOrder = 'asc' | 'desc';

export const CustomerSalesTable: React.FC<CustomerSalesTableProps> = ({
  customers,
  currency,
  selectedCustomer,
  onSelectCustomer,
  onOpenInvoiceForCustomer,
  onExportCustomers,
}) => {
  const [sortField, setSortField] = useState<SortField>('totalSales');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Filter
  const filtered = customers.filter((c) =>
    c.customerName.toLowerCase().includes(search.toLowerCase())
  );

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'customerName') {
      comparison = a.customerName.localeCompare(b.customerName, 'ar');
    } else {
      comparison = a[sortField] - b[sortField];
    }
    return sortOrder === 'desc' ? -comparison : comparison;
  });

  // Pagination
  const totalPages = Math.ceil(sorted.length / pageSize) || 1;
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const maxSales = customers.length > 0 ? Math.max(...customers.map((c) => c.totalSales)) : 1;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs card-realistic overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              جدول 1: ملخص المبيعات حسب العملاء (Table 1: Sales by Customer)
            </h3>
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded border"
              style={{
                backgroundColor: 'var(--theme-primary-light)',
                color: 'var(--theme-text-accent)',
                borderColor: 'var(--theme-primary-border)',
              }}
            >
              Customer Dimension
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            تحليل تفصيلي لأداء العملاء، إجمالي القيمة، عدد العمليات ومتوسط الفاتورة
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {onExportCustomers && (
            <button
              type="button"
              onClick={onExportCustomers}
              className="px-2.5 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg border border-emerald-300 dark:border-emerald-700 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
              title="تخصيص وتصدير جدول العملاء بصيغة Excel أو CSV"
            >
              <span>📊</span>
              <span>تصدير العملاء (Excel / CSV)</span>
            </button>
          )}

          <input
            type="text"
            placeholder="بحث في أسماء العملاء..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            style={{ accentColor: 'var(--theme-primary)' }}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-1.5 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--theme-ring)] focus:border-[var(--theme-primary)] w-full sm:w-44 transition-all"
          />

          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg px-2 py-1.5 focus:bg-white dark:focus:bg-slate-800 cursor-pointer"
          >
            <option value={5}>5 صفوف</option>
            <option value={10}>10 صفوف</option>
            <option value={25}>25 صفاً</option>
          </select>
        </div>
      </div>

      {/* Table Viewport */}
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead
            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold border-b-2"
            style={{ borderBottomColor: 'var(--theme-primary-border)' }}
          >
            <tr>
              <th className="py-3.5 px-4 w-12 text-center text-slate-500 dark:text-slate-400 font-bold">#</th>
              <th
                onClick={() => handleSort('customerName')}
                className="py-3.5 px-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-bold text-slate-900 dark:text-white min-w-[180px]"
              >
                <div className="flex items-center gap-1">
                  <span>اسم العميل (Customer Name)</span>
                  {sortField === 'customerName' && (
                    <span className="font-black" style={{ color: 'var(--theme-primary)' }}>{sortOrder === 'desc' ? ' ↓' : ' ↑'}</span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('totalSales')}
                className="py-3.5 px-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left font-bold text-slate-950 dark:text-white min-w-[140px]"
              >
                <div className="flex items-center justify-end gap-1">
                  <span className="text-slate-950 dark:text-white font-black">إجمالي القيمة (SUM Sales)</span>
                  {sortField === 'totalSales' && (
                    <span className="font-black" style={{ color: 'var(--theme-primary)' }}>{sortOrder === 'desc' ? ' ↓' : ' ↑'}</span>
                  )}
                </div>
              </th>
              <th className="py-3.5 px-4 w-32 hidden md:table-cell text-center font-bold text-slate-900 dark:text-white">
                نسبة الإسهام
              </th>
              <th
                onClick={() => handleSort('totalQuantity')}
                className="py-3.5 px-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left font-bold text-slate-900 dark:text-white min-w-[100px]"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>الكمية (SUM Quantity)</span>
                  {sortField === 'totalQuantity' && (
                    <span className="text-blue-600 dark:text-blue-400 font-black">{sortOrder === 'desc' ? ' ↓' : ' ↑'}</span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('orderCount')}
                className="py-3.5 px-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left font-bold text-slate-900 dark:text-white min-w-[90px]"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>الطلبيات (COUNT Orders)</span>
                  {sortField === 'orderCount' && (
                    <span className="text-blue-600 dark:text-blue-400 font-black">{sortOrder === 'desc' ? ' ↓' : ' ↑'}</span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('avgOrderValue')}
                className="py-3.5 px-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left font-bold text-slate-900 dark:text-white min-w-[120px]"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>متوسط الطلب (AOV)</span>
                  {sortField === 'avgOrderValue' && (
                    <span className="text-blue-600 dark:text-blue-400 font-black">{sortOrder === 'desc' ? ' ↓' : ' ↑'}</span>
                  )}
                </div>
              </th>
              <th className="py-3.5 px-4 text-center w-24 min-w-[100px] font-bold text-slate-900 dark:text-white">تصفية</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400 dark:text-slate-500">
                  لا توجد سجلات مطابقة للبحث
                </td>
              </tr>
            ) : (
              paginated.map((c, idx) => {
                const globalIndex = (currentPage - 1) * pageSize + idx + 1;
                const isSelected = selectedCustomer === c.customerName;
                const barWidth = Math.max(4, (c.totalSales / maxSales) * 100);

                return (
                  <tr
                    key={c.customerName}
                    style={isSelected ? { backgroundColor: 'var(--theme-primary-light)' } : undefined}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                      isSelected ? 'font-semibold' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-center text-slate-400 tabular-numbers">
                      {globalIndex}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-white min-w-[180px]">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <span className="font-bold text-slate-900 dark:text-white break-words">{c.customerName}</span>
                        {c.segment && (
                          <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 w-fit shrink-0">
                            {c.segment}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-left font-bold text-slate-900 dark:text-white tabular-numbers">
                      {formatCurrency(c.totalSales, currency)}
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${barWidth}%`,
                              backgroundColor: 'var(--theme-primary)',
                            }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-numbers w-10 text-left">
                          {formatPercent(c.percentageOfTotal)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-left tabular-numbers text-slate-700 dark:text-slate-300">
                      {formatNumber(c.totalQuantity)}{' '}
                      <span className="text-[10px] text-slate-400">عبوة</span>
                    </td>
                    <td className="py-3 px-4 text-left tabular-numbers text-slate-700 dark:text-slate-300">
                      {formatNumber(c.orderCount)}{' '}
                      <span className="text-[10px] text-slate-400">طلب</span>
                    </td>
                    <td className="py-3 px-4 text-left font-medium text-slate-800 dark:text-slate-200 tabular-numbers">
                      {formatCurrency(c.avgOrderValue, currency)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() =>
                            onSelectCustomer(isSelected ? '' : c.customerName)
                          }
                          style={
                            isSelected
                              ? { backgroundColor: 'var(--theme-primary)', color: '#ffffff' }
                              : undefined
                          }
                          className={`text-[11px] px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                            isSelected
                              ? 'font-bold shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                          title="تصفية حسب هذا العميل"
                        >
                          {isSelected ? 'إلغاء' : 'تحديد'}
                        </button>
                        {onOpenInvoiceForCustomer && (
                          <button
                            onClick={() => onOpenInvoiceForCustomer(c.customerName)}
                            style={{
                              backgroundColor: 'var(--theme-primary-light)',
                              color: 'var(--theme-text-accent)',
                              borderColor: 'var(--theme-primary-border)',
                            }}
                            className="text-[11px] px-2 py-1 rounded-md font-semibold cursor-pointer border flex items-center gap-1 transition-colors hover:brightness-105"
                            title="عرض وتنزيل فاتورة PDF للعميل"
                          >
                            <span>📄</span>
                            <span className="hidden sm:inline">فاتورة</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-850">
        <div>
          العدد الإجمالي: <span className="font-bold text-slate-800 dark:text-white">{sorted.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            السابق
          </button>
          <span className="tabular-numbers">
            صفحة {currentPage} من {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            التالي
          </button>
        </div>
      </div>
    </div>
  );
};
