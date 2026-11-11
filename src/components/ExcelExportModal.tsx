import React, { useMemo, useState, useEffect } from 'react';
import { CurrencyCode, SalesRecord } from '../types';
import {
  AVAILABLE_EXCEL_FIELDS,
  CUSTOMER_SUMMARY_EXCEL_FIELDS,
  ITEM_SUMMARY_EXCEL_FIELDS,
  ExcelExportField,
  ReportDimensionMode,
  CustomExcelOptions,
  exportCustomExcelFile,
  aggregateCustomerSummaries,
  aggregateItemSummaries,
} from '../utils/csvHelper';
import { formatCurrency, formatNumber } from '../utils/formatters';

interface ExcelExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  allRecords: SalesRecord[];
  filteredRecords: SalesRecord[];
  currency: CurrencyCode;
  customersList: string[];
  initialFormat?: 'xlsx' | 'xml-excel' | 'csv';
  initialReportMode?: ReportDimensionMode;
}

export const ExcelExportModal: React.FC<ExcelExportModalProps> = ({
  isOpen,
  onClose,
  allRecords,
  filteredRecords,
  currency,
  customersList,
  initialFormat = 'xlsx',
  initialReportMode = 'detailed',
}) => {
  // 1. Report Dimension Mode: detailed | byCustomer | byItem | allReports
  const [reportMode, setReportMode] = useState<ReportDimensionMode>(initialReportMode);

  // 2. Scope selection: filtered | daily | specificDate | all | customer
  const [scope, setScope] = useState<'filtered' | 'daily' | 'specificDate' | 'all' | 'customer'>('filtered');
  const todayDateStr = new Date().toISOString().split('T')[0];
  const [targetDate, setTargetDate] = useState<string>(todayDateStr);
  const [targetCustomer, setTargetCustomer] = useState<string>('');

  // 3. Field selection state per mode
  const [detailedFields, setDetailedFields] = useState<string[]>(() =>
    AVAILABLE_EXCEL_FIELDS.filter((f) => f.defaultSelected).map((f) => f.id)
  );
  const [customerFields, setCustomerFields] = useState<string[]>(() =>
    CUSTOMER_SUMMARY_EXCEL_FIELDS.filter((f) => f.defaultSelected).map((f) => f.id)
  );
  const [itemFields, setItemFields] = useState<string[]>(() =>
    ITEM_SUMMARY_EXCEL_FIELDS.filter((f) => f.defaultSelected).map((f) => f.id)
  );

  // Sub-reports inclusion for allReports mode
  const [includeAllKpi, setIncludeAllKpi] = useState<boolean>(true);
  const [includeAllCustomers, setIncludeAllCustomers] = useState<boolean>(true);
  const [includeAllItems, setIncludeAllItems] = useState<boolean>(true);
  const [includeAllDetailed, setIncludeAllDetailed] = useState<boolean>(true);

  // 4. File format and export options
  const [fileFormat, setFileFormat] = useState<'xlsx' | 'xml-excel' | 'csv'>(initialFormat);
  const [includeTotals, setIncludeTotals] = useState<boolean>(true);
  const [customFilename, setCustomFilename] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Sync initial props whenever modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialFormat) setFileFormat(initialFormat);
      if (initialReportMode) setReportMode(initialReportMode);
    }
  }, [isOpen, initialFormat, initialReportMode]);

  // Compute active dataset to export
  const dataset = useMemo(() => {
    if (scope === 'daily') {
      return allRecords.filter((r) => r.date === todayDateStr);
    }
    if (scope === 'specificDate' && targetDate) {
      return allRecords.filter((r) => r.date === targetDate);
    }
    if (scope === 'all') return allRecords;
    if (scope === 'customer' && targetCustomer) {
      return allRecords.filter((r) => r.customerName === targetCustomer);
    }
    return filteredRecords;
  }, [scope, targetDate, targetCustomer, allRecords, filteredRecords, todayDateStr]);

  const dailyCount = useMemo(() => allRecords.filter((r) => r.date === todayDateStr).length, [allRecords, todayDateStr]);
  const specificDateCount = useMemo(() => allRecords.filter((r) => r.date === targetDate).length, [allRecords, targetDate]);

  // Aggregated data for customer and item modes
  const customerSummaries = useMemo(() => aggregateCustomerSummaries(dataset), [dataset]);
  const itemSummaries = useMemo(() => aggregateItemSummaries(dataset), [dataset]);

  // Active fields for current report mode
  const activeFieldDefinitions: ExcelExportField[] = useMemo(() => {
    if (reportMode === 'byCustomer') return CUSTOMER_SUMMARY_EXCEL_FIELDS;
    if (reportMode === 'byItem') return ITEM_SUMMARY_EXCEL_FIELDS;
    return AVAILABLE_EXCEL_FIELDS;
  }, [reportMode]);

  const currentSelectedFieldIds: string[] = useMemo(() => {
    if (reportMode === 'byCustomer') return customerFields;
    if (reportMode === 'byItem') return itemFields;
    return detailedFields;
  }, [reportMode, customerFields, itemFields, detailedFields]);

  const setSelectedFieldIds = (newFields: string[]) => {
    if (reportMode === 'byCustomer') {
      setCustomerFields(newFields);
    } else if (reportMode === 'byItem') {
      setItemFields(newFields);
    } else {
      setDetailedFields(newFields);
    }
  };

  const toggleField = (id: string) => {
    const list = currentSelectedFieldIds;
    if (list.includes(id)) {
      if (list.length <= 1) {
        alert('يرجى الإبقاء على عمود واحد على الأقل في الجدول');
        return;
      }
      setSelectedFieldIds(list.filter((f) => f !== id));
    } else {
      setSelectedFieldIds([...list, id]);
    }
  };

  const handleSelectAll = () => {
    setSelectedFieldIds(activeFieldDefinitions.map((f) => f.id));
  };

  const handleSelectMinimal = () => {
    if (reportMode === 'byCustomer') {
      setSelectedFieldIds(['customerName', 'totalSales']);
    } else if (reportMode === 'byItem') {
      setSelectedFieldIds(['itemName', 'totalQuantity', 'totalSales']);
    } else {
      setSelectedFieldIds(['orderId', 'customerName', 'itemName', 'totalSales']);
    }
  };

  // Live summary metrics
  const totalAmount = useMemo(() => dataset.reduce((s, r) => s + (r.totalSales || 0), 0), [dataset]);
  const totalQty = useMemo(() => dataset.reduce((s, r) => s + (r.quantity || 0), 0), [dataset]);

  const activeRowCount = useMemo(() => {
    if (reportMode === 'allReports') {
      return dataset.length + customerSummaries.length + itemSummaries.length;
    }
    if (reportMode === 'byCustomer') return customerSummaries.length;
    if (reportMode === 'byItem') return itemSummaries.length;
    return dataset.length;
  }, [reportMode, customerSummaries, itemSummaries, dataset]);

  if (!isOpen) return null;

  // Handle Export File
  const handleExport = async (saveDirect = false) => {
    if (reportMode !== 'allReports' && currentSelectedFieldIds.length === 0) {
      alert('يرجى اختيار عمود واحد على الأقل للتصدير');
      return;
    }

    setIsExporting(true);
    setStatusMessage(null);
    try {
      const options: CustomExcelOptions = {
        selectedFieldIds: currentSelectedFieldIds,
        includeTotalsRow: includeTotals,
        fileFormat,
        reportMode,
        currency,
        filename: customFilename.trim() || undefined,
      };

      const outcome = await exportCustomExcelFile(dataset, options, saveDirect);
      if (outcome.method === 'folder') {
        setStatusMessage(`✓ تم حفظ الملف مباشرة في مجلد الهاتف (${outcome.path || outcome.filename}) بنجاح!`);
      } else if (outcome.method === 'picker') {
        setStatusMessage('✓ تم حفظ ملف التصدير في مجلد التخزين المختار بنجاح!');
      } else {
        setStatusMessage('✓ تم تجهيز وتنزيل الملف المخصص بنجاح!');
      }
      setTimeout(() => {
        setStatusMessage(null);
      }, 4000);
    } catch (err) {
      console.error('Export error', err);
      setStatusMessage('حدث خطأ أثناء التصدير');
    } finally {
      setIsExporting(false);
    }
  };

  // Copy as TSV for Excel or Google Sheets
  const handleCopyForSheets = () => {
    const activeFields = activeFieldDefinitions.filter((f) => currentSelectedFieldIds.includes(f.id));
    const headers = activeFields.map((f) => f.labelAr);

    let rows: (string | number)[][] = [];

    if (reportMode === 'byCustomer') {
      rows = customerSummaries.map((c) =>
        activeFields.map((f) => {
          switch (f.id) {
            case 'customerName': return c.customerName;
            case 'segment': return c.segment;
            case 'totalSales': return c.totalSales.toFixed(2);
            case 'percentageOfTotal': return `${c.percentageOfTotal.toFixed(1)}%`;
            case 'totalQuantity': return c.totalQuantity;
            case 'orderCount': return c.orderCount;
            case 'avgOrderValue': return c.avgOrderValue.toFixed(2);
            case 'currency': return currency;
            default: return '';
          }
        })
      );
    } else if (reportMode === 'byItem') {
      rows = itemSummaries.map((it) =>
        activeFields.map((f) => {
          switch (f.id) {
            case 'itemName': return it.itemName;
            case 'category': return it.category;
            case 'genericName': return it.genericName;
            case 'totalQuantity': return it.totalQuantity;
            case 'avgUnitPrice': return it.avgUnitPrice.toFixed(2);
            case 'totalSales': return it.totalSales.toFixed(2);
            case 'percentageOfTotal': return `${it.percentageOfTotal.toFixed(1)}%`;
            case 'currency': return currency;
            default: return '';
          }
        })
      );
    } else {
      rows = dataset.map((item, idx) =>
        activeFields.map((f) => {
          switch (f.id) {
            case 'orderId': return item.orderId || `INV-${idx + 1}`;
            case 'date': return item.date || '';
            case 'customerName': return item.customerName || '';
            case 'customerSegment': return item.customerSegment || 'صيدلية';
            case 'itemName': return item.itemName || '';
            case 'genericName': return item.genericName || '';
            case 'category': return item.category || '';
            case 'quantity': return item.quantity ?? 0;
            case 'boxCrt': return item.boxCrt || '-';
            case 'unitPrice': return item.unitPrice ?? 0;
            case 'totalSales': return item.totalSales ?? 0;
            case 'currency': return currency;
            case 'salesRep': return item.salesRep || '';
            case 'notes': return item.notes || '';
            default: return '';
          }
        })
      );
    }

    if (includeTotals && rows.length > 0) {
      const summaryCells = activeFields.map((f, i) => {
        if (i === 0) return 'الإجمالي الكلي';
        if (f.id === 'totalSales') return totalAmount.toFixed(2);
        if (f.id === 'totalQuantity' || f.id === 'quantity') return totalQty;
        if (f.id === 'percentageOfTotal') return '100%';
        if (f.id === 'currency') return currency;
        return '';
      });
      rows.push(summaryCells);
    }

    const tsv = [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(tsv);
    setCopied(true);
    setStatusMessage('✓ تم نسخ الجدول للحافظة بصيغة متوافقة مع Excel و Google Sheets (الصق عبر Ctrl+V)');
    setTimeout(() => {
      setCopied(false);
      setStatusMessage(null);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[94vh] shadow-2xl border-2 border-emerald-300 dark:border-emerald-800 flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 my-auto">
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-white dark:from-slate-850 dark:via-slate-800 dark:to-slate-900 border-b-2 border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl shadow-sm shrink-0">
              📊
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                تصدير وتخصيص تقارير {fileFormat === 'csv' ? 'CSV' : 'Excel'}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                تصدير حسب الأصناف أو العملاء أو تفصيلي أو تصدير كل التقارير في ملف واحد
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold flex items-center justify-center cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Content Scrollable Area */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">
          {/* Status Toast */}
          {statusMessage && (
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-bold rounded-xl animate-in fade-in flex items-center gap-2">
              <span>💾</span>
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Section 0: Report Dimension Mode Selector with 4 tabs */}
          <div className="bg-gradient-to-r from-slate-50 to-emerald-50/40 dark:from-slate-850 dark:to-emerald-950/20 p-3.5 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black text-slate-900 dark:text-white">
                1. اختر نوع التقرير والتجميع المطلوب (Report Dimension):
              </label>
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                {reportMode === 'allReports' ? 'حزمة شاملة' : 'تقرير محدد'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setReportMode('detailed')}
                className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                  reportMode === 'detailed'
                    ? 'bg-emerald-600 text-white font-bold shadow-sm border-emerald-600'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
                }`}
              >
                <div className="flex items-center gap-1.5 font-black text-xs">
                  <span>📋</span>
                  <span>فواتير تفصيلية</span>
                </div>
                <div className={`text-[10px] mt-0.5 truncate ${reportMode === 'detailed' ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'}`}>
                  كافة الحركات ({dataset.length} سجل)
                </div>
              </button>

              <button
                type="button"
                onClick={() => setReportMode('byCustomer')}
                className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                  reportMode === 'byCustomer'
                    ? 'bg-emerald-600 text-white font-bold shadow-sm border-emerald-600'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
                }`}
              >
                <div className="flex items-center gap-1.5 font-black text-xs">
                  <span>👥</span>
                  <span>حسب العملاء</span>
                </div>
                <div className={`text-[10px] mt-0.5 truncate ${reportMode === 'byCustomer' ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'}`}>
                  مبيعات الصيدليات ({customerSummaries.length} عميل)
                </div>
              </button>

              <button
                type="button"
                onClick={() => setReportMode('byItem')}
                className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                  reportMode === 'byItem'
                    ? 'bg-emerald-600 text-white font-bold shadow-sm border-emerald-600'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
                }`}
              >
                <div className="flex items-center gap-1.5 font-black text-xs">
                  <span>💊</span>
                  <span>حسب الأصناف</span>
                </div>
                <div className={`text-[10px] mt-0.5 truncate ${reportMode === 'byItem' ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'}`}>
                  كميات وأسعار الأدوية ({itemSummaries.length} صنف)
                </div>
              </button>

              <button
                type="button"
                onClick={() => setReportMode('allReports')}
                className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                  reportMode === 'allReports'
                    ? 'bg-emerald-600 text-white font-bold shadow-sm border-emerald-600'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
                }`}
              >
                <div className="flex items-center gap-1.5 font-black text-xs">
                  <span>📦</span>
                  <span>كل التقارير معاً</span>
                </div>
                <div className={`text-[10px] mt-0.5 truncate ${reportMode === 'allReports' ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'}`}>
                  حزمة الـ 4 جداول مجمعة
                </div>
              </button>
            </div>
          </div>

          {/* Special Section for All Reports Mode */}
          {reportMode === 'allReports' ? (
            <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-4 rounded-2xl border-2 border-emerald-300 dark:border-emerald-700 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📑</span>
                <div>
                  <div className="font-black text-xs text-slate-900 dark:text-white">
                    حزمة كافة التقارير الشاملة (All-In-One Reports Workbook)
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300">
                    عند اختيار Excel (.xlsx) يتم إنشاء مصنف متكامل يحتوي على أوراق العمل التالية، وعند اختيار CSV يتم دمجها معاً بعناوين واضحة:
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 font-bold text-slate-800 dark:text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeAllKpi}
                    onChange={(e) => setIncludeAllKpi(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-0 cursor-pointer"
                  />
                  <span>1. ورقة المؤشرات العامة ولوحة القيادة (KPI Dashboard)</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 font-bold text-slate-800 dark:text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeAllCustomers}
                    onChange={(e) => setIncludeAllCustomers(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-0 cursor-pointer"
                  />
                  <span>2. ورقة ملخص مبيعات العملاء والصيدليات ({customerSummaries.length} عميل)</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 font-bold text-slate-800 dark:text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeAllItems}
                    onChange={(e) => setIncludeAllItems(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-0 cursor-pointer"
                  />
                  <span>3. ورقة تحليل مبيعات وكميات الأصناف ({itemSummaries.length} صنف)</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 font-bold text-slate-800 dark:text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeAllDetailed}
                    onChange={(e) => setIncludeAllDetailed(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-0 cursor-pointer"
                  />
                  <span>4. ورقة سجلات وفواتير المبيعات التفصيلية ({dataset.length} سجل)</span>
                </label>
              </div>
            </div>
          ) : (
            /* Columns Selection Grid for Detailed, ByCustomer, or ByItem modes */
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                  <span>2. تحديد أعمدة الجدول المصدر</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                    {currentSelectedFieldIds.length} من {activeFieldDefinitions.length} محددة
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    تحديد الكل ✓
                  </button>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <button
                    type="button"
                    onClick={handleSelectMinimal}
                    className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:underline cursor-pointer"
                  >
                    الحد الأدنى
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {activeFieldDefinitions.map((field) => {
                  const isChecked = currentSelectedFieldIds.includes(field.id);
                  return (
                    <label
                      key={field.id}
                      onClick={() => toggleField(field.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-colors select-none ${
                        isChecked
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 font-bold text-slate-900 dark:text-white'
                          : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded text-emerald-600 focus:ring-0 cursor-pointer"
                        />
                        <span className="truncate">{field.labelAr}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {field.labelEn}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: Record Scope Selector */}
          <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
            <label className="block text-xs font-black text-slate-800 dark:text-white mb-2">
              {reportMode === 'allReports' ? '2. نطاق البيانات المشمولة:' : '3. نطاق وفلترة البيانات المصدرة:'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {/* Option 1: Daily Report (Today) */}
              <button
                type="button"
                onClick={() => setScope('daily')}
                className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                  scope === 'daily'
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-emerald-950 dark:text-emerald-100 font-bold shadow-xs ring-2 ring-emerald-500/30'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 font-black text-xs text-emerald-700 dark:text-emerald-300">
                  <span>📅</span>
                  <span>تقرير مبيعات يومي (اليوم)</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  تاريخ اليوم: {todayDateStr} ({dailyCount} عملية)
                </div>
              </button>

              {/* Option 2: Specific Date Report */}
              <div
                className={`p-3 rounded-xl border text-right transition-all ${
                  scope === 'specificDate'
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-emerald-950 dark:text-emerald-100 font-bold shadow-xs ring-2 ring-emerald-500/30'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div
                  className="flex items-center gap-1.5 font-black text-xs cursor-pointer text-blue-700 dark:text-blue-300"
                  onClick={() => setScope('specificDate')}
                >
                  <span>📆</span>
                  <span>تقرير بتاريخ معين (اختر اليوم)</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => {
                      setTargetDate(e.target.value);
                      setScope('specificDate');
                    }}
                    className="w-full text-xs font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 text-slate-900 dark:text-white focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 shrink-0 font-bold">
                    {specificDateCount} سجل
                  </span>
                </div>
              </div>

              {/* Option 3: Filtered Records */}
              <button
                type="button"
                onClick={() => setScope('filtered')}
                className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                  scope === 'filtered'
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-emerald-950 dark:text-emerald-100 font-bold shadow-xs ring-2 ring-emerald-500/30'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="font-black text-xs">السجلات المصفاة حالياً</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  وفق فلاتر الشاشة ({filteredRecords.length} سجل)
                </div>
              </button>

              {/* Option 4: All Records */}
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                  scope === 'all'
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-emerald-950 dark:text-emerald-100 font-bold shadow-xs ring-2 ring-emerald-500/30'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="font-black text-xs">كافة السجلات المخزنة</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  كل الفواتير ({allRecords.length} سجل)
                </div>
              </button>

              {/* Option 5: Specific Customer */}
              <div
                className={`p-3 rounded-xl border text-right transition-all ${
                  scope === 'customer'
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 shadow-xs ring-2 ring-emerald-500/30'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div
                  className="font-black text-xs cursor-pointer text-slate-800 dark:text-white"
                  onClick={() => setScope('customer')}
                >
                  عميل أو صيدلية محددة
                </div>
                <select
                  value={targetCustomer}
                  onChange={(e) => {
                    setTargetCustomer(e.target.value);
                    setScope('customer');
                  }}
                  className="w-full mt-1 text-[11px] font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-1 text-slate-800 dark:text-white"
                >
                  <option value="">-- اختر العميل --</option>
                  {customersList.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section: File Format & Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Format choice with .xlsx, .csv, and .xls */}
            <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
              <label className="block text-xs font-black text-slate-800 dark:text-white mb-2">
                صيغة وتنسيق الملف:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setFileFormat('xlsx')}
                  className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer ${
                    fileFormat === 'xlsx'
                      ? 'bg-emerald-600 text-white font-bold shadow-xs border-emerald-600'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-[11px]">Excel (.xlsx)</div>
                  <div className="text-[9px] opacity-80 mt-0.5">أوراق متعددة حديث</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFileFormat('csv')}
                  className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer ${
                    fileFormat === 'csv'
                      ? 'bg-emerald-600 text-white font-bold shadow-xs border-emerald-600'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-[11px]">CSV معرب (.csv)</div>
                  <div className="text-[9px] opacity-80 mt-0.5">UTF-8 BOM معتمد</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFileFormat('xml-excel')}
                  className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer ${
                    fileFormat === 'xml-excel'
                      ? 'bg-emerald-600 text-white font-bold shadow-xs border-emerald-600'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-[11px]">Excel (.xls)</div>
                  <div className="text-[9px] opacity-80 mt-0.5">أوفيس متوافق</div>
                </button>
              </div>
            </div>

            {/* Extra Options */}
            <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-black text-slate-800 dark:text-white mb-2">
                  خيارات إضافية:
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 dark:text-white mb-2">
                  <input
                    type="checkbox"
                    checked={includeTotals}
                    onChange={(e) => setIncludeTotals(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-0 cursor-pointer"
                  />
                  <span>إضافة سطر الإجمالي الكلي (Totals Row) أسفل الجداول</span>
                </label>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="اسم الملف اختياري (مثال: تقرير_المبيعات_الربع_الأول)"
                  value={customFilename}
                  onChange={(e) => setCustomFilename(e.target.value)}
                  className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Live Data Preview Card */}
          <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 dark:from-slate-850 dark:via-slate-800 dark:to-slate-850 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 flex flex-wrap items-center justify-between gap-3 font-semibold">
            <div className="flex items-center gap-2">
              <span className="text-base">📋</span>
              <span className="text-slate-800 dark:text-white font-bold">
                معاينة نطاق التصدير:
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-black text-[11px]">
                {reportMode === 'allReports' ? '4 أوراق عمل / جداول' : `${activeRowCount} صفوف`}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white font-black text-[11px]">
                {fileFormat.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <span>الكمية: <strong className="text-slate-900 dark:text-white">{formatNumber(totalQty)}</strong></span>
              <span>·</span>
              <span>الإجمالي: <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{formatCurrency(totalAmount, currency)}</strong></span>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons Footer */}
        <div className="px-5 sm:px-6 py-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 shrink-0 text-xs">
          {/* Quick Copy to Clipboard */}
          <button
            type="button"
            onClick={handleCopyForSheets}
            className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750 font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title="نسخ الجدول لصفحات Google Sheets أو لصقه مباشرة في Excel"
          >
            <span>{copied ? '✓ تم النسخ' : '📋 نسخ للحافظة (Excel / Sheets)'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              إلغاء
            </button>

            {/* Direct Storage Picker */}
            <button
              type="button"
              disabled={isExporting || dataset.length === 0}
              onClick={() => handleExport(true)}
              className="px-4 py-2 font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
              title="تحديد مجلد الحفظ المباشر في ذاكرة الهاتف"
            >
              <span>📁</span>
              <span>حفظ بالتخزين</span>
            </button>

            {/* Standard Download */}
            <button
              type="button"
              disabled={isExporting || dataset.length === 0}
              onClick={() => handleExport(false)}
              className="px-5 py-2 font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <span className="inline-block animate-spin">⏳</span>
                  <span>جارٍ التصدير...</span>
                </>
              ) : (
                <>
                  <span>📥</span>
                  <span>
                    {reportMode === 'allReports'
                      ? fileFormat === 'xlsx'
                        ? 'تصدير كل التقارير في ملف Excel واحد 📦'
                        : 'تصدير كل التقارير في ملف CSV واحد 📦'
                      : fileFormat === 'csv'
                      ? reportMode === 'byCustomer'
                        ? 'تصدير CSV مجمع حسب العملاء'
                        : reportMode === 'byItem'
                        ? 'تصدير CSV مجمع حسب الأصناف'
                        : 'تصدير ملف CSV المخصص'
                      : reportMode === 'byCustomer'
                      ? 'تصدير Excel مجمع حسب العملاء'
                      : reportMode === 'byItem'
                      ? 'تصدير Excel مجمع حسب الأصناف'
                      : 'تصدير ملف Excel'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
