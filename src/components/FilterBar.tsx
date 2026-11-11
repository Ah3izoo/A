import React from 'react';
import { FilterState } from '../types';

interface FilterBarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  customersList: string[];
  categoriesList: string[];
  itemsList: string[];
  salesRepsList: string[];
  totalFiltered: number;
  totalRecords: number;
  onReset: () => void;
  onExportCSV: () => void;
  onExportExcel?: () => void;
  onPrint: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  setFilters,
  customersList,
  categoriesList,
  itemsList,
  salesRepsList,
  totalFiltered,
  totalRecords,
  onReset,
  onExportCSV,
  onExportExcel,
  onPrint,
}) => {
  const isFiltered =
    filters.dateRange !== 'all' ||
    filters.selectedCustomer !== '' ||
    filters.selectedCategory !== '' ||
    filters.selectedItem !== '' ||
    filters.selectedSalesRep !== '' ||
    filters.searchQuery !== '';

  return (
    <div
      className="bg-white dark:bg-slate-900 rounded-xl border shadow-xs card-realistic p-4 mb-6"
      style={{ borderColor: 'var(--theme-primary-border)' }}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Side: Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 flex-1">
          {/* 1. Date Range Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              النطاق الزمني (Date Range)
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  dateRange: e.target.value as FilterState['dateRange'],
                }))
              }
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--theme-ring)] focus:border-[var(--theme-primary)] cursor-pointer transition-all"
            >
              <option value="all" className="dark:bg-slate-800">جميع الفترات (All Time)</option>
              <option value="today" className="dark:bg-slate-800">اليوم (Today / تقرير يومي)</option>
              <option value="thisWeek" className="dark:bg-slate-800">هذا الأسبوع (Current Week)</option>
              <option value="7days" className="dark:bg-slate-800">آخر 7 أيام (Last 7 Days)</option>
              <option value="30days" className="dark:bg-slate-800">آخر 30 يوماً (Last 30 Days)</option>
              <option value="90days" className="dark:bg-slate-800">آخر 90 يوماً (Last Quarter)</option>
              <option value="thisMonth" className="dark:bg-slate-800">هذا الشهر (This Month)</option>
              <option value="lastMonth" className="dark:bg-slate-800">الشهر الماضي (Last Month)</option>
              <option value="custom" className="dark:bg-slate-800">نطاق مخصص (Custom)...</option>
            </select>
          </div>

          {/* 2. Sales Rep Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              مندوب المبيعات (Sales Rep)
            </label>
            <select
              value={filters.selectedSalesRep}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, selectedSalesRep: e.target.value }))
              }
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--theme-ring)] focus:border-[var(--theme-primary)] cursor-pointer truncate transition-all"
            >
              <option value="" className="dark:bg-slate-800">كافة المناديب ({salesRepsList.length})</option>
              {salesRepsList.map((rep) => (
                <option key={rep} value={rep} className="dark:bg-slate-800">
                  {rep}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Customer Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              العميل / الصيدلية (Customer)
            </label>
            <select
              value={filters.selectedCustomer}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, selectedCustomer: e.target.value }))
              }
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--theme-ring)] focus:border-[var(--theme-primary)] cursor-pointer truncate transition-all"
            >
              <option value="" className="dark:bg-slate-800">كافة العملاء ({customersList.length})</option>
              {customersList.map((c) => (
                <option key={c} value={c} className="dark:bg-slate-800">
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Category Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              التصنيف الطبي (Category)
            </label>
            <select
              value={filters.selectedCategory}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  selectedCategory: e.target.value,
                  selectedItem: '',
                }))
              }
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--theme-ring)] focus:border-[var(--theme-primary)] cursor-pointer transition-all"
            >
              <option value="" className="dark:bg-slate-800">كافة التصنيفات</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat} className="dark:bg-slate-800">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Item / Product Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              الصنف الدوائي (Item)
            </label>
            <select
              value={filters.selectedItem}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, selectedItem: e.target.value }))
              }
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--theme-ring)] focus:border-[var(--theme-primary)] cursor-pointer truncate transition-all"
            >
              <option value="" className="dark:bg-slate-800">كافة الأصناف ({itemsList.length})</option>
              {itemsList.map((itm) => (
                <option key={itm} value={itm} className="dark:bg-slate-800">
                  {itm}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Side: Search & Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
          {/* Custom Date Pickers */}
          {filters.dateRange === 'custom' && (
            <div className="flex items-center gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">من</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters((p) => ({ ...p, startDate: e.target.value }))}
                  className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg px-2 py-1.5 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">إلى</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters((p) => ({ ...p, endDate: e.target.value }))}
                  className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg px-2 py-1.5 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Search input */}
          <div className="w-full sm:w-44">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">بحث سريع</label>
            <input
              type="text"
              placeholder="بحث في كل الحقول..."
              value={filters.searchQuery}
              onChange={(e) => setFilters((p) => ({ ...p, searchQuery: e.target.value }))}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--theme-ring)] focus:border-[var(--theme-primary)] transition-all"
            />
          </div>

          {/* Reset button */}
          {isFiltered && (
            <button
              onClick={onReset}
              className="px-2.5 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              title="إعادة تعيين الفلاتر"
            >
              إلغاء التصفية
            </button>
          )}

          {/* Export & Print */}
          <div className="flex items-center gap-1.5 no-print">
            {onExportExcel && (
              <button
                onClick={onExportExcel}
                style={{
                  backgroundColor: 'var(--theme-primary-light)',
                  color: 'var(--theme-text-accent)',
                  borderColor: 'var(--theme-primary-border)',
                }}
                className="px-2.5 py-1.5 text-xs font-bold border rounded-lg transition-all hover:brightness-105 whitespace-nowrap cursor-pointer flex items-center gap-1 shadow-2xs"
                title="تصدير تقرير مفصل للأصناف والطلبيات بصيغة إكسل"
              >
                <span>Excel 📊</span>
              </button>
            )}
            <button
              onClick={onExportCSV}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              title="تنزيل جدول البيانات CSV"
            >
              تصدير CSV
            </button>
            <button
              onClick={onPrint}
              style={{
                backgroundColor: 'var(--theme-primary-light)',
                color: 'var(--theme-text-accent)',
                borderColor: 'var(--theme-primary-border)',
              }}
              className="px-2.5 py-1.5 text-xs font-bold border rounded-lg transition-all hover:brightness-105 whitespace-nowrap cursor-pointer"
              title="طباعة التقرير أو حفظ كـ PDF"
            >
              طباعة / PDF
            </button>
          </div>
        </div>
      </div>

      {/* Filter status ticker & Quick Range Shortcuts */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <span>نتائج العرض:</span>
          <span className="font-bold text-slate-800 dark:text-white tabular-numbers">
            {totalFiltered} من إجمالي {totalRecords} عملية
          </span>
          {isFiltered && (
            <span className="text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded text-[11px] font-medium border border-amber-200/60 dark:border-amber-800">
              تصفية مفعلة
            </span>
          )}
          {filters.dateRange === 'thisWeek' && (
            <span className="text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded text-[11px] font-semibold border border-blue-200 dark:border-blue-800 flex items-center gap-1">
              <span>📅</span>
              <span>هذا الأسبوع (Current Week)</span>
            </span>
          )}
        </div>

        {/* Quick 1-Tap Date Filters for Sales Rep */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:pb-0">
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 shrink-0">اختصار:</span>
          <button
            type="button"
            onClick={() => setFilters((p) => ({ ...p, dateRange: 'today' }))}
            className={`px-2.5 py-1 text-[11px] rounded-lg font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
              filters.dateRange === 'today'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            style={filters.dateRange === 'today' ? { backgroundColor: 'var(--theme-primary)' } : {}}
            title="تصفية فواتير اليوم فقط (تقرير يومي)"
          >
            <span>📅 اليوم</span>
          </button>
          <button
            type="button"
            onClick={() => setFilters((p) => ({ ...p, dateRange: 'thisWeek' }))}
            className={`px-2.5 py-1 text-[11px] rounded-lg font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
              filters.dateRange === 'thisWeek'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            style={filters.dateRange === 'thisWeek' ? { backgroundColor: 'var(--theme-primary)' } : {}}
            title="تصفية فواتير هذا الأسبوع لمتابعة أداء المندوب"
          >
            <span>هذا الأسبوع</span>
          </button>
          <button
            type="button"
            onClick={() => setFilters((p) => ({ ...p, dateRange: '7days' }))}
            className={`px-2 py-1 text-[11px] rounded-lg font-medium transition-all cursor-pointer shrink-0 ${
              filters.dateRange === '7days'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            style={filters.dateRange === '7days' ? { backgroundColor: 'var(--theme-primary)' } : {}}
            title="آخر 7 أيام"
          >
            آخر 7 أيام
          </button>
          <button
            type="button"
            onClick={() => setFilters((p) => ({ ...p, dateRange: 'thisMonth' }))}
            className={`px-2 py-1 text-[11px] rounded-lg font-medium transition-all cursor-pointer shrink-0 ${
              filters.dateRange === 'thisMonth'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            style={filters.dateRange === 'thisMonth' ? { backgroundColor: 'var(--theme-primary)' } : {}}
            title="هذا الشهر"
          >
            هذا الشهر
          </button>
          <button
            type="button"
            onClick={() => setFilters((p) => ({ ...p, dateRange: 'all' }))}
            className={`px-2 py-1 text-[11px] rounded-lg font-medium transition-all cursor-pointer shrink-0 ${
              filters.dateRange === 'all'
                ? 'bg-slate-700 text-white dark:bg-slate-600 font-bold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title="عرض جميع الفترات"
          >
            الكل
          </button>
        </div>
      </div>
    </div>
  );
};
