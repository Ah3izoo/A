import React, { useState } from 'react';
import {
  getAdminCredentials,
  updateAdminCredentials,
  resetAdminCredentialsToDefault,
  DEFAULT_ADMIN_USERNAME,
} from '../services/adminAuthService';

interface AdminCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AdminCredentialsModal: React.FC<AdminCredentialsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const currentCreds = getAdminCredentials();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState(currentCreds.username);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!currentPassword) {
      setErrorMessage('يرجى إدخال كلمة المرور الحالية للمصادقة.');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMessage('كلمة المرور الجديدة وتأكيدها غير متطابقين!');
      return;
    }

    const targetPassword = newPassword ? newPassword : currentPassword;
    const result = updateAdminCredentials(currentPassword, newUsername, targetPassword);

    if (result.success) {
      setSuccessMessage(result.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
        setSuccessMessage('');
      }, 2000);
    } else {
      setErrorMessage(result.message);
    }
  };

  const handleReset = () => {
    if (window.confirm('هل أنت متأكد من استعادة بيانات المدير الافتراضية (اسم المستخدم وكلمة المرور الأصلية)؟')) {
      const res = resetAdminCredentialsToDefault();
      if (res.success) {
        setSuccessMessage(res.message);
        setNewUsername(DEFAULT_ADMIN_USERNAME);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
          setSuccessMessage('');
        }, 2200);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      dir="rtl"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-950 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center text-lg font-black shadow-md">
              🔐
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base">تغيير بيانات المدير العام (Admin)</h3>
              <p className="text-[11px] text-blue-200">تعديل اسم المستخدم وكلمة المرور للمدير</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 text-xs">
          {/* Status Messages */}
          {errorMessage && (
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 font-bold flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 font-black flex items-center gap-2">
              <span>✓</span>
              <span>{successMessage}</span>
            </div>
          )}

          {/* Current Password Field */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
              كلمة المرور الحالية للمدير <span className="text-rose-500">*</span>:
            </label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="أدخل كلمة المرور الحالية للتأكيد..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
            {/* New Username Field */}
            <div className="mb-3">
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                اسم المستخدم الجديد (Username):
              </label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="اسم المستخدم الجديد..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:border-blue-500 focus:outline-none"
                required
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                الاسم الحالي: <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{currentCreds.username}</span>
              </span>
            </div>

            {/* New Password Field */}
            <div className="mb-3">
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                كلمة المرور الجديدة (اتركها فارغة إذا أردت الاحتفاظ بالحالية):
              </label>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="كلمة مرور جديدة (اختياري)..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Confirm New Password Field */}
            {newPassword && (
              <div className="mb-2">
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  تأكيد كلمة المرور الجديدة:
                </label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="أعد كتابة كلمة المرور الجديدة..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
            )}

            {/* Toggle show password */}
            <label className="flex items-center gap-2 cursor-pointer mt-2 text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={showPasswords}
                onChange={(e) => setShowPasswords(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-[11px] font-semibold">إظهار كلمات المرور أثناء الكتابة</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
            <button
              type="submit"
              className="w-full sm:flex-1 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-xl shadow-md cursor-pointer active:scale-95 transition-all text-center"
            >
              💾 حفظ بيانات الدخول الجديدة
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl cursor-pointer text-center"
              title="استعادة اسم المستخدم وكلمة المرور الأصلية"
            >
              🔄 استعادة الافتراضي
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
