import React, { useState } from 'react';
import { CurrencyCode, ItemSummary } from '../../types';
import { formatCurrency, formatNumber, formatPercent } from '../../utils/formatters';

interface ItemQuantityDonutProps {
  items: ItemSummary[];
  currency: CurrencyCode;
  selectedItem: string;
  onSelectItem: (itemName: string) => void;
}

const DONUT_COLORS = [
  'var(--theme-chart-1, #2563EB)',
  'var(--theme-chart-2, #0D9488)',
  'var(--theme-chart-3, #7C3AED)',
  'var(--theme-chart-4, #D97706)',
  'var(--theme-chart-5, #E11D48)',
  '#64748B',
];

export const ItemQuantityDonut: React.FC<ItemQuantityDonutProps> = ({
  items,
  currency,
  selectedItem,
  onSelectItem,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Group top 4 items by quantity, rest to 'أخرى'
  const sortedByQty = [...items].sort((a, b) => b.totalQuantity - a.totalQuantity);
  const top4 = sortedByQty.slice(0, 4);
  const remaining = sortedByQty.slice(4);
  const totalAllQty = items.reduce((sum, it) => sum + it.totalQuantity, 0);

  interface SliceData {
    name: string;
    quantity: number;
    sales: number;
    color: string;
    pct: number;
  }

  const slices: SliceData[] = top4.map((it, idx) => ({
    name: it.itemName,
    quantity: it.totalQuantity,
    sales: it.totalSales,
    color: DONUT_COLORS[idx % DONUT_COLORS.length],
    pct: totalAllQty > 0 ? it.totalQuantity / totalAllQty : 0,
  }));

  if (remaining.length > 0) {
    const remainingQty = remaining.reduce((s, it) => s + it.totalQuantity, 0);
    const remainingSales = remaining.reduce((s, it) => s + it.totalSales, 0);
    slices.push({
      name: `أخرى (${remaining.length} أصناف)`,
      quantity: remainingQty,
      sales: remainingSales,
      color: DONUT_COLORS[5],
      pct: totalAllQty > 0 ? remainingQty / totalAllQty : 0,
    });
  }

  // Calculate SVG stroke dashes for Donut
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  let accumulatedOffset = 0;

  const svgSlices = slices.map((s, idx) => {
    const strokeDasharray = `${s.pct * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedOffset;
    accumulatedOffset += s.pct * circumference;
    return {
      ...s,
      index: idx,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const activeSlice = hoveredIdx !== null ? slices[hoveredIdx] : null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs card-realistic flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span>حصة الكميات المباعة (Donut Chart)</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Quantity Share</span>
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            توزيع العبوات
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          نسبة كل صنف من إجمالي حجم الوحدات المباعة للعملاء
        </p>

        {totalAllQty === 0 ? (
          <div className="flex items-center justify-center h-48 text-slate-400 dark:text-slate-500 text-xs">
            لا توجد مبيعات مسجلة
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Donut SVG */}
            <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90 transform">
                {/* Background Ring */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke="currentColor"
                  className="text-slate-100 dark:text-slate-800"
                  strokeWidth="20"
                />
                {/* Slices */}
                {svgSlices.map((sl) => {
                  const isHovered = hoveredIdx === sl.index;
                  return (
                    <circle
                      key={sl.name}
                      cx="80"
                      cy="80"
                      r={radius}
                      fill="transparent"
                      stroke={sl.color}
                      strokeWidth={isHovered ? 24 : 20}
                      strokeDasharray={sl.strokeDasharray}
                      strokeDashoffset={sl.strokeDashoffset}
                      strokeLinecap="butt"
                      className="transition-all duration-200 cursor-pointer"
                      onMouseEnter={() => setHoveredIdx(sl.index)}
                      onMouseLeave={() => setHoveredIdx(null)}
                      onClick={() => {
                        if (!sl.name.startsWith('أخرى')) {
                          onSelectItem(selectedItem === sl.name ? '' : sl.name);
                        }
                      }}
                    />
                  );
                })}
              </svg>

              {/* Center Metrics */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-2">
                {activeSlice ? (
                  <>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[90px] font-medium">
                      {activeSlice.name}
                    </span>
                    <span className="text-base font-bold text-slate-900 dark:text-white tabular-numbers">
                      {formatPercent(activeSlice.pct)}
                    </span>
                    <span className="text-[9px] text-slate-400 tabular-numbers">
                      {formatNumber(activeSlice.quantity)} عبوة
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                      إجمالي العبوات
                    </span>
                    <span className="text-lg font-bold text-slate-900 dark:text-white tabular-numbers">
                      {formatNumber(totalAllQty)}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">عبوة</span>
                  </>
                )}
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-2 w-full text-xs">
              {slices.map((sl, idx) => {
                const isSelected = selectedItem === sl.name;
                const isHovered = hoveredIdx === idx;

                return (
                  <div
                    key={sl.name}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    onClick={() => {
                      if (!sl.name.startsWith('أخرى')) {
                        onSelectItem(isSelected ? '' : sl.name);
                      }
                    }}
                    style={
                      isSelected
                        ? {
                            backgroundColor: 'var(--theme-primary-light)',
                            borderColor: 'var(--theme-primary-border)',
                          }
                        : undefined
                    }
                    className={`flex items-center justify-between p-1.5 rounded-lg border transition-colors cursor-pointer ${
                      isSelected
                        ? 'font-bold shadow-xs'
                        : isHovered
                        ? 'bg-slate-100/90 dark:bg-slate-800 border-transparent'
                        : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: sl.color }}
                      />
                      <span className="truncate text-slate-700 dark:text-slate-200">
                        {sl.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-slate-900 dark:text-white tabular-numbers">
                        {formatNumber(sl.quantity)}
                      </span>
                      <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px] w-10 text-left">
                        {formatPercent(sl.pct)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-800 mt-4">
        <span>مقياس Looker: SUM(Quantity) كنسبة مئوية</span>
        <span>دائري مجوف (Hole: 65%)</span>
      </div>
    </div>
  );
};
