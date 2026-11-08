import React from 'react';
import { ThemeColor, ThemeMode } from '../types';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeColor: ThemeColor;
  setThemeColor: (color: ThemeColor) => void;
  themeMode: ThemeMode;
  onToggleThemeMode?: () => void;
}

interface ThemeConfig {
  id: ThemeColor;
  nameAr: string;
  nameEn: string;
  description: string;
  primaryHex: string;
  gradientHex: string;
  badgeHex: string;
}

const BUILT_IN_THEMES: ThemeConfig[] = [
  {
    id: 'blue',
    nameAr: 'أزرق جمجوم الملكي',
    nameEn: 'Jamjoom Royal Blue',
    description: 'المظهر الرسمي المعتمد لشركة جمجوم فارما، تباين فائق وأناقة كلاسيكية',
    primaryHex: '#2563eb',
    gradientHex: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    badgeHex: '#dbeafe',
  },
  {
    id: 'emerald',
    nameAr: 'أخضر طبي زمردي',
    nameEn: 'Medical Emerald',
    description: 'طابع صحي وسريري منعش ومريح للعين، مستوحى من الرعاية الطبية والصيدلانية',
    primaryHex: '#059669',
    gradientHex: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    badgeHex: '#d1fae5',
  },
  {
    id: 'violet',
    nameAr: 'بنفسجي إمبراطوري',
    nameEn: 'Imperial Violet',
    description: 'طابع فخم راقٍ وحديث، يبرز التقارير والمبيعات بجاذبية استثنائية',
    primaryHex: '#7c3aed',
    gradientHex: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
    badgeHex: '#ede9fe',
  },
  {
    id: 'teal',
    nameAr: 'فيروزي سريري',
    nameEn: 'Clinical Teal',
    description: 'أزرق محيطي هادئ يعكس الدقة والاحترافية والصفاء الذهني',
    primaryHex: '#0d9488',
    gradientHex: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
    badgeHex: '#ccfbf1',
  },
  {
    id: 'amber',
    nameAr: 'ذهبي تنفيذي',
    nameEn: 'Executive Amber',
    description: 'طابع ذهبي كهرماني دافئ، مثالي للاجتماعات وعرض مؤشرات الأداء الكبرى',
    primaryHex: '#d97706',
    gradientHex: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
    badgeHex: '#fef3c7',
  },
  {
    id: 'rose',
    nameAr: 'ياقوتي قرمزي',
    nameEn: 'Ruby Crimson',
    description: 'لون حيوي يمنح اللوحة طاقة عالية وتمييزاً بصرياً فورياً',
    primaryHex: '#e11d48',
    gradientHex: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
    badgeHex: '#ffe4e6',
  },
  {
    id: 'slate',
    nameAr: 'تيتانيوم مونوكروم',
    nameEn: 'Titanium Slate',
    description: 'تصميم أسود ورمادي وأبيض خالص عالي التباين، بساطة مطلقة',
    primaryHex: '#1e293b',
    gradientHex: 'linear-gradient(135deg, #334155 0%, #0f172a 100%)',
    badgeHex: '#e2e8f0',
  },
];

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  isOpen,
  onClose,
  themeColor,
  setThemeColor,
  themeMode,
  onToggleThemeMode,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl max-w-2xl w-full max-h-[92vh] shadow-2xl border-2 border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Mobile Pull Handle */}
        <div className="w-12 h-1.5 bg-slate-400 dark:bg-slate-600 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              🎨
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                تخصيص ثيم وألوان التطبيق (Theme Settings)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                تغيير شامل وفوري لكافة ألوان الأزرار، الرسوم البيانية، والأشرطة التفاعلية
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-base cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Light / Dark Mode Toggle Quick Banner */}
          {onToggleThemeMode && (
            <div className="p-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-slate-900 dark:text-white block">
                  وضع الإضاءة (Light / Dark Appearance):
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {themeMode === 'dark' ? 'الوضع الليلي (خلفية داكنة موفرة للبطارية)' : 'الوضع النهاري (خلفية بيضاء نقية)'}
                </span>
              </div>
              <button
                type="button"
                onClick={onToggleThemeMode}
                className="px-3 py-1.5 rounded-xl border-2 font-black text-xs transition-all cursor-pointer shadow-xs active:scale-95
                  bg-white text-black border-black hover:bg-slate-100
                  dark:bg-black dark:text-white dark:border-white dark:hover:bg-slate-950"
              >
                {themeMode === 'dark' ? 'تحويل لنهاري ☀️' : 'تحويل لليلي 🌙'}
              </button>
            </div>
          )}

          {/* Theme Palette Cards Grid */}
          <div>
            <div className="text-xs font-black text-slate-900 dark:text-white mb-2.5 flex items-center gap-2">
              <span>اختر باليتة الألوان المعتمدة (Built-in Themes):</span>
              <span className="text-[11px] font-bold text-slate-500">({BUILT_IN_THEMES.length} ثيمات جاهزة)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BUILT_IN_THEMES.map((theme) => {
                const isSelected = themeColor === theme.id;

                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setThemeColor(theme.id)}
                    className={`text-right p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2.5 relative overflow-hidden group ${
                      isSelected
                        ? 'border-slate-900 dark:border-white shadow-md bg-white dark:bg-slate-800'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 bg-slate-50/60 dark:bg-slate-850'
                    }`}
                  >
                    {/* Top Row: Swatch & Name */}
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-lg shadow-xs flex items-center justify-center shrink-0 border border-black/10"
                          style={{ background: theme.gradientHex }}
                        >
                          {isSelected && <span className="text-white text-xs font-black">✓</span>}
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{theme.nameAr}</span>
                            {isSelected && (
                              <span className="text-[10px] bg-slate-900 dark:bg-white text-white dark:text-black font-black px-1.5 py-0.2 rounded-md">
                                مفعل
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            {theme.nameEn}
                          </div>
                        </div>
                      </div>

                      {/* Swatch dots */}
                      <div className="flex items-center gap-1">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/20"
                          style={{ backgroundColor: theme.primaryHex }}
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/20"
                          style={{ backgroundColor: theme.badgeHex }}
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                      {theme.description}
                    </p>

                    {/* Micro Live Preview Bar */}
                    <div className="w-full pt-2 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                        style={{ backgroundColor: theme.badgeHex, color: theme.primaryHex }}
                      >
                        معاينة الشارة
                      </span>
                      <div
                        className="text-[10px] font-black text-white px-2.5 py-0.5 rounded-md shadow-2xs"
                        style={{ background: theme.gradientHex }}
                      >
                        زر مبيعات
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            يتم حفظ الثيم تلقائياً في ذاكرة المتصفح
          </span>
          <button
            type="button"
            onClick={onClose}
            className="btn-realistic-primary px-6 py-2 rounded-xl text-xs sm:text-sm font-black text-white shadow-xs cursor-pointer"
          >
            تطبيق وإغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
