import React from 'react';
import { AppTab } from '../types';

interface AndroidBottomBarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  onOpenAddModal: () => void;
  onOpenInvoiceModal: () => void;
  onOpenOfflineModal?: () => void;
  onOpenSettingsModal?: () => void;
  recordCount: number;
  offlineCount?: number;
}

export const AndroidBottomBar: React.FC<AndroidBottomBarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  onOpenSettingsModal,
  recordCount,
  offlineCount = 0,
}) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 no-print select-none">
      <nav
        className="w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800/80 shadow-[0_-4px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.5)] px-1 pt-1.5"
        style={{
          paddingBottom: 'max(0.45rem, env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          {/* 1. Invoices Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('invoices')}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all cursor-pointer active:scale-95 ${
              activeTab === 'invoices'
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-black shadow-xs ring-1 ring-blue-500/20'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <span className="text-base leading-none">🧾</span>
            <span className="text-[9px] mt-0.5 tracking-tight font-bold">الفواتير</span>
          </button>

          {/* 2. Kambal Orders Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('kambalOrders')}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all cursor-pointer active:scale-95 ${
              activeTab === 'kambalOrders'
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-black shadow-xs ring-1 ring-blue-500/20'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <span className="text-base leading-none">🏢</span>
            <span className="text-[9px] mt-0.5 tracking-tight font-bold">كمبال</span>
          </button>

          {/* 2. Warehouse Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('warehouse')}
            className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-2xl transition-all cursor-pointer active:scale-95 ${
              activeTab === 'warehouse'
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-black shadow-xs ring-1 ring-blue-500/20'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
          >
            <span className="text-lg leading-none">📦</span>
            <span className="text-[10px] mt-0.5 tracking-tight font-bold">المخزن</span>
          </button>

          {/* 3. Center FAB Button: Add Sale */}
          <div className="flex flex-col items-center -mt-3.5 px-0.5">
            <button
              type="button"
              onClick={onOpenAddModal}
              style={{
                background:
                  'linear-gradient(135deg, var(--theme-gradient-start, #2563eb) 0%, var(--theme-gradient-end, #1d4ed8) 100%)',
              }}
              className="w-12 h-12 rounded-2xl text-white flex items-center justify-center shadow-lg shadow-blue-500/30 hover:shadow-xl active:scale-90 transition-all cursor-pointer border-2 border-white dark:border-slate-850 ring-2 ring-blue-500/20"
              title="إضافة فاتورة بيع جديدة"
            >
              <span className="text-2xl font-bold leading-none mb-0.5">+</span>
            </button>
            <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 mt-0.5">
              + فاتورة
            </span>
          </div>

          {/* 4. Items Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('items')}
            className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-2xl transition-all cursor-pointer active:scale-95 ${
              activeTab === 'items'
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-black shadow-xs ring-1 ring-blue-500/20'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
          >
            <span className="text-lg leading-none">💊</span>
            <span className="text-[10px] mt-0.5 tracking-tight font-bold">الأصناف</span>
          </button>

          {/* 5. Customers Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('customers')}
            className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-2xl transition-all cursor-pointer active:scale-95 ${
              activeTab === 'customers'
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-black shadow-xs ring-1 ring-blue-500/20'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
          >
            <span className="text-lg leading-none">👥</span>
            <span className="text-[10px] mt-0.5 tracking-tight font-bold">العملاء</span>
          </button>

          {/* 6. Analytics Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-2xl transition-all cursor-pointer active:scale-95 ${
              activeTab === 'analytics'
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-black shadow-xs ring-1 ring-blue-500/20'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
          >
            <span className="text-lg leading-none">📊</span>
            <span className="text-[10px] mt-0.5 tracking-tight font-bold">التقارير</span>
          </button>

          {/* 7. Settings (Screen Adaptation & Storage) Tab */}
          {onOpenSettingsModal && (
            <button
              type="button"
              onClick={onOpenSettingsModal}
              className="flex flex-col items-center justify-center py-1 px-1.5 rounded-2xl transition-all cursor-pointer active:scale-95 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
              title="إعدادات ملاءمة الشاشة وتخزين الهاتف"
            >
              <span className="text-lg leading-none">⚙️</span>
              <span className="text-[10px] mt-0.5 tracking-tight font-bold">الضبط</span>
            </button>
          )}
        </div>
      </nav>
    </div>
  );
};
