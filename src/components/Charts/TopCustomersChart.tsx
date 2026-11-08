import React from 'react';
import { CurrencyCode, CustomerSummary } from '../../types';
import { formatCurrency, formatNumber, formatPercent } from '../../utils/formatters';

interface TopCustomersChartProps {
  customers: CustomerSummary[];
  currency: CurrencyCode;
  selectedCustomer: string;
  onSelectCustomer: (customerName: string) => void;
}

export const TopCustomersChart: React.FC<TopCustomersChartProps> = ({
  customers,
  currency,
  selectedCustomer,
  onSelectCustomer,
}) => {
  const top5 = customers.slice(0, 5);
  const maxSales = top5.length > 0 ? top5[0].totalSales : 1;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs card-realistic flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span>أعلى 5 عملاء شراءً (Top 5 Customers)</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Bar Chart</span>
          </h3>
          <span className="text-xs font-semibold theme-text-primary">
            حسب إجمالي المبيعات
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          اضغط على أي عميل لتصفية كامل لوحة البيانات وفق مشترياته
        </p>

        {top5.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-slate-400 dark:text-slate-500 text-xs">
            لا توجد بيانات مطابقة
          </div>
        ) : (
          <div className="space-y-3.5">
            {top5.map((c, idx) => {
              const widthPct = Math.max(8, (c.totalSales / maxSales) * 100);
              const isSelected = selectedCustomer === c.customerName;

              return (
                <div
                  key={c.customerName}
                  onClick={() =>
                    onSelectCustomer(isSelected ? '' : c.customerName)
                  }
                  style={
                    isSelected
                      ? {
                          backgroundColor: 'var(--theme-primary-light)',
                          borderColor: 'var(--theme-primary)',
                        }
                      : undefined
                  }
                  className={`group p-2.5 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'shadow-xs'
                      : 'bg-slate-50/60 dark:bg-slate-850 border-slate-200/70 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2 font-bold text-slate-850 dark:text-slate-100 truncate">
                      <span
                        className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          idx === 0
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                            : idx === 1
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            : idx === 2
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="truncate group-hover:opacity-80 transition-opacity">
                        {c.customerName}
                      </span>
                      {isSelected && (
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.2 rounded border"
                          style={{
                            backgroundColor: 'var(--theme-badge-bg)',
                            color: 'var(--theme-badge-text)',
                            borderColor: 'var(--theme-primary-border)',
                          }}
                        >
                          نشط
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-slate-900 dark:text-white tabular-numbers">
                        {formatCurrency(c.totalSales, currency)}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                        ({formatPercent(c.percentageOfTotal)})
                      </span>
                    </div>
                  </div>

                  {/* Visual Bar */}
                  <div className="w-full bg-slate-200/80 dark:bg-slate-800 rounded-full h-2 overflow-hidden flex">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${widthPct}%`,
                        background: isSelected
                          ? 'var(--theme-primary)'
                          : `var(--theme-chart-${Math.min(5, idx + 1)}, var(--theme-primary))`,
                      }}
                    />
                  </div>

                  {/* Micro footer: items & orders */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1 pt-0.5">
                    <span>
                      {c.orderCount} طلبيات · {formatNumber(c.totalQuantity)} عبوة
                    </span>
                    <span>
                      متوسط الفاتورة: {formatCurrency(c.avgOrderValue, currency)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-800 mt-4">
        <span>المقياس: SUM(Total Sales) تنازلياً</span>
        <span>المحدد: Top 5 Dimensions</span>
      </div>
    </div>
  );
};
