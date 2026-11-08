import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  testFirestoreConnection,
  loginWithGoogle,
  logoutUser,
  subscribeToAuth,
  batchSyncSalesToFirestore,
  fetchSalesRecordsFromFirestore,
  uploadToGoogleDrive,
  getDriveAccessToken,
} from '../services/firebase';
import { SalesRecord, ProductItem } from '../types';
import { generateCSVString } from '../utils/csvHelper';
import firebaseConfig from '../../firebase-applet-config.json';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  salesData: SalesRecord[];
  onImportSalesData: (records: SalesRecord[]) => void;
  catalog: ProductItem[];
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  salesData,
  onImportSalesData,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [driveToken, setDriveToken] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [driveFileLink, setDriveFileLink] = useState<string | null>(null);
  const [firestoreStatus, setFirestoreStatus] = useState<'testing' | 'connected' | 'error'>('testing');

  useEffect(() => {
    if (!isOpen) return;

    // Check Firestore connection
    testFirestoreConnection().then((connected) => {
      setFirestoreStatus(connected ? 'connected' : 'error');
    });

    // Listen to Firebase auth state
    const unsubscribe = subscribeToAuth((user) => {
      setCurrentUser(user);
      const token = getDriveAccessToken();
      setDriveToken(token);
    });

    // Load in-memory drive token
    const token = getDriveAccessToken();
    if (token) setDriveToken(token);

    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setIsConnecting(true);
    setStatusMessage(null);
    try {
      const { user, driveAccessToken } = await loginWithGoogle();
      setCurrentUser(user);
      if (driveAccessToken) {
        setDriveToken(driveAccessToken);
        setStatusMessage('تم تسجيل الدخول بنجاح وتفويض Google Drive');
      } else {
        setStatusMessage('تم تسجيل الدخول بنجاح');
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`فشل تسجيل الدخول: ${err.message || 'خطأ غير متوقع'}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setCurrentUser(null);
      setDriveToken(null);
      setStatusMessage('تم تسجيل الخروج');
    } catch (err: any) {
      setStatusMessage(`خطأ أثناء تسجيل الخروج: ${err.message}`);
    }
  };

  const handleSyncToFirestore = async () => {
    if (salesData.length === 0) {
      setStatusMessage('لا توجد فواتير محلية لرفعها');
      return;
    }
    setIsSyncing(true);
    setStatusMessage(null);
    try {
      const count = await batchSyncSalesToFirestore(salesData);
      setStatusMessage(`✓ تم رفع ومزامنة ${count} سجل مبيعات بنجاح إلى Cloud Firestore!`);
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`فشلت المزامنة: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFetchFromFirestore = async () => {
    setIsSyncing(true);
    setStatusMessage(null);
    try {
      const remote = await fetchSalesRecordsFromFirestore();
      if (remote.length === 0) {
        setStatusMessage('لا توجد سجلات مخزنة على السحابة بعد.');
      } else {
        onImportSalesData(remote);
        setStatusMessage(`✓ تم استيراد وتحميل ${remote.length} سجل من Cloud Firestore بنجاح!`);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`فشل جلب البيانات: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportToGoogleDrive = async () => {
    if (!driveToken) {
      setStatusMessage('يرجى تسجيل الدخول بحساب Google أولاً لتفعيل خدمة Google Drive');
      return;
    }
    if (salesData.length === 0) {
      setStatusMessage('لا توجد بيانات لتصديرها');
      return;
    }

    setIsSyncing(true);
    setStatusMessage(null);
    setDriveFileLink(null);

    try {
      const csvContent = generateCSVString(salesData);
      const filename = `AhmedJam_Sales_Report_${new Date().toISOString().split('T')[0]}.csv`;
      const result = await uploadToGoogleDrive(driveToken, filename, csvContent, 'text/csv');
      setDriveFileLink(result.webViewLink || null);
      setStatusMessage(`✓ تم إنشاء ورفع ملف مبيعاتك (${filename}) إلى Google Drive بنجاح!`);
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`فشل الرفع إلى Google Drive: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl max-w-xl w-full max-h-[94vh] shadow-2xl border-2 border-blue-200 dark:border-slate-700 flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Android Drag Indicator Pill */}
        <div className="w-12 h-1.5 bg-slate-400 dark:bg-slate-600 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-blue-50 via-sky-50 to-white dark:from-slate-800 dark:via-slate-850 dark:to-slate-900 border-b-2 border-blue-200 dark:border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-lg font-bold shadow-sm">
              ☁️
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                المزامنة السحابية (Firebase & Google Drive)
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold mt-0.5">
                حفظ الفواتير على Firestore والنسخ الاحتياطي على Google Drive
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

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Status Message Toast */}
          {statusMessage && (
            <div className="p-3.5 rounded-xl border-2 border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/70 text-blue-950 dark:text-blue-100 text-xs sm:text-sm font-bold flex items-center justify-between">
              <span>{statusMessage}</span>
              <button
                type="button"
                onClick={() => setStatusMessage(null)}
                className="text-blue-700 dark:text-blue-300 hover:underline text-xs"
              >
                ✕
              </button>
            </div>
          )}

          {/* Live Service Status */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border-2 border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    firestoreStatus === 'connected'
                      ? 'bg-emerald-500 animate-pulse'
                      : 'bg-amber-500'
                  }`}
                />
                اتصال قاعدة بيانات Cloud Firestore:
              </span>
              <span
                className={`font-mono text-xs font-black px-2.5 py-1 rounded-md ${
                  firestoreStatus === 'connected'
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                {firestoreStatus === 'connected' ? 'متصل سحابياً ✓' : 'جاري التحقق...'}
              </span>
            </div>
            <div className="text-xs text-slate-700 dark:text-slate-300 font-mono">
              المشروع: <span className="font-bold text-blue-700 dark:text-blue-300">{firebaseConfig.projectId}</span>
            </div>
            <div className="text-xs text-slate-700 dark:text-slate-300 font-bold">
              فواتيرك الحالية على الهاتف: <span className="font-black text-blue-700 dark:text-blue-300">{salesData.length} سجل</span>
            </div>
          </div>

          {/* Google Account Section */}
          <div className="p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">📁</span>
                <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  حساب Google وتفويض Google Drive
                </span>
              </div>
              {currentUser && (
                <span className="text-xs bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-2.5 py-0.5 rounded-full font-black">
                  مسجل الدخول ✓
                </span>
              )}
            </div>

            {currentUser ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2.5">
                    {currentUser.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt={currentUser.displayName || ''}
                        className="w-9 h-9 rounded-full border-2 border-blue-400"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center">
                        {(currentUser.displayName || currentUser.email || 'U')[0]}
                      </div>
                    )}
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {currentUser.displayName || 'مستخدم Google'}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 font-mono font-medium">
                        {currentUser.email}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-xs text-rose-700 dark:text-rose-300 hover:underline font-bold px-2 py-1 rounded border border-rose-200 dark:border-rose-800"
                  >
                    تسجيل خروج
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleExportToGoogleDrive}
                  disabled={isSyncing}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                >
                  <span>📊</span>
                  <span>تصدير ورفع ملف مبيعات Excel إلى Google Drive</span>
                </button>

                {driveFileLink && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
                    <span>تم رفع الملف إلى Google Drive بنجاح:</span>
                    <a
                      href={driveFileLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 underline font-black"
                    >
                      فتح الملف ↗
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  سجل الدخول بحساب Google لرفع تقارير مبيعاتك مباشرة إلى مجلد Google Drive الخاص بك لفتحها ومشاركتها مع Looker Studio.
                </p>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isConnecting}
                  className="w-full py-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-900 dark:text-white rounded-xl font-bold text-xs sm:text-sm border-2 border-slate-300 dark:border-slate-600 transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>تسجيل الدخول باستخدام Google</span>
                </button>
              </div>
            )}
          </div>

          {/* Firestore Database Sync Actions */}
          <div className="p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔄</span>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                المزامنة مع قاعدة بيانات Cloud Firestore
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleSyncToFirestore}
                disabled={isSyncing || salesData.length === 0}
                className="btn-realistic-primary py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm text-white shadow-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <span>☁️⬆️</span>
                <span>رفع الفواتير الحالية للسحابة</span>
              </button>

              <button
                type="button"
                onClick={handleFetchFromFirestore}
                disabled={isSyncing}
                className="py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm bg-blue-50 dark:bg-blue-950/70 border-2 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-200 hover:bg-blue-100 transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <span>☁️⬇️</span>
                <span>استيراد الفواتير من السحابة</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-850 border-t-2 border-slate-200 dark:border-slate-700 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg font-bold text-xs cursor-pointer transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
