import React, { useEffect, useState } from 'react';
import {
  AndroidVersionProfile,
  PhoneStorageConfig,
  ScreenDensity,
  ScreenSettings,
  StoragePermissionState,
} from '../types';
import {
  detectCurrentDevice,
  DeviceInfo,
  getScreenSettings,
  saveScreenSettings,
} from '../services/screenAdaptationService';
import {
  disconnectPhoneStorage,
  getPhoneStorageConfig,
  isFileSystemAccessSupported,
  requestPhoneFolderPermission,
  savePhoneStorageConfig,
  testStorageWritePermission,
  verifyStoragePermission,
} from '../services/phoneStorageService';

interface AppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'screen' | 'storage';
}

export const AppSettingsModal: React.FC<AppSettingsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'screen',
}) => {
  const [activeTab, setActiveTab] = useState<'screen' | 'storage'>(initialTab);

  // Screen Settings State
  const [screenSettings, setScreenSettings] = useState<ScreenSettings>(() => getScreenSettings());
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => detectCurrentDevice());

  // Storage Settings State
  const [storageConfig, setStorageConfig] = useState<PhoneStorageConfig>(() =>
    getPhoneStorageConfig()
  );
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [isTestingStorage, setIsTestingStorage] = useState(false);
  const [storageTestResult, setStorageTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDeviceInfo(detectCurrentDevice());
      setScreenSettings(getScreenSettings());
      setStorageConfig(getPhoneStorageConfig());
      setStorageTestResult(null);

      // Verify permission asynchronously
      verifyStoragePermission().then((status) => {
        setStorageConfig((prev) => ({ ...prev, permissionState: status }));
      });
    }
  }, [isOpen]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  if (!isOpen) return null;

  // Handler: Update screen settings
  const handleUpdateScreenSettings = (updates: Partial<ScreenSettings>) => {
    const updated = saveScreenSettings(updates);
    setScreenSettings(updated);
    showNotice('تم تطبيق إعدادات ملاءمة الشاشة بنجاح!');
  };

  // Handler: Reset screen settings to auto
  const handleResetScreenSettings = () => {
    const detected = detectCurrentDevice();
    const defaults: ScreenSettings = {
      androidVersion: 'auto',
      scale: detected.screenCategory === 'compact' ? 95 : 100,
      density: detected.screenCategory === 'compact' ? 'compact' : 'standard',
      edgeToEdge: true,
      notchPadding: true,
      bottomBarExtraPadding: true,
      hapticFeedback: true,
      fullWidthTables: true,
    };
    saveScreenSettings(defaults);
    setScreenSettings(defaults);
    showNotice('تمت استعادة الإعدادات التلقائية الموصى بها لهاتفك!');
  };

  // Handler: Request Phone Folder Permission
  const handleRequestStoragePermission = async () => {
    setIsRequestingPermission(true);
    setStorageTestResult(null);
    try {
      const res = await requestPhoneFolderPermission();
      if (res.success) {
        const updated = getPhoneStorageConfig();
        setStorageConfig(updated);
        showNotice(`تم منح الإذن واقتران مجلد (${res.directoryName}) بنجاح!`);
      } else if (res.error) {
        setStorageTestResult({
          success: false,
          message: res.error,
        });
      }
    } finally {
      setIsRequestingPermission(false);
    }
  };

  // Handler: Test Storage Permission Write & Edit
  const handleTestStorage = async () => {
    setIsTestingStorage(true);
    setStorageTestResult(null);
    try {
      const res = await testStorageWritePermission();
      setStorageTestResult(res);
      if (res.success) {
        setStorageConfig(getPhoneStorageConfig());
      }
    } finally {
      setIsTestingStorage(false);
    }
  };

  // Handler: Disconnect Phone Storage
  const handleDisconnectStorage = async () => {
    await disconnectPhoneStorage();
    setStorageConfig(getPhoneStorageConfig());
    setStorageTestResult(null);
    showNotice('تم إلغاء اقتران مجلد الهاتف والعودة لوضع التنزيل الافتراضي.');
  };

  const showNotice = (msg: string) => {
    setSaveSuccessNotice(msg);
    setTimeout(() => {
      setSaveSuccessNotice(null);
    }, 3200);
  };

  const fsSupported = isFileSystemAccessSupported();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      dir="rtl"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs font-bold text-lg"
              style={{ background: 'var(--theme-gradient-start, #2563eb)' }}
            >
              ⚙️
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                إعدادات التطبيق والهاتف الذكي
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
                ملاءمة الشاشة لجميع أنواع الأندرويد وإدارة أذونات حفظ الملفات بالهاتف
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-bold text-lg cursor-pointer"
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>

        {/* Success Alert Banner */}
        {saveSuccessNotice && (
          <div className="px-4 py-2 bg-emerald-500 text-white text-xs font-bold text-center animate-in slide-in-from-top duration-200 flex items-center justify-center gap-2">
            <span>✓</span>
            <span>{saveSuccessNotice}</span>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/40 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('screen')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'screen'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>📱</span>
            <span>ملاءمة الشاشة ونوع الأندرويد</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('storage')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'storage'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>💾</span>
            <span>أذونات وتخزين الهاتف (PDF & Excel)</span>
            {storageConfig.permissionState === 'granted' && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* ================= TAB 1: SCREEN & ANDROID ADAPTATION ================= */}
          {activeTab === 'screen' && (
            <div className="space-y-5">
              {/* Detected Device Info Card */}
              <div className="p-3.5 sm:p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                    <span>🔍</span>
                    <span>كاشف مواصفات جهازك التلقائي</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                    {deviceInfo.isAndroid ? 'هاتف أندرويد' : 'شاشة ذكية'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-blue-100 dark:border-blue-900/40">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">النظام المكتشف</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100 truncate block mt-0.5">
                      {deviceInfo.detectedVersion}
                    </span>
                  </div>
                  <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-blue-100 dark:border-blue-900/40">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">أبعاد النافذة</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100 block mt-0.5 dir-ltr tabular-nums">
                      {deviceInfo.windowWidth} × {deviceInfo.windowHeight}
                    </span>
                  </div>
                  <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-blue-100 dark:border-blue-900/40">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">كثافة البكسل (DPR)</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100 block mt-0.5 tabular-nums">
                      {deviceInfo.devicePixelRatio}x
                    </span>
                  </div>
                  <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-blue-100 dark:border-blue-900/40">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">فئة الشاشة</span>
                    <span className="font-bold text-blue-700 dark:text-blue-300 block mt-0.5 truncate">
                      {deviceInfo.categoryLabelAr}
                    </span>
                  </div>
                </div>
              </div>

              {/* 1. Android Version Profile */}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center justify-between">
                  <span>1. تحديد نمط إصدار الأندرويد (Android OS Profile):</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    يحدد طريقة التعامل مع الحواف وشريط الإيماءات
                  </span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'auto', label: 'تلقائي (موصى به)', sub: 'كشف ذكي للنظام' },
                    { id: 'android15', label: 'Android 15 / 14', sub: 'Edge-to-Edge حديث' },
                    { id: 'android13', label: 'Android 13 / 12', sub: 'أندرويد متكيف' },
                    { id: 'android11', label: 'Android 11 وأقدم', sub: 'شريط تنقل كلاسيكي' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        handleUpdateScreenSettings({
                          androidVersion: item.id as AndroidVersionProfile,
                        })
                      }
                      className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                        screenSettings.androidVersion === item.id
                          ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/60 dark:border-blue-500 shadow-xs ring-2 ring-blue-500/20'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100'
                      }`}
                    >
                      <div className="font-bold text-xs text-slate-900 dark:text-white">
                        {item.label}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.sub}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Screen Scale / Zoom */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                    2. مقياس حجم العناصر والنصوص (Screen Zoom):
                  </label>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 tabular-nums">
                    {screenSettings.scale}%
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {[
                    { scale: 85, label: '85% مكثف', desc: 'بيانات أكثر' },
                    { scale: 90, scaleDesc: '90%', label: '90% مدمج', desc: 'هواتف صغيرة' },
                    { scale: 95, label: '95% رشيق', desc: 'شاشات عادية' },
                    { scale: 100, label: '100% قياسي', desc: 'المثالي الافتراضي' },
                    { scale: 105, label: '105% واضح', desc: 'نصوص أوضح' },
                    { scale: 110, label: '110% كبير', desc: 'قراءة مريحة' },
                  ].map((s) => (
                    <button
                      key={s.scale}
                      type="button"
                      onClick={() => handleUpdateScreenSettings({ scale: s.scale })}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        screenSettings.scale === s.scale
                          ? 'border-blue-600 bg-blue-600 text-white shadow-xs font-black'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-xs font-bold">{s.label}</div>
                      <div
                        className={`text-[9px] mt-0.5 ${
                          screenSettings.scale === s.scale ? 'text-blue-100' : 'text-slate-400'
                        }`}
                      >
                        {s.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Screen Density Mode */}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  3. كثافة العرض لمندوب المبيعات الميداني (Display Density):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    {
                      id: 'compact',
                      title: 'وضع المندوب الميداني (Compact)',
                      icon: '⚡',
                      desc: 'جداول مضغوطة لعرض أكبر كمية من الأصناف والعملاء بدون تمرير كثير.',
                    },
                    {
                      id: 'standard',
                      title: 'الوضع المتوازن القياسي (Standard)',
                      icon: '⚖️',
                      desc: 'التوازن الافتراضي المعتمد لمظهر متناسق وقراءة سهلة لجميع البيانات.',
                    },
                    {
                      id: 'comfortable',
                      title: 'الوضع المريح باللمس (Comfortable)',
                      icon: '👆',
                      desc: 'أزرار لمس كبيرة وواضحة (44px+) مناسبة للعمل بيد واحدة أثناء الحركة.',
                    },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() =>
                        handleUpdateScreenSettings({ density: mode.id as ScreenDensity })
                      }
                      className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                        screenSettings.density === mode.id
                          ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/60 dark:border-blue-500 shadow-xs ring-2 ring-blue-500/20'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                        <span>{mode.icon}</span>
                        <span>{mode.title}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {mode.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Notch, Edge-to-Edge & Gesture Bar Toggles */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-xs font-black text-slate-900 dark:text-white block">
                  4. خيارات ملء الشاشة وتجنب النوتش وشريط الأندرويد:
                </span>
                <div className="space-y-2 text-xs">
                  <label className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span>📐</span>
                      <div>
                        <span className="font-bold block">مراعاة النوتش والكاميرا العلوية (Notch Safe Area)</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          إضافة مسافة أمان علوية تلقائية لتفادي حجب شريط الأدوات بالكاميرا
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={screenSettings.notchPadding}
                      onChange={(e) =>
                        handleUpdateScreenSettings({ notchPadding: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span>🔘</span>
                      <div>
                        <span className="font-bold block">
                          تعويض شريط التنقل السفلي للأندرويد (Gesture Bar Offset)
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          توفير مسافة أمان سفلية لعدم تداخل أزرار الفواتير مع شريط الهاتف السفلي
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={screenSettings.bottomBarExtraPadding}
                      onChange={(e) =>
                        handleUpdateScreenSettings({ bottomBarExtraPadding: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Reset to Recommended Button */}
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleResetScreenSettings}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>🔄</span>
                  <span>استعادة الضبط التلقائي الموصى به لهاتفي</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= TAB 2: PHONE STORAGE & PERMISSIONS ================= */}
          {activeTab === 'storage' && (
            <div className="space-y-5">
              {/* Status Header Card */}
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  storageConfig.permissionState === 'granted'
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                    : 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                      storageConfig.permissionState === 'granted'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    {storageConfig.permissionState === 'granted' ? '✓' : '⚠️'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-sm sm:text-base">
                        {storageConfig.permissionState === 'granted'
                          ? 'إذن التخزين مفعل ومقترن بذاكرة الهاتف بنجاح'
                          : 'إذن التخزين بانتظار الإذن والاقتران بمجلد الهاتف'}
                      </h3>
                    </div>
                    <p className="text-xs opacity-90 mt-0.5">
                      {storageConfig.permissionState === 'granted' && storageConfig.directoryName
                        ? `المجلد المقترن: ${storageConfig.directoryName} (صلاحية كاملة للكتابة والتعديل)`
                        : 'اختر مجلد الفواتير بالهاتف (Documents أو Downloads) لتصدير الفواتير وتقارير Excel مباشرة.'}
                    </p>
                  </div>
                </div>

                {storageConfig.permissionState === 'granted' && (
                  <button
                    type="button"
                    onClick={handleDisconnectStorage}
                    className="px-3 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 rounded-lg hover:bg-rose-50 cursor-pointer whitespace-nowrap self-end sm:self-center"
                  >
                    إلغاء الاقتران
                  </button>
                )}
              </div>

              {/* Action: Connect / Request Permission */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                      إدارة أذونات وتخزين الهاتف (Phone Storage Access)
                    </h4>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      تم تفعيل وضمان صلاحية حفظ وتعديل فواتير PDF وملفات تقارير Excel في ذاكرة الهاتف مباشرة (مجلد التنزيلات والمستندات). يمكنك الضغط أدناه للتحقق أو لاختيار مجلد محدد، كما يمكنك اختبار حفظ ملف تجريبي فوراً للتأكد من التخزين بدون أي مشاكل.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isRequestingPermission}
                    onClick={handleRequestStoragePermission}
                    className="btn-realistic-primary px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>📁</span>
                    <span>
                      {isRequestingPermission
                        ? 'جارِ التحقق من ذاكرة الهاتف...'
                        : storageConfig.permissionState === 'granted'
                        ? 'إعادة تأكيد إذن التخزين بذاكرة الهاتف'
                        : 'تفعيل إذن التخزين بذاكرة الهاتف'}
                    </span>
                  </button>

                  {storageConfig.permissionState === 'granted' && (
                    <button
                      type="button"
                      disabled={isTestingStorage}
                      onClick={handleTestStorage}
                      className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-800 hover:bg-blue-100 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <span>⚡</span>
                      <span>{isTestingStorage ? 'جارِ فحص إذن الكتابة...' : 'اختبار صلاحية الكتابة والتعديل'}</span>
                    </button>
                  )}
                </div>

                {/* Storage Test Result Banner */}
                {storageTestResult && (
                  <div
                    className={`p-3 rounded-lg text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150 ${
                      storageTestResult.success
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700'
                        : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-700'
                    }`}
                  >
                    <span>{storageTestResult.success ? '✓' : '⚠️'}</span>
                    <span>{storageTestResult.message}</span>
                  </div>
                )}
              </div>

              {/* Automatic Export Preferences */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  تفضيلات التصدير إلى ذاكرة الهاتف:
                </h4>
                <div className="space-y-2 text-xs">
                  <label className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 cursor-pointer">
                    <div>
                      <span className="font-bold block">
                        حفظ مباشر وتلقائي في مجلد الهاتف المقترن
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        عند الضغط على تحميل فاتورة PDF أو تقرير Excel، يتم حفظها فوراً في المجلد دون سؤال إضافي
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={storageConfig.autoSaveToFolder}
                      onChange={(e) => {
                        const updated = savePhoneStorageConfig({
                          autoSaveToFolder: e.target.checked,
                        });
                        setStorageConfig(updated);
                      }}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Android Native APK Permissions Info */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/30 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-black text-slate-900 dark:text-white">
                  <span>🛡️</span>
                  <span>أذونات حزمة الأندرويد (Android Manifest & Scoped Storage):</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  تم ضبط ملف <code>AndroidManifest.xml</code> و <code>FileProvider</code> في التطبيق ليشمل أذونات:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400 block text-[10px]">
                      MANAGE_EXTERNAL_STORAGE
                    </span>
                    <span className="text-slate-500 text-[10px]">
                      إذن إدارة جميع الملفات في أندرويد 11 و 12 و 13 و 14 و 15
                    </span>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400 block text-[10px]">
                      WRITE_EXTERNAL_STORAGE
                    </span>
                    <span className="text-slate-500 text-[10px]">
                      مع خاصية requestLegacyExternalStorage للإصدارات الأقدم
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 sm:px-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 text-xs">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {activeTab === 'screen'
              ? 'تُحفظ إعدادات الشاشة تلقائياً على هذا الهاتف'
              : storageConfig.permissionState === 'granted'
              ? 'جاهز لتصدير فواتير PDF و Excel إلى ذاكرة الهاتف'
              : 'يمكنك أيضاً استخدام التنزيل المباشر أو المشاركة'}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-realistic-primary px-5 py-2 rounded-xl font-bold text-white shadow-xs cursor-pointer text-xs sm:text-sm"
          >
            تم / إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
};
