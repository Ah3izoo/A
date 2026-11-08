import React, { useRef, useState, useEffect } from 'react';
import { CurrencyCode, ProductItem, SalesRecord } from '../types';
import { APP_NAME, DEFAULT_SALES_REP, MASTER_PRODUCT_CATALOG, SUPPLIER_LINE } from '../data/productCatalog';
import { formatCurrency, formatNumber } from '../utils/formatters';
import {
  generateInvoicePdfBlob,
  downloadPdfToMobileStorage,
  saveInvoiceToOfflineVault,
  deleteOfflineInvoice,
  clearAllOfflineInvoices,
  savePdfToPhoneStorageWithPermissions,
  sharePdfDirectlyToWhatsApp,
  PdfPaperSize,
  PdfOrientation,
  PdfMarginOption,
  GeneratePdfOptions,
} from '../utils/pdfHelper';
import {
  uploadToGoogleDrive,
  ensureDriveAccessToken,
} from '../services/firebase';
import { exportSingleInvoiceToExcel } from '../utils/excelInvoiceHelper';
import { saveFileToPhoneStorage } from '../services/phoneStorageService';
import { InvoiceCsvExportModal } from './InvoiceCsvExportModal';

export type InvoiceTheme = 'royal-blue' | 'emerald' | 'slate' | 'amber' | 'crimson' | 'teal' | 'monochrome';
export type InvoiceTemplateStyle = 'royal' | 'modern' | 'pharmacy' | 'banner' | 'thermal' | 'monochrome';
export type InvoiceHeaderStyle = 'modern-split' | 'classic-center' | 'banner-strip' | 'minimal';
export type InvoiceBorderStyle = 'rounded' | 'square' | 'double' | 'borderless';
export type ColumnGridStyle = 'full-grid' | 'striped' | 'clean' | 'cards';
export type ColumnAlign = 'standard' | 'center' | 'right';
export type TableDensity = 'compact' | 'comfortable' | 'spacious';
export type TableFontSize = 'small' | 'medium' | 'large';
export type ColumnWidthPreset = 'balanced' | 'wide-product' | 'compact-data' | 'custom';
export type ScreenWidthMode = 'fit' | 'a4' | 'wide' | 'full';

export interface InvoiceThemeConfig {
  name: string;
  primaryHex: string;
  primaryBg: string;
  badgeBg: string;
  borderClass: string;
  headerAccent: string;
  headerText: string;
  zebraBg: string;
  hoverBg: string;
  totalBoxBorder: string;
  totalText: string;
}

export const THEME_CONFIGS: Record<InvoiceTheme, InvoiceThemeConfig> = {
  'royal-blue': {
    name: 'كحلي ملكي طبي',
    primaryHex: '#0f3775',
    primaryBg: 'bg-[#0f3775]',
    badgeBg: 'bg-blue-600',
    borderClass: 'border-blue-900',
    headerAccent: 'from-blue-900 via-indigo-950 to-slate-950',
    headerText: 'text-blue-950',
    zebraBg: 'bg-blue-50/30',
    hoverBg: 'hover:bg-blue-50/50',
    totalBoxBorder: 'border-blue-600',
    totalText: 'text-blue-900',
  },
  'emerald': {
    name: 'زمردي صيدلاني',
    primaryHex: '#065f46',
    primaryBg: 'bg-[#065f46]',
    badgeBg: 'bg-emerald-600',
    borderClass: 'border-emerald-800',
    headerAccent: 'from-emerald-950 via-teal-950 to-slate-950',
    headerText: 'text-emerald-950',
    zebraBg: 'bg-emerald-50/30',
    hoverBg: 'hover:bg-emerald-50/50',
    totalBoxBorder: 'border-emerald-600',
    totalText: 'text-emerald-800',
  },
  'slate': {
    name: 'رمادي عصري وتنفيذي',
    primaryHex: '#1e293b',
    primaryBg: 'bg-[#1e293b]',
    badgeBg: 'bg-slate-700',
    borderClass: 'border-slate-800',
    headerAccent: 'from-slate-900 via-slate-800 to-zinc-950',
    headerText: 'text-slate-900',
    zebraBg: 'bg-slate-50/60',
    hoverBg: 'hover:bg-slate-100/60',
    totalBoxBorder: 'border-slate-700',
    totalText: 'text-slate-900',
  },
  'amber': {
    name: 'عنبر ذهبي فاخر',
    primaryHex: '#78350f',
    primaryBg: 'bg-[#78350f]',
    badgeBg: 'bg-amber-600',
    borderClass: 'border-amber-900',
    headerAccent: 'from-amber-950 via-yellow-950 to-stone-950',
    headerText: 'text-amber-950',
    zebraBg: 'bg-amber-50/30',
    hoverBg: 'hover:bg-amber-50/50',
    totalBoxBorder: 'border-amber-600',
    totalText: 'text-amber-900',
  },
  'crimson': {
    name: 'عنابي وقور',
    primaryHex: '#881337',
    primaryBg: 'bg-[#881337]',
    badgeBg: 'bg-rose-600',
    borderClass: 'border-rose-900',
    headerAccent: 'from-rose-950 via-red-950 to-stone-950',
    headerText: 'text-rose-950',
    zebraBg: 'bg-rose-50/30',
    hoverBg: 'hover:bg-rose-50/50',
    totalBoxBorder: 'border-rose-600',
    totalText: 'text-rose-900',
  },
  'teal': {
    name: 'تيل بحري طبي',
    primaryHex: '#0f766e',
    primaryBg: 'bg-[#0f766e]',
    badgeBg: 'bg-teal-600',
    borderClass: 'border-teal-900',
    headerAccent: 'from-teal-950 via-emerald-950 to-slate-950',
    headerText: 'text-teal-950',
    zebraBg: 'bg-teal-50/30',
    hoverBg: 'hover:bg-teal-50/50',
    totalBoxBorder: 'border-teal-600',
    totalText: 'text-teal-900',
  },
  'monochrome': {
    name: 'أبيض وأسود (طباعة اقتصادية)',
    primaryHex: '#111827',
    primaryBg: 'bg-black',
    badgeBg: 'bg-black',
    borderClass: 'border-black',
    headerAccent: 'from-black via-zinc-900 to-black',
    headerText: 'text-black',
    zebraBg: 'bg-gray-100',
    hoverBg: 'hover:bg-gray-200',
    totalBoxBorder: 'border-black',
    totalText: 'text-black',
  },
};

interface InvoicePdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: SalesRecord | null;
  allRecords: SalesRecord[];
  onSelectRecord: (record: SalesRecord) => void;
  onUpdateRecords?: (updatedRecords: SalesRecord[]) => void;
  onDeleteCurrentInvoice?: (orderId: string) => void;
  onClearAllInvoices?: () => void;
  catalog?: ProductItem[];
  currency: CurrencyCode;
  activeSalesRep?: string;
  initialOpenDesigner?: boolean;
}

