import React, { useState } from 'react';
import { CurrencyCode, ItemSummary } from '../types';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';

interface ItemSalesTableProps {
  items: ItemSummary[];
  currency: CurrencyCode;
  selectedItem: string;
  onSelectItem: (itemName: string) => void;
  onExportItems?: () => void;
}

type SortField = 'itemName' | 'category' | 'totalQuantity' | 'avgUnitPrice' | 'totalSales' | 'percentageOfTotal';
type SortOrder = 'asc' | 'desc';

export const ItemSalesTable: React.FC<ItemSalesTableProps> = ({
  items,
  currency,
  selectedItem,
  onSelectItem,
  onExportItems,
}) => {
  const [sortField, setSortField] = useState<SortField>('totalSales');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Categories list for table filter
  const categories = Array.from(new Set(items.map((it) => it.category)));

  // Filter
  const filtered = items.filter((it) => {
    const matchesSearch =
      it.itemName.toLowerCase().includes(search.toLowerCase()) ||
      it.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || it.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let comp = 0;
    if (sortField === 'itemName' || sortField === 'category') {
      comp = a[sortField].localeCompare(b[sortField], 'ar');
    } else {
      comp = a[sortField] - b[sortField];
    }
    return sortOrder === 'desc' ? -comp : comp;
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

  const maxSales = items.length > 0 ? Math.max(...items.map((i) => i.totalSales)) : 1;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs card-realistic overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              جدول 2: تحليل مبيعات الأصناف والكميات (Table 2: Sales by Item & Quantity)
            </h3>
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded border"
              style={{
                backgroundColor: 'var(--theme-primary-light)',
                color: 'var(--theme-text-accent)',
                borderColor: 'var(--theme-primary-border)',
              }}
            >
              Item & Quantity Dimensions
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            توزيع الكميات الإجمالية، متوسط سعر الوحدة ونسبة إسهام كل صنف في المبيعات
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {onExportItems && (
            <button
              type="button"
              onClick={onExportItems}
              className="px-2.5 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg border border-emerald-300 dark:border-emerald-700 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
              title="تخصيص وتصدير جدول الأصناف بصيغة Excel أو CSV"
            >
              <span>📊</span>
              <span>تصدير الأصناف (Excel / CSV)</span>
            </button>
          )}

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg px-2.5 py-1.5 focus:bg-white dark:focus:bg-slate-800 cursor-pointer"
          >
            <option value="all">كافة الفئات</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Search Box */}
          <input
            type="text"
            placeholder="بحث في الأصناف..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-1.5 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--theme-ring)] focus:border-[var(--theme-primary)] w-full sm:w-40 transition-all"
          />

          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg px-2 py-1.5 focus:bg-white dark:focus:bg-slate-800 cursor-pointer"
          >
            <option value={5}>5 أصناف</option>
            <option value={10}>10 أصناف</option>
            <option value={20}>20 صنفاً</option>
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
                onClick={() => handleSort('itemName')}
                className="py-3.5 px-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-bold text-slate-900 dark:text-white"
              >
                <div className="flex items-center gap-1">
                  <span>اسم الصنف (Item Name)</span>
                  {sortField === 'itemName' && (
                    <span className="font-black" style={{ color: 'var(--theme-primary)' }}>{sortOrder === 'desc' ? ' ↓' : ' ↑'}</span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('category')}
                className="py-3.5 px-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors hidden sm:table-cell font-bold text-slate-900 dark:text-white"
              >
                <div className="flex items-center gap-1">
                  <span>الفئة (Category)</span>
                  {sortField === 'category' && (
                    <span className="font-black" style={{ color: 'var(--theme-primary)' }}>{sortOrder === 'desc' ? ' ↓' : ' ↑'}</span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('totalQuantity')}
                className="py-3.5 px-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left font-bold text-slate-900 dark:text-white"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>الكمية (SUM Quantity)</span>
                  {sortField === 'totalQuantity' && (
                    <span className="font-black" style={{ color: 'var(--theme-primary)' }}>{sortOrder === 'desc' ? ' ↓' : ' ↑'}</span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('avgUnitPrice')}
                className="py-3.5 px-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left font-bold text-slate-900 dark:text-white"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>متوسط السعر (Unit Price)</span>
                  {sortField === 'avgUnitPrice' && (
                    <span className="font-black" style={{ color: 'var(--theme-primary)' }}>{sortOrder === 'desc' ? ' ↓' : ' ↑'}</span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('totalSales')}
                className="py-3.5 px-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left font-bold text-slate-950 dark:text-white"
              >
                <div className="flex items-center justify-end gap-1">
                  <span className="text-slate-950 dark:text-white font-black">إجمالي المبيعات (SUM Total Sales)</span>
                  {sortField === 'totalSales' && (
                    <span className="font-black" style={{ color: 'var(--theme-primary)' }}>{sortOrder === 'desc' ? ' ↓' : ' ↑'}</span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('percentageOfTotal')}
                className="py-3.5 px-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left w-36 font-bold text-slate-900 dark:text-white"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>نسبة الإسهام (% of Sales)</span>
                  {sortField === 'percentageOfTotal' && (
                    <span className="font-black" style={{ color: 'var(--theme-primary)' }}>{sortOrder === 'desc' ? ' ↓' : ' ↑'}</span>
                  )}
                </div>
              </th>
              <th className="py-3.5 px-4 text-center w-20 font-bold text-slate-900 dark:text-white">تصفية</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400 dark:text-slate-500">
                  لا توجد أصناف مطابقة للبحث
                </td>
              </tr>
            ) : (
              paginated.map((it, idx) => {
                const globalIndex = (currentPage - 1) * pageSize + idx + 1;
                const isSelected = selectedItem === it.itemName;
                const barWidth = Math.max(3, (it.totalSales / maxSales) * 100);

                return (
                  <tr
                    key={it.itemName}
                    style={isSelected ? { backgroundColor: 'var(--theme-primary-light)' } : undefined}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                      isSelected ? 'font-semibold' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-center text-slate-400 tabular-numbers">
                      {globalIndex}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span>{it.itemName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 hidden sm:table-cell">
                      <span>{it.category}</span>
                    </td>
                    <td className="py-3 px-4 text-left font-bold text-slate-900 dark:text-white tabular-numbers">
                      {formatNumber(it.totalQuantity)}{' '}
                      <span className="text-[10px] font-normal text-slate-400">عبوة</span>
                    </td>
                    <td className="py-3 px-4 text-left text-slate-700 dark:text-slate-300 tabular-numbers">
                      {formatCurrency(it.avgUnitPrice, currency)}
                    </td>
                    <td className="py-3 px-4 text-left font-bold text-slate-900 dark:text-white tabular-numbers">
                      {formatCurrency(it.totalSales, currency)}
                    </td>
                    <td className="py-3 px-4 text-left">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${barWidth}%`,
                              backgroundColor: 'var(--theme-primary)',
                            }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 tabular-numbers w-11 text-left">
                          {formatPercent(it.percentageOfTotal)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() =>
                          onSelectItem(isSelected ? '' : it.itemName)
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
                        title="تصفية التقرير حسب هذا الصنف"
                      >
                        {isSelected ? 'إلغاء' : 'تحديد'}
                      </button>
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
