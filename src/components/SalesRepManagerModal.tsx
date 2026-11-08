import React, { useState } from 'react';

export interface SalesRepItem {
  id: string;
  name: string;
  code?: string;
  phone?: string;
  notes?: string;
  addedAt: string;
}

interface SalesRepManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSalesRep: string;
  onSetActiveSalesRep: (repName: string) => void;
  salesReps: SalesRepItem[];
  onUpdateSalesReps: (reps: SalesRepItem[]) => void;
}

import {
  getAdminCredentials,
  verifyAdminCredentials,
} from '../services/adminAuthService';
import { AdminCredentialsModal } from './AdminCredentialsModal';

export const getManagerCredentials = getAdminCredentials;
export const MANAGER_USERNAME = getAdminCredentials().username;
export const MANAGER_PASSWORD = getAdminCredentials().password;

export const SalesRepManagerModal: React.FC<SalesRepManagerModalProps> = ({
  isOpen,
  onClose,
  activeSalesRep,
  onSetActiveSalesRep,
  salesReps,
  onUpdateSalesReps,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isChangingAdminCreds, setIsChangingAdminCreds] = useState(false);

  // Rep Pending Delete Confirmation State
  const [repToDelete, setRepToDelete] = useState<SalesRepItem | null>(null);
  const [replacementNameInput, setReplacementNameInput] = useState('');

  // New Rep Form State
  const [newRepName, setNewRepName] = useState('');
  const [newRepCode, setNewRepCode] = useState('');
  const [newRepPhone, setNewRepPhone] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyAdminCredentials(usernameInput, passwordInput)) {
      setIsAuthenticated(true);
      setAuthError('');
      setUsernameInput('');
      setPasswordInput('');
    } else {
      setAuthError('بيانات الدخول غير صحيحة! يرجى إدخال اسم المستخدم وكلمة المرور الصحيحة للمدير العام.');
    }
  };

  const handleSelectRep = (repName: string) => {
    onSetActiveSalesRep(repName);
    setStatusMessage(`✓ تم تغيير مندوب التطبيق بالكامل إلى: "${repName}" بنجاح!`);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleAddNewRep = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newRepName.trim();
    if (!name) return;

    if (salesReps.some((r) => r.name.toLowerCase() === name.toLowerCase())) {
      setStatusMessage('يوجد مندوب مسجل بنفس هذا الاسم مسبقاً.');
      setTimeout(() => setStatusMessage(null), 3500);
      return;
    }

    const newRep: SalesRepItem = {
      id: `rep-${Date.now()}`,
      name,
      code: newRepCode.trim() || `REP-${salesReps.length + 1}`,
      phone: newRepPhone.trim(),
      addedAt: new Date().toISOString(),
    };

    const updated = [...salesReps, newRep];
    onUpdateSalesReps(updated);

    // Auto-activate new rep as per manager authority
    onSetActiveSalesRep(name);

    setNewRepName('');
    setNewRepCode('');
    setNewRepPhone('');
    setStatusMessage(`✓ تمت إضافة المندوب "${name}" واعتماده كمندوب حالي للتطبيق بنجاح!`);
    setTimeout(() => setStatusMessage(null), 4500);
  };

  const confirmDeleteRep = () => {
    if (!repToDelete) return;

    if (salesReps.length === 1) {
      const repName = replacementNameInput.trim() || 'مندوب مبيعات معتمد';
      const newRep: SalesRepItem = {
        id: `rep-${Date.now()}`,
        name: repName,
        code: 'REP-01',
        addedAt: new Date().toISOString(),
      };
      onUpdateSalesReps([newRep]);
      onSetActiveSalesRep(newRep.name);
      setStatusMessage(`✓ تم حذف "${repToDelete.name}" واعتماد المندوب البديل "${newRep.name}" بنجاح!`);
    } else {
      const updated = salesReps.filter((r) => r.id !== repToDelete.id);
      onUpdateSalesReps(updated);

      if (activeSalesRep === repToDelete.name) {
        const fallback = updated[0]?.name || 'مندوب مبيعات معتمد';
        onSetActiveSalesRep(fallback);
      }
      setStatusMessage(`✓ تم حذف المندوب "${repToDelete.name}" نهائياً من قبل المدير.`);
    }

    setRepToDelete(null);
    setReplacementNameInput('');
    setTimeout(() => setStatusMessage(null), 4500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full shadow-2xl border-2 border-blue-200 dark:border-slate-700 flex flex-col overflow-hidden my-auto text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">👤</span>
            <div>
              <h2 className="text-base sm:text-lg font-black">إدارة المناديب (سلطة المدير العام)</h2>
              <p className="text-xs text-blue-200 font-medium">المدير يستطيع حذف أو إضافة أي مندوب بما في ذلك أحمد عزالدين</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[80vh] space-y-5">
          {!isAuthenticated ? (
            /* Manager Authentication Screen */
            <form onSubmit={handleAuthSubmit} className="py-6 px-3 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center text-3xl shadow-inner border border-amber-300 dark:border-amber-700">
                🔒
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  منطقة خاصة بالمدير العام
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  يرجى إدخال اسم المستخدم وكلمة المرور لتأكيد هوية المدير والوصول إلى صلاحية إضافة أو حذف المناديب.
                </p>
              </div>

              <div className="max-w-xs mx-auto space-y-2.5 text-right">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اسم المستخدم (User Name):
                  </label>
                  <input
                    type="text"
                    required
                    value={usernameInput}
                    onChange={(e) => {
                      setUsernameInput(e.target.value);
                      setAuthError('');
                    }}
                    placeholder="اسم المستخدم..."
                    className="w-full text-center px-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl font-mono focus:outline-none focus:border-blue-600 dark:text-white"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    كلمة المرور (Password):
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      setAuthError('');
                    }}
                    placeholder="كلمة المرور..."
                    className="w-full text-center px-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl font-mono focus:outline-none focus:border-blue-600 dark:text-white"
                  />
                </div>

                {authError && (
                  <p className="text-xs text-rose-600 font-bold bg-rose-50 dark:bg-rose-950/50 p-2 rounded-lg border border-rose-200 dark:border-rose-800 text-center">
                    {authError}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs cursor-pointer transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs cursor-pointer shadow-md transition-all active:scale-95"
                >
                  تسجيل الدخول كمدير 🔓
                </button>
                <button
                  type="button"
                  onClick={() => setIsChangingAdminCreds(true)}
                  className="px-3 py-2 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 rounded-xl font-bold text-xs cursor-pointer transition-all flex items-center gap-1"
                  title="تغيير اسم المستخدم أو كلمة المرور للمدير"
                >
                  <span>🔐</span>
                  <span>تغيير بيانات المدير</span>
                </button>
              </div>
            </form>
          ) : (
            /* Manager Sales Rep Dashboard */
            <>
              {/* Success Notification */}
              {statusMessage && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-bold rounded-xl flex items-center justify-between">
                  <span>{statusMessage}</span>
                  <button onClick={() => setStatusMessage(null)} className="text-emerald-700">✕</button>
                </div>
              )}

              {/* In-Modal Delete Confirmation Box */}
              {repToDelete && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/80 border-2 border-rose-400 rounded-xl text-rose-900 dark:text-rose-200 space-y-3 animate-in fade-in">
                  <div className="flex items-center gap-2 font-black text-xs sm:text-sm">
                    <span className="text-base">⚠️</span>
                    <span>تأكيد حذف المندوب: &quot;{repToDelete.name}&quot;</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    بصفتك المدير العام، يمكنك حذف أي مندوب في النظام (بما في ذلك أحمد عزالدين). هل تريد بالتأكيد إزالة هذا المندوب نهائياً؟
                  </p>
                  {salesReps.length === 1 && (
                    <div>
                      <label className="block text-[11px] font-bold mb-1">
                        أنت تحذف المندوب الوحيد المسجل. اكتب اسم المندوب البديل الجديد:
                      </label>
                      <input
                        type="text"
                        value={replacementNameInput}
                        onChange={(e) => setReplacementNameInput(e.target.value)}
                        placeholder="اسم المندوب البديل..."
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-rose-300 rounded-lg text-slate-900 dark:text-white font-bold"
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setRepToDelete(null)}
                      className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      onClick={confirmDeleteRep}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-black shadow-sm cursor-pointer"
                    >
                      نعم، احذف المندوب نهائياً 🗑️
                    </button>
                  </div>
                </div>
              )}

              {/* Active Rep Banner */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-sky-50 dark:from-slate-800 dark:to-slate-850 rounded-xl border-2 border-blue-300 dark:border-blue-700 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-base shadow-xs shrink-0">
                    ✓
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 block">
                      المندوب النشط حالياً في التطبيق والفواتير:
                    </span>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                      {activeSalesRep}
                    </h3>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-black rounded-lg shadow-2xs shrink-0">
                  مفعل حالياً
                </span>
              </div>

              {/* List of Registered Sales Reps */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                    قائمة المناديب المسجلين في النظام ({salesReps.length}):
                  </h4>
                  <span className="text-[11px] text-slate-500">سلطة الحذف والإضافة متاحة للمدير على الجميع</span>
                </div>

                <div className="space-y-2">
                  {salesReps.map((rep) => {
                    const isActive = rep.name === activeSalesRep;
                    return (
                      <div
                        key={rep.id}
                        className={`p-3 rounded-xl border-2 transition-all flex items-center justify-between gap-3 ${
                          isActive
                            ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 shadow-xs'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                              isActive
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {rep.name.charAt(0)}
                          </div>
                          <div className="truncate">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-xs text-slate-900 dark:text-white truncate">
                                {rep.name}
                              </span>
                              {rep.code && (
                                <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.2 rounded text-slate-600 dark:text-slate-300">
                                  {rep.code}
                                </span>
                              )}
                            </div>
                            {rep.phone && (
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                📞 {rep.phone}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isActive ? (
                            <span className="px-3 py-1 bg-blue-600 text-white text-xs font-black rounded-lg">
                              النشط حالياً ✓
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSelectRep(rep.name)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-2xs active:scale-95"
                            >
                              تفعيل المندوب
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setRepToDelete(rep)}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 flex items-center gap-1 text-xs font-bold cursor-pointer transition-colors border border-rose-200 dark:border-rose-900"
                            title={`حذف المندوب ${rep.name} نهائياً بصفتك المدير`}
                          >
                            <span>🗑️</span>
                            <span className="text-[10px]">حذف المندوب</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add New Sales Rep Section */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-1.5">
                  <span>➕</span>
                  <span>إضافة مندوب طبي جديد بواسطة المدير:</span>
                </h4>
                <form onSubmit={handleAddNewRep} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        اسم المندوب الكامل *
                      </label>
                      <input
                        type="text"
                        value={newRepName}
                        onChange={(e) => setNewRepName(e.target.value)}
                        placeholder="اسم المندوب..."
                        required
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-blue-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        كود المندوب / الرمز التعريفي
                      </label>
                      <input
                        type="text"
                        value={newRepCode}
                        onChange={(e) => setNewRepCode(e.target.value)}
                        placeholder="مثال: REP-03"
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-blue-600 dark:text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      رقم الهاتف / ملاحظات التوريد
                    </label>
                    <input
                      type="text"
                      value={newRepPhone}
                      onChange={(e) => setNewRepPhone(e.target.value)}
                      placeholder="رقم الهاتف أو الملاحظات..."
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-blue-600 dark:text-white"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs cursor-pointer shadow-sm transition-all active:scale-95"
                    >
                      + حفظ وإضافة المندوب وتفعيله فوراً
                    </button>
                  </div>
                </form>
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAuthenticated(false)}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg font-bold cursor-pointer transition-colors"
                  >
                    🔒 قفل صلاحية المدير
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsChangingAdminCreds(true)}
                    className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 rounded-lg font-bold cursor-pointer transition-all flex items-center gap-1"
                  >
                    <span>🔐</span>
                    <span>تغيير بيانات المدير</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl font-black cursor-pointer shadow-sm transition-all"
                >
                  إغلاق واعتماد
                </button>
              </div>
            </>
          )}
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
