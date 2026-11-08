import * as XLSX from 'xlsx';
import { saveFileToPhoneStorage, isNativeCapacitorPlatform } from '../services/phoneStorageService';
import { formatNumber } from './formatters';

export interface SingleInvoiceExcelData {
  orderId: string;
  customerName: string;
  customerSegment?: string;
  date: string;
  salesRep: string;
  paymentType?: string;
  currency: string;
  items: Array<{
    itemName: string;
    genericName?: string;
    category?: string;
    quantity: number;
    unitPrice: number;
    totalSales: number;
    boxCrt?: number;
    notes?: string;
  }>;
  totalQuantity: number;
  totalAmount: number;
  showPaymentTerms?: boolean;
}

/**
 * Generates an Excel workbook (.xlsx) for a single invoice and saves it to phone storage
 * (or downloads in browser) with complete Arabic headers, corporate Jamjoom branding, and item lines.
 */
export async function exportSingleInvoiceToExcel(
  invoiceData: SingleInvoiceExcelData
): Promise<{
  success: boolean;
  filename: string;
  path?: string;
  method: 'folder' | 'picker' | 'download';
  message: string;
}> {
  const {
    orderId,
    customerName,
    date,
    salesRep,
    paymentType,
    currency,
    items,
    totalQuantity,
    totalAmount,
    showPaymentTerms = true,
  } = invoiceData;

  // Build clean sheet rows
  const rows: any[][] = [];

  // Title & Corporate Banner
  rows.push(['شركة جمجوم للأدوية - المملكة العربية السعودية (Jamjoom Pharma)']);
  rows.push(['فاتورة مبيعات معتمدة رسمياً']);
  rows.push([]); // blank

  // Invoice Metadata
  rows.push(['رقم الفاتورة:', orderId, '', 'تاريخ الفاتورة:', date]);
  rows.push(['اسم العميل / الصيدلية:', customerName, '', 'العملة:', currency]);
  
  if (showPaymentTerms && paymentType && paymentType !== 'hidden' && paymentType !== 'بدون') {
    rows.push(['المندوب الطبي:', salesRep, '', 'طريقة وشروط السداد:', paymentType]);
  } else {
    rows.push(['المندوب الطبي:', salesRep, '', '', '']);
  }
  rows.push([]); // blank

  // Table Headers
  rows.push([
    '#',
    'اسم الصنف التجاري',
    'التركيبة والاسم العلمي',
    'التصنيف العلاجي',
    'الكمية (عبوة)',
    'سعر الوحدة',
    `إجمالي القيمة (${currency})`,
  ]);

  // Items
  items.forEach((item, index) => {
    rows.push([
      index + 1,
      item.itemName,
      item.genericName || '-',
      item.category || '-',
      item.quantity,
      item.unitPrice,
      item.totalSales,
    ]);
  });

  // Empty separation
  rows.push([]);

  // Summary Row
  rows.push([
    'الإجمالي الكلي',
    `عدد الأصناف: ${items.length}`,
    '',
    '',
    totalQuantity,
    '',
    `${formatNumber(totalAmount)} ${currency}`,
  ]);

  // Create worksheet and workbook
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths for beautiful layout
  ws['!cols'] = [
    { wch: 6 },  // #
    { wch: 32 }, // Item Name
    { wch: 35 }, // Generic
    { wch: 22 }, // Category
    { wch: 16 }, // Quantity
    { wch: 16 }, // Unit Price
    { wch: 24 }, // Total
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `فاتورة ${orderId.replace(/[^a-zA-Z0-9-]/g, '')}`);

  // Generate binary array buffer
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const safeCustomer = customerName.trim().replace(/[/\\?%*:|"<>]/g, '_') || 'عميل';
  const filename = `فاتورة_${orderId}_${safeCustomer}.xlsx`;

  try {
    const saveResult = await saveFileToPhoneStorage(
      filename,
      blob,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'excel'
    );

    // If web browser fallback
    if (saveResult.method === 'download' && !isNativeCapacitorPlatform()) {
      try {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (e) {
        console.warn('Web blob download fallback', e);
      }
    }

    const targetDir = saveResult.path || 'ذاكرة الهاتف (مستندات ahmed jam)';
    return {
      success: true,
      filename,
      path: targetDir,
      method: saveResult.method,
      message: `✓ تم تصدير وحفظ الفاتورة بصيغة Excel (${filename}) في ${targetDir} بنجاح!`,
    };
  } catch (err: any) {
    console.error('Export Excel failed:', err);
    // Emergency browser download fallback
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }

    return {
      success: true,
      filename,
      method: 'download',
      message: `✓ تم تنزيل الفاتورة بصيغة Excel (${filename}) بنجاح!`,
    };
  }
}
