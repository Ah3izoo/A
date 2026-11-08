import React, { useState } from 'react';
import { CurrencyCode, TimeSeriesPoint } from '../../types';
import { formatCurrency, formatNumber } from '../../utils/formatters';

interface TimeSeriesChartProps {
  data: TimeSeriesPoint[];
  currency: CurrencyCode;
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({ data, currency }) => {
  const [metricMode, setMetricMode] = useState<'sales' | 'quantity'>('sales');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs card-realistic flex items-center justify-center h-72 text-slate-400 dark:text-slate-500 text-sm">
        لا توجد بيانات زمنية متاحة
      </div>
    );
  }

  // Values based on selected metric
  const values = data.map((d) => (metricMode === 'sales' ? d.sales : d.quantity));
  const maxVal = Math.max(...values, 10);
  const minVal = 0;

  // Chart dimensions
  const width = 680;
  const height = 220;
  const paddingLeft = 65;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Compute points
  const points = data.map((d, i) => {
    const x = paddingLeft + (i / Math.max(1, data.length - 1)) * chartWidth;
    const val = metricMode === 'sales' ? d.sales : d.quantity;
    const y = paddingTop + chartHeight - ((val - minVal) / (maxVal - minVal)) * chartHeight;
    return { x, y, data: d, val };
  });

  const pathD = points.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, '');

  const areaD =
    points.length > 0
      ? `${pathD} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${
          paddingTop + chartHeight
        } Z`
      : '';

  // Y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => {
    const v = minVal + pct * (maxVal - minVal);
    const y = paddingTop + chartHeight - pct * chartHeight;
    return {
      y,
      label: metricMode === 'sales' ? formatCurrency(v, currency, false) : formatNumber(Math.round(v)),
    };
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs card-realistic flex flex-col justify-between">
      {/* Header & Metric Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span>اتجاه المبيعات الزمني (Time Series Chart)</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Date Dimension</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            تطور أداء المبيعات وحركة الفواتير عبر الأيام والفترات
          </p>
        </div>

        {/* Metric Selector */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setMetricMode('sales')}
            style={metricMode === 'sales' ? { backgroundColor: 'var(--theme-primary)', color: '#ffffff' } : undefined}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              metricMode === 'sales'
                ? 'shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            إجمالي المبيعات
          </button>
          <button
            onClick={() => setMetricMode('quantity')}
            style={metricMode === 'quantity' ? { backgroundColor: 'var(--theme-primary)', color: '#ffffff' } : undefined}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              metricMode === 'quantity'
                ? 'shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            الكميات المباعة
          </button>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-56 select-none"
          preserveAspectRatio="none"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            <linearGradient id="timeSeriesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--theme-primary, #2563EB)" stopOpacity="0.32" />
              <stop offset="100%" stopColor="var(--theme-primary, #2563EB)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map((tick, idx) => (
            <g key={idx}>
              <line
                x1={paddingLeft}
                y1={tick.y}
                x2={width - paddingRight}
                y2={tick.y}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={paddingLeft - 8}
                y={tick.y + 4}
                textAnchor="end"
                className="text-[10px] fill-slate-400 dark:fill-slate-500 font-mono"
              >
                {tick.label}
              </text>
            </g>
          ))}

          {/* Area Fill */}
          <path d={areaD} fill="url(#timeSeriesGradient)" />

          {/* Main Line */}
          <path
            d={pathD}
            fill="none"
            stroke="var(--theme-primary, #2563EB)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points and interactive hover markers */}
          {points.map((pt, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <g
                key={idx}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
              >
                {/* Invisible larger hit circle */}
                <circle cx={pt.x} cy={pt.y} r={12} fill="transparent" />

                {/* Visible dot */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : 3.5}
                  fill={isHovered ? 'var(--theme-primary-hover, #1D4ED8)' : 'var(--theme-primary, #2563EB)'}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  className="transition-all"
                />

                {/* X-axis labels */}
                {(data.length <= 10 || idx % Math.ceil(data.length / 7) === 0 || idx === data.length - 1) && (
                  <text
                    x={pt.x}
                    y={height - 10}
                    textAnchor="middle"
                    className="text-[10px] fill-slate-500 dark:fill-slate-400 font-medium"
                  >
                    {pt.data.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Hover Crosshair */}
          {hoveredIndex !== null && points[hoveredIndex] && (
            <g>
              <line
                x1={points[hoveredIndex].x}
                y1={paddingTop}
                x2={points[hoveredIndex].x}
                y2={paddingTop + chartHeight}
                stroke="#3B82F6"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
            </g>
          )}
        </svg>

        {/* Hover Tooltip Box */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div
            className="absolute top-2 bg-slate-900/95 dark:bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-xl pointer-events-none transition-all border border-slate-700"
            style={{
              left: `${Math.min(
                Math.max(15, (points[hoveredIndex].x / width) * 100),
                80
              )}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="font-semibold text-slate-200 border-b border-slate-700 pb-1 mb-1">
              {points[hoveredIndex].data.label}
            </div>
            <div className="flex items-center justify-between gap-4 text-[11px]">
              <span className="text-slate-400">المبيعات:</span>
              <span className="font-bold tabular-numbers text-emerald-400">
                {formatCurrency(points[hoveredIndex].data.sales, currency)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 text-[11px] mt-0.5">
              <span className="text-slate-400">الكمية:</span>
              <span className="font-bold tabular-numbers text-blue-300">
                {formatNumber(points[hoveredIndex].data.quantity)} عبوة
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 text-[11px] mt-0.5">
              <span className="text-slate-400">الطلبيات:</span>
              <span className="font-bold tabular-numbers text-slate-200">
                {points[hoveredIndex].data.orders} طلب
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
        <span>محاكاة Looker Studio: SUM(Total Sales) عبر Time Dimension</span>
        <span>تسلسل زمني تلقائي</span>
      </div>
    </div>
  );
};