export const InvoicePdfModal: React.FC<InvoicePdfModalProps> = ({
  isOpen,
  onClose,
  record,
  allRecords,
  onSelectRecord,
  onUpdateRecords,
  onDeleteCurrentInvoice,
  onClearAllInvoices,
  catalog,
  currency,
  activeSalesRep,
  initialOpenDesigner = false,
}) => {
  // Designer Drawer & Customization State
  const [isDesignerOpen, setIsDesignerOpen] = useState(initialOpenDesigner);
  const [designerActiveTab, setDesignerActiveTab] = useState<'paper' | 'design' | 'columns' | 'screen' | 'company'>('paper');

  // Sync initialOpenDesigner when modal opens
  useEffect(() => {
    if (isOpen && initialOpenDesigner) {
      setIsDesignerOpen(true);
    }
  }, [isOpen, initialOpenDesigner]);

  // 1. PDF Page Size & Geometry
  const [pdfPaperSize, setPdfPaperSize] = useState<PdfPaperSize>(() => {
    return (localStorage.getItem('ahmedjam_pdf_paper_size') as PdfPaperSize) || 'a4';
  });
  const [pdfOrientation, setPdfOrientation] = useState<PdfOrientation>(() => {
    return (localStorage.getItem('ahmedjam_pdf_orientation') as PdfOrientation) || 'portrait';
  });
  const [pdfMargin, setPdfMargin] = useState<PdfMarginOption>(() => {
    return (localStorage.getItem('ahmedjam_pdf_margin') as PdfMarginOption) || 'standard';
  });
  const [customMarginMm, setCustomMarginMm] = useState<number>(() => {
    return Number(localStorage.getItem('ahmedjam_custom_margin_mm')) || 6;
  });
  const [pdfResolution, setPdfResolution] = useState<number>(() => {
    return Number(localStorage.getItem('ahmedjam_pdf_res')) || 2;
  });

  // 2. Invoice Template & Style
  const [invoiceTemplate, setInvoiceTemplate] = useState<InvoiceTemplateStyle>(() => {
    return (localStorage.getItem('ahmedjam_inv_template') as InvoiceTemplateStyle) || 'royal';
  });
  const [invoiceTheme, setInvoiceTheme] = useState<InvoiceTheme>(() => {
    return (localStorage.getItem('ahmedjam_inv_theme') as InvoiceTheme) || 'royal-blue';
  });
  const [invoiceHeaderStyle, setInvoiceHeaderStyle] = useState<InvoiceHeaderStyle>(() => {
    return (localStorage.getItem('ahmedjam_inv_header') as InvoiceHeaderStyle) || 'modern-split';
  });
  const [invoiceBorderStyle, setInvoiceBorderStyle] = useState<InvoiceBorderStyle>(() => {
    return (localStorage.getItem('ahmedjam_inv_border') as InvoiceBorderStyle) || 'rounded';
  });

  // 3. Columns & Table Customization
  const [columnGridStyle, setColumnGridStyle] = useState<ColumnGridStyle>(() => {
    return (localStorage.getItem('ahmedjam_col_grid') as ColumnGridStyle) || 'full-grid';
  });
  const [columnAlign, setColumnAlign] = useState<ColumnAlign>(() => {
    return (localStorage.getItem('ahmedjam_col_align') as ColumnAlign) || 'standard';
  });
  const [tableDensity, setTableDensity] = useState<TableDensity>(() => {
    return (localStorage.getItem('ahmedjam_tbl_density') as TableDensity) || 'comfortable';
  });
  const [tableFontSize, setTableFontSize] = useState<TableFontSize>(() => {
    return (localStorage.getItem('ahmedjam_tbl_font') as TableFontSize) || 'medium';
  });
  const [columnWidthPreset, setColumnWidthPreset] = useState<ColumnWidthPreset>(() => {
    return (localStorage.getItem('ahmedjam_col_preset') as ColumnWidthPreset) || 'balanced';
  });

  // Column Visibility Toggles
  const [showIndexCol, setShowIndexCol] = useState<boolean>(() => {
    const val = localStorage.getItem('ahmedjam_show_col_index');
    return val === null ? true : val === 'true';
  });
  const [showLogo, setShowLogo] = useState<boolean>(() => {
    const val = localStorage.getItem('ahmedjam_show_logo');
    return val === null ? true : val === 'true';
  });
  const [showGeneric, setShowGeneric] = useState<boolean>(() => {
    const val = localStorage.getItem('ahmedjam_show_generic');
    return val === null ? true : val === 'true';
  });
  const [showCategory, setShowCategory] = useState<boolean>(() => {
    const val = localStorage.getItem('ahmedjam_show_category');
    return val === null ? true : val === 'true';
  });
  const [showUnitCol, setShowUnitCol] = useState<boolean>(() => {
    const val = localStorage.getItem('ahmedjam_show_col_unit');
    return val === null ? true : val === 'true';
  });
  const [showSignatures, setShowSignatures] = useState<boolean>(() => {
    const val = localStorage.getItem('ahmedjam_show_signatures');
    return val === null ? true : val === 'true';
  });
  const [showBarcode, setShowBarcode] = useState<boolean>(() => {
    const val = localStorage.getItem('ahmedjam_show_barcode');
    return val === null ? true : val === 'true';
  });
  const [showTopInvoiceCard, setShowTopInvoiceCard] = useState<boolean>(() => {
    const val = localStorage.getItem('ahmedjam_show_top_invoice_card');
    return val === null ? false : val === 'true';
  });
  const [showOrderDetailsCard, setShowOrderDetailsCard] = useState<boolean>(() => {
    const val = localStorage.getItem('ahmedjam_show_order_details_card');
    return val === null ? false : val === 'true';
  });
  const [showDeliveryRepCard, setShowDeliveryRepCard] = useState<boolean>(() => {
    const val = localStorage.getItem('ahmedjam_show_delivery_rep_card');
    return val === null ? true : val === 'true';
  });
  const [showPaymentTerms, setShowPaymentTerms] = useState<boolean>(() => {
    const val = localStorage.getItem('ahmedjam_show_payment_terms');
    return val === null ? true : val === 'true';
  });
  const [paymentTermsType, setPaymentTermsType] = useState<string>(() => {
    return localStorage.getItem('ahmedjam_payment_type') || 'نقدي / تسليم فوري';
  });
  const [customPaymentTermsText, setCustomPaymentTermsText] = useState<string>(() => {
    return localStorage.getItem('ahmedjam_custom_payment_text') || '';
  });
  const [isPaymentPopoverOpen, setIsPaymentPopoverOpen] = useState<boolean>(false);
  const [showWatermark, setShowWatermark] = useState<boolean>(() => {
    const val = localStorage.getItem('ahmedjam_show_watermark');
    return val === null ? true : val === 'true';
  });
  const [watermarkText, setWatermarkText] = useState<string>(() => {
    return localStorage.getItem('ahmedjam_watermark_text') || 'معتمد رسمياً ✓';
  });

  // 4. On-Screen Zoom & Display Scale
  const [zoomScale, setZoomScale] = useState<number>(() => {
    return Number(localStorage.getItem('ahmedjam_zoom_scale')) || 100;
  });
  const [screenWidthMode, setScreenWidthMode] = useState<ScreenWidthMode>(() => {
    return (localStorage.getItem('ahmedjam_screen_mode') as ScreenWidthMode) || 'wide';
  });

  // Invoice Format Style: 'detailed' (تفصيلي) vs 'quick' (سريع)
  const [invoiceFormatStyle, setInvoiceFormatStyle] = useState<'detailed' | 'quick'>(() => {
    return (localStorage.getItem('ahmedjam_invoice_format_style') as 'detailed' | 'quick') || 'detailed';
  });

  // Custom Company Header State
  const [isEditingCompanyHeader, setIsEditingCompanyHeader] = useState(false);
  const [companyName, setCompanyName] = useState<string>(() => {
    return localStorage.getItem('ahmedjam_company_name') || 'ahmed jam • Jamjoom Pharma';
  });
  const [companySubtitle, setCompanySubtitle] = useState<string>(() => {
    return localStorage.getItem('ahmedjam_company_subtitle') || 'Jamjoom Pharma (شركة كمبال العالمية للأدوية)';
  });
  const [companyTaxNumber, setCompanyTaxNumber] = useState<string>(() => {
    return localStorage.getItem('ahmedjam_company_tax') || 'قطاع التوزيع والمبيعات الطبية • س.ت: 4030138905 • معتمد رسمياً';
  });
  const [companyContact, setCompanyContact] = useState<string>(() => {
    return localStorage.getItem('ahmedjam_company_contact') || 'هاتف: 012-6140000 • خدمة العملاء والمستودعات';
  });

  // Save Custom Company Header
  const handleSaveCompanyHeader = () => {
    localStorage.setItem('ahmedjam_company_name', companyName.trim() || 'ahmed jam • Jamjoom Pharma');
    localStorage.setItem('ahmedjam_company_subtitle', companySubtitle.trim());
    localStorage.setItem('ahmedjam_company_tax', companyTaxNumber.trim());
    localStorage.setItem('ahmedjam_company_contact', companyContact.trim());
    setIsEditingCompanyHeader(false);
    setToastMessage({ text: '✓ تم حفظ الترويسة المخصصة للشركة وتطبيقها بنجاح!' });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleResetCompanyHeader = () => {
    const defName = 'ahmed jam • Jamjoom Pharma';
    const defSub = 'Jamjoom Pharma (شركة كمبال العالمية للأدوية)';
    const defTax = 'قطاع التوزيع والمبيعات الطبية • س.ت: 4030138905 • معتمد رسمياً';
    const defContact = 'هاتف: 012-6140000 • خدمة العملاء والمستودعات';
    setCompanyName(defName);
    setCompanySubtitle(defSub);
    setCompanyTaxNumber(defTax);
    setCompanyContact(defContact);
    localStorage.removeItem('ahmedjam_company_name');
    localStorage.removeItem('ahmedjam_company_subtitle');
    localStorage.removeItem('ahmedjam_company_tax');
    localStorage.removeItem('ahmedjam_company_contact');
    setIsEditingCompanyHeader(false);
    setToastMessage({ text: '✓ تمت استعادة ترويسة الشركة الافتراضية.' });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Reset All Invoice Design & PDF Settings to defaults
  const handleResetDesignDefaults = () => {
    setPdfPaperSize('a4');
    setPdfOrientation('portrait');
    setPdfMargin('standard');
    setCustomMarginMm(6);
    setPdfResolution(2);
    setInvoiceTemplate('royal');
    setInvoiceTheme('royal-blue');
    setInvoiceHeaderStyle('modern-split');
    setInvoiceBorderStyle('rounded');
    setColumnGridStyle('full-grid');
    setColumnAlign('standard');
    setTableDensity('comfortable');
    setTableFontSize('medium');
    setColumnWidthPreset('balanced');
    setShowIndexCol(true);
    setShowLogo(true);
    setShowGeneric(true);
    setShowCategory(true);
    setShowUnitCol(true);
    setShowSignatures(true);
    setShowBarcode(true);
    setShowTopInvoiceCard(false);
    setShowOrderDetailsCard(false);
    setShowWatermark(true);
    setWatermarkText('معتمد رسمياً ✓');
    setZoomScale(100);
    setScreenWidthMode('wide');

    localStorage.removeItem('ahmedjam_pdf_paper_size');
    localStorage.removeItem('ahmedjam_pdf_orientation');
    localStorage.removeItem('ahmedjam_pdf_margin');
    localStorage.removeItem('ahmedjam_custom_margin_mm');
    localStorage.removeItem('ahmedjam_pdf_res');
    localStorage.removeItem('ahmedjam_inv_template');
    localStorage.removeItem('ahmedjam_inv_theme');
    localStorage.removeItem('ahmedjam_inv_header');
    localStorage.removeItem('ahmedjam_inv_border');
    localStorage.removeItem('ahmedjam_col_grid');
    localStorage.removeItem('ahmedjam_col_align');
    localStorage.removeItem('ahmedjam_tbl_density');
    localStorage.removeItem('ahmedjam_tbl_font');
    localStorage.removeItem('ahmedjam_col_preset');
    localStorage.removeItem('ahmedjam_show_col_index');
    localStorage.removeItem('ahmedjam_show_logo');
    localStorage.removeItem('ahmedjam_show_generic');
    localStorage.removeItem('ahmedjam_show_category');
    localStorage.removeItem('ahmedjam_show_col_unit');
    localStorage.removeItem('ahmedjam_show_signatures');
    localStorage.removeItem('ahmedjam_show_barcode');
    localStorage.removeItem('ahmedjam_show_top_invoice_card');
    localStorage.removeItem('ahmedjam_show_order_details_card');
    localStorage.removeItem('ahmedjam_show_watermark');
    localStorage.removeItem('ahmedjam_watermark_text');
    localStorage.removeItem('ahmedjam_zoom_scale');
    localStorage.removeItem('ahmedjam_screen_mode');

    setToastMessage({ text: '✓ تمت استعادة أبعاد ومقاسات وتصميم الفاتورة الافتراضية بنجاح.' });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // FULLSCREEN MODE
  const [isFullscreen, setIsFullscreen] = useState(true);

  // Invoice Editing State
  const [isEditingInvoice, setIsEditingInvoice] = useState(false);
  const [editableItems, setEditableItems] = useState<SalesRecord[]>([]);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editRep, setEditRep] = useState('');
  const [editPaymentType, setEditPaymentType] = useState('نقدي / تسليم فوري');
  const [selectedCatalogItem, setSelectedCatalogItem] = useState('');
  const [newAddQuantity, setNewAddQuantity] = useState<number>(10);

  // Action Loading States
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);
  const [isSavingDirectStorage, setIsSavingDirectStorage] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isSharingWhatsApp, setIsSharingWhatsApp] = useState(false);
  const [isInvoiceCsvModalOpen, setIsInvoiceCsvModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; link?: string } | null>(null);

  const printAreaRef = useRef<HTMLDivElement>(null);

  // Deduplicate orders so dropdown lists each order only once
  const uniqueInvoiceRecords = React.useMemo(() => {
    const map = new Map<string, SalesRecord>();
    for (const r of allRecords) {
      const key = r.orderId || `${r.customerName}-${r.date}`;
      if (!map.has(key)) {
        map.set(key, r);
      }
    }
    return Array.from(map.values());
  }, [allRecords]);

  // Selected record or fallback
  const activeRecord: SalesRecord = record || allRecords[0] || {
    id: 'empty',
    orderId: 'INV-84650',
    date: new Date().toISOString().split('T')[0],
    customerName: 'صيدلية الأمل الحديثة',
    itemName: 'Acretin 0.05 cream',
    category: 'الجلدية والتجميل',
    quantity: 10,
    unitPrice: 11981,
    totalSales: 119810,
    salesRep: activeSalesRep || DEFAULT_SALES_REP,
  };

  // Group all items belonging to this order or customer on the same date
  const invoiceItems = allRecords.filter(
    (r) =>
      r.orderId === activeRecord.orderId ||
      (r.customerName === activeRecord.customerName && r.date === activeRecord.date)
  );
  const itemsToDisplay = isEditingInvoice
    ? editableItems
    : invoiceItems.length > 0
    ? invoiceItems
    : [activeRecord];

  const totalQuantity = itemsToDisplay.reduce((s, it) => s + (it.quantity || 0), 0);
  const totalAmount = itemsToDisplay.reduce((s, it) => s + (it.totalSales || 0), 0);

  // Active Sales Representative
  const currentRepDisplay = (activeSalesRep && activeSalesRep.trim())
    ? activeSalesRep
    : (activeRecord.salesRep && activeRecord.salesRep.trim())
    ? activeRecord.salesRep
    : DEFAULT_SALES_REP;

  // Export Invoice to CSV
  const handleExportInvoiceCsv = async () => {
    try {
      const bom = '\uFEFF';
      let csv = bom;

      csv += `رقم الفاتورة,${activeRecord.orderId}\n`;
      csv += `تاريخ الفاتورة,${activeRecord.date}\n`;
      csv += `العميل / الصيدلية,"${(activeRecord.customerName || '').replace(/"/g, '""')}"\n`;
      csv += `تصنيف العميل,"${(activeRecord.customerSegment || 'صيدليات مجتمعية').replace(/"/g, '""')}"\n`;
      csv += `المندوب الطبي,"${currentRepDisplay.replace(/"/g, '""')}"\n`;
      csv += `طريقة السداد,"${(activeRecord.paymentType || paymentTermsType || 'نقدي / تسليم فوري').replace(/"/g, '""')}"\n`;
      csv += `الشركة / المنشأة,"${companyName.replace(/"/g, '""')}"\n`;
      csv += `العملة,${currency}\n`;
      csv += '\n';

      csv += '#,اسم الصنف والمستحضر الدوائي,التركيبة العلمية,التصنيف,الوحدة,الكمية (العبوات),سعر الوحدة,الإجمالي\n';
      itemsToDisplay.forEach((it, idx) => {
        const itemTitle = `"${(it.itemName || '').replace(/"/g, '""')}"`;
        const gen = `"${(it.genericName || '').replace(/"/g, '""')}"`;
        const cat = `"${(it.category || '').replace(/"/g, '""')}"`;
        csv += `${idx + 1},${itemTitle},${gen},${cat},عبوة,${it.quantity},${it.unitPrice},${it.totalSales}\n`;
      });

      csv += '\n';
      csv += `إجمالي عدد الأصناف,${itemsToDisplay.length}\n`;
      csv += `إجمالي الكمية المباعة,${totalQuantity}\n`;
      csv += `المجموع الفرعي,${totalAmount} ${currency}\n`;
      csv += `الخصم التجاري,0 ${currency}\n`;
      csv += `الصافي المطلوب سداده,${totalAmount} ${currency}\n`;
      if (activeRecord.notes) {
        csv += `الملاحظات,"${activeRecord.notes.replace(/"/g, '""')}"\n`;
      }

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const safeCustomer = (activeRecord.customerName || 'Customer').replace(/[\s/\\?%*:|"<>]+/g, '_');
      const filename = `Invoice-${activeRecord.orderId}-${safeCustomer}.csv`;

      try {
        const res = await saveFileToPhoneStorage(filename, blob, 'text/csv;charset=utf-8;', 'csv');
        setToastMessage({
          text: res.path
            ? `✓ تم حفظ الفاتورة بصيغة CSV في (${res.path}) متوافقة مع Excel!`
            : `✓ تم حفظ وتنزيل الفاتورة بصيغة CSV (${filename}) بنجاح!`,
        });
      } catch {
        downloadPdfToMobileStorage(blob, filename);
        setToastMessage({
          text: `✓ تم تنزيل الفاتورة بصيغة CSV (${filename}) متوافقة مع Excel!`,
        });
      }
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err) {
      console.error('CSV Export Error', err);
      setToastMessage({ text: 'حدث خطأ أثناء حفظ الفاتورة كـ CSV.' });
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  // Delete Invoices Handlers
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<'all' | 'current' | null>(null);

  const handleDeleteCurrentInvoice = () => {
    const remaining = allRecords.filter((r) => r.orderId !== activeRecord.orderId);
    if (onUpdateRecords) {
      onUpdateRecords(remaining);
    }
    if (onDeleteCurrentInvoice) {
      onDeleteCurrentInvoice(activeRecord.orderId);
    }
    deleteOfflineInvoice(activeRecord.orderId);

    if (remaining.length > 0) {
      onSelectRecord(remaining[0]);
      setToastMessage({ text: `✓ تم حذف الفاتورة (${activeRecord.orderId}) بنجاح.` });
      setTimeout(() => setToastMessage(null), 3500);
    } else {
      onClose();
    }
    setShowDeleteConfirm(null);
  };

  const handleDeleteAllInvoices = () => {
    if (onUpdateRecords) {
      onUpdateRecords([]);
    }
    if (onClearAllInvoices) {
      onClearAllInvoices();
    }
    clearAllOfflineInvoices();
    setShowDeleteConfirm(null);
    onClose();
  };

  // Handlers for Editing
  const handleStartEditing = () => {
    const items = invoiceItems.length > 0 ? invoiceItems : [activeRecord];
    setEditableItems(JSON.parse(JSON.stringify(items)));
    setEditCustomerName(activeRecord.customerName);
    setEditDate(activeRecord.date);
    setEditNotes(activeRecord.notes || '');
    setEditRep(currentRepDisplay);
    setEditPaymentType(activeRecord.paymentType || paymentTermsType || 'نقدي / تسليم فوري');
    setIsEditingInvoice(true);
  };

  const handleUpdateItemQuantity = (index: number, newQty: number) => {
    const qty = Math.max(1, newQty);
    setEditableItems((prev) => {
      const copy = [...prev];
      if (copy[index]) {
        copy[index] = {
          ...copy[index],
          quantity: qty,
          totalSales: qty * copy[index].unitPrice,
        };
      }
      return copy;
    });
  };

  const handleDeleteItem = (index: number) => {
    if (editableItems.length <= 1) {
      setToastMessage({ text: 'لا يمكن حذف الصنف الوحيد في الفاتورة.' });
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    setEditableItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddNewItem = () => {
    if (!selectedCatalogItem) return;
    const catList = catalog || MASTER_PRODUCT_CATALOG;
    const prod = catList.find(
      (p) => p.productName === selectedCatalogItem || (p as any).itemName === selectedCatalogItem
    );
    if (!prod) return;

    const qty = Math.max(1, newAddQuantity);
    const unitPrice = prod.currentPrice || prod.defaultPrice || 0;
    const itemName = prod.productName || (prod as any).itemName;
    const newItem: SalesRecord = {
      id: `sale-edit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      orderId: activeRecord.orderId,
      customerName: editCustomerName.trim() || activeRecord.customerName,
      customerSegment: activeRecord.customerSegment,
      date: editDate || activeRecord.date,
      itemName: itemName,
      genericName: prod.genericName,
      category: prod.category,
      quantity: qty,
      unitPrice: unitPrice,
      totalSales: qty * unitPrice,
      salesRep: editRep || activeRecord.salesRep || activeSalesRep || DEFAULT_SALES_REP,
      paymentType: editPaymentType,
      notes: editNotes || activeRecord.notes,
    };

    setEditableItems((prev) => [...prev, newItem]);
    setSelectedCatalogItem('');
    setNewAddQuantity(10);
  };

  const handleSaveInvoiceModifications = () => {
    if (editableItems.length === 0) return;

    const finalizedItems = editableItems.map((item) => ({
      ...item,
      customerName: editCustomerName.trim() || item.customerName,
      date: editDate || item.date,
      notes: editNotes,
      salesRep: editRep || item.salesRep,
      paymentType: editPaymentType,
    }));

    const otherRecords = allRecords.filter(
      (r) =>
        r.orderId !== activeRecord.orderId &&
        !(r.customerName === activeRecord.customerName && r.date === activeRecord.date)
    );

    const updatedAll = [...otherRecords, ...finalizedItems];

    if (onUpdateRecords) {
      onUpdateRecords(updatedAll);
    }

    if (finalizedItems[0]) {
      onSelectRecord(finalizedItems[0]);
    }

    setIsEditingInvoice(false);
    setToastMessage({ text: '✓ تم حفظ تعديل الفاتورة وتحديث الكميات وطريقة السداد بنجاح!' });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleQuickChangePaymentTerms = (newType: string) => {
    setPaymentTermsType(newType);
    localStorage.setItem('ahmedjam_payment_type', newType);

    if (newType === 'hidden' || newType === 'none' || newType === 'بدون') {
      setShowPaymentTerms(false);
      localStorage.setItem('ahmedjam_show_payment_terms', 'false');
    } else {
      setShowPaymentTerms(true);
      localStorage.setItem('ahmedjam_show_payment_terms', 'true');
    }

    if (onUpdateRecords) {
      const updatedAll = allRecords.map((r) => {
        if (
          r.orderId === activeRecord.orderId ||
          (r.customerName === activeRecord.customerName && r.date === activeRecord.date)
        ) {
          return {
            ...r,
            paymentType: newType,
          };
        }
        return r;
      });
      onUpdateRecords(updatedAll);
    }

    setIsPaymentPopoverOpen(false);
    setToastMessage({
      text: `✓ تم تعديل شروط السداد إلى: "${newType === 'hidden' ? 'إخفاء من الفاتورة' : newType}" بنجاح!`,
    });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Export single invoice to Excel (.xlsx)
  const handleExportInvoiceExcel = async () => {
    setIsExportingExcel(true);
    setToastMessage(null);
    try {
      const activePay =
        activeRecord.paymentType ||
        (paymentTermsType === 'custom' ? customPaymentTermsText : paymentTermsType) ||
        'نقدي / تسليم فوري';

      const isPayVisible =
        showPaymentTerms &&
        activePay !== 'hidden' &&
        activePay !== 'none' &&
        activePay !== 'بدون';

      const res = await exportSingleInvoiceToExcel({
        orderId: activeRecord.orderId,
        customerName: activeRecord.customerName,
        customerSegment: activeRecord.customerSegment,
        date: activeRecord.date,
        salesRep: currentRepDisplay,
        paymentType: isPayVisible ? activePay : undefined,
        currency,
        items: itemsToDisplay.map((it) => ({
          itemName: it.itemName,
          genericName: it.genericName,
          category: it.category,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          totalSales: it.totalSales,
          boxCrt: it.boxCrt,
          notes: it.notes,
        })),
        totalQuantity,
        totalAmount,
        showPaymentTerms: isPayVisible,
      });

      setToastMessage({
        text: res.message || `✓ تم تصدير الفاتورة بصيغة Excel (${res.filename}) بنجاح!`,
      });
      setTimeout(() => setToastMessage(null), 5500);
    } catch (err: any) {
      console.error('Export Excel failed:', err);
      setToastMessage({ text: '⚠️ تعذر تصدير الفاتورة بصيغة Excel: ' + (err?.message || '') });
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getPdfGenerationOptions = (): GeneratePdfOptions => ({
    singlePageFit: true,
    paperSize: pdfPaperSize,
    orientation: pdfOrientation,
    margin: pdfMargin,
    customMarginMm: customMarginMm,
    scale: pdfResolution,
  });

  // Google Drive
  const handleSaveToGoogleDrive = async () => {
    if (!printAreaRef.current) return;
    setIsUploadingToDrive(true);
    setToastMessage(null);
    try {
      const token = await ensureDriveAccessToken();
      const filename = `Invoice-${activeRecord.orderId}-${activeRecord.customerName.replace(/\s+/g, '_')}.pdf`;
      const result = await generateInvoicePdfBlob(printAreaRef.current, pdfPaperSize, filename, getPdfGenerationOptions());

      const driveRes = await uploadToGoogleDrive(token, filename, result.blob, 'application/pdf');

      setToastMessage({
        text: `✓ تم حفظ ورفع الفاتورة (${filename}) بنجاح إلى Google Drive!`,
        link: driveRes.webViewLink,
      });
    } catch (err: any) {
      console.warn('Google Drive Upload Notice:', err?.message || err);
      if (printAreaRef.current) {
        try {
          const fallbackRes = await generateInvoicePdfBlob(
            printAreaRef.current,
            pdfPaperSize,
            `Invoice-${activeRecord.orderId}.pdf`,
            getPdfGenerationOptions()
          );
          downloadPdfToMobileStorage(fallbackRes.blob, `Invoice-${activeRecord.orderId}.pdf`);
        } catch {}
      }
      setToastMessage({
        text: `${err.message || 'تعذر الاتصال بـ Google Drive'} (تم تنزيل نسخة PDF في جهازك تلقائياً).`,
      });
      setTimeout(() => setToastMessage(null), 6000);
    } finally {
      setIsUploadingToDrive(false);
    }
  };

  // Save PDF directly to Phone Storage
  const handleSaveToPhoneStorageWithPermissions = async () => {
    if (!printAreaRef.current) return;
    setIsSavingDirectStorage(true);
    setToastMessage(null);
    try {
      const filename = `Invoice-${activeRecord.orderId}.pdf`;
      const result = await generateInvoicePdfBlob(printAreaRef.current, pdfPaperSize, filename, getPdfGenerationOptions());

      const storageResult = await savePdfToPhoneStorageWithPermissions(result.blob, filename);

      saveInvoiceToOfflineVault({
        id: `offline-${activeRecord.orderId}-${Date.now()}`,
        orderId: activeRecord.orderId,
        customerName: activeRecord.customerName,
        date: activeRecord.date,
        salesRep: currentRepDisplay,
        items: itemsToDisplay.map((it) => ({
          itemName: it.itemName,
          genericName: it.genericName,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          totalSales: it.totalSales,
        })),
        totalQuantity,
        totalAmount,
        currency,
        savedAt: new Date().toISOString(),
        format: pdfPaperSize,
      });

      setToastMessage({
        text: storageResult.message || `✓ تم حفظ الفاتورة بصيغة PDF في ذاكرة الهاتف (${storageResult.directoryName}) بنجاح!`,
      });
      setTimeout(() => setToastMessage(null), 5500);
    } catch (err: any) {
      console.error('Storage save error', err);
      if (printAreaRef.current) {
        const fallbackRes = await generateInvoicePdfBlob(printAreaRef.current, pdfPaperSize, `Invoice-${activeRecord.orderId}.pdf`, getPdfGenerationOptions());
        downloadPdfToMobileStorage(fallbackRes.blob, `Invoice-${activeRecord.orderId}.pdf`);
      }
      setToastMessage({ text: '✓ تم حفظ الفاتورة في مجلد التنزيلات بالجهاز.' });
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsSavingDirectStorage(false);
    }
  };

  // WhatsApp Direct PDF Share
  const handleShareWhatsAppDirectPdf = async () => {
    if (!printAreaRef.current) return;
    setIsSharingWhatsApp(true);
    setToastMessage(null);
    try {
      const filename = `Invoice-${activeRecord.orderId}.pdf`;
      const result = await generateInvoicePdfBlob(printAreaRef.current, pdfPaperSize, filename, getPdfGenerationOptions());

      const shareRes = await sharePdfDirectlyToWhatsApp(
        result.blob,
        filename,
        activeRecord.orderId,
        activeRecord.customerName,
        APP_NAME
      );

      setToastMessage({ text: shareRes.message });
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err: any) {
      console.error('WhatsApp direct share error', err);
      handleShareWhatsAppText();
    } finally {
      setIsSharingWhatsApp(false);
    }
  };

  // Download PDF
  const handleDownloadPdf = async () => {
    if (!printAreaRef.current) return;
    setIsGeneratingPdf(true);
    setToastMessage(null);
    try {
      const filename = `Invoice-${activeRecord.orderId}.pdf`;
      const result = await generateInvoicePdfBlob(printAreaRef.current, pdfPaperSize, filename, getPdfGenerationOptions());

      downloadPdfToMobileStorage(result.blob, filename);

      saveInvoiceToOfflineVault({
        id: `offline-${activeRecord.orderId}-${Date.now()}`,
        orderId: activeRecord.orderId,
        customerName: activeRecord.customerName,
        date: activeRecord.date,
        salesRep: currentRepDisplay,
        items: itemsToDisplay.map((it) => ({
          itemName: it.itemName,
          genericName: it.genericName,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          totalSales: it.totalSales,
        })),
        totalQuantity,
        totalAmount,
        currency,
        savedAt: new Date().toISOString(),
        format: pdfPaperSize,
      });

      setToastMessage({
        text: '✓ تم تنزيل الفاتورة بصيغة PDF وحفظها في ذاكرة الهاتف!',
      });
      setTimeout(() => setToastMessage(null), 4500);
    } catch (err) {
      console.error('PDF generation error', err);
      setToastMessage({ text: 'حدث خطأ أثناء إنشاء ملف PDF.' });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // WhatsApp Text Share Fallback
  const handleShareWhatsAppText = () => {
    const text = `*فاتورة مبيعات شركة جمجوم فارما - ${APP_NAME}*
رقم الفاتورة: ${activeRecord.orderId}
العميل: ${activeRecord.customerName}
التاريخ: ${activeRecord.date}
المندوب الطبي: ${currentRepDisplay}
---------------------
الأصناف المعتمدة:
${itemsToDisplay.map((it) => `• ${it.itemName} (${it.quantity} عبوة) = ${formatNumber(it.totalSales)} ${currency}`).join('\n')}
---------------------
*الصافي المطلوب سداده: ${formatCurrency(totalAmount, currency)}*
تم التسليم والاعتماد بحالة سليمة تماماً.`;

    const encoded = encodeURIComponent(text);
    try {
      const a = document.createElement('a');
      a.href = `https://wa.me/?text=${encoded}`;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => document.body.removeChild(a), 300);
    } catch {
      // ignore
    }
  };

  // Active Visual Theme
  const currentTheme = THEME_CONFIGS[invoiceTheme] || THEME_CONFIGS['royal-blue'];

  // Table Font Size Class
  const tableFontSizeClass =
    tableFontSize === 'small'
      ? 'text-[11px]'
      : tableFontSize === 'large'
      ? 'text-[13.5px] sm:text-sm'
      : 'text-xs';

  // Table Density Padding
  const tableHeaderPaddingClass =
    tableDensity === 'compact'
      ? 'py-1.5 px-2'
      : tableDensity === 'spacious'
      ? 'py-3.5 px-4'
      : 'py-2.5 px-3';

  const tableBodyPaddingClass =
    tableDensity === 'compact'
      ? 'py-1 px-2'
      : tableDensity === 'spacious'
      ? 'py-3 px-3.5'
      : 'py-2 px-2.5 sm:px-3';

  // Screen Width Container
  const paperMaxWidth =
    screenWidthMode === 'a4'
      ? 'max-w-[820px]'
      : screenWidthMode === 'wide'
      ? 'max-w-[1180px]'
      : screenWidthMode === 'full'
      ? 'max-w-none'
      : 'max-w-[960px]';

  // Border Style
  const paperBorderClass =
    invoiceBorderStyle === 'square'
      ? 'rounded-none border-2 border-slate-500 shadow-lg'
      : invoiceBorderStyle === 'double'
      ? 'rounded-2xl border-4 border-double border-slate-800 shadow-2xl'
      : invoiceBorderStyle === 'borderless'
      ? 'rounded-none border-0 shadow-none'
      : 'rounded-2xl border border-slate-300 shadow-xl';

  // Column Grid Cell Border
  const cellBorderClass =
    columnGridStyle === 'full-grid'
      ? 'border-l border-b border-slate-200'
      : columnGridStyle === 'striped'
      ? 'border-b border-slate-200'
      : columnGridStyle === 'cards'
      ? 'border border-slate-200 shadow-2xs rounded'
      : 'border-b border-slate-100';

  // Column Text Align
  const nameAlignClass = columnAlign === 'center' ? 'text-center' : 'text-right';
  const dataAlignClass = columnAlign === 'center' ? 'text-center' : columnAlign === 'right' ? 'text-right' : 'text-left';

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-slate-950/85 backdrop-blur-xs text-slate-900 transition-all flex flex-col items-center justify-start sm:justify-center p-0 sm:p-2 md:p-4`}
    >
      <div
        className={`bg-white dark:bg-slate-900 flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 transition-all w-full max-w-5xl my-auto min-h-[100dvh] sm:min-h-0 sm:max-h-[96dvh] rounded-none sm:rounded-3xl shadow-2xl border-0 sm:border-2 border-blue-400/30 dark:border-slate-700`}
      >
        {/* ================= FLOATING ACTION & CONTROLS TOP BAR (CAMERA & NOTCH SAFE) ================= */}
        <div className="px-3 sm:px-6 pt-[max(env(safe-area-inset-top,0px),3.25rem)] pb-3 sm:py-3 bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-950 text-white shadow-lg shrink-0 no-print z-20 space-y-2.5">
          {/* Row 1: Brand/PDF Badge, Invoice Selector, Format Switcher & Easy-To-Tap Close Button */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shadow-xs shrink-0">
                PDF
              </span>

              {/* Order selector dropdown */}
              <div className="min-w-0 max-w-[180px] xs:max-w-[220px] sm:max-w-xs">
                {uniqueInvoiceRecords.length > 1 ? (
                  <select
                    value={activeRecord.orderId}
                    onChange={(e) => {
                      const target = uniqueInvoiceRecords.find((r) => r.orderId === e.target.value);
                      if (target) onSelectRecord(target);
                    }}
                    className="w-full text-xs font-bold bg-slate-900/95 text-white border-2 border-blue-400/50 rounded-xl px-2 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer truncate shadow-xs touch-manipulation"
                    title="اختر الفاتورة المطلوبة"
                  >
                    {uniqueInvoiceRecords.map((r) => (
                      <option key={r.orderId} value={r.orderId} className="bg-slate-900 text-white">
                        {r.orderId} - {r.customerName}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="truncate">
                    <div className="text-xs sm:text-sm font-black text-white truncate">
                      فاتورة: {activeRecord.orderId}
                    </div>
                    <div className="text-[10.5px] text-blue-200 truncate hidden xs:block">
                      {activeRecord.customerName}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Format Switcher */}
              <div className="flex items-center bg-slate-900/90 p-0.5 rounded-xl border border-blue-400/40 text-[11px] font-bold shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setInvoiceFormatStyle('detailed');
                    localStorage.setItem('ahmedjam_invoice_format_style', 'detailed');
                  }}
                  className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer touch-manipulation ${
                    invoiceFormatStyle === 'detailed'
                      ? 'bg-blue-600 text-white shadow-xs font-black'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  title="تنسيق تفصيلي شامل"
                >
                  <span>📋</span>
                  <span className="hidden sm:inline">تفصيلي</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInvoiceFormatStyle('quick');
                    localStorage.setItem('ahmedjam_invoice_format_style', 'quick');
                  }}
                  className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer touch-manipulation ${
                    invoiceFormatStyle === 'quick'
                      ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  title="تنسيق سريع مدمج"
                >
                  <span>⚡</span>
                  <span className="hidden sm:inline">سريع</span>
                </button>
              </div>
            </div>

            {/* Prominent, Spacious Close Button completely clear of camera */}
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 active:scale-90 text-white flex items-center justify-center font-black text-lg cursor-pointer transition-all shadow-md shrink-0 border border-white/30 touch-manipulation"
              aria-label="إغلاق الفاتورة"
              title="إغلاق"
            >
              ✕
            </button>
          </div>

          {/* Row 2: Action Buttons Bar - Spacious & touch-friendly */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1 border-t border-white/10">
            {/* 1. DIRECT SAVE TO PHONE STORAGE (Documents / PDF) */}
            <button
              type="button"
              onClick={handleSaveToPhoneStorageWithPermissions}
              disabled={isSavingDirectStorage}
              className="flex-1 min-w-[130px] sm:min-w-0 py-2 px-2 sm:px-3 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-black text-xs cursor-pointer shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-50 ring-1 ring-blue-400/40 touch-manipulation"
              title="حفظ الفاتورة بصيغة PDF مباشرة في ذاكرة ومستندات الهاتف بعد السماح بتعديل ذاكرة الهاتف"
            >
              {isSavingDirectStorage ? <span className="animate-spin">⏳</span> : <span className="text-sm">💾</span>}
              <span className="truncate">حفظ PDF بالهاتف</span>
            </button>

            {/* 2. DIRECT EXPORT TO EXCEL (.xlsx) */}
            <button
              type="button"
              onClick={handleExportInvoiceExcel}
              disabled={isExportingExcel}
              className="flex-1 min-w-[110px] sm:min-w-0 py-2 px-2 sm:px-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-xs cursor-pointer shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-50 ring-1 ring-emerald-300/40 touch-manipulation"
              title="تصدير هذه الفاتورة بصيغة Excel في مجلد ahmed jam بذاكرة الهاتف"
            >
              {isExportingExcel ? <span className="animate-spin">⏳</span> : <span className="text-sm">📊</span>}
              <span className="truncate">تصدير Excel</span>
            </button>

            {/* 2b. CUSTOMIZE & EXPORT TO CSV */}
            <button
              type="button"
              onClick={() => setIsInvoiceCsvModalOpen(true)}
              className="flex-1 min-w-[110px] sm:min-w-0 py-2 px-2 sm:px-3 bg-gradient-to-r from-sky-600 via-cyan-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white font-black rounded-xl text-xs cursor-pointer shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all ring-1 ring-sky-300/40 touch-manipulation"
              title="تخصيص وتعديل الجداول والأعمدة وتصدير ملف CSV للفاتورة متوافق مع Excel"
            >
              <span className="text-sm">📄</span>
              <span className="truncate">تخصيص وتصدير CSV</span>
            </button>

            {/* 3. DIRECT WHATSAPP SHARE */}
            <button
              type="button"
              onClick={handleShareWhatsAppDirectPdf}
              disabled={isSharingWhatsApp}
              className="flex-1 min-w-[120px] sm:min-w-0 py-2 px-2 sm:px-3 bg-[#25D366] hover:bg-[#20ba5a] text-slate-950 font-black rounded-xl text-xs cursor-pointer shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-50 ring-1 ring-emerald-300/40 touch-manipulation"
              title="إرسال الفاتورة PDF مباشرة كملف مستند عبر واتساب"
            >
              {isSharingWhatsApp ? <span className="animate-spin">⏳</span> : <span className="text-sm">🟢</span>}
              <span className="truncate">إرسال واتساب</span>
            </button>

            {/* 4. Toggle Designer (Dimensions, Size & Shape) */}
            <button
              type="button"
              onClick={() => {
                setIsDesignerOpen(!isDesignerOpen);
                setIsEditingInvoice(false);
                setIsEditingCompanyHeader(false);
              }}
              className={`flex-1 min-w-[110px] sm:min-w-0 py-2 px-2 sm:px-3 rounded-xl font-black text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 touch-manipulation ${
                isDesignerOpen
                  ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-300 text-slate-950 ring-2 ring-amber-300 shadow-amber-500/30'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
              }`}
              title="التحكم الكامل بأبعاد ومقاسات وتصميم وشكل الفاتورة"
            >
              <span className="text-sm">📐</span>
              <span className="truncate">شكل الفاتورة</span>
            </button>

            {/* 5. Toggle Edit Invoice */}
            <button
              type="button"
              onClick={handleStartEditing}
              className={`flex-1 min-w-[85px] sm:min-w-0 py-2 px-2 sm:px-3 rounded-xl font-black text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 touch-manipulation ${
                isEditingInvoice
                  ? 'bg-amber-500 text-slate-950 font-black ring-2 ring-amber-300 shadow-amber-500/30'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
              }`}
              title="تعديل أصناف وكميات وبيانات الفاتورة"
            >
              <span className="text-sm">✏️</span>
              <span className="truncate">تعديل</span>
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border-2 border-rose-500 text-slate-900 dark:text-white space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center text-2xl shrink-0 font-black">
                  ⚠️
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-rose-700 dark:text-rose-400">
                    {showDeleteConfirm === 'all'
                      ? 'تأكيد حذف جميع الفواتير'
                      : `تأكيد حذف الفاتورة (${activeRecord.orderId})`}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    إجراء نهائي يتطلب تأكيدك الصريح
                  </p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {showDeleteConfirm === 'all'
                  ? `هل أنت متأكد من حذف كافة فواتير المبيعات بالكامل؟ سيتم مسح جميع السجلات (${allRecords.length} سجل).`
                  : `هل تريد بالتأكيد حذف الفاتورة رقم (${activeRecord.orderId}) الخاصة بالعميل "${activeRecord.customerName}"؟`}
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  إلغاء وتراجع
                </button>
                <button
                  type="button"
                  onClick={showDeleteConfirm === 'all' ? handleDeleteAllInvoices : handleDeleteCurrentInvoice}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-md active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <span>🗑️</span>
                  <span>{showDeleteConfirm === 'all' ? 'نعم، حذف الكل' : 'نعم، حذف الفاتورة'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast / Notification Banner */}
        {toastMessage && (
          <div className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold flex items-center justify-between shadow-md shrink-0 animate-in slide-in-from-top-1 z-30">
            <div className="flex items-center gap-2">
              <span className="text-base">✓</span>
              <span>{toastMessage.text}</span>
              {toastMessage.link && (
                <a
                  href={toastMessage.link}
                  target="_blank"
                  rel="noreferrer"
                  className="mr-3 underline font-black text-amber-200 hover:text-white flex items-center gap-1"
                >
                  <span>عرض في Google Drive</span>
                  <span>↗</span>
                </a>
              )}
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-white hover:text-slate-200 font-bold ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* ================= EDITING COMPANY HEADER DRAWER ================= */}
        {isEditingCompanyHeader && (
          <div className="max-h-[60dvh] overflow-y-auto overscroll-contain touch-pan-y p-4 sm:p-5 bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 border-b-2 border-amber-400 text-white text-xs no-print animate-in slide-in-from-top-2 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <span className="font-black text-amber-300 text-sm flex items-center gap-2">
                <span className="text-base">🏢</span>
                <span>تخصيص ترويسة الشركة في الفاتورة:</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetCompanyHeader}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer transition-colors"
                >
                  استعادة الافتراضي
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingCompanyHeader(false)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveCompanyHeader}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black cursor-pointer shadow-md active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <span>✓</span>
                  <span>حفظ وتطبيق الترويسة 💾</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-amber-200 mb-1">اسم الشركة / المنشأة الرئيسي:</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-900/90 border border-blue-400/50 rounded-xl text-white font-bold focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-blue-200 mb-1">الاسم التجاري أو الوصف الفرعي:</label>
                <input
                  type="text"
                  value={companySubtitle}
                  onChange={(e) => setCompanySubtitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-900/90 border border-blue-400/50 rounded-xl text-white font-bold focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-blue-200 mb-1">السجل التجاري / الرقم الضريبي:</label>
                <input
                  type="text"
                  value={companyTaxNumber}
                  onChange={(e) => setCompanyTaxNumber(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-900/90 border border-blue-400/50 rounded-xl text-white font-bold focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-blue-200 mb-1">بيانات التواصل والهاتف:</label>
                <input
                  type="text"
                  value={companyContact}
                  onChange={(e) => setCompanyContact(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-900/90 border border-blue-400/50 rounded-xl text-white font-bold focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= EDITING INVOICE DRAWER ================= */}
        {isEditingInvoice && (
          <div className="max-h-[65dvh] sm:max-h-[55dvh] overflow-y-auto overscroll-contain touch-pan-y p-3.5 sm:p-5 bg-amber-50/95 dark:bg-slate-850/95 border-b-2 border-amber-400 dark:border-amber-600 text-xs shadow-inner no-print animate-in slide-in-from-top-2">
            {/* Sticky Top Bar with Actions */}
            <div className="sticky top-0 bg-amber-50/95 dark:bg-slate-850/95 backdrop-blur-md pb-2.5 mb-3 border-b border-amber-200 dark:border-amber-700/60 z-10 flex flex-wrap items-center justify-between gap-2">
              <span className="font-black text-amber-950 dark:text-amber-200 text-sm flex items-center gap-1.5">
                <span>✏️</span>
                <span>تعديل أصناف وكميات الفاتورة ({editableItems.length} صنف)</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm('current')}
                  className="px-2.5 py-1.5 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-xl font-bold cursor-pointer transition-colors flex items-center gap-1"
                  title="حذف هذه الفاتورة"
                >
                  <span>🗑️</span>
                  <span className="hidden sm:inline">حذف</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingInvoice(false)}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl font-bold cursor-pointer transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveInvoiceModifications}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black cursor-pointer shadow-md active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <span>💾</span>
                  <span>حفظ التعديلات واعتماد الفاتورة</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">اسم العميل:</label>
                <input
                  type="text"
                  value={editCustomerName}
                  onChange={(e) => setEditCustomerName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white font-bold focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">تاريخ الفاتورة:</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white font-bold focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">المندوب الطبي:</label>
                <input
                  type="text"
                  value={editRep}
                  onChange={(e) => setEditRep(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white font-bold focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">طريقة وشروط السداد:</label>
                <select
                  value={editPaymentType}
                  onChange={(e) => setEditPaymentType(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white font-bold focus:border-amber-500 focus:outline-none cursor-pointer"
                >
                  <option value="نقدي / تسليم فوري">💵 نقدي / تسليم فوري</option>
                  <option value="آجل">⏳ بيع آجل (Credit)</option>
                  <option value="كاش">💰 كاش (Cash)</option>
                  <option value="تحويل بنكي">🏦 تحويل بنكي</option>
                  <option value="شيك مصرفي">📝 شيك مصرفي</option>
                  <option value="hidden">🗑️ إخفاء / حذف من الفاتورة</option>
                </select>
              </div>
            </div>

            {/* Editable Items Rows */}
            <div className="space-y-2 mb-3">
              {editableItems.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 text-xs shadow-xs"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <span className="font-bold text-slate-500">{idx + 1}.</span>
                    <span className="font-black text-slate-900 dark:text-white truncate">{item.itemName}</span>
                    <span className="text-slate-400 font-mono text-[11px]">({formatNumber(item.unitPrice)} {currency})</span>
                  </div>
                  <div className="flex items-center gap-2 mr-auto sm:mr-0">
                    <span className="text-[11px] text-slate-500 font-bold">الكمية:</span>
                    <div className="flex items-center rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden bg-slate-50 dark:bg-slate-900">
                      <button
                        type="button"
                        onClick={() => handleUpdateItemQuantity(idx, item.quantity - 1)}
                        className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-white font-black cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-3 font-mono font-black text-blue-600 dark:text-blue-400 min-w-[36px] text-center">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateItemQuantity(idx, item.quantity + 1)}
                        className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-white font-black cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                    <span className="font-mono font-black text-slate-900 dark:text-white w-24 text-left">
                      {formatNumber(item.totalSales)} {currency}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(idx)}
                      className="text-rose-600 hover:text-rose-700 font-bold p-1 cursor-pointer rounded hover:bg-rose-50 dark:hover:bg-rose-950"
                      title="حذف الصنف"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Item to this Invoice */}
            <div className="pt-2.5 border-t border-amber-200 dark:border-slate-700 flex flex-wrap items-center gap-2">
              <select
                value={selectedCatalogItem}
                onChange={(e) => setSelectedCatalogItem(e.target.value)}
                className="flex-1 min-w-[200px] px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white font-bold cursor-pointer"
              >
                <option value="">+ اختر صنفاً من قائمة الأدوية لإضافته للفاتورة...</option>
                {(catalog || MASTER_PRODUCT_CATALOG).map((p) => (
                  <option key={p.id} value={p.productName}>
                    {p.productName} ({formatNumber(p.currentPrice || p.defaultPrice)} {currency})
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">الكمية:</span>
                <input
                  type="number"
                  min={1}
                  value={newAddQuantity}
                  onChange={(e) => setNewAddQuantity(Number(e.target.value))}
                  className="w-16 px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white font-bold font-mono text-center"
                />
              </div>
              <button
                type="button"
                onClick={handleAddNewItem}
                disabled={!selectedCatalogItem}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 rounded-xl font-black text-xs cursor-pointer shadow-xs transition-colors"
              >
                + إضافة الصنف
              </button>
            </div>

            {/* Sticky Bottom Summary Bar */}
            <div className="sticky bottom-0 bg-amber-50/95 dark:bg-slate-850/95 backdrop-blur-md pt-2.5 mt-3 border-t border-amber-200 dark:border-amber-700/60 z-10 flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                المجموع بعد التعديل: <strong className="font-mono text-emerald-600 dark:text-emerald-400 text-xs">{formatNumber(editableItems.reduce((s, it) => s + it.totalSales, 0))} {currency}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingInvoice(false)}
                  className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveInvoiceModifications}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black shadow-md flex items-center gap-1 cursor-pointer"
                >
                  <span>💾</span>
                  <span>حفظ التعديلات</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= COMPREHENSIVE PDF & INVOICE DESIGNER DRAWER ================= */}
        {isDesignerOpen && (
          <div className="max-h-[65dvh] sm:max-h-[55dvh] overflow-y-auto overscroll-contain touch-pan-y p-3 sm:p-5 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border-b-2 border-amber-400 text-white text-xs shadow-2xl z-20 no-print animate-in slide-in-from-top-2">
            {/* Header & Tabs */}
            <div className="sticky top-0 bg-slate-950/95 backdrop-blur-md z-10 flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10 mb-3.5 pt-1">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center font-black text-base shadow-sm">
                  📐
                </span>
                <div>
                  <h3 className="font-black text-amber-300 text-sm sm:text-base flex items-center gap-2">
                    <span>لوحة التحكم بأبعاد ومقاسات وتصميم الفاتورة (PDF Studio)</span>
                  </h3>
                  <p className="text-[11px] text-blue-200">
                    تخصيص كامل لمقاسات PDF، وتصميم وشكل الفاتورة، وتحديد شكل ومقاسات الأعمدة، وترويسة المنشأة
                  </p>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/15 gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => setDesignerActiveTab('paper')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5 ${
                    designerActiveTab === 'paper'
                      ? 'bg-blue-600 text-white shadow-xs font-black'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span>📄</span>
                  <span>أبعاد ومقاسات PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDesignerActiveTab('design')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5 ${
                    designerActiveTab === 'design'
                      ? 'bg-blue-600 text-white shadow-xs font-black'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span>🎨</span>
                  <span>التصميم والثيم</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDesignerActiveTab('columns')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5 ${
                    designerActiveTab === 'columns'
                      ? 'bg-blue-600 text-white shadow-xs font-black'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span>📊</span>
                  <span>شكل ومقاسات الأعمدة</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDesignerActiveTab('screen')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5 ${
                    designerActiveTab === 'screen'
                      ? 'bg-blue-600 text-white shadow-xs font-black'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span>🖥️</span>
                  <span>حجم الظهور على الشاشة</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDesignerActiveTab('company')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5 ${
                    designerActiveTab === 'company'
                      ? 'bg-blue-600 text-white shadow-xs font-black'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span>🏢</span>
                  <span>ترويسة الشركة</span>
                </button>
              </div>

              {/* Reset & Close Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetDesignDefaults}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer transition-colors flex items-center gap-1 text-xs"
                  title="استعادة كافة الإعدادات والأبعاد الافتراضية"
                >
                  <span>↺</span>
                  <span>استعادة الافتراضي</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDesignerOpen(false)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold cursor-pointer transition-colors text-xs"
                >
                  ✕ إغلاق
                </button>
              </div>
            </div>

            {/* TAB 1: Paper & PDF Dimensions */}
            {designerActiveTab === 'paper' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 animate-in fade-in duration-150">
                {/* 1. Paper Size */}
                <div className="bg-slate-900/80 p-3 rounded-2xl border border-white/10 space-y-2">
                  <span className="block font-black text-amber-200 text-xs">
                    1. مقاس ورقة الفاتورة (Paper Size):
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'a4', label: 'A4 القياسي', sub: '210×297 مم' },
                      { id: 'a5', label: 'A5 نصف الحجم', sub: '148×210 مم' },
                      { id: 'a3', label: 'A3 لوحة عريضة', sub: '297×420 مم' },
                      { id: 'letter', label: 'Letter مكتبي', sub: '216×279 مم' },
                      { id: 'thermal80', label: 'إيصال حراري 80mm', sub: 'طابعات POS بلوتوث' },
                      { id: 'thermal58', label: 'إيصال حراري 58mm', sub: 'كاشير مدمج صغير' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setPdfPaperSize(p.id as PdfPaperSize);
                          localStorage.setItem('ahmedjam_pdf_paper_size', p.id);
                        }}
                        className={`p-2 rounded-xl text-right transition-all border cursor-pointer ${
                          pdfPaperSize === p.id
                            ? 'bg-blue-600/90 border-blue-400 text-white font-black shadow-xs ring-1 ring-blue-300'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <div className="text-xs font-bold">{p.label}</div>
                        <div className="text-[9.5px] opacity-75 font-mono">{p.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Orientation */}
                <div className="bg-slate-900/80 p-3 rounded-2xl border border-white/10 space-y-2">
                  <span className="block font-black text-amber-200 text-xs">
                    2. اتجاه الورقة (Orientation):
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPdfOrientation('portrait');
                        localStorage.setItem('ahmedjam_pdf_orientation', 'portrait');
                      }}
                      className={`p-2.5 rounded-xl text-center transition-all border cursor-pointer ${
                        pdfOrientation === 'portrait'
                          ? 'bg-blue-600/90 border-blue-400 text-white font-black shadow-xs ring-1 ring-blue-300'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-xl block mb-0.5">📄</span>
                      <span className="text-xs font-bold block">عمودي (Portrait)</span>
                      <span className="text-[10px] opacity-70">طولي كلاسيكي معتمد</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPdfOrientation('landscape');
                        localStorage.setItem('ahmedjam_pdf_orientation', 'landscape');
                      }}
                      className={`p-2.5 rounded-xl text-center transition-all border cursor-pointer ${
                        pdfOrientation === 'landscape'
                          ? 'bg-blue-600/90 border-blue-400 text-white font-black shadow-xs ring-1 ring-blue-300'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-xl block mb-0.5">📜</span>
                      <span className="text-xs font-bold block">أفقي (Landscape)</span>
                      <span className="text-[10px] opacity-70">عرضي للجداول الكبيرة</span>
                    </button>
                  </div>
                </div>

                {/* 3. Margins */}
                <div className="bg-slate-900/80 p-3 rounded-2xl border border-white/10 space-y-2">
                  <span className="block font-black text-amber-200 text-xs">
                    3. هوامش الصفحة (Page Margins):
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'none', label: 'بدون هوامش', sub: '1 مم - أقصى ملء' },
                      { id: 'compact', label: 'مدمج ضيق', sub: '3.5 مم - أنيق' },
                      { id: 'standard', label: 'قياسي (موصى)', sub: '6 مم - متوازن' },
                      { id: 'spacious', label: 'عريض فسيح', sub: '12 مم - تباعد إضافي' },
                      { id: 'custom', label: 'هوامش مخصصة', sub: `${customMarginMm} مم يدوي` },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setPdfMargin(m.id as PdfMarginOption);
                          localStorage.setItem('ahmedjam_pdf_margin', m.id);
                        }}
                        className={`p-2 rounded-xl text-right transition-all border cursor-pointer ${
                          pdfMargin === m.id
                            ? 'bg-blue-600/90 border-blue-400 text-white font-black shadow-xs ring-1 ring-blue-300'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <div className="text-xs font-bold">{m.label}</div>
                        <div className="text-[9.5px] opacity-75 font-mono">{m.sub}</div>
                      </button>
                    ))}
                  </div>

                  {pdfMargin === 'custom' && (
                    <div className="pt-2 border-t border-white/10 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-300 font-bold">الهامش اليدوي:</span>
                        <span className="font-mono font-black text-amber-300">{customMarginMm} مم</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={25}
                        step={1}
                        value={customMarginMm}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setCustomMarginMm(val);
                          localStorage.setItem('ahmedjam_custom_margin_mm', String(val));
                        }}
                        className="w-full cursor-pointer accent-amber-400"
                      />
                    </div>
                  )}
                </div>

                {/* 4. Resolution */}
                <div className="bg-slate-900/80 p-3 rounded-2xl border border-white/10 space-y-2">
                  <span className="block font-black text-amber-200 text-xs">
                    4. دقة ووضوح PDF (Resolution):
                  </span>
                  <div className="space-y-1.5">
                    {[
                      { val: 1.5, label: '1.5x - خفيفة وسريعة', sub: 'حجم ملف صغير جداً للتحميل الفوري' },
                      { val: 2, label: '2.0x - فائق الدقة (المثالي)', sub: 'نصوص واضحة وحادة جداً وموصى بها' },
                      { val: 3, label: '3.0x - طباعة فائقة الحدة 300DPI', sub: 'أقصى حدة ممكنة للمطابع الدقيقة' },
                    ].map((r) => (
                      <button
                        key={r.val}
                        type="button"
                        onClick={() => {
                          setPdfResolution(r.val);
                          localStorage.setItem('ahmedjam_pdf_res', String(r.val));
                        }}
                        className={`w-full p-2 rounded-xl text-right transition-all border cursor-pointer ${
                          pdfResolution === r.val
                            ? 'bg-blue-600/90 border-blue-400 text-white font-black shadow-xs ring-1 ring-blue-300'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <div className="text-xs font-bold">{r.label}</div>
                        <div className="text-[10px] opacity-70">{r.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Design & Theme */}
            {designerActiveTab === 'design' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 animate-in fade-in duration-150">
                {/* 1. Layout Template */}
                <div className="bg-slate-900/80 p-3 rounded-2xl border border-white/10 space-y-2">
                  <span className="block font-black text-amber-200 text-xs">
                    1. تصميم وقالب الفاتورة (Template Layout):
                  </span>
                  <div className="space-y-1.5">
                    {[
                      { id: 'royal', label: 'طبي ملكي رسمي (Jamjoom Royal)', desc: 'إطارات رسمية معتمدة لشركات الأدوية' },
                      { id: 'modern', label: 'عصري ناعم (Modern Minimalist)', desc: 'بسيط وخفيف بدون تعقيدات' },
                      { id: 'pharmacy', label: 'صيدلاني كلاسيكي (Pharmacy Grid)', desc: 'شبكة مربعة واضحة للمستودعات' },
                      { id: 'banner', label: 'شريط تنفيذي بارز (Banner Strip)', desc: 'ترويسة علوية ملونة عريضة فخمة' },
                      { id: 'thermal', label: 'إيصال حراري POS (Thermal Receipt)', desc: 'تنسيق شريطي لطابعات البلوتوث' },
                      { id: 'monochrome', label: 'طباعة اقتصادية (Monochrome Eco)', desc: 'أبيض وأسود بدون استهلاك ألوان' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setInvoiceTemplate(t.id as InvoiceTemplateStyle);
                          localStorage.setItem('ahmedjam_inv_template', t.id);
                          if (t.id === 'monochrome') {
                            setInvoiceTheme('monochrome');
                          }
                        }}
                        className={`w-full p-2 rounded-xl text-right transition-all border cursor-pointer ${
                          invoiceTemplate === t.id
                            ? 'bg-blue-600/90 border-blue-400 text-white font-black shadow-xs ring-1 ring-blue-300'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <div className="text-xs font-bold">{t.label}</div>
                        <div className="text-[10px] opacity-70">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Color Themes */}
                <div className="bg-slate-900/80 p-3 rounded-2xl border border-white/10 space-y-2">
                  <span className="block font-black text-amber-200 text-xs">
                    2. ثيم وألوان الفاتورة:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {Object.entries(THEME_CONFIGS).map(([k, cfg]) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => {
                          setInvoiceTheme(k as InvoiceTheme);
                          localStorage.setItem('ahmedjam_inv_theme', k);
                        }}
                        className={`p-2 rounded-xl text-right transition-all border cursor-pointer flex items-center gap-2 ${
                          invoiceTheme === k
                            ? 'bg-blue-600/90 border-blue-400 text-white font-black shadow-xs ring-1 ring-blue-300'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full shrink-0 border border-white/40 shadow-xs"
                          style={{ backgroundColor: cfg.primaryHex }}
                        />
                        <span className="text-xs truncate">{cfg.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Header & Border Style */}
                <div className="bg-slate-900/80 p-3 rounded-2xl border border-white/10 space-y-2">
                  <span className="block font-black text-amber-200 text-xs">
                    3. شكل الترويسة وإطار الورقة:
                  </span>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 block font-bold">نمط الترويسة العلوية:</span>
                    <div className="grid grid-cols-2 gap-1">
                      {[
                        { id: 'modern-split', label: 'عصري مقسوم' },
                        { id: 'classic-center', label: 'كلاسيكي ممركز' },
                        { id: 'banner-strip', label: 'شريط ملون كامل' },
                        { id: 'minimal', label: 'نصي مبسط' },
                      ].map((h) => (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => {
                            setInvoiceHeaderStyle(h.id as InvoiceHeaderStyle);
                            localStorage.setItem('ahmedjam_inv_header', h.id);
                          }}
                          className={`p-1.5 rounded-lg text-center text-[11px] font-bold border cursor-pointer transition-all ${
                            invoiceHeaderStyle === h.id
                              ? 'bg-blue-600 text-white border-blue-400'
                              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          {h.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1 pt-1.5 border-t border-white/10">
                    <span className="text-[10px] text-slate-400 block font-bold">شكل إطار وحواف الورقة:</span>
                    <div className="grid grid-cols-2 gap-1">
                      {[
                        { id: 'rounded', label: 'حواف منحنية ناعمة' },
                        { id: 'square', label: 'حواف مستقيمة حادة' },
                        { id: 'double', label: 'إطار خارجي مزدوج' },
                        { id: 'borderless', label: 'بدون إطار مسطح' },
                      ].map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            setInvoiceBorderStyle(b.id as InvoiceBorderStyle);
                            localStorage.setItem('ahmedjam_inv_border', b.id);
                          }}
                          className={`p-1.5 rounded-lg text-center text-[11px] font-bold border cursor-pointer transition-all ${
                            invoiceBorderStyle === b.id
                              ? 'bg-blue-600 text-white border-blue-400'
                              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. Watermark */}
                <div className="bg-slate-900/80 p-3 rounded-2xl border border-white/10 space-y-2">
                  <span className="block font-black text-amber-200 text-xs">
                    4. العلامة المائية والاعتماد:
                  </span>
                  <label className="flex items-center gap-2 cursor-pointer bg-white/5 p-2 rounded-xl border border-white/10">
                    <input
                      type="checkbox"
                      checked={showWatermark}
                      onChange={(e) => {
                        setShowWatermark(e.target.checked);
                        localStorage.setItem('ahmedjam_show_watermark', String(e.target.checked));
                      }}
                      className="rounded text-blue-600 w-4 h-4 cursor-pointer"
                    />
                    <span className="font-bold text-xs text-white">إظهار علامة مائية خلف الفاتورة</span>
                  </label>
                  {showWatermark && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 block">نص العلامة المائية:</span>
                      <input
                        type="text"
                        value={watermarkText}
                        onChange={(e) => {
                          setWatermarkText(e.target.value);
                          localStorage.setItem('ahmedjam_watermark_text', e.target.value);
                        }}
                        placeholder="معتمد رسمياً ✓"
                        className="w-full px-2.5 py-1.5 text-xs bg-black/60 border border-white/20 rounded-xl text-white font-bold focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  )}
                </div>

                {/* 5. Payment Terms & Conditions */}
                <div className="bg-slate-900/80 p-3 rounded-2xl border border-white/10 space-y-2 sm:col-span-2 lg:col-span-4">
                  <div className="flex items-center justify-between pb-1 border-b border-white/10">
                    <span className="font-black text-amber-200 text-xs flex items-center gap-1.5">
                      <span>💳</span>
                      <span>طريقة وشروط سداد الفاتورة (نقدي / آجل / كاش / تحويل):</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuickChangePaymentTerms('hidden')}
                      className="text-[11px] font-bold text-rose-400 hover:text-rose-300 underline cursor-pointer"
                    >
                      حذف / إخفاء السطر نهائياً 🗑️
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { id: 'نقدي / تسليم فوري', label: '💵 نقدي / تسليم فوري' },
                      { id: 'آجل', label: '⏳ بيع آجل (Credit)' },
                      { id: 'كاش', label: '💰 كاش (Cash)' },
                      { id: 'تحويل بنكي', label: '🏦 تحويل بنكي' },
                      { id: 'شيك مصرفي', label: '📝 شيك مصرفي' },
                    ].map((term) => (
                      <button
                        key={term.id}
                        type="button"
                        onClick={() => handleQuickChangePaymentTerms(term.id)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-all ${
                          paymentTermsType === term.id && showPaymentTerms
                            ? 'bg-amber-400 text-slate-950 font-black shadow-md ring-2 ring-amber-300'
                            : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                      >
                        {term.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const next = !showPaymentTerms;
                        setShowPaymentTerms(next);
                        localStorage.setItem('ahmedjam_show_payment_terms', String(next));
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-all ${
                        !showPaymentTerms
                          ? 'bg-rose-600 text-white font-black'
                          : 'bg-white/10 hover:bg-white/20 text-slate-300'
                      }`}
                    >
                      {!showPaymentTerms ? '✓ السطر مخفي حالياً' : 'إخفاء سطر السداد'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Columns & Table Layout */}
            {designerActiveTab === 'columns' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 animate-in fade-in duration-150">
                {/* 1. Visible Columns */}
                <div className="bg-slate-900/80 p-3 rounded-2xl border border-white/10 space-y-2">
                  <span className="block font-black text-amber-200 text-xs">
                    1. تحديد الأعمدة الظاهرة في الجدول:
                  </span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {[
                      { id: 'index', label: 'رقم التسلسل (#)', state: showIndexCol, set: setShowIndexCol, key: 'ahmedjam_show_col_index' },
                      { id: 'generic', label: 'عمود التركيبة العلمية', state: showGeneric, set: setShowGeneric, key: 'ahmedjam_show_generic' },
                      { id: 'cat', label: 'عمود التصنيف الدوائي', state: showCategory, set: setShowCategory, key: 'ahmedjam_show_category' },
                      { id: 'unit', label: 'عمود وحدة القياس (عبوة)', state: showUnitCol, set: setShowUnitCol, key: 'ahmedjam_show_col_unit' },
                      { id: 'logo', label: 'شعار الشركة الرسمي', state: showLogo, set: setShowLogo, key: 'ahmedjam_show_logo' },
                      { id: 'barcode', label: 'الباركود الرقمي', state: showBarcode, set: setShowBarcode, key: 'ahmedjam_show_barcode' },
                      { id: 'topbox', label: 'صندوق الفاتورة والباركود العلوي', state: showTopInvoiceCard, set: setShowTopInvoiceCard, key: 'ahmedjam_show_top_invoice_card' },
                      { id: 'delivcard', label: 'قسم بيانات المندوب والتسليم (Delivery & Rep)', state: showDeliveryRepCard, set: setShowDeliveryRepCard, key: 'ahmedjam_show_delivery_rep_card' },
                      { id: 'payterms', label: 'سطر شروط وسداد الفاتورة (نقدي / آجل / كاش)', state: showPaymentTerms, set: setShowPaymentTerms, key: 'ahmedjam_show_payment_terms' },
                      { id: 'orderbox', label: 'بطاقة تفاصيل الطلبية', state: showOrderDetailsCard, set: setShowOrderDetailsCard, key: 'ahmedjam_show_order_details_card' },
                      { id: 'signs', label: 'صناديق أختام وتواقيع التسليم', state: showSignatures, set: setShowSignatures, key: 'ahmedjam_show_signatures' },
                    ].map((c) => (
                      <label key={c.id} className="flex items-center gap-2 cursor-pointer p-1 rounded-lg hover:bg-white/5">
                        <input
                          type="checkbox"
                          checked={c.state}
                          onChange={(e) => {
                            c.set(e.target.checked);
                            localStorage.setItem(c.key, String(e.target.checked));
                          }}
                          className="rounded text-blue-600 w-3.5 h-3.5 cursor-pointer"
                        />
                        <span className="text-xs text-slate-200 font-bold">{c.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 2. Column Grid & Border Style */}
                <div className="bg-slate-900/80 p-3 rounded-2xl border border-white/10 space-y-2">
                  <span className="block font-black text-amber-200 text-xs">
                    2. شكل وتنسيق حدود الأعمدة (Grid):
                  </span>
                  <div className="space-y-1.5">
                    {[
                      { id: 'full-grid', label: 'شبكة كاملة متصلة (Full Grid)', desc: 'خطوط رأسية وأفقية واضحة ومحددة' },
                      { id: 'striped', label: 'خطوط أفقية ناعمة (Striped Only)', desc: 'صفوف متبادلة بدون فواصل رأسية' },
                      { id: 'clean', label: 'خلايا ناعمة مبسطة (Clean Minimal)', desc: 'مظهر عصري خفيف بدون خطوط ثقيلة' },
                      { id: 'cards', label: 'خلايا بطاقات بارزة (Card Cells)', desc: 'مربعات خلايا أنيقة ومظللة' },
                    ].map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => {
                          setColumnGridStyle(g.id as ColumnGridStyle);
                          localStorage.setItem('ahmedjam_col_grid', g.id);
                        }}
                        className={`w-full p-2 rounded-xl text-right transition-all border cursor-pointer ${
                          columnGridStyle === g.id
                            ? 'bg-blue-600/90 border-blue-400 text-white font-black shadow-xs ring-1 ring-blue-300'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <div className="text-xs font-bold">{g.label}</div>
                        <div className="text-[9.5px] opacity-70">{g.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Column Width Presets & Sizing */}
                <div className="bg-slate-900/80 p-3 rounded-2xl border border-white/10 space-y-2">
                  <span className="block font-black text-amber-200 text-xs">
                    3. مقاسات ونسب عرض الأعمدة:
                  </span>
                  <div className="space-y-1.5">
                    {[
                      { id: 'balanced', label: 'متوازن تلقائي', desc: 'توزيع قياسي احترافي متناسق' },
                      { id: 'wide-product', label: 'عرض واسع لأسماء الأصناف (48%)', desc: 'مساحة عريضة لأسماء الأدوية الطويلة' },
                      { id: 'compact-data', label: 'أرقام وبيانات مبرزة (40%)', desc: 'عرض أوسع للكمية والأسعار والإجمالي' },
                    ].map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setColumnWidthPreset(c.id as ColumnWidthPreset);
                          localStorage.setItem('ahmedjam_col_preset', c.id);
                        }}
                        className={`w-full p-2 rounded-xl text-right transition-all border cursor-pointer ${
                          columnWidthPreset === c.id
                            ? 'bg-blue-600/90 border-blue-400 text-white font-black shadow-xs ring-1 ring-blue-300'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <div className="text-xs font-bold">{c.label}</div>
                        <div className="text-[9.5px] opacity-70">{c.desc}</div>
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-white/10 space-y-1">
                    <span className="text-[10px] text-slate-400 block font-bold">محاذاة نصوص الأعمدة:</span>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { id: 'standard', label: 'تلقائي' },
                        { id: 'center', label: 'توسيط' },
                        { id: 'right', label: 'يمين' },
                      ].map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => {
                            setColumnAlign(a.id as ColumnAlign);
                            localStorage.setItem('ahmedjam_col_align', a.id);
                          }}
                          className={`p-1 rounded-lg text-center text-[10.5px] font-bold border cursor-pointer ${
                            columnAlign === a.id
                              ? 'bg-blue-600 text-white border-blue-400'
                              : 'bg-white/5 border-white/10 text-slate-300'
                          }`}
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. Density & Font Size */}
                <div className="bg-slate-900/80 p-3 rounded-2xl border border-white/10 space-y-2">
                  <span className="block font-black text-amber-200 text-xs">
                    4. تباعد الصفوف وحجم الخط:
                  </span>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 block font-bold">تباعد وارتفاع صفوف الجدول:</span>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { id: 'compact', label: 'مكثف' },
                        { id: 'comfortable', label: 'قياسي' },
                        { id: 'spacious', label: 'فسيح' },
                      ].map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => {
                            setTableDensity(d.id as TableDensity);
                            localStorage.setItem('ahmedjam_tbl_density', d.id);
                          }}
                          className={`p-1.5 rounded-lg text-center text-[11px] font-bold border cursor-pointer ${
                            tableDensity === d.id
                              ? 'bg-blue-600 text-white border-blue-400'
                              : 'bg-white/5 border-white/10 text-slate-300'
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-white/10">
                    <span className="text-[10px] text-slate-400 block font-bold">حجم خط نصوص الجدول:</span>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { id: 'small', label: 'صغير 11px' },
                        { id: 'medium', label: 'قياسي 12px' },
                        { id: 'large', label: 'كبير 14px' },
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => {
                            setTableFontSize(f.id as TableFontSize);
                            localStorage.setItem('ahmedjam_tbl_font', f.id);
                          }}
                          className={`p-1.5 rounded-lg text-center text-[11px] font-bold border cursor-pointer ${
                            tableFontSize === f.id
                              ? 'bg-blue-600 text-white border-blue-400'
                              : 'bg-white/5 border-white/10 text-slate-300'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: Screen Display & Zoom */}
            {designerActiveTab === 'screen' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 animate-in fade-in duration-150">
                {/* 1. Zoom Slider */}
                <div className="bg-slate-900/80 p-3 rounded-2xl border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-amber-200 text-xs">
                      1. نسبة التكبير والزووم على الشاشة:
                    </span>
                    <span className="font-mono font-black text-amber-300 bg-black/50 px-2 py-0.5 rounded border border-amber-400/30 text-xs">
                      {zoomScale}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={160}
                    step={5}
                    value={zoomScale}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setZoomScale(val);
                      localStorage.setItem('ahmedjam_zoom_scale', String(val));
                    }}
                    className="w-full cursor-pointer accent-amber-400"
                  />
                  <div className="flex items-center justify-between gap-1 text-[11px] flex-wrap">
                    {[50, 75, 90, 100, 110, 125, 150].map((z) => (
                      <button
                        key={z}
                        type="button"
                        onClick={() => {
                          setZoomScale(z);
                          localStorage.setItem('ahmedjam_zoom_scale', String(z));
                        }}
                        className={`px-2 py-1 rounded-lg font-mono font-bold cursor-pointer transition-colors ${
                          zoomScale === z
                            ? 'bg-amber-400 text-slate-950 font-black'
                            : 'bg-white/10 text-slate-300 hover:text-white'
                        }`}
                      >
                        {z}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Screen Width Modes */}
                <div className="bg-slate-900/80 p-3 rounded-2xl border border-white/10 space-y-2">
                  <span className="block font-black text-amber-200 text-xs">
                    2. وضع عرض الفاتورة على الشاشة:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'fit', label: 'ملاءمة مرنة', sub: 'يناسب شاشات الهواتف' },
                      { id: 'a4', label: 'ورقة A4 كلاسيكية', sub: 'عرض 820px متطابق' },
                      { id: 'wide', label: 'عرض واسع ومريح', sub: 'عرض 1180px ممتاز' },
                      { id: 'full', label: 'ملء الشاشة 100%', sub: 'أقصى عرض متاح' },
                    ].map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => {
                          setScreenWidthMode(w.id as ScreenWidthMode);
                          localStorage.setItem('ahmedjam_screen_mode', w.id);
                        }}
                        className={`p-2 rounded-xl text-right transition-all border cursor-pointer ${
                          screenWidthMode === w.id
                            ? 'bg-blue-600/90 border-blue-400 text-white font-black shadow-xs ring-1 ring-blue-300'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <div className="text-xs font-bold">{w.label}</div>
                        <div className="text-[10px] opacity-70">{w.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Summary & Apply */}
                <div className="bg-slate-900/80 p-3 rounded-2xl border border-white/10 flex flex-col justify-between">
                  <div>
                    <span className="block font-black text-amber-200 text-xs mb-1">
                      ملخص الإعدادات النشطة:
                    </span>
                    <ul className="text-[11px] text-blue-200 space-y-1">
                      <li>• المقاس: <strong className="text-white">{pdfPaperSize.toUpperCase()}</strong> ({pdfOrientation === 'portrait' ? 'عمودي' : 'أفقي'})</li>
                      <li>• القالب: <strong className="text-white">{invoiceTemplate}</strong> | الثيم: <strong className="text-white">{currentTheme.name}</strong></li>
                      <li>• الهوامش: <strong className="text-white">{pdfMargin === 'custom' ? `${customMarginMm}مم` : pdfMargin}</strong> | الدقة: <strong className="text-white">{pdfResolution}x</strong></li>
                      <li>• شبكة الأعمدة: <strong className="text-white">{columnGridStyle}</strong> | الخط: <strong className="text-white">{tableFontSize}</strong></li>
                    </ul>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDesignerOpen(false);
                      setToastMessage({ text: '✓ تم حفظ وتطبيق تخصيصات الفاتورة بنجاح!' });
                      setTimeout(() => setToastMessage(null), 3000);
                    }}
                    className="w-full mt-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-black text-xs cursor-pointer shadow-md active:scale-95 transition-all text-center"
                  >
                    حفظ التخصيص وإغلاق اللوحة 💾
                  </button>
                </div>
              </div>
            )}

            {/* TAB 5: Company Header */}
            {designerActiveTab === 'company' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/10">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-2 border-b border-white/10">
                    <span className="font-black text-amber-200 text-xs flex items-center gap-1.5">
                      <span>🏢</span>
                      <span>بيانات وترويسة الشركة الرسمية في الفاتورة:</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleResetCompanyHeader}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                      >
                        استعادة الافتراضي
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveCompanyHeader}
                        className="px-3.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black cursor-pointer shadow-md flex items-center gap-1"
                      >
                        <span>✓</span>
                        <span>حفظ الترويسة 💾</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-amber-200 mb-1">اسم الشركة / المنشأة الرئيسي:</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-blue-400/50 rounded-xl text-white font-bold focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-blue-200 mb-1">الاسم التجاري أو الوصف الفرعي:</label>
                      <input
                        type="text"
                        value={companySubtitle}
                        onChange={(e) => setCompanySubtitle(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-blue-400/50 rounded-xl text-white font-bold focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-blue-200 mb-1">السجل التجاري / الرقم الضريبي:</label>
                      <input
                        type="text"
                        value={companyTaxNumber}
                        onChange={(e) => setCompanyTaxNumber(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-blue-400/50 rounded-xl text-white font-bold focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-blue-200 mb-1">بيانات التواصل والهاتف:</label>
                      <input
                        type="text"
                        value={companyContact}
                        onChange={(e) => setCompanyContact(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-blue-400/50 rounded-xl text-white font-bold focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sticky Bottom Actions Bar inside Designer */}
            <div className="sticky bottom-0 bg-slate-950/95 backdrop-blur-md z-10 pt-3 pb-1 border-t border-white/10 flex items-center justify-between gap-2 mt-4">
              <span className="text-[11px] text-blue-200 hidden sm:inline">
                المقاس الحالي: <strong className="text-amber-300 font-mono">{pdfPaperSize.toUpperCase()}</strong> ({pdfOrientation === 'portrait' ? 'عمودي' : 'أفقي'})
              </span>
              <div className="flex items-center gap-2 mr-auto">
                <button
                  type="button"
                  onClick={handleResetDesignDefaults}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer text-xs"
                >
                  استعادة الافتراضي
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsDesignerOpen(false);
                    setToastMessage({ text: '✓ تم حفظ وتطبيق مقاسات وتخصيصات الفاتورة بنجاح!' });
                    setTimeout(() => setToastMessage(null), 3000);
                  }}
                  className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-black text-xs cursor-pointer shadow-md active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <span>💾</span>
                  <span>حفظ التخصيص وتطبيق الأبعاد</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= INVOICE FULL-SCREEN CANVAS CONTAINER ================= */}
        <div className="flex-1 overflow-y-auto overflow-x-auto p-2 sm:p-4 md:p-6 bg-slate-100 dark:bg-slate-950 flex flex-col items-center print:p-0 print:bg-white print:overflow-visible">
          {/* Quick On-Screen Viewport & Zoom Toolbar */}
          <div className="w-full flex flex-wrap items-center justify-between gap-2 max-w-[1180px] mb-3 px-3.5 py-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs rounded-2xl border border-slate-300 dark:border-slate-800 text-xs shadow-xs no-print">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">حجم الظهور على الشاشة:</span>
              <div className="flex items-center rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    const n = Math.max(50, zoomScale - 10);
                    setZoomScale(n);
                    localStorage.setItem('ahmedjam_zoom_scale', String(n));
                  }}
                  className="w-7 h-7 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-black text-sm flex items-center justify-center cursor-pointer transition-colors"
                  title="تصغير الرؤية"
                >
                  -
                </button>
                <span className="font-mono font-black text-xs min-w-[44px] text-center text-blue-900 dark:text-blue-400 px-1">
                  {zoomScale}%
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const n = Math.min(160, zoomScale + 10);
                    setZoomScale(n);
                    localStorage.setItem('ahmedjam_zoom_scale', String(n));
                  }}
                  className="w-7 h-7 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-black text-sm flex items-center justify-center cursor-pointer transition-colors"
                  title="تكبير الرؤية"
                >
                  +
                </button>
              </div>

              {/* Quick Zoom Presets */}
              <div className="hidden sm:flex items-center gap-1">
                {[75, 100, 125].map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => {
                      setZoomScale(z);
                      localStorage.setItem('ahmedjam_zoom_scale', String(z));
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                      zoomScale === z
                        ? 'bg-blue-600 text-white font-black'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                    }`}
                  >
                    {z}%
                  </button>
                ))}
              </div>

              {/* Screen Width Modes */}
              <div className="flex items-center gap-1 border-r border-slate-300 dark:border-slate-700 pr-2 mr-1">
                <button
                  type="button"
                  onClick={() => {
                    setScreenWidthMode('fit');
                    localStorage.setItem('ahmedjam_screen_mode', 'fit');
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                    screenWidthMode === 'fit' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400'
                  }`}
                  title="ملاءمة الشاشة"
                >
                  📱 شاشة
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setScreenWidthMode('a4');
                    localStorage.setItem('ahmedjam_screen_mode', 'a4');
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                    screenWidthMode === 'a4' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400'
                  }`}
                  title="ورقة A4 متطابقة"
                >
                  📄 A4
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setScreenWidthMode('wide');
                    localStorage.setItem('ahmedjam_screen_mode', 'wide');
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                    screenWidthMode === 'wide' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400'
                  }`}
                  title="عرض واسع 1180px"
                >
                  ↔️ عريض
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-mono font-bold text-[10px]">
                {pdfPaperSize.toUpperCase()} · {pdfOrientation === 'portrait' ? 'عمودي' : 'أفقي'}
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-[10px] hidden md:inline">
                {currentTheme.name}
              </span>
              <button
                type="button"
                onClick={() => setIsDesignerOpen(!isDesignerOpen)}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer transition-all"
              >
                <span>📐</span>
                <span>تعديل الأبعاد والشكل</span>
              </button>
            </div>
          </div>

          {/* ================= THE PRINTABLE INVOICE PAPER ================= */}
          <div
            ref={printAreaRef}
            id="printable-invoice-paper"
            style={{
              zoom: `${zoomScale}%`,
              boxSizing: 'border-box',
            }}
            className={`w-full ${paperMaxWidth} bg-white text-slate-900 ${paperBorderClass} p-4 sm:p-7 md:p-8 print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:rounded-none font-sans relative transition-all`}
          >
            {/* Watermark Overlay */}
            {showWatermark && watermarkText && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none z-0">
                <span className="text-slate-300/35 dark:text-slate-400/20 font-black text-5xl sm:text-7xl md:text-8xl transform -rotate-25 whitespace-nowrap tracking-widest uppercase">
                  {watermarkText}
                </span>
              </div>
            )}

            {/* 1. Header Rendering */}
            {invoiceHeaderStyle === 'banner-strip' ? (
              <div className={`${currentTheme.primaryBg} text-white p-4 rounded-xl mb-4 sm:mb-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10`}>
                <div className="flex items-center gap-3">
                  {showLogo && (
                    <div className="w-12 h-12 rounded-xl bg-white/20 p-1 flex items-center justify-center shrink-0">
                      <img
                        src="/assets/aistudio/8db2b587-11d0-4e6c-8537-0c4a7b722628_d90de0e1.png"
                        alt={companyName}
                        className="h-9 w-auto object-contain brightness-0 invert"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
                      {companyName}
                    </h1>
                    {companySubtitle && <p className="text-xs text-white/90 font-bold">{companySubtitle}</p>}
                    <p className="text-[11px] text-white/80">{companyTaxNumber} · {companyContact}</p>
                  </div>
                </div>
                <div className="bg-black/25 px-3 py-2 rounded-xl border border-white/20 text-right min-w-[190px]">
                  <div className="text-[10px] font-bold text-amber-300 uppercase">فاتورة مبيعات معتمدة</div>
                  <div className="text-base sm:text-lg font-black font-mono tracking-wider">{activeRecord.orderId}</div>
                  <div className="text-[11px] text-white/90">تاريخ: {activeRecord.date}</div>
                </div>
              </div>
            ) : invoiceHeaderStyle === 'classic-center' ? (
              <div className="text-center pb-4 mb-4 border-b-2 border-slate-300 relative z-10">
                {showLogo && (
                  <div className="flex justify-center mb-2">
                    <img
                      src="/assets/aistudio/8db2b587-11d0-4e6c-8537-0c4a7b722628_d90de0e1.png"
                      alt={companyName}
                      className="h-12 w-auto object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <h1 className={`text-2xl font-black ${currentTheme.headerText} tracking-tight`}>
                  {companyName}
                </h1>
                {companySubtitle && <p className="text-xs font-bold text-slate-700 mt-0.5">{companySubtitle}</p>}
                <p className="text-[11px] text-slate-500 mt-1">{companyTaxNumber} · {companyContact}</p>
                <div className="mt-2 inline-block px-3 py-1 bg-slate-100 rounded-lg border border-slate-300 font-mono font-bold text-xs text-slate-800">
                  فاتورة رقم: {activeRecord.orderId} · التاريخ: {activeRecord.date}
                </div>
              </div>
            ) : invoiceHeaderStyle === 'minimal' ? (
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 relative z-10">
                <div>
                  <h1 className="text-lg font-black text-slate-900">{companyName}</h1>
                  <p className="text-[11px] text-slate-600">{companySubtitle}</p>
                </div>
                <div className="text-left font-mono">
                  <div className="text-sm font-black text-slate-900">{activeRecord.orderId}</div>
                  <div className="text-[11px] text-slate-500">{activeRecord.date}</div>
                </div>
              </div>
            ) : (
              /* Default: modern-split */
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 sm:pb-5 mb-4 sm:mb-5 border-b-2 border-slate-200/90 gap-4 relative z-10">
                <div className="flex items-center gap-3 sm:gap-4">
                  {showLogo && (
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-50 p-1.5 border border-slate-200/80 shadow-2xs flex items-center justify-center shrink-0">
                      <img
                        src="/assets/aistudio/8db2b587-11d0-4e6c-8537-0c4a7b722628_d90de0e1.png"
                        alt={companyName}
                        className="h-10 sm:h-12 w-auto object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div className="flex flex-col">
                    <h1 className={`text-xl sm:text-2xl font-black ${currentTheme.headerText} tracking-tight leading-snug`}>
                      {companyName}
                    </h1>
                    {companySubtitle && (
                      <p className="text-xs text-slate-700 font-bold mt-0.5">
                        {companySubtitle}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 font-semibold mt-1">
                      {companyTaxNumber && <span>{companyTaxNumber}</span>}
                      {companyContact && <span>• {companyContact}</span>}
                    </div>
                  </div>
                </div>

                {showTopInvoiceCard ? (
                  <div className="text-left shrink-0 self-stretch sm:self-auto">
                    <div className="bg-gradient-to-br from-blue-50/90 to-slate-50 border-2 border-blue-300 rounded-xl p-2.5 sm:p-3 text-right shadow-2xs min-w-[210px]">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded shadow-2xs text-white ${
                          invoiceFormatStyle === 'quick' ? 'bg-amber-600' : currentTheme.badgeBg
                        }`}>
                          {invoiceFormatStyle === 'quick' ? 'فاتورة سريعة (مختصرة)' : 'فاتورة مبيعات معتمدة'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 font-bold">INVOICE</span>
                      </div>
                      <div className="text-base sm:text-lg font-black font-mono text-slate-950 tracking-wider">
                        {activeRecord.orderId}
                      </div>
                      <div className="text-[11px] font-bold text-slate-600 mt-0.5 flex items-center justify-between">
                        <span>تاريخ الإصدار:</span>
                        <span className="font-mono text-slate-900 font-bold">{activeRecord.date}</span>
                      </div>
                      {showBarcode && (
                        <div className="text-[10px] font-mono tracking-widest text-slate-400 mt-1 select-none text-center border-t border-slate-200/80 pt-1">
                          ||||| ||| |||| || |||| |||||
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-left shrink-0 self-center pl-1">
                    <div className="text-xs sm:text-sm font-black font-mono text-slate-900">
                      فاتورة رقم: <span className="text-blue-900">{activeRecord.orderId}</span>
                    </div>
                    <div className="text-[11px] font-bold text-slate-500 mt-0.5">
                      تاريخ الإصدار: <span className="font-mono text-slate-700">{activeRecord.date}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Customer & Details Info Strip */}
            {(() => {
              const activePay =
                activeRecord.paymentType ||
                (paymentTermsType === 'custom' ? customPaymentTermsText : paymentTermsType) ||
                'نقدي / تسليم فوري';

              const isPayVisible =
                showPaymentTerms &&
                activePay !== 'hidden' &&
                activePay !== 'none' &&
                activePay !== 'بدون';

              const activeCardsCount = 1 + (showDeliveryRepCard ? 1 : 0) + (showOrderDetailsCard ? 1 : 0);
              const gridColsClass =
                activeCardsCount === 3
                  ? 'md:grid-cols-3'
                  : activeCardsCount === 2
                  ? 'sm:grid-cols-2'
                  : 'grid-cols-1';

              return (
                <div className={`grid grid-cols-1 ${gridColsClass} gap-3 sm:gap-4 text-xs mb-4 relative z-10`}>
                  {/* Card 1: Billed To */}
                  <div className="bg-slate-50/90 rounded-xl border border-slate-200 p-3 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2 font-black text-slate-800">
                      <span className="text-[10px] font-mono text-slate-400">Billed To</span>
                      <span className="text-xs font-bold">بيانات العميل / الصيدلية</span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-semibold">اسم العميل:</span>
                        <span className="font-black text-slate-900 text-sm truncate max-w-[180px]">{activeRecord.customerName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-semibold">تصنيف المنشأة:</span>
                        <span className="font-bold text-slate-700">
                          {activeRecord.customerSegment || 'صيدليات مجتمعية'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-semibold">حالة التوريد:</span>
                        <span className="font-black text-emerald-700 flex items-center gap-1">
                          <span>تم التسليم والاعتماد</span>
                          <span>✓</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Delivery & Rep (Can be deleted or hidden by user) */}
                  {showDeliveryRepCard && (
                    <div className="bg-slate-50/90 rounded-xl border border-slate-200 p-3 shadow-2xs relative">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2 font-black text-slate-800">
                        <span className="text-xs font-bold flex items-center gap-1">
                          <span>بيانات المندوب والتسليم</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">Delivery & Rep</span>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-semibold">المندوب الطبي:</span>
                          <span className="font-black text-blue-900 truncate max-w-[180px]">{currentRepDisplay}</span>
                        </div>

                        {/* Payment Terms Line (Can be changed: نقدي / آجل / كاش / تحويل or deleted / hidden) */}
                        {isPayVisible && (
                          <div className="flex items-center justify-between relative group/pay">
                            <span className="text-slate-500 font-semibold flex items-center gap-1">
                              <span>شروط وسداد الفاتورة:</span>
                              <button
                                type="button"
                                onClick={() => setIsPaymentPopoverOpen(!isPaymentPopoverOpen)}
                                className="no-print text-blue-600 hover:text-blue-800 text-[10px] cursor-pointer"
                                title="تعديل أو حذف شروط السداد"
                              >
                                ✏️
                              </button>
                            </span>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setIsPaymentPopoverOpen(!isPaymentPopoverOpen)}
                                className="font-bold text-slate-800 hover:text-blue-700 cursor-pointer flex items-center gap-1 text-right no-print:underline"
                                title="اضغط لتغيير شرط السداد (نقدي / آجل / كاش) أو حذفه"
                              >
                                <span>{activePay}</span>
                                <span className="text-[10px] text-blue-500 no-print">▾</span>
                              </button>
                              <span className="hidden print:inline font-bold text-slate-800">{activePay}</span>

                              {/* Quick One-Tap Popover to Change or Delete */}
                              {isPaymentPopoverOpen && (
                                <div className="absolute left-0 sm:right-0 top-full mt-1 z-30 bg-white border-2 border-blue-400 rounded-xl shadow-2xl p-2 min-w-[210px] text-xs space-y-1 animate-in fade-in zoom-in-95 no-print">
                                  <div className="font-black text-[11px] text-slate-800 pb-1 border-b border-slate-200 flex items-center justify-between">
                                    <span>طريقة وشروط السداد:</span>
                                    <button
                                      type="button"
                                      onClick={() => setIsPaymentPopoverOpen(false)}
                                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                  {[
                                    { label: '💵 نقدي / تسليم فوري', value: 'نقدي / تسليم فوري' },
                                    { label: '⏳ بيع آجل (Credit)', value: 'آجل' },
                                    { label: '💰 كاش (Cash)', value: 'كاش' },
                                    { label: '🏦 تحويل بنكي', value: 'تحويل بنكي' },
                                    { label: '📝 شيك مصرفي', value: 'شيك مصرفي' },
                                  ].map((opt) => (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      onClick={() => handleQuickChangePaymentTerms(opt.value)}
                                      className={`w-full text-right px-2.5 py-1.5 rounded-lg font-bold flex items-center justify-between cursor-pointer transition-colors ${
                                        activePay === opt.value
                                          ? 'bg-blue-600 text-white'
                                          : 'hover:bg-blue-50 text-slate-800'
                                      }`}
                                    >
                                      <span>{opt.label}</span>
                                      {activePay === opt.value && <span>✓</span>}
                                    </button>
                                  ))}
                                  <div className="pt-1 border-t border-slate-200">
                                    <button
                                      type="button"
                                      onClick={() => handleQuickChangePaymentTerms('hidden')}
                                      className="w-full text-right px-2.5 py-1.5 rounded-lg font-black text-rose-600 hover:bg-rose-50 flex items-center gap-1.5 cursor-pointer transition-colors"
                                    >
                                      <span>🗑️</span>
                                      <span>حذف / إخفاء من الفاتورة</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-semibold">العملة المعتمدة:</span>
                          <span className="font-bold font-mono text-slate-900">{currency}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Card 3: Order Info */}
                  {showOrderDetailsCard && (
                    <div className="bg-slate-50/90 rounded-xl border border-slate-200 p-3 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2 font-black text-slate-800">
                        <span className="text-[10px] font-mono text-slate-400">Order Info</span>
                        <span className="text-xs font-bold">تفاصيل الطلبية</span>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-semibold">رقم الطلب:</span>
                          <span className="font-bold font-mono text-slate-900 truncate max-w-[150px]">{activeRecord.orderId}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-semibold">حالة الفاتورة:</span>
                          <span className="font-bold text-blue-900 font-mono">معتمدة رسمياً</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ================= ITEMS TABLE ================= */}
            <div className="w-full border-2 border-slate-300 rounded-xl overflow-hidden shadow-2xs bg-white mb-4 relative z-10">
              <table className={`w-full ${tableFontSizeClass} border-collapse`} style={{ tableLayout: 'fixed', width: '100%' }}>
                <colgroup>
                  {showIndexCol && <col style={{ width: '5%' }} />}
                  <col
                    style={{
                      width:
                        columnWidthPreset === 'wide-product'
                          ? showGeneric && showCategory ? '45%' : '55%'
                          : columnWidthPreset === 'compact-data'
                          ? showGeneric && showCategory ? '28%' : '38%'
                          : showGeneric && showCategory ? '34%' : '44%',
                    }}
                  />
                  {showGeneric && <col style={{ width: '16%' }} />}
                  {showCategory && <col style={{ width: '14%' }} />}
                  {showUnitCol && <col style={{ width: '8%' }} />}
                  <col style={{ width: columnWidthPreset === 'compact-data' ? '12%' : '9%' }} />
                  <col style={{ width: columnWidthPreset === 'compact-data' ? '14%' : '11%' }} />
                  <col style={{ width: columnWidthPreset === 'compact-data' ? '16%' : '13%' }} />
                </colgroup>
                <thead className={`${currentTheme.primaryBg} text-white font-black border-b-2 border-slate-900`}>
                  <tr>
                    {showIndexCol && (
                      <th className={`${tableHeaderPaddingClass} text-center font-black border-l border-white/20 truncate`}>#</th>
                    )}
                    <th className={`${tableHeaderPaddingClass} ${nameAlignClass} font-black border-l border-white/20 truncate`}>
                      اسم الصنف الدوائي والمستحضر
                    </th>
                    {showGeneric && (
                      <th className={`${tableHeaderPaddingClass} text-center font-bold border-l border-white/20 truncate`}>
                        التركيبة العلمية
                      </th>
                    )}
                    {showCategory && (
                      <th className={`${tableHeaderPaddingClass} text-center font-bold border-l border-white/20 truncate`}>
                        التصنيف
                      </th>
                    )}
                    {showUnitCol && (
                      <th className={`${tableHeaderPaddingClass} text-center font-bold border-l border-white/20 truncate`}>
                        الوحدة
                      </th>
                    )}
                    <th className={`${tableHeaderPaddingClass} text-center font-black border-l border-white/20 truncate`}>
                      الكمية
                    </th>
                    <th className={`${tableHeaderPaddingClass} ${dataAlignClass} font-black border-l border-white/20 truncate`}>
                      سعر الوحدة
                    </th>
                    <th className={`${tableHeaderPaddingClass} ${dataAlignClass} font-black truncate`}>
                      الإجمالي ({currency})
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {itemsToDisplay.map((it, idx) => (
                    <tr
                      key={it.id || idx}
                      className={`transition-colors ${currentTheme.hoverBg} ${
                        idx % 2 === 1 ? currentTheme.zebraBg : 'bg-white'
                      }`}
                    >
                      {showIndexCol && (
                        <td className={`${tableBodyPaddingClass} text-center text-slate-600 font-bold font-mono ${cellBorderClass}`}>
                          {idx + 1}
                        </td>
                      )}
                      <td className={`${tableBodyPaddingClass} ${nameAlignClass} font-black text-slate-950 ${cellBorderClass}`}>
                        {it.itemName}
                      </td>
                      {showGeneric && (
                        <td className={`${tableBodyPaddingClass} text-center text-slate-600 font-mono text-[11px] ${cellBorderClass}`}>
                          {it.genericName || '-'}
                        </td>
                      )}
                      {showCategory && (
                        <td className={`${tableBodyPaddingClass} text-center text-slate-600 font-semibold text-[11px] ${cellBorderClass}`}>
                          {it.category}
                        </td>
                      )}
                      {showUnitCol && (
                        <td className={`${tableBodyPaddingClass} text-center text-slate-500 font-semibold text-[11px] ${cellBorderClass}`}>
                          عبوة
                        </td>
                      )}
                      <td className={`${tableBodyPaddingClass} text-center font-black text-slate-900 font-mono ${cellBorderClass}`}>
                        {it.quantity}
                      </td>
                      <td className={`${tableBodyPaddingClass} ${dataAlignClass} font-mono font-bold text-slate-800 ${cellBorderClass}`}>
                        {formatNumber(it.unitPrice)}
                      </td>
                      <td className={`${tableBodyPaddingClass} ${dataAlignClass} font-mono font-black ${currentTheme.totalText} ${cellBorderClass}`}>
                        {formatNumber(it.totalSales)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Footer Totals */}
                <tfoot className="bg-slate-100/90 font-black border-t-2 border-slate-300">
                  <tr>
                    <td
                      colSpan={(showIndexCol ? 1 : 0) + 1 + (showGeneric ? 1 : 0) + (showCategory ? 1 : 0) + (showUnitCol ? 1 : 0)}
                      className={`${tableHeaderPaddingClass} text-right text-slate-800 border-l border-slate-200`}
                    >
                      الإجمالي الكلي للأصناف ({itemsToDisplay.length} أصناف)
                    </td>
                    <td className={`${tableHeaderPaddingClass} text-center font-mono text-slate-950 border-l border-slate-200`}>
                      {formatNumber(totalQuantity)}
                    </td>
                    <td className={`${tableHeaderPaddingClass} ${dataAlignClass} text-slate-600 text-[11px] border-l border-slate-200`}>
                      الصافي:
                    </td>
                    <td className={`${tableHeaderPaddingClass} ${dataAlignClass} font-mono font-black text-base ${currentTheme.totalText}`}>
                      {formatNumber(totalAmount)} {currency}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Delivery Declaration & Totals Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pt-1 mb-4 print-avoid-break relative z-10">
              <div className="sm:col-span-7 bg-slate-50/90 border border-slate-300 rounded-xl p-3.5 flex flex-col justify-center text-[11px] leading-relaxed text-slate-600">
                <p>
                  <strong className="text-slate-800">إقرار التسليم الطبي:</strong> أقر أنا المستلم باستلام الأصناف الدوائية والمستحضرات الطبية الموضحة بالجدول أعلاه بحالة سليمة تماماً ومطابقة للمواصفات القياسية وضمن شروط التخزين والحفظ المعتمدة.
                </p>
                {activeRecord.notes && (
                  <p className="mt-2 text-[10px] font-bold text-slate-800">
                    ملاحظات: {activeRecord.notes}
                  </p>
                )}
              </div>

              <div className={`sm:col-span-5 bg-white border-2 ${currentTheme.totalBoxBorder} rounded-xl p-3.5 shadow-2xs space-y-1.5 text-xs`}>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="font-semibold">إجمالي الكمية المباعة:</span>
                  <span className="font-black text-slate-950 font-mono">{formatNumber(totalQuantity)} عبوة</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>المجموع الفرعي:</span>
                  <span className="font-mono font-bold">{currency} {formatNumber(totalAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>الخصم التجاري / الضريبة:</span>
                  <span className="font-mono font-bold">{currency} 0.00</span>
                </div>
                <div className={`border-t-2 ${currentTheme.totalBoxBorder} pt-2 mt-2 flex items-center justify-between`}>
                  <span className="text-sm font-black text-slate-900">صافي الفاتورة:</span>
                  <span className={`text-base sm:text-xl font-black font-mono ${currentTheme.totalText}`}>
                    {formatNumber(totalAmount)} {currency}
                  </span>
                </div>
              </div>
            </div>

            {/* Signatures */}
            {showSignatures && (
              <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-200 text-center text-xs print-avoid-break relative z-10">
                <div>
                  <div className="w-48 sm:w-64 border-b border-slate-400 mx-auto mb-2" />
                  <div className="font-black text-slate-900 text-xs">المندوب الطبي المعتمد</div>
                  <div className="text-[11px] text-slate-600 font-semibold mt-0.5">
                    {currentRepDisplay} • {companyName}
                  </div>
                </div>

                <div>
                  <div className="w-48 sm:w-64 border-b border-slate-400 mx-auto mb-2" />
                  <div className="font-black text-slate-900 text-xs">ختم وتوقيع الصيدلية المستلمة</div>
                  <div className="text-[11px] text-slate-600 font-semibold mt-0.5">
                    {activeRecord.customerName}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invoice CSV Customization & Export Modal */}
      <InvoiceCsvExportModal
        isOpen={isInvoiceCsvModalOpen}
        onClose={() => setIsInvoiceCsvModalOpen(false)}
        record={activeRecord}
        items={itemsToDisplay}
        currency={currency}
        activeSalesRep={currentRepDisplay}
        companyName={companyName}
        onSuccess={(text) => {
          setToastMessage({ text });
          setTimeout(() => setToastMessage(null), 5000);
        }}
      />
    </div>
  );
};
