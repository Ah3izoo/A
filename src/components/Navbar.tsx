import React, { useState } from 'react';
import { AppTab, CurrencyCode, ThemeColor, ThemeMode } from '../types';

interface NavbarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  onOpenAddModal: () => void;
  onOpenPriceModal: () => void;
  onOpenApkModal: () => void;
  onOpenInvoiceModal?: () => void;
  onOpenInvoiceDesignerModal?: () => void;
  onOpenOfflineInvoicesModal?: () => void;
  onOpenCloudSyncModal?: () => void;
  themeMode?: ThemeMode;
  onToggleThemeMode?: () => void;
  themeColor?: ThemeColor;
  onOpenThemeModal?: () => void;
  onOpenSettingsModal?: (tab?: 'screen' | 'storage') => void;
  onOpenSalesRepModal?: () => void;
  recordCount: number;
  salesRepName: string;
  offlineCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currency,
  setCurrency,
  onOpenAddModal,
  onOpenPriceModal,
  onOpenApkModal,
  onOpenInvoiceModal,
  onOpenInvoiceDesignerModal,
  onOpenOfflineInvoicesModal,
  onOpenCloudSyncModal,
  themeMode = 'light',
  onToggleThemeMode,
  themeColor = 'blue',
  onOpenThemeModal,
  onOpenSettingsModal,
  onOpenSalesRepModal,
  recordCount,
  salesRepName,
  offlineCount = 0,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleTabClick = (tab: AppTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header
        className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b transition-colors shadow-2xs"
        style={{ borderBottomColor: 'var(--theme-primary-border)' }}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 sm:gap-6 h-14 sm:h-16">
            {/* Zone 1: Brand & Rep Identifier (ahmed jam) */}
            <div className="flex items-center gap-2.5 shrink-0">
              <a
                href="#invoices"
                onClick={(e) => {
                  e.preventDefault();
                  handleTabClick('invoices');
                }}
                className="flex items-center gap-2.5 group cursor-pointer"
                title="Ahmed App - منصة ولوحة مبيعات الأدوية"
              >
                <div
                  className="h-9 sm:h-10 text-white rounded-xl px-2 py-1 shadow-xs flex items-center justify-center gap-1.5 shrink-0 border border-white/20 transition-all"
                  style={{ background: 'var(--theme-gradient-start, #2563eb)' }}
                >
                  <span className="font-black text-xs tracking-wider">AJ</span>
                  <img
                    src="/assets/aistudio/8db2b587-11d0-4e6c-8537-0c4a7b722628_d90de0e1.png"
                    alt="Ahmed App"
                    className="h-5 w-auto object-contain rounded brightness-105"
                  />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white whitespace-nowrap transition-colors">
                      Ahmed App
                    </span>
                    <span
                      className="hidden sm:inline-block px-1.5 py-0.2 text-[10px] font-black rounded border transition-colors"
                      style={{
                        backgroundColor: 'var(--theme-primary-light, #eff6ff)',
                        color: 'var(--theme-text-accent, #1d4ed8)',
                        borderColor: 'var(--theme-primary-border, #bfdbfe)',
                      }}
                    >
                      Jamjoom
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold sm:hidden truncate max-w-[130px]">
                    {salesRepName}
                  </span>
                </div>
              </a>

              {/* Desktop Sales Rep Badge (Clickable to open Manager Modal with manager credentials) */}
              <button
                type="button"
                onClick={onOpenSalesRepModal}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold shadow-2xs border transition-all cursor-pointer hover:brightness-95 active:scale-95"
                style={{
                  backgroundColor: 'var(--theme-primary-light, #eff6ff)',
                  color: 'var(--theme-text-accent, #1d4ed8)',
                  borderColor: 'var(--theme-primary-border, #bfdbfe)',
                }}
                title="إدارة المناديب وتعيين مندوب التطبيق (خاص بالمدير العام)"
              >
                <span className="text-[11px] opacity-75 font-medium">المندوب:</span>
                <span className="font-black">{salesRepName}</span>
                <span className="text-[10px] opacity-70">🔐</span>
              </button>
            </div>

            {/* Zone 2: Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-4 lg:gap-5 text-xs lg:text-sm font-semibold text-slate-700 dark:text-slate-200">
              <button
                onClick={() => handleTabClick('invoices')}
                style={activeTab === 'invoices' ? { borderColor: 'var(--theme-primary)', color: 'var(--theme-primary)' } : undefined}
                className={`transition-colors whitespace-nowrap cursor-pointer pb-1 border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'invoices'
                    ? 'font-black'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:border-slate-300'
                }`}
              >
                <span>🧾</span>
                <span>الفواتير والطلبيات</span>
              </button>
              <button
                onClick={() => handleTabClick('warehouse')}
                style={activeTab === 'warehouse' ? { borderColor: 'var(--theme-primary)', color: 'var(--theme-primary)' } : undefined}
                className={`transition-colors whitespace-nowrap cursor-pointer pb-1 border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'warehouse'
                    ? 'font-black'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:border-slate-300'
                }`}
              >
                <span>📦</span>
                <span>المخزن والمستودع</span>
              </button>
              <button
                onClick={() => handleTabClick('items')}
                style={activeTab === 'items' ? { borderColor: 'var(--theme-primary)', color: 'var(--theme-primary)' } : undefined}
                className={`transition-colors whitespace-nowrap cursor-pointer pb-1 border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'items'
                    ? 'font-black'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:border-slate-300'
                }`}
              >
                <span>💊</span>
                <span>الأسعار (24 صنف)</span>
              </button>
              <button
                onClick={() => handleTabClick('customers')}
                style={activeTab === 'customers' ? { borderColor: 'var(--theme-primary)', color: 'var(--theme-primary)' } : undefined}
                className={`transition-colors whitespace-nowrap cursor-pointer pb-1 border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'customers'
                    ? 'font-black'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:border-slate-300'
                }`}
              >
                <span>👥</span>
                <span>العملاء</span>
              </button>
              <button
                onClick={() => handleTabClick('analytics')}
                style={activeTab === 'analytics' ? { borderColor: 'var(--theme-primary)', color: 'var(--theme-primary)' } : undefined}
                className={`transition-colors whitespace-nowrap cursor-pointer pb-1 border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'analytics'
                    ? 'font-black'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:border-slate-300'
                }`}
              >
                <span>📊</span>
                <span>التقارير</span>
              </button>
              <button
                onClick={() => handleTabClick('dataSource')}
                style={activeTab === 'dataSource' ? { borderColor: 'var(--theme-primary)', color: 'var(--theme-primary)' } : undefined}
                className={`transition-colors whitespace-nowrap cursor-pointer pb-1 border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'dataSource'
                    ? 'font-black'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:border-slate-300'
                }`}
              >
                <span>🗄️</span>
                <span>النسخ الاحتياطي</span>
              </button>
              <button
                onClick={() => handleTabClick('lookerGuide')}
                style={activeTab === 'lookerGuide' ? { borderColor: 'var(--theme-primary)', color: 'var(--theme-primary)' } : undefined}
                className={`transition-colors whitespace-nowrap cursor-pointer pb-1 border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'lookerGuide'
                    ? 'font-black'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:border-slate-300'
                }`}
              >
                <span>📖</span>
                <span>لوكر ستوديو</span>
              </button>
            </nav>

            {/* Zone 3: Actions & Quick Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

              {/* Currency Selector (Desktop) */}
              <div className="hidden sm:flex items-center border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200">
                <span className="px-1.5 text-slate-500 dark:text-slate-400">العملة:</span>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                  className="bg-transparent text-slate-800 dark:text-slate-100 font-bold focus:outline-none cursor-pointer pr-1 pl-1 py-1"
                  aria-label="اختيار العملة"
                >
                  <option value="SDG" className="dark:bg-slate-800">SDG (ج.س)</option>
                  <option value="SAR" className="dark:bg-slate-800">SAR (ر.س)</option>
                  <option value="USD" className="dark:bg-slate-800">USD ($)</option>
                  <option value="AED" className="dark:bg-slate-800">AED (د.إ)</option>
                  <option value="EGP" className="dark:bg-slate-800">EGP (ج.م)</option>
                  <option value="EUR" className="dark:bg-slate-800">EUR (€)</option>
                </select>
              </div>

              {/* Price List Modifier Button (Desktop) */}
              <button
                onClick={onOpenPriceModal}
                className="hidden lg:flex px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer items-center gap-1.5"
                title="تعديل وتخصيص أسعار الأصناف المعتمدة"
              >
                <span>تغيير الأسعار (24 صنف)</span>
              </button>

              {/* Cloud Sync Firebase & Drive Button (Desktop) */}
              {onOpenCloudSyncModal && (
                <button
                  onClick={onOpenCloudSyncModal}
                  className="hidden md:flex px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer items-center gap-1 shadow-2xs"
                  title="المزامنة السحابية مع Firebase و Google Drive"
                >
                  <span>☁️ سحابي</span>
                </button>
              )}

              {/* Offline Invoices Vault Button (Desktop) */}
              {onOpenOfflineInvoicesModal && (
                <button
                  onClick={onOpenOfflineInvoicesModal}
                  className="hidden md:flex px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer items-center gap-1.5 shadow-2xs"
                  title="استعراض الفواتير المحفوظة أوفلاين على الهاتف"
                >
                  <span>💾 أوفلاين</span>
                  {offlineCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {offlineCount}
                    </span>
                  )}
                </button>
              )}

              {/* 1. Dedicated Button: PDF Shape, Dimensions & Invoice Designer */}
              {(onOpenInvoiceDesignerModal || onOpenInvoiceModal) && (
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenInvoiceDesignerModal) {
                      onOpenInvoiceDesignerModal();
                    } else if (onOpenInvoiceModal) {
                      onOpenInvoiceModal();
                    }
                  }}
                  className="hidden sm:flex px-2.5 sm:px-3 py-1.5 text-xs font-black text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 rounded-xl transition-all whitespace-nowrap cursor-pointer items-center gap-1.5 shadow-xs active:scale-95 border border-amber-300/80 ring-1 ring-amber-400/30"
                  title="التحكم الكامل بأبعاد ومقاسات PDF، وتصميم وشكل الفاتورة، وتحديد شكل الأعمدة وحجم الظهور"
                >
                  <span className="text-sm">📐</span>
                  <span>شكل وأبعاد الفاتورة (PDF)</span>
                </button>
              )}

              {/* Invoice PDF Button (Desktop) */}
              {onOpenInvoiceModal && (
                <button
                  onClick={onOpenInvoiceModal}
                  className="hidden md:flex px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-300 dark:border-blue-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer items-center gap-1 shadow-2xs"
                  title="عرض وطباعة فواتير PDF ملء الشاشة"
                >
                  <span>فواتير PDF 📄</span>
                </button>
              )}

              {/* Built-in Theme Palette Button (Desktop / Tablet) */}
              {onOpenThemeModal && (
                <button
                  type="button"
                  onClick={onOpenThemeModal}
                  style={{
                    backgroundColor: 'var(--theme-primary-light)',
                    borderColor: 'var(--theme-primary-border)',
                    color: 'var(--theme-text-accent)',
                  }}
                  className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border font-black text-xs hover:brightness-105 transition-all cursor-pointer shadow-xs active:scale-95"
                  title="تغيير ثيم وألوان التطبيق من الثيمات الجاهزة (7 باليتات معتمدة)"
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full inline-block shadow-2xs border border-white/50 shrink-0 animate-pulse"
                    style={{ background: 'linear-gradient(135deg, var(--theme-gradient-start, #2563eb) 0%, var(--theme-gradient-end, #1d4ed8) 100%)' }}
                  />
                  <span className="hidden sm:inline">الثيمات</span>
                  <span className="sm:hidden text-xs">🎨</span>
                </button>
              )}

              {/* Settings (Screen Adaptation & Phone Storage) Button (Desktop / Tablet) */}
              {onOpenSettingsModal && (
                <button
                  type="button"
                  onClick={() => onOpenSettingsModal('screen')}
                  className="hidden md:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-bold text-xs cursor-pointer shadow-xs active:scale-95"
                  title="إعدادات ملاءمة الشاشة ونوع الأندرويد وأذونات تخزين الهاتف"
                >
                  <span className="text-sm">⚙️</span>
                  <span className="hidden xl:inline">إعدادات الهاتف</span>
                </button>
              )}

              {/* Balanced Black & White Dark Mode Switcher Button (Desktop / Tablet) */}
              {onToggleThemeMode && (
                <button
                  type="button"
                  onClick={onToggleThemeMode}
                  className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border-2 transition-all cursor-pointer active:scale-95 shadow-2xs select-none
                    bg-white text-black border-black hover:bg-slate-100
                    dark:bg-black dark:text-white dark:border-white dark:hover:bg-slate-900"
                  aria-label={themeMode === 'dark' ? 'التحويل للوضع النهاري (فاتح)' : 'التحويل للوضع الليلي (داكن)'}
                  title={themeMode === 'dark' ? 'التحويل إلى الوضع النهاري (أبيض)' : 'التحويل إلى الوضع الليلي (أسود)'}
                >
                  {/* Balanced B&W Toggle Indicator */}
                  <div
                    className={`w-7 h-4 rounded-full p-0.5 flex items-center transition-all ${
                      themeMode === 'dark' ? 'bg-white justify-end' : 'bg-black justify-start'
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full transition-transform ${
                        themeMode === 'dark' ? 'bg-black' : 'bg-white'
                      }`}
                    />
                  </div>
                  <span className="text-[11px] sm:text-xs font-black tracking-tight whitespace-nowrap">
                    {themeMode === 'dark' ? 'ليلي 🌙' : 'نهاري ☀️'}
                  </span>
                </button>
              )}

              {/* Primary Action Button */}
              <button
                onClick={onOpenAddModal}
                className="btn-realistic-primary px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-white rounded-lg shadow-sm whitespace-nowrap cursor-pointer flex items-center gap-1"
              >
                <span>+ فاتورة بيع</span>
              </button>

              {/* Android Mobile Hamburger Menu Button */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
                aria-label="فتح القائمة الرئيسية"
              >
                <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Android Mobile Slide-Over Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-end bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-4/5 max-w-xs bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col p-4 overflow-y-auto border-l border-slate-200 dark:border-slate-800">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="h-8 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-lg px-2 py-0.5 border border-blue-400/30 shadow-xs flex items-center justify-center font-black text-xs">
                  AJ
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                    ahmed jam
                  </span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                    Jamjoom Pharma
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Rep Info Card */}
            <div className="my-3 p-3 bg-blue-50 dark:bg-blue-950/50 rounded-xl border border-blue-200 dark:border-blue-900/60 text-xs">
              <span className="text-blue-600 dark:text-blue-400 font-semibold block text-[10px]">المندوب الطبي:</span>
              <span className="font-bold text-blue-950 dark:text-blue-100 text-sm block mt-0.5">
                {salesRepName}
              </span>
            </div>

            {/* Navigation Links */}
            <div className="space-y-1.5 flex-1 text-xs font-semibold">
              <button
                onClick={() => handleTabClick('invoices')}
                style={activeTab === 'invoices' ? { backgroundColor: 'var(--theme-primary)', color: '#ffffff' } : undefined}
                className={`w-full text-right px-3 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center gap-2 ${
                  activeTab === 'invoices'
                    ? 'font-bold shadow-xs'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>🧾</span>
                <span>الفواتير والطلبيات</span>
              </button>

              <button
                onClick={() => handleTabClick('warehouse')}
                style={activeTab === 'warehouse' ? { backgroundColor: 'var(--theme-primary)', color: '#ffffff' } : undefined}
                className={`w-full text-right px-3 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center gap-2 ${
                  activeTab === 'warehouse'
                    ? 'font-bold shadow-xs'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>📦</span>
                <span>المخزن والمستودع (الكميات والمتبقي)</span>
              </button>

              <button
                onClick={() => handleTabClick('items')}
                style={activeTab === 'items' ? { backgroundColor: 'var(--theme-primary)', color: '#ffffff' } : undefined}
                className={`w-full text-right px-3 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center gap-2 ${
                  activeTab === 'items'
                    ? 'font-bold shadow-xs'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>💊</span>
                <span>الأصناف والأسعار (24 صنف)</span>
              </button>

              <button
                onClick={() => handleTabClick('customers')}
                style={activeTab === 'customers' ? { backgroundColor: 'var(--theme-primary)', color: '#ffffff' } : undefined}
                className={`w-full text-right px-3 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center gap-2 ${
                  activeTab === 'customers'
                    ? 'font-bold shadow-xs'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>👥</span>
                <span>تحليل مبيعات العملاء</span>
              </button>

              <button
                onClick={() => handleTabClick('analytics')}
                style={activeTab === 'analytics' ? { backgroundColor: 'var(--theme-primary)', color: '#ffffff' } : undefined}
                className={`w-full text-right px-3 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center gap-2 ${
                  activeTab === 'analytics'
                    ? 'font-bold shadow-xs'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>📊</span>
                <span>التقارير والإحصائيات</span>
              </button>

              <button
                onClick={() => handleTabClick('dataSource')}
                style={activeTab === 'dataSource' ? { backgroundColor: 'var(--theme-primary)', color: '#ffffff' } : undefined}
                className={`w-full text-right px-3 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center gap-2 ${
                  activeTab === 'dataSource'
                    ? 'font-bold shadow-xs'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>🗄️</span>
                <span>النسخ الاحتياطي و Excel</span>
              </button>

              <button
                onClick={() => handleTabClick('lookerGuide')}
                style={activeTab === 'lookerGuide' ? { backgroundColor: 'var(--theme-primary)', color: '#ffffff' } : undefined}
                className={`w-full text-right px-3 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center gap-2 ${
                  activeTab === 'lookerGuide'
                    ? 'font-bold shadow-xs'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>📖</span>
                <span>دليل Looker Studio</span>
              </button>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                {/* Mobile Black & White Theme Switcher */}
                {onToggleThemeMode && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl border-2 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{themeMode === 'dark' ? '🌙' : '☀️'}</span>
                      <span className="text-xs font-black">
                        {themeMode === 'dark' ? 'الوضع الليلي (داكن)' : 'الوضع النهاري (فاتح)'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={onToggleThemeMode}
                      className="px-3 py-1 rounded-lg text-xs font-black bg-black text-white dark:bg-white dark:text-black cursor-pointer active:scale-95 transition-transform"
                    >
                      {themeMode === 'dark' ? 'تحويل لنهاري ☀️' : 'تحويل لليلي 🌙'}
                    </button>
                  </div>
                )}

                {/* Mobile Built-in Theme Button */}
                {onOpenThemeModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenThemeModal();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-right px-3 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-between font-black text-xs cursor-pointer border border-slate-300 dark:border-slate-700"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded-full inline-block shadow-2xs border border-black/10"
                        style={{ background: 'var(--theme-gradient-start, #2563eb)' }}
                      />
                      <span>تغيير ثيم وألوان التطبيق (7 ثيمات)</span>
                    </span>
                    <span>🎨 ↗</span>
                  </button>
                )}

                {/* Mobile Currency Chooser */}
                <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/80 rounded-xl">
                  <span className="text-slate-500 dark:text-slate-400">عملة العرض:</span>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                    className="bg-transparent text-slate-800 dark:text-white font-bold text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="SDG" className="dark:bg-slate-900">SDG (ج.س)</option>
                    <option value="SAR" className="dark:bg-slate-900">SAR (ر.س)</option>
                    <option value="USD" className="dark:bg-slate-900">USD ($)</option>
                    <option value="AED" className="dark:bg-slate-900">AED (د.إ)</option>
                    <option value="EGP" className="dark:bg-slate-900">EGP (ج.م)</option>
                    <option value="EUR" className="dark:bg-slate-900">EUR (€)</option>
                  </select>
                </div>

                {/* Quick actions inside drawer */}
                <button
                  onClick={() => {
                    onOpenPriceModal();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-right px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  ⚙️ تعديل قائمة الأسعار (24 صنف)
                </button>

                {(onOpenInvoiceDesignerModal || onOpenInvoiceModal) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenInvoiceDesignerModal) {
                        onOpenInvoiceDesignerModal();
                      } else if (onOpenInvoiceModal) {
                        onOpenInvoiceModal();
                      }
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-right px-3 py-2.5 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-300 text-slate-950 rounded-xl hover:brightness-105 transition-colors font-black text-xs flex items-center justify-between shadow-xs border border-amber-400"
                  >
                    <span className="flex items-center gap-1.5">
                      <span>📐</span>
                      <span>تحكم شكل وأبعاد الفاتورة (PDF Studio)</span>
                    </span>
                    <span className="text-[10px] bg-slate-950 text-amber-300 px-2 py-0.5 rounded-md font-black">جديد</span>
                  </button>
                )}

                {onOpenInvoiceModal && (
                  <button
                    onClick={() => {
                      onOpenInvoiceModal();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-right px-3 py-2 bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 rounded-xl hover:bg-blue-100 transition-colors font-bold"
                  >
                    📄 معاينة وطباعة فواتير PDF ملء الشاشة
                  </button>
                )}

                {onOpenOfflineInvoicesModal && (
                  <button
                    onClick={() => {
                      onOpenOfflineInvoicesModal();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-right px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-between"
                  >
                    <span>💾 فواتير أوفلاين على الهاتف</span>
                    {offlineCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                        {offlineCount}
                      </span>
                    )}
                  </button>
                )}

                {onOpenCloudSyncModal && (
                  <button
                    onClick={() => {
                      onOpenCloudSyncModal();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-right px-3 py-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-xl hover:bg-emerald-100 transition-colors font-semibold"
                  >
                    ☁️ مزامنة سحابية (Firebase & Drive)
                  </button>
                )}

                {onOpenSettingsModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenSettingsModal('screen');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-right px-3 py-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors flex items-center justify-between font-bold text-xs cursor-pointer border border-blue-200 dark:border-blue-800"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base">⚙️</span>
                      <span>إعدادات الشاشة وتخزين الهاتف</span>
                    </span>
                    <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-black">
                      هاتف & أندرويد
                    </span>
                  </button>
                )}

                <button
                  onClick={() => {
                    onOpenApkModal();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-right px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  📱 تطبيق أندرويد APK عبر GitHub
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
