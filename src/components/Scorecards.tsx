import React from 'react';
import { CurrencyCode } from '../types';
import { formatCurrency, formatNumber } from '../utils/formatters';

interface ScorecardsProps {
  totalRevenue: number;
  totalQuantity: number;
  distinctCustomers: number;
  orderCount: number;
  averageOrderValue: number;
  currency: CurrencyCode;
}

export const Scorecards: React.FC<ScorecardsProps> = ({
  totalRevenue,
  totalQuantity,
  distinctCustomers,
  orderCount,
  averageOrderValue,
  currency,
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-5 sm:mb-6">
      {/* 1. إجمالي القيمة (SUM Sales) */}
      <div
        className="glass-panel rounded-2xl p-3.5 sm:p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden group border"
        style={{ borderColor: 'var(--theme-primary-border)' }}
      >
        <div
          className="absolute top-0 right-0 left-0 h-1"
          style={{ background: 'linear-gradient(90deg, var(--theme-chart-1, #2563eb) 0%, var(--theme-chart-2, #0284c7) 100%)' }}
        />
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-black text-slate-900 dark:text-white">
            إجمالي القيمة (SUM Sales)
          </span>
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-md font-mono border"
            style={{
              backgroundColor: 'var(--theme-primary-light)',
              color: 'var(--theme-text-accent)',
              borderColor: 'var(--theme-primary-border)',
            }}
          >
            SUM
          </span>
        </div>
        <div className="text-xl sm:text-2xl lg:text-[26px] font-black text-slate-950 dark:text-white tabular-numbers tracking-tight truncate">
          {formatCurrency(totalRevenue, currency)}
        </div>
        <div
          className="mt-2.5 pt-2 border-t text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between"
          style={{ borderColor: 'var(--theme-primary-border)', opacity: 0.9 }}
        >
          <span className="truncate">صافي المبيعات</span>
          <span
            className="font-bold border px-2 py-0.5 rounded-full text-[10px] shrink-0"
            style={{
              backgroundColor: 'var(--theme-primary-light)',
              color: 'var(--theme-text-accent)',
              borderColor: 'var(--theme-primary-border)',
            }}
          >
            معتمد رسمياً ✓
          </span>
        </div>
      </div>

      {/* 2. إجمالي الكميات المباعة (SUM Quantity) */}
      <div
        className="glass-panel rounded-2xl p-3.5 sm:p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden group border"
        style={{ borderColor: 'var(--theme-primary-border)' }}
      >
        <div
          className="absolute top-0 right-0 left-0 h-1"
          style={{ background: 'linear-gradient(90deg, var(--theme-chart-2, #0284c7) 0%, var(--theme-chart-3, #6366f1) 100%)' }}
        />
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-black text-slate-900 dark:text-white">
            إجمالي الكميات (SUM Qty)
          </span>
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-md font-mono border"
            style={{
              backgroundColor: 'var(--theme-primary-light)',
              color: 'var(--theme-text-accent)',
              borderColor: 'var(--theme-primary-border)',
            }}
          >
            QTY
          </span>
        </div>
        <div className="text-xl sm:text-2xl lg:text-[26px] font-black text-slate-950 dark:text-white tabular-numbers tracking-tight truncate">
          {formatNumber(totalQuantity)}{' '}
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">عبوة</span>
        </div>
        <div
          className="mt-2.5 pt-2 border-t text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between"
          style={{ borderColor: 'var(--theme-primary-border)', opacity: 0.9 }}
        >
          <span className="truncate">حجم الوحدات</span>
          <span
            className="font-bold border px-2 py-0.5 rounded-full text-[10px] shrink-0"
            style={{
              backgroundColor: 'var(--theme-primary-light)',
              color: 'var(--theme-text-accent)',
              borderColor: 'var(--theme-primary-border)',
            }}
          >
            تدفق المستودع
          </span>
        </div>
      </div>

      {/* 3. إجمالي عدد العملاء (COUNT_DISTINCT) */}
      <div
        className="glass-panel rounded-2xl p-3.5 sm:p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden group border"
        style={{ borderColor: 'var(--theme-primary-border)' }}
      >
        <div
          className="absolute top-0 right-0 left-0 h-1"
          style={{ background: 'linear-gradient(90deg, var(--theme-chart-3, #6366f1) 0%, var(--theme-chart-4, #0d9488) 100%)' }}
        />
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-black text-slate-900 dark:text-white">
            عدد العملاء (Clients)
          </span>
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-md font-mono border"
            style={{
              backgroundColor: 'var(--theme-primary-light)',
              color: 'var(--theme-text-accent)',
              borderColor: 'var(--theme-primary-border)',
            }}
          >
            DISTINCT
          </span>
        </div>
        <div className="text-xl sm:text-2xl lg:text-[26px] font-black text-slate-950 dark:text-white tabular-numbers tracking-tight truncate">
          {formatNumber(distinctCustomers)}{' '}
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">عميل</span>
        </div>
        <div
          className="mt-2.5 pt-2 border-t text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between"
          style={{ borderColor: 'var(--theme-primary-border)', opacity: 0.9 }}
        >
          <span className="truncate">توزيع الصيدليات</span>
          <span
            className="font-bold border px-2 py-0.5 rounded-full text-[10px] shrink-0"
            style={{
              backgroundColor: 'var(--theme-primary-light)',
              color: 'var(--theme-text-accent)',
              borderColor: 'var(--theme-primary-border)',
            }}
          >
            {distinctCustomers > 0 ? (orderCount / distinctCustomers).toFixed(1) : 0} لكل عميل
          </span>
        </div>
      </div>

      {/* 4. إجمالي عدد الطلبيات والفواتير (RECORD_COUNT) */}
      <div
        className="glass-panel rounded-2xl p-3.5 sm:p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden group border"
        style={{ borderColor: 'var(--theme-primary-border)' }}
      >
        <div
          className="absolute top-0 right-0 left-0 h-1"
          style={{ background: 'linear-gradient(90deg, var(--theme-chart-4, #0d9488) 0%, var(--theme-chart-1, #2563eb) 100%)' }}
        />
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-black text-slate-900 dark:text-white">
            عدد الطلبيات (Orders)
          </span>
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-md font-mono border"
            style={{
              backgroundColor: 'var(--theme-primary-light)',
              color: 'var(--theme-text-accent)',
              borderColor: 'var(--theme-primary-border)',
            }}
          >
            COUNT
          </span>
        </div>
        <div className="text-xl sm:text-2xl lg:text-[26px] font-black text-slate-950 dark:text-white tabular-numbers tracking-tight truncate">
          {formatNumber(orderCount)}{' '}
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">فاتورة</span>
        </div>
        <div
          className="mt-2.5 pt-2 border-t text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between"
          style={{ borderColor: 'var(--theme-primary-border)', opacity: 0.9 }}
        >
          <span className="truncate">حالة العمليات</span>
          <span
            className="font-bold border px-2 py-0.5 rounded-full text-[10px] shrink-0"
            style={{
              backgroundColor: 'var(--theme-primary-light)',
              color: 'var(--theme-text-accent)',
              borderColor: 'var(--theme-primary-border)',
            }}
          >
            100% مكتملة
          </span>
        </div>
      </div>

      {/* 5. متوسط قيمة الطلبية (AOV) */}
      <div
        className="col-span-2 lg:col-span-1 glass-panel rounded-2xl p-3.5 sm:p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden group border"
        style={{ borderColor: 'var(--theme-primary-border)' }}
      >
        <div
          className="absolute top-0 right-0 left-0 h-1"
          style={{ background: 'linear-gradient(90deg, var(--theme-chart-5, #f59e0b) 0%, var(--theme-chart-1, #2563eb) 100%)' }}
        />
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-black text-slate-900 dark:text-white">
            متوسط الفاتورة (AOV)
          </span>
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-md font-mono border"
            style={{
              backgroundColor: 'var(--theme-primary-light)',
              color: 'var(--theme-text-accent)',
              borderColor: 'var(--theme-primary-border)',
            }}
          >
            AVG
          </span>
        </div>
        <div className="text-xl sm:text-2xl lg:text-[26px] font-black text-slate-950 dark:text-white tabular-numbers tracking-tight truncate">
          {formatCurrency(averageOrderValue, currency)}
        </div>
        <div
          className="mt-2.5 pt-2 border-t text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between"
          style={{ borderColor: 'var(--theme-primary-border)', opacity: 0.9 }}
        >
          <span className="truncate">قيمة المعاملة</span>
          <span
            className="font-bold border px-2 py-0.5 rounded-full text-[10px] shrink-0"
            style={{
              backgroundColor: 'var(--theme-primary-light)',
              color: 'var(--theme-text-accent)',
              borderColor: 'var(--theme-primary-border)',
            }}
          >
            معدل الصيدلية
          </span>
        </div>
      </div>
    </div>
  );
};
