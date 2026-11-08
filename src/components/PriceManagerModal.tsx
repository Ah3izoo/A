import React, { useState } from 'react';
import { ProductItem, CurrencyCode } from '../types';
import { formatNumber } from '../utils/formatters';
import { SUPPLIER_LINE } from '../data/productCatalog';
import { verifyAdminCredentials } from '../services/adminAuthService';
import { AdminCredentialsModal } from './AdminCredentialsModal';

interface PriceManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalog: ProductItem[];
  onSaveCatalog: (updatedCatalog: ProductItem[], applyToExistingSales: boolean) => void;
  currency: CurrencyCode;
}

export const PriceManagerModal: React.FC<PriceManagerModalProps> = ({
  isOpen,
  onClose,
  catalog,
  onSaveCatalog,
  currency,
}) => {
  const [localCatalog, setLocalCatalog] = useState<ProductItem[]>(catalog);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [percentAdjust, setPercentAdjust] = useState<number>(0);
  const [applyToExisting, setApplyToExisting] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  // Manager Authentication State (ONLY manager can change prices!)
  const [isManagerAuthenticated, setIsManagerAuthenticated] = useState(false);
  const [managerUsernameInput, setManagerUsernameInput] = useState('');
  const [managerPasswordInput, setManagerPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isChangingAdminCreds, setIsChangingAdminCreds] = useState(false);

  // Sync if prop changes
  React.useEffect(() => {
    setLocalCatalog(catalog);
  }, [catalog]);

  if (!isOpen) return null;

  const handleManagerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyAdminCredentials(managerUsernameInput, managerPasswordInput)) {
      setIsManagerAuthenticated(true);
      setAuthError('');
      setManagerUsernameInput('');
      setManagerPasswordInput('');
    } else {
      setAuthError('بيانات الدخول غير صحيحة! يرجى إدخال اسم المستخدم وكلمة المرور الصحيحة للمدير العام.');
    }
  };

  const categories = Array.from(new Set(catalog.map((i) => i.category)));

  const handlePriceChange = (id: string, newPrice: number) => {
    if (!isManagerAuthenticated) return;
    setLocalCatalog((prev) =>
      prev.map((item) => (item.id === id ? { ...item, currentPrice: Math.max(0, newPrice) } : item))
    );
  };

  const handleApplyPercentage = (pct: number) => {
    if (!isManagerAuthenticated || pct === 0) return;
    setLocalCatalog((prev) =>
      prev.map((item) => {
        const adjusted = Math.round(item.currentPrice * (1 + pct / 100));
        return { ...item, currentPrice: Math.max(0, adjusted) };
      })
    );
    setPercentAdjust(0);
  };

  const handleResetToOfficial = () => {
    if (!isManagerAuthenticated) return;
    setLocalCatalog((prev) =>
      prev.map((item) => ({ ...item, currentPrice: item.defaultPrice }))
    );
  };

  const handleSave = () => {
    if (!isManagerAuthenticated) return;
    onSaveCatalog(localCatalog, applyToExisting);
    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
      onClose();
    }, 1200);
  };

  const filtered = localCatalog.filter((item) => {
    const matchesSearch =
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.genericName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl max-w-4xl w-full max-h-[94vh] shadow-2xl border-2 border-blue-200 dark:border-slate-700 flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Android Drag Indicator Pill */}
        <div className="w-12 h-1.5 bg-slate-400 dark:bg-slate-600 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-blue-50 via-sky-50 to-white dark:from-slate-800 dark:via-slate-850 dark:to-slate-900 border-b-2 border-blue-200 dark:border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              🏷️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  إدارة وتخصيص أسعار الأصناف (Price Management)
                </h2>
                {isManagerAuthenticated ? (
                  <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-black rounded-md shadow-2xs">
                    صلاحية المدير مفعلة ✓
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-amber-600 text-white text-[10px] font-black rounded-md shadow-2xs flex items-center gap-1">
                    <span>🔒</span>
                    <span>خاص بالمدير</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold mt-0.5">
                تعديل الأسعار محمي ومقتصر على المدير العام فقط · {SUPPLIER_LINE}
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

        {/* Manager Protection Banner / Login Gate */}
        {!isManagerAuthenticated ? (
          <div className="px-5 py-3.5 bg-amber-50 dark:bg-amber-950/70 border-b-2 border-amber-300 dark:border-amber-700/80 shrink-0">
            <form onSubmit={handleManagerLogin} className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔒</span>
                <div>
                  <span className="font-black text-amber-950 dark:text-amber-200 block">
                    المدير فقط يستطيع تغيير وتعديل أسعار الأدوية
                  </span>
                  <span className="text-[11px] text-amber-800 dark:text-amber-300">
                    يرجى إدخال اسم المستخدم وكلمة المرور لتأكيد صلاحية المدير وتعديل الأسعار
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  required
                  value={managerUsernameInput}
                  onChange={(e) => {
                    setManagerUsernameInput(e.target.value);
                    setAuthError('');
                  }}
                  placeholder="اسم المستخدم..."
                  className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-amber-400 dark:border-amber-600 rounded-lg text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-600 w-32"
                />
                <input
                  type="password"
                  required
                  value={managerPasswordInput}
                  onChange={(e) => {
                    setManagerPasswordInput(e.target.value);
                    setAuthError('');
                  }}
                  placeholder="كلمة المرور..."
                  className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-amber-400 dark:border-amber-600 rounded-lg text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-600 w-32"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-black text-xs cursor-pointer shadow-xs active:scale-95 transition-all"
                >
                  فتح الصلاحية 🔓
                </button>
                <button
                  type="button"
                  onClick={() => setIsChangingAdminCreds(true)}
                  className="px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg font-bold text-xs cursor-pointer transition-colors flex items-center gap-1"
                  title="تغيير اسم المستخدم أو كلمة المرور للمدير"
                >
                  <span>🔐</span>
                  <span className="hidden sm:inline">بيانات المدير</span>
                </button>
              </div>
            </form>
            {authError && (
              <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-2">
                ⚠️ {authError}
              </p>
            )}
          </div>
        ) : (
          <div className="px-5 py-2 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-300 dark:border-emerald-800 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
            <span className="text-emerald-800 dark:text-emerald-200 font-bold flex items-center gap-1.5">
              <span>🔓</span>
              <span>أنت مسجل حالياً بصلاحية المدير العام — يمكنك تعديل كافة الأسعار وحفظها واعتمادها</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsChangingAdminCreds(true)}
                className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 rounded-lg font-bold text-[11px] cursor-pointer transition-colors flex items-center gap-1"
                title="تغيير اسم المستخدم وكلمة المرور للمدير"
              >
                <span>🔐</span>
                <span>تغيير بيانات المدير</span>
              </button>
              <button
                type="button"
                onClick={() => setIsManagerAuthenticated(false)}
                className="text-[11px] text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer font-bold"
              >
                قفل الصلاحية 🔒
              </button>
            </div>
          </div>
        )}

        {/* Quick Batch Tools Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/90 border-b-2 border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-extrabold text-slate-900 dark:text-white">تعديل جماعي:</span>
            <div className={`flex items-center gap-1 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 rounded-lg p-1 ${!isManagerAuthenticated ? 'opacity-50 pointer-events-none' : ''}`}>
              <input
                type="number"
                placeholder="نسبة %"
                disabled={!isManagerAuthenticated}
                value={percentAdjust || ''}
                onChange={(e) => setPercentAdjust(parseFloat(e.target.value) || 0)}
                className="w-16 px-1.5 py-0.5 text-xs text-center border-none font-bold text-slate-900 dark:text-white focus:outline-none tabular-numbers bg-transparent"
              />
              <button
                type="button"
                disabled={!isManagerAuthenticated}
                onClick={() => handleApplyPercentage(percentAdjust)}
                className="px-2.5 py-1 bg-blue-600 text-white rounded-md font-bold hover:bg-blue-700 cursor-pointer text-[11px] disabled:cursor-not-allowed"
              >
                تطبيق %
              </button>
            </div>
            <button
              type="button"
              disabled={!isManagerAuthenticated}
              onClick={() => handleApplyPercentage(5)}
              className={`px-3 py-1.5 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-bold text-slate-800 dark:text-slate-200 cursor-pointer text-xs ${!isManagerAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              +5% زيادة
            </button>
            <button
              type="button"
              disabled={!isManagerAuthenticated}
              onClick={() => handleApplyPercentage(-5)}
              className={`px-3 py-1.5 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-bold text-slate-800 dark:text-slate-200 cursor-pointer text-xs ${!isManagerAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              -5% تخفيض
            </button>
            <button
              type="button"
              disabled={!isManagerAuthenticated}
              onClick={handleResetToOfficial}
              className={`px-3 py-1.5 bg-amber-50 dark:bg-amber-950/60 border-2 border-amber-400 dark:border-amber-700 text-amber-900 dark:text-amber-200 hover:bg-amber-100 rounded-lg font-bold cursor-pointer text-xs ${!isManagerAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              استعادة السعر الرسمي
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="بحث في الأصناف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs font-bold bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600 w-full sm:w-48 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs font-bold bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="all" className="dark:bg-slate-900 text-slate-900 dark:text-white">
                كافة الفئات ({catalog.length})
              </option>
              {categories.map((c) => (
                <option key={c} value={c} className="dark:bg-slate-900 text-slate-900 dark:text-white">
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Scrollable Products Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <table className="w-full text-right text-xs">
            <thead className="bg-blue-50 dark:bg-slate-800 text-blue-950 dark:text-blue-100 font-black sticky top-0 border-b-2 border-blue-200 dark:border-slate-700 z-10">
              <tr>
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th className="py-3 px-3">اسم الصنف الدوائي</th>
                <th className="py-3 px-3 hidden sm:table-cell">التركيبة العلمية</th>
                <th className="py-3 px-3 hidden md:table-cell">التصنيف</th>
                <th className="py-3 px-3 text-left">السعر الرسمي</th>
                <th className="py-3 px-3 text-left w-36 sm:w-44">السعر المعتمد ({currency})</th>
                <th className="py-3 px-3 text-center w-24">نسبة التغير</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
              {filtered.map((item, idx) => {
                const isModified = item.currentPrice !== item.defaultPrice;
                const diffPct =
                  item.defaultPrice > 0
                    ? ((item.currentPrice - item.defaultPrice) / item.defaultPrice) * 100
                    : 0;

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-blue-50/50 dark:hover:bg-slate-800/60 transition-colors ${
                      isModified ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-3 text-center text-slate-600 dark:text-slate-400 font-bold tabular-numbers">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-3 font-black text-slate-900 dark:text-white text-xs sm:text-sm">
                      {item.productName}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-mono text-[11px] font-semibold hidden sm:table-cell">
                      {item.genericName}
                    </td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-semibold hidden md:table-cell">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px]">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-left font-mono font-bold text-slate-700 dark:text-slate-300 tabular-numbers">
                      {formatNumber(item.defaultPrice)}
                    </td>
                    <td className="py-3 px-3 text-left">
                      <div className="flex items-center gap-1.5 justify-end">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          disabled={!isManagerAuthenticated}
                          value={item.currentPrice}
                          onChange={(e) =>
                            handlePriceChange(item.id, parseFloat(e.target.value) || 0)
                          }
                          title={!isManagerAuthenticated ? 'تعديل السعر مقتصر على المدير فقط' : 'تعديل السعر المعتمد'}
                          className={`w-28 sm:w-32 text-left font-black text-xs sm:text-sm px-2.5 py-1.5 border-2 rounded-lg focus:outline-none focus:border-blue-600 tabular-numbers ${
                            !isManagerAuthenticated
                              ? 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-500 cursor-not-allowed'
                              : isModified
                              ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-950 dark:text-amber-100'
                              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
                          }`}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {isModified ? (
                        <span
                          className={`px-2 py-1 rounded-md text-[11px] font-black ${
                            diffPct > 0
                              ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200'
                              : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200'
                          }`}
                        >
                          {diffPct > 0 ? `+${diffPct.toFixed(1)}%` : `${diffPct.toFixed(1)}%`}
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          رسمي ✓
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-850 border-t-2 border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0">
          <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 dark:text-slate-200">
            <input
              type="checkbox"
              disabled={!isManagerAuthenticated}
              checked={applyToExisting}
              onChange={(e) => setApplyToExisting(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer disabled:opacity-50"
            />
            <span>تحديث وتطبيق هذه الأسعار أيضاً على سجلات المبيعات الحالية في التقرير</span>
          </label>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {savedToast && (
              <span className="text-emerald-700 dark:text-emerald-300 font-extrabold flex items-center gap-1">
                ✓ تم حفظ وتحديث الأسعار بنجاح
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer border border-slate-300 dark:border-slate-600"
            >
              إغلاق
            </button>
            <button
              type="button"
              disabled={!isManagerAuthenticated}
              onClick={handleSave}
              className={`btn-realistic-primary px-6 py-2 text-xs font-black text-white rounded-lg shadow-sm cursor-pointer ${
                !isManagerAuthenticated ? 'opacity-40 cursor-not-allowed' : ''
              }`}
              title={!isManagerAuthenticated ? 'سجل كمدير لحفظ الأسعار' : 'حفظ قائمة الأسعار المعتمدة'}
            >
              حفظ قائمة الأسعار
            </button>
          </div>
        </div>
      </div>

      {/* Admin Credentials Modal */}
      <AdminCredentialsModal
        isOpen={isChangingAdminCreds}
        onClose={() => setIsChangingAdminCreds(false)}
      />
    </div>
  );
};
