import React, { useState } from 'react';

export const LookerStudioGuide: React.FC = () => {
  const [copiedFormula, setCopiedFormula] = useState<string | null>(null);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormula(id);
    setTimeout(() => setCopiedFormula(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Blueprint Header */}
      <div className="bg-gradient-to-l from-blue-900 to-slate-900 text-white rounded-2xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-semibold mb-2">
              <span>Google Looker Studio Implementation Manual</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              دليل بناء التقرير خطوة بخطوة في Google Looker Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              اتبع هذا الدليل العملي لنقل نفس هذا التصميم والمؤشرات والأصناف إلى حسابك في Looker Studio
              مباشرة عبر Google Sheets بكل سهولة واحترافية.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://lookerstudio.google.com"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap shadow-sm"
            >
              فتح Google Looker Studio ↗
            </a>
          </div>
        </div>
      </div>

      {/* Step 1: Data Preparation */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
            1
          </div>
          <h2 className="text-sm font-bold text-slate-900">
            الخطوة الأولى: إعداد وربط مصدر البيانات (Google Sheets)
          </h2>
        </div>
        <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
          <p>
            1. افتح جدول Google Sheets جديد، وانسخ البيانات بالنقر على زر <span className="font-semibold text-blue-600">"نسخ لـ Google Sheets"</span> من تبويب مصدر البيانات في هذا البرنامج، ثم الصقها في الخلية A1.
          </p>
          <p>
            2. في Looker Studio، انقر على <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">Create -&gt; Report</span> ثم اختر مزود البيانات <span className="font-semibold text-slate-800">Google Sheets</span> واختر الملف والورقة الأولى.
          </p>
          <p>
            3. تأكد من تحديد خيار <span className="italic">"Use first row as headers"</span> (استخدام الصف الأول كترويسة للأعمدة).
          </p>
        </div>

        {/* Data Types Grid */}
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
          <div className="text-[11px] font-bold text-slate-700 mb-2">
            جدول ضبط أنواع البيانات الصحيحة (Field Data Types):
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-[11px]">
            <div className="bg-white p-2 rounded border border-slate-200">
              <span className="font-semibold text-slate-800 block">التاريخ (Date)</span>
              <span className="text-blue-600 font-mono text-[10px]">Date &gt; Date</span>
            </div>
            <div className="bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
              <span className="font-semibold text-slate-800 dark:text-slate-100 block">المندوب (Sales Rep)</span>
              <span className="text-purple-600 dark:text-purple-400 font-mono text-[10px]">Text (أحمد - ahmed jam)</span>
            </div>
            <div className="bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
              <span className="font-semibold text-slate-800 dark:text-slate-100 block">اسم العميل</span>
              <span className="text-purple-600 dark:text-purple-400 font-mono text-[10px]">Text</span>
            </div>
            <div className="bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
              <span className="font-semibold text-slate-800 dark:text-slate-100 block">الصنف / الدواء</span>
              <span className="text-purple-600 dark:text-purple-400 font-mono text-[10px]">Text (23 صنف)</span>
            </div>
            <div className="bg-white p-2 rounded border border-slate-200">
              <span className="font-semibold text-slate-800 block">الكمية المباعة</span>
              <span className="text-emerald-700 font-mono text-[10px]">Numeric &gt; Number</span>
            </div>
            <div className="bg-white p-2 rounded border border-slate-200">
              <span className="font-semibold text-slate-800 block">سعر الوحدة (W.Price)</span>
              <span className="text-emerald-700 font-mono text-[10px]">Currency &gt; SAR</span>
            </div>
            <div className="bg-white p-2 rounded border border-slate-200">
              <span className="font-semibold text-slate-800 block">إجمالي المبيعات</span>
              <span className="text-emerald-700 font-mono text-[10px]">Currency &gt; SAR</span>
            </div>
          </div>
        </div>
      </div>

      {/* Step 2: Scorecards */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
            2
          </div>
          <h2 className="text-sm font-bold text-slate-900">
            الخطوة الثانية: إضافة كروت الإحصائيات السريعة (Scorecards / KPIs)
          </h2>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed mb-3">
          من شريط الأدوات العلوي في Looker Studio اختر <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">Add a chart -&gt; Scorecard</span> وأنشئ 4 أو 5 كروت في أعلى الصفحة:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
            <div className="font-bold text-slate-800">1. إجمالي المبيعات</div>
            <div className="text-[11px] text-slate-500 mt-1">
              المقياس (Metric): <span className="font-mono text-blue-600">Total Sales</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              التجميع: <span className="font-mono">SUM</span>
            </div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
            <div className="font-bold text-slate-800">2. إجمالي الكميات</div>
            <div className="text-[11px] text-slate-500 mt-1">
              المقياس (Metric): <span className="font-mono text-blue-600">Quantity</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              التجميع: <span className="font-mono">SUM</span>
            </div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
            <div className="font-bold text-slate-800">3. إجمالي العملاء</div>
            <div className="text-[11px] text-slate-500 mt-1">
              المقياس (Metric): <span className="font-mono text-blue-600">Customer Name</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              التجميع: <span className="font-mono">COUNT_DISTINCT</span>
            </div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
            <div className="font-bold text-slate-800">4. عدد الفواتير</div>
            <div className="text-[11px] text-slate-500 mt-1">
              المقياس (Metric): <span className="font-mono text-blue-600">Order ID</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              التجميع: <span className="font-mono">COUNT</span> أو <span className="font-mono">RECORD_COUNT</span>
            </div>
          </div>
        </div>
      </div>

      {/* Step 3: Calculated Fields */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
            3
          </div>
          <h2 className="text-sm font-bold text-slate-900">
            الخطوة الثالثة: إنشاء الحقول المحسوبة (Calculated Fields)
          </h2>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed mb-3">
          انقر على <span className="font-semibold text-slate-800">"Add Field"</span> في نافذة مصدر البيانات لإضافة المعادلات المخصصة:
        </p>

        <div className="space-y-2.5">
          {/* Formula 1 */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-bold text-xs text-slate-800">
                1. متوسط قيمة الفاتورة (Average Order Value)
              </div>
              <div className="text-[11px] font-mono text-blue-700 mt-0.5">
                SUM(Total Sales) / COUNT(Order ID)
              </div>
            </div>
            <button
              onClick={() => copyText('SUM(Total Sales) / COUNT(Order ID)', 'f1')}
              className="px-3 py-1.5 text-xs bg-white border border-slate-200 hover:bg-slate-100 rounded-md transition-colors font-medium cursor-pointer shrink-0"
            >
              {copiedFormula === 'f1' ? '✓ تم النسخ' : 'نسخ المعادلة'}
            </button>
          </div>

          {/* Formula 2 */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-bold text-xs text-slate-800">
                2. إجمالي المبيعات الآلي (في حال لم يكن العمود محسوباً مسبقاً)
              </div>
              <div className="text-[11px] font-mono text-blue-700 mt-0.5">
                Quantity * Unit Price
              </div>
            </div>
            <button
              onClick={() => copyText('Quantity * Unit Price', 'f2')}
              className="px-3 py-1.5 text-xs bg-white border border-slate-200 hover:bg-slate-100 rounded-md transition-colors font-medium cursor-pointer shrink-0"
            >
              {copiedFormula === 'f2' ? '✓ تم النسخ' : 'نسخ المعادلة'}
            </button>
          </div>
        </div>
      </div>

      {/* Step 4 & 5: Tables & Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Table Setup */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
              4
            </div>
            <h2 className="text-sm font-bold text-slate-900">
              الخطوة الرابعة: إعداد الجداول التفصيلية (Tables)
            </h2>
          </div>

          <div className="space-y-3 text-xs text-slate-600">
            <div className="border border-slate-100 bg-slate-50/50 p-3 rounded-lg">
              <span className="font-bold text-slate-800 block mb-1">
                جدول 1: ملخص المبيعات حسب العملاء
              </span>
              <ul className="list-disc list-inside space-y-1 text-[11px]">
                <li>الأبعاد (Dimensions): <span className="font-mono">Customer Name</span></li>
                <li>المقاييس (Metrics): <span className="font-mono">SUM(Total Sales), SUM(Quantity), RECORD_COUNT, Average Order Value</span></li>
                <li>الفرز (Sort): حسب <span className="font-mono">SUM(Total Sales)</span> تنازلياً.</li>
                <li>خيارات الأنماط (Style): تفعيل Bars / Heatmap لعمود المبيعات.</li>
              </ul>
            </div>

            <div className="border border-slate-100 bg-slate-50/50 p-3 rounded-lg">
              <span className="font-bold text-slate-800 block mb-1">
                جدول 2: ملخص المبيعات حسب الأصناف والكميات
              </span>
              <ul className="list-disc list-inside space-y-1 text-[11px]">
                <li>الأبعاد (Dimensions): <span className="font-mono">Item Name</span> (و <span className="font-mono">Category</span> اختياري)</li>
                <li>المقاييس (Metrics): <span className="font-mono">SUM(Quantity), SUM(Total Sales)</span></li>
                <li>النسبة المئوية: في إعدادات المقياس اختر <span className="italic">Comparison calculation &gt; Percent of total</span></li>
                <li>الفرز: حسب إجمالي الكمية أو المبيعات تنازلياً.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Charts & Controls Setup */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
              5
            </div>
            <h2 className="text-sm font-bold text-slate-900">
              الخطوة الخامسة: الفلاتر والرسوم البيانية (Visuals)
            </h2>
          </div>

          <div className="space-y-3 text-xs text-slate-600">
            <div className="border border-slate-100 bg-slate-50/50 p-3 rounded-lg">
              <span className="font-bold text-slate-800 block mb-1">
                عناصر التصفية والتحكم (Add a control)
              </span>
              <ul className="list-disc list-inside space-y-1 text-[11px]">
                <li><span className="font-semibold">Date range control:</span> لتحديد فترة زمنية معينة.</li>
                <li><span className="font-semibold">Drop-down list (للعملاء):</span> Control field: <span className="font-mono">Customer Name</span></li>
                <li><span className="font-semibold">Drop-down list (للأصناف):</span> Control field: <span className="font-mono">Item Name</span></li>
              </ul>
            </div>

            <div className="border border-slate-100 bg-slate-50/50 p-3 rounded-lg">
              <span className="font-bold text-slate-800 block mb-1">
                الرسوم البيانية التوضيحية (Charts)
              </span>
              <ul className="list-disc list-inside space-y-1 text-[11px]">
                <li><span className="font-semibold">Bar Chart:</span> Dimension: <span className="font-mono">Customer Name</span>, Metric: <span className="font-mono">SUM(Total Sales)</span>, Sort: Descending, Limit: 5 bars.</li>
                <li><span className="font-semibold">Donut Chart:</span> Dimension: <span className="font-mono">Item Name</span>, Metric: <span className="font-mono">SUM(Quantity)</span>, Slices: 5.</li>
                <li><span className="font-semibold">Time Series:</span> Dimension: <span className="font-mono">Date</span>, Metric: <span className="font-mono">SUM(Total Sales)</span>.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
