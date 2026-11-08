import React, { useState } from 'react';

interface ApkBuildModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkBuildModal: React.FC<ApkBuildModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'actions' | 'codespace' | 'pwa'>('actions');
  const [copied, setCopied] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyCommand = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2500);
  };

  // Quick 1-click script command
  const quickScriptCommand = `./build-apk-codespaces.sh`;

  // Full Codespace APK build commands
  const codespaceFullCommands = `# أمر البناء التلقائي الشامل بنقرة واحدة:
./build-apk-codespaces.sh

# --- أو الأوامر اليدوية خطوة بخطوة ---
# 1. بناء ملفات تطبيق الويب
npm install
npm run build

# 2. مزامنة أندرويد عبر Capacitor
npx cap sync android

# 3. تجميع وبناء ملف الـ APK عبر Gradle
cd android
chmod +x gradlew
./gradlew assembleDebug

# 4. مسار ملف الـ APK الناتج:
# android/app/build/outputs/apk/debug/app-debug.apk`;

  const gitPushCommands = `git init
git add .
git commit -m "Build Android APK via GitHub"
git branch -M main
git remote add origin https://github.com/Ah3izoo/Ahmed-jamjoom.git
git push -u origin main`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl max-w-3xl w-full max-h-[94vh] shadow-2xl border-2 border-blue-200 dark:border-slate-700 flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Android Drag Indicator Pill */}
        <div className="w-12 h-1.5 bg-slate-400 dark:bg-slate-600 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-blue-50 via-sky-50 to-white dark:from-slate-800 dark:via-slate-850 dark:to-slate-900 border-b-2 border-blue-200 dark:border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
              APK
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                تنزيل وبناء تطبيق أندرويد (Android APK)
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold mt-0.5">
                طرق سريعة مباشرة لتشغيل وتثبيت التطبيق على هاتفك دون انتظار
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

        {/* Tab Chooser */}
        <div className="flex border-b-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 px-3 sm:px-6 gap-1 sm:gap-2 text-xs font-bold shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('actions')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'actions'
                ? 'border-emerald-600 text-emerald-800 dark:text-emerald-300 font-black'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>⚡</span>
            <span>الأسرع: GitHub Actions (بدون فتح Codespace)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pwa')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'pwa'
                ? 'border-emerald-600 text-emerald-800 dark:text-emerald-300 font-black'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>📱</span>
            <span>تثبيت فوري على الهاتف (PWA)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('codespace')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'codespace'
                ? 'border-emerald-600 text-emerald-800 dark:text-emerald-300 font-black'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>💻</span>
            <span>بناء في Codespace (تم تسريعه)</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
          {activeTab === 'actions' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-300 dark:border-emerald-700 rounded-xl">
                <div className="flex items-center gap-2 font-black text-emerald-950 dark:text-emerald-200 text-sm mb-1">
                  <span>⚡ الحل الأسرع: لا تنتظر تشغيل Codespace نهائياً!</span>
                </div>
                <p className="text-xs text-emerald-900 dark:text-emerald-300 font-semibold leading-relaxed">
                  يقوم GitHub ببناء ملف الـ APK في السحابة على خوادمهم السريعة خلال دقيقة ونصف، دون استهلاك جهازك أو فتح طرفية Codespace!
                </p>
              </div>

              {/* Step by step Actions guide */}
              <div className="p-4 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-xl space-y-3">
                <div className="font-black text-slate-900 dark:text-white text-xs sm:text-sm">
                  🎯 كيفية الحصول على الـ APK بنقرة واحدة من GitHub:
                </div>
                <ol className="list-decimal list-inside space-y-2 text-slate-800 dark:text-slate-200 font-semibold text-xs leading-relaxed">
                  <li>
                    افتح صفحة مستودعك على GitHub: <code className="font-mono font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-blue-600 dark:text-blue-400">Ah3izoo/Ahmed-jamjoom</code>
                  </li>
                  <li>
                    اضغط على تبويب <strong>Actions</strong> في الشريط العلوي.
                  </li>
                  <li>
                    اختر من القائمة الجانبية سير العمل: <strong>Build Android APK</strong>.
                  </li>
                  <li>
                    اضغط على زر <strong>Run workflow</strong> الأزرق على اليمين.
                  </li>
                  <li>
                    انتظر حوالي <strong>90 ثانية</strong> فقط حتى يظهر صح أخضر ✓، ثم ادخل عليه وحمّل ملف <strong>AhmedJam-Android-APK</strong> (أو من قسم Releases)!
                  </li>
                </ol>
              </div>

              {/* Push commands */}
              <div className="border-2 border-slate-300 dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-slate-900 dark:text-white text-xs sm:text-sm">
                    أمر رفع التحديثات إلى المستودع (لتشغيل البناء تلقائياً):
                  </span>
                  <button
                    type="button"
                    onClick={() => copyCommand(gitPushCommands, 'git')}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-2xs cursor-pointer flex items-center gap-1.5 transition-colors"
                  >
                    <span>{copied === 'git' ? '✓ تم النسخ!' : '📋 نسخ الأوامر'}</span>
                  </button>
                </div>
                <pre className="bg-slate-950 text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto text-left dir-ltr leading-relaxed border border-slate-800 shadow-inner">
                  {gitPushCommands}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'pwa' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/50 border-2 border-blue-300 dark:border-blue-700 rounded-xl">
                <div className="font-black text-blue-950 dark:text-blue-200 text-sm mb-1 flex items-center gap-2">
                  <span>📱 التثبيت الفوري كأيقونة تطبيق على أندرويد (في ثانية واحدة):</span>
                </div>
                <p className="text-xs text-blue-900 dark:text-blue-300 font-semibold leading-relaxed">
                  هذا التطبيق مجهز بالكامل كـ Progressive Web App (PWA). يعمل بكامل الشاشة وبدون شريط متصفح وبسرعة فائقة ويعمل دون إنترنت!
                </p>
              </div>

              <div className="border-2 border-slate-300 dark:border-slate-700 rounded-xl p-5 bg-white dark:bg-slate-900 space-y-3">
                <h4 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm">
                  خطوات التثبيت على الهاتف:
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-slate-800 dark:text-slate-200 font-medium text-xs leading-relaxed">
                  <li>افتح رابط التطبيق الحالي في متصفح <strong>Google Chrome</strong> على هاتفك الأندرويد.</li>
                  <li>اضغط على زر النقاط الثلاث <strong>(⋮)</strong> في أعلى الزاوية.</li>
                  <li>اضغط على <strong>تثبيت التطبيق (Install App)</strong> أو <strong>إضافة إلى الشاشة الرئيسية (Add to Home screen)</strong>.</li>
                  <li>سيظهر التطبيق كأيقونة رسمية على شاشة هاتفك مثل أي تطبيق مثبت من متجر Google Play!</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'codespace' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/50 border-2 border-amber-300 dark:border-amber-700 rounded-xl">
                <h3 className="font-black text-amber-950 dark:text-amber-200 text-sm mb-1 flex items-center gap-2">
                  <span>⚡ تم تسريع فتح Codespace الآن:</span>
                </h3>
                <p className="text-xs text-amber-900 dark:text-amber-300 font-semibold leading-relaxed">
                  قمنا بحذف ملفات التهيئة الثقيلة (.devcontainer) التي كانت تُجبر GitHub على تحميل صور عملاقة بحجم 15GB. الآن تفتح حاوية Codespace بسرعة البرق في ثوانٍ معدودة!
                </p>
              </div>

              {/* Quick 1-click script execution box */}
              <div className="border-2 border-emerald-400 dark:border-emerald-600 rounded-xl p-4 bg-emerald-50/60 dark:bg-emerald-950/30">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-black text-emerald-950 dark:text-emerald-200 text-xs sm:text-sm flex items-center gap-1.5">
                      <span>⚡</span>
                      <span>أمر البناء السريع التلقائي في Codespace:</span>
                    </span>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium mt-0.5">
                      يقوم بتجهيز أدوات أندرويد وبناء ملف الـ APK بالكامل
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyCommand(quickScriptCommand, 'quick')}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black text-xs shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors"
                  >
                    <span>{copied === 'quick' ? '✓ تم النسخ!' : '📋 نسخ الأمر'}</span>
                  </button>
                </div>
                <div className="bg-slate-950 text-emerald-400 p-3 rounded-xl font-mono text-xs overflow-x-auto text-left dir-ltr border border-slate-800 flex items-center justify-between">
                  <code>{quickScriptCommand}</code>
                </div>
              </div>

              {/* Codespace full commands box */}
              <div className="border-2 border-slate-300 dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="font-black text-slate-900 dark:text-white text-xs sm:text-sm">
                    الأوامر الكاملة خطوة بخطوة (Full Commands):
                  </span>
                  <button
                    type="button"
                    onClick={() => copyCommand(codespaceFullCommands, 'codespace')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-xs shadow-2xs cursor-pointer flex items-center gap-1.5 transition-colors"
                  >
                    <span>{copied === 'codespace' ? '✓ تم النسخ!' : '📋 نسخ الأوامر'}</span>
                  </button>
                </div>
                <pre className="bg-slate-950 text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto text-left dir-ltr leading-relaxed border border-slate-800 shadow-inner">
                  {codespaceFullCommands}
                </pre>
              </div>

              {/* How to download the APK */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950/60 border-2 border-blue-200 dark:border-blue-800 rounded-xl space-y-2">
                <div className="font-black text-blue-950 dark:text-blue-200 text-xs sm:text-sm">
                  📥 كيفية تحميل ملف الـ APK الناتج على هاتفك أو كمبيوترك:
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-800 dark:text-slate-200 font-medium text-xs">
                  <li>في قائمة الملفات على يسار Codespace، افتح المجلد: <code className="font-mono font-bold bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded">android/app/build/outputs/apk/debug/</code></li>
                  <li>انقر بزر الفأرة الأيمن (Right Click) على ملف <code className="font-mono font-bold bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded">app-debug.apk</code>.</li>
                  <li>اختر <strong>Download...</strong> لتحميله مباشرة إلى جهازك وتثبيته على هاتفك!</li>
                </ol>
              </div>
            </div>
          )}
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
