import { SalesRecord } from '../types';
import { DEFAULT_SALES_REP } from '../data/productCatalog';

export function generateCSVString(data: SalesRecord[]): string {
  const BOM = '\uFEFF';
  const headers = ['Order ID', 'Date', 'Sales Rep', 'Customer Name', 'Category', 'Item Name', 'Generic Name', 'Quantity', 'Unit Price', 'Total Sales', 'Notes'];
  
  const rows = data.map((item) => [
    `"${item.orderId || ''}"`,
    `"${item.date || ''}"`,
    `"${(item.salesRep || DEFAULT_SALES_REP).replace(/"/g, '""')}"`,
    `"${(item.customerName || '').replace(/"/g, '""')}"`,
    `"${(item.category || '').replace(/"/g, '""')}"`,
    `"${(item.itemName || '').replace(/"/g, '""')}"`,
    `"${(item.genericName || '').replace(/"/g, '""')}"`,
    item.quantity,
    item.unitPrice,
    item.totalSales,
    `"${(item.notes || '').replace(/"/g, '""')}"`,
  ]);

  return BOM + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

export function exportToCSV(data: SalesRecord[], filename = 'sales_data_looker_studio.csv') {
  const csvContent = generateCSVString(data);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  // 1. If running inside native Android APK or supported environment, save to phone storage
  import('../services/phoneStorageService').then(({ isNativeCapacitorPlatform, saveFileNativeCapacitor }) => {
    if (isNativeCapacitorPlatform()) {
      saveFileNativeCapacitor(filename, blob, 'text/csv;charset=utf-8;').catch((err) => {
        console.error('Native CSV export failed:', err);
      });
      return;
    }

    // 2. Web browser fallback
    try {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn('Web download failed', e);
    }
  });
}

export interface ExcelExportField {
  id: string;
  labelAr: string;
  labelEn: string;
  category: 'invoice' | 'customer' | 'item' | 'financial';
  defaultSelected: boolean;
}

export const AVAILABLE_EXCEL_FIELDS: ExcelExportField[] = [
  { id: 'orderId', labelAr: 'رقم الفاتورة / الطلبية', labelEn: 'Order ID', category: 'invoice', defaultSelected: true },
  { id: 'date', labelAr: 'تاريخ الفاتورة', labelEn: 'Invoice Date', category: 'invoice', defaultSelected: true },
  { id: 'customerName', labelAr: 'اسم العميل / الصيدلية', labelEn: 'Customer Name', category: 'customer', defaultSelected: true },
  { id: 'customerSegment', labelAr: 'تصنيف العميل / الشريحة', labelEn: 'Customer Segment', category: 'customer', defaultSelected: false },
  { id: 'itemName', labelAr: 'اسم الصنف الدوائي', labelEn: 'Product / Drug Name', category: 'item', defaultSelected: true },
  { id: 'genericName', labelAr: 'الاسم العلمي والتركيبة', labelEn: 'Generic Formulation', category: 'item', defaultSelected: true },
  { id: 'category', labelAr: 'التصنيف العلاجي', labelEn: 'Medical Category', category: 'item', defaultSelected: true },
  { id: 'quantity', labelAr: 'الكمية المباعة (عبوة)', labelEn: 'Quantity Sold', category: 'financial', defaultSelected: true },
  { id: 'boxCrt', labelAr: 'عدد الكراتين (Box/Crt)', labelEn: 'Box / Carton Count', category: 'item', defaultSelected: false },
  { id: 'unitPrice', labelAr: 'سعر الوحدة', labelEn: 'Unit Price', category: 'financial', defaultSelected: true },
  { id: 'totalSales', labelAr: 'إجمالي القيمة (SUM Sales)', labelEn: 'Total Sales Amount', category: 'financial', defaultSelected: true },
  { id: 'currency', labelAr: 'العملة', labelEn: 'Currency', category: 'financial', defaultSelected: true },
  { id: 'salesRep', labelAr: 'مندوب المبيعات', labelEn: 'Sales / Medical Rep', category: 'invoice', defaultSelected: true },
  { id: 'notes', labelAr: 'الملاحظات وحالة الفاتورة', labelEn: 'Notes & Status', category: 'invoice', defaultSelected: false },
];

export const CUSTOMER_SUMMARY_EXCEL_FIELDS: ExcelExportField[] = [
  { id: 'customerName', labelAr: 'اسم العميل / الصيدلية', labelEn: 'Customer / Pharmacy', category: 'customer', defaultSelected: true },
  { id: 'segment', labelAr: 'تصنيف وشريحة العميل', labelEn: 'Customer Segment', category: 'customer', defaultSelected: true },
  { id: 'totalSales', labelAr: 'إجمالي المبيعات (SUM Sales)', labelEn: 'Total Sales Amount', category: 'financial', defaultSelected: true },
  { id: 'percentageOfTotal', labelAr: 'نسبة الإسهام من المبيعات (%)', labelEn: '% of Total Sales', category: 'financial', defaultSelected: true },
  { id: 'totalQuantity', labelAr: 'إجمالي العبوات والكميات', labelEn: 'Total Units (Quantity)', category: 'financial', defaultSelected: true },
  { id: 'orderCount', labelAr: 'عدد الفواتير والطلبيات', labelEn: 'Orders / Invoices Count', category: 'invoice', defaultSelected: true },
  { id: 'avgOrderValue', labelAr: 'متوسط قيمة الطلبية (AOV)', labelEn: 'Average Order Value', category: 'financial', defaultSelected: true },
  { id: 'currency', labelAr: 'العملة الرسمية', labelEn: 'Currency', category: 'financial', defaultSelected: true },
];

export const ITEM_SUMMARY_EXCEL_FIELDS: ExcelExportField[] = [
  { id: 'itemName', labelAr: 'اسم الصنف والمستحضر الدوائي', labelEn: 'Product / Drug Name', category: 'item', defaultSelected: true },
  { id: 'category', labelAr: 'التصنيف والفئة العلاجية', labelEn: 'Therapeutic Category', category: 'item', defaultSelected: true },
  { id: 'genericName', labelAr: 'الاسم العلمي والتركيبة', labelEn: 'Generic Formulation', category: 'item', defaultSelected: true },
  { id: 'totalQuantity', labelAr: 'إجمالي الكمية المباعة (عبوة)', labelEn: 'Total Quantity Sold', category: 'financial', defaultSelected: true },
  { id: 'avgUnitPrice', labelAr: 'متوسط سعر الوحدة', labelEn: 'Avg Unit Price', category: 'financial', defaultSelected: true },
  { id: 'totalSales', labelAr: 'إجمالي المبيعات (SUM Sales)', labelEn: 'Total Sales Amount', category: 'financial', defaultSelected: true },
  { id: 'percentageOfTotal', labelAr: 'نسبة الإسهام من المبيعات (%)', labelEn: '% of Total Sales', category: 'financial', defaultSelected: true },
  { id: 'currency', labelAr: 'العملة الرسمية', labelEn: 'Currency', category: 'financial', defaultSelected: true },
];

export type ReportDimensionMode = 'detailed' | 'byCustomer' | 'byItem' | 'allReports';

export interface CustomExcelOptions {
  selectedFieldIds: string[];
  includeTotalsRow: boolean;
  fileFormat: 'csv' | 'xml-excel' | 'xlsx';
  reportMode?: ReportDimensionMode;
  currency?: string;
  filename?: string;
}

export function generateCustomCSVString(
  data: SalesRecord[],
  options: CustomExcelOptions
): string {
  const BOM = '\uFEFF';
  const activeFields = AVAILABLE_EXCEL_FIELDS.filter((f) =>
    options.selectedFieldIds.includes(f.id)
  );

  const headers = activeFields.map((f) => `"${f.labelAr} (${f.labelEn})"`);

  const rows = data.map((item, idx) => {
    return activeFields.map((field) => {
      switch (field.id) {
        case 'orderId':
          return `"${item.orderId || `INV-${idx + 1}`}"`;
        case 'date':
          return `"${item.date || ''}"`;
        case 'customerName':
          return `"${(item.customerName || '').replace(/"/g, '""')}"`;
        case 'customerSegment':
          return `"${(item.customerSegment || 'صيدلية').replace(/"/g, '""')}"`;
        case 'itemName':
          return `"${(item.itemName || '').replace(/"/g, '""')}"`;
        case 'genericName':
          return `"${(item.genericName || '').replace(/"/g, '""')}"`;
        case 'category':
          return `"${(item.category || '').replace(/"/g, '""')}"`;
        case 'quantity':
          return item.quantity ?? 0;
        case 'boxCrt':
          return `"${item.boxCrt || '-'}"`;
        case 'unitPrice':
          return item.unitPrice ?? 0;
        case 'totalSales':
          return item.totalSales ?? 0;
        case 'currency':
          return `"${options.currency || 'SDG'}"`;
        case 'salesRep':
          return `"${(item.salesRep || DEFAULT_SALES_REP).replace(/"/g, '""')}"`;
        case 'notes':
          return `"${(item.notes || 'معتمد').replace(/"/g, '""')}"`;
        default:
          return '""';
      }
    });
  });

  // Calculate and add totals row if requested
  let summaryRowContent = '';
  if (options.includeTotalsRow && data.length > 0) {
    const totalQty = data.reduce((s, it) => s + (it.quantity || 0), 0);
    const totalAmount = data.reduce((s, it) => s + (it.totalSales || 0), 0);

    const summaryCells = activeFields.map((field, i) => {
      if (i === 0) return '"الإجمالي الكلي (Total Summary)"';
      if (field.id === 'quantity') return totalQty;
      if (field.id === 'totalSales') return totalAmount;
      if (field.id === 'customerName') return `"عدد الطلبيات: ${data.length}"`;
      if (field.id === 'currency') return `"${options.currency || 'SDG'}"`;
      return '""';
    });
    summaryRowContent = '\r\n' + summaryCells.join(',');
  }

  return (
    BOM +
    [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n') +
    summaryRowContent
  );
}

export function generateExcelXMLString(
  data: SalesRecord[],
  options: CustomExcelOptions
): string {
  const activeFields = AVAILABLE_EXCEL_FIELDS.filter((f) =>
    options.selectedFieldIds.includes(f.id)
  );

  const totalQty = data.reduce((s, it) => s + (it.quantity || 0), 0);
  const totalAmount = data.reduce((s, it) => s + (it.totalSales || 0), 0);

  const headerCells = activeFields
    .map(
      (f) =>
        `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(
          f.labelAr
        )}</Data></Cell>`
    )
    .join('');

  const rowsXml = data
    .map((item, idx) => {
      const cells = activeFields
        .map((field) => {
          switch (field.id) {
            case 'orderId':
              return `<Cell ss:StyleID="String"><Data ss:Type="String">${escapeXml(
                item.orderId || `INV-${idx + 1}`
              )}</Data></Cell>`;
            case 'date':
              return `<Cell ss:StyleID="Date"><Data ss:Type="String">${escapeXml(
                item.date || ''
              )}</Data></Cell>`;
            case 'customerName':
              return `<Cell ss:StyleID="String"><Data ss:Type="String">${escapeXml(
                item.customerName || ''
              )}</Data></Cell>`;
            case 'customerSegment':
              return `<Cell ss:StyleID="String"><Data ss:Type="String">${escapeXml(
                item.customerSegment || 'صيدلية'
              )}</Data></Cell>`;
            case 'itemName':
              return `<Cell ss:StyleID="BoldString"><Data ss:Type="String">${escapeXml(
                item.itemName || ''
              )}</Data></Cell>`;
            case 'genericName':
              return `<Cell ss:StyleID="String"><Data ss:Type="String">${escapeXml(
                item.genericName || ''
              )}</Data></Cell>`;
            case 'category':
              return `<Cell ss:StyleID="String"><Data ss:Type="String">${escapeXml(
                item.category || ''
              )}</Data></Cell>`;
            case 'quantity':
              return `<Cell ss:StyleID="Number"><Data ss:Type="Number">${
                item.quantity || 0
              }</Data></Cell>`;
            case 'boxCrt':
              return `<Cell ss:StyleID="String"><Data ss:Type="String">${escapeXml(
                String(item.boxCrt ?? '-')
              )}</Data></Cell>`;
            case 'unitPrice':
              return `<Cell ss:StyleID="Currency"><Data ss:Type="Number">${
                item.unitPrice || 0
              }</Data></Cell>`;
            case 'totalSales':
              return `<Cell ss:StyleID="CurrencyBold"><Data ss:Type="Number">${
                item.totalSales || 0
              }</Data></Cell>`;
            case 'currency':
              return `<Cell ss:StyleID="String"><Data ss:Type="String">${escapeXml(
                options.currency || 'SDG'
              )}</Data></Cell>`;
            case 'salesRep':
              return `<Cell ss:StyleID="String"><Data ss:Type="String">${escapeXml(
                item.salesRep || DEFAULT_SALES_REP
              )}</Data></Cell>`;
            case 'notes':
              return `<Cell ss:StyleID="String"><Data ss:Type="String">${escapeXml(
                item.notes || 'معتمد'
              )}</Data></Cell>`;
            default:
              return '<Cell ss:StyleID="String"><Data ss:Type="String"></Data></Cell>';
          }
        })
        .join('');
      return `<Row>${cells}</Row>`;
    })
    .join('');

  let totalRowXml = '';
  if (options.includeTotalsRow && data.length > 0) {
    const totalCells = activeFields
      .map((field, i) => {
        if (i === 0) {
          return `<Cell ss:StyleID="TotalHeader"><Data ss:Type="String">الإجمالي الكلي</Data></Cell>`;
        }
        if (field.id === 'customerName') {
          return `<Cell ss:StyleID="TotalHeader"><Data ss:Type="String">عدد الطلبيات: ${data.length}</Data></Cell>`;
        }
        if (field.id === 'quantity') {
          return `<Cell ss:StyleID="TotalNumber"><Data ss:Type="Number">${totalQty}</Data></Cell>`;
        }
        if (field.id === 'totalSales') {
          return `<Cell ss:StyleID="TotalCurrency"><Data ss:Type="Number">${totalAmount}</Data></Cell>`;
        }
        if (field.id === 'currency') {
          return `<Cell ss:StyleID="TotalHeader"><Data ss:Type="String">${escapeXml(
            options.currency || 'SDG'
          )}</Data></Cell>`;
        }
        return `<Cell ss:StyleID="TotalHeader"><Data ss:Type="String"></Data></Cell>`;
      })
      .join('');
    totalRowXml = `<Row ss:StyleID="TotalRow">${totalCells}</Row>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#0f172a"/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#2563eb"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="11" ss:Bold="1" ss:Color="#ffffff"/>
   <Interior ss:Color="#2563eb" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="String">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="BoldString">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#0f172a"/>
  </Style>
  <Style ss:ID="Date">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Number">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="#,##0"/>
  </Style>
  <Style ss:ID="Currency">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="#,##0.00"/>
  </Style>
  <Style ss:ID="CurrencyBold">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#1e3a8a"/>
   <NumberFormat ss:Format="#,##0.00"/>
  </Style>
  <Style ss:ID="TotalRow">
   <Interior ss:Color="#f1f5f9" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="TotalHeader">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="11" ss:Bold="1" ss:Color="#0f172a"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#2563eb"/>
   </Borders>
  </Style>
  <Style ss:ID="TotalNumber">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="11" ss:Bold="1" ss:Color="#0f172a"/>
   <NumberFormat ss:Format="#,##0"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#2563eb"/>
   </Borders>
  </Style>
  <Style ss:ID="TotalCurrency">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="11" ss:Bold="1" ss:Color="#1e3a8a"/>
   <NumberFormat ss:Format="#,##0.00"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#2563eb"/>
   </Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="تقرير المبيعات">
  <Table ss:DefaultRowHeight="20">
   <Row ss:Height="26">${headerCells}</Row>
   ${rowsXml}
   ${totalRowXml}
  </Table>
 </Worksheet>
</Workbook>`;
}

export function aggregateCustomerSummaries(data: SalesRecord[]) {
  const map = new Map<
    string,
    {
      customerName: string;
      segment: string;
      totalSales: number;
      totalQuantity: number;
      orderCount: number;
    }
  >();

  data.forEach((r) => {
    const name = r.customerName || 'صيدلية غير محددة';
    const cur = map.get(name) || {
      customerName: name,
      segment: r.customerSegment || 'صيدلية مجتمعية',
      totalSales: 0,
      totalQuantity: 0,
      orderCount: 0,
    };
    cur.totalSales += r.totalSales || 0;
    cur.totalQuantity += r.quantity || 0;
    cur.orderCount += 1;
    map.set(name, cur);
  });

  const total = Array.from(map.values()).reduce((s, c) => s + c.totalSales, 0);
  return Array.from(map.values())
    .map((c) => ({
      ...c,
      avgOrderValue: c.orderCount > 0 ? c.totalSales / c.orderCount : 0,
      percentageOfTotal: total > 0 ? (c.totalSales / total) * 100 : 0,
    }))
    .sort((a, b) => b.totalSales - a.totalSales);
}

export function aggregateItemSummaries(data: SalesRecord[]) {
  const map = new Map<
    string,
    {
      itemName: string;
      category: string;
      genericName: string;
      totalQuantity: number;
      totalSales: number;
    }
  >();

  data.forEach((r) => {
    const name = r.itemName || 'صنف غير محدد';
    const cur = map.get(name) || {
      itemName: name,
      category: r.category || 'عام',
      genericName: r.genericName || '',
      totalQuantity: 0,
      totalSales: 0,
    };
    cur.totalQuantity += r.quantity || 0;
    cur.totalSales += r.totalSales || 0;
    map.set(name, cur);
  });

  const total = Array.from(map.values()).reduce((s, it) => s + it.totalSales, 0);
  return Array.from(map.values())
    .map((it) => ({
      ...it,
      avgUnitPrice: it.totalQuantity > 0 ? it.totalSales / it.totalQuantity : 0,
      percentageOfTotal: total > 0 ? (it.totalSales / total) * 100 : 0,
    }))
    .sort((a, b) => b.totalSales - a.totalSales);
}

export function generateCustomerSummaryCSVString(
  data: SalesRecord[],
  options: CustomExcelOptions
): string {
  const BOM = '\uFEFF';
  const customers = aggregateCustomerSummaries(data);
  const activeFields = CUSTOMER_SUMMARY_EXCEL_FIELDS.filter((f) =>
    options.selectedFieldIds.includes(f.id)
  );

  const headers = activeFields.map((f) => `"${f.labelAr} (${f.labelEn})"`);
  const rows = customers.map((c) => {
    return activeFields.map((f) => {
      switch (f.id) {
        case 'customerName':
          return `"${c.customerName.replace(/"/g, '""')}"`;
        case 'segment':
          return `"${c.segment.replace(/"/g, '""')}"`;
        case 'totalSales':
          return c.totalSales.toFixed(2);
        case 'percentageOfTotal':
          return `"${c.percentageOfTotal.toFixed(1)}%"`;
        case 'totalQuantity':
          return c.totalQuantity;
        case 'orderCount':
          return c.orderCount;
        case 'avgOrderValue':
          return c.avgOrderValue.toFixed(2);
        case 'currency':
          return `"${options.currency || 'SDG'}"`;
        default:
          return '""';
      }
    });
  });

  let summaryRowContent = '';
  if (options.includeTotalsRow && customers.length > 0) {
    const totalSales = customers.reduce((s, c) => s + c.totalSales, 0);
    const totalQty = customers.reduce((s, c) => s + c.totalQuantity, 0);
    const totalOrders = customers.reduce((s, c) => s + c.orderCount, 0);

    const summaryCells = activeFields.map((field, i) => {
      if (i === 0) return '"الإجمالي الكلي"';
      if (field.id === 'customerName') return `"عدد العملاء: ${customers.length}"`;
      if (field.id === 'segment') return '""';
      if (field.id === 'totalSales') return totalSales.toFixed(2);
      if (field.id === 'percentageOfTotal') return '"100%"';
      if (field.id === 'totalQuantity') return totalQty;
      if (field.id === 'orderCount') return totalOrders;
      if (field.id === 'avgOrderValue') return (totalOrders > 0 ? (totalSales / totalOrders).toFixed(2) : '0');
      if (field.id === 'currency') return `"${options.currency || 'SDG'}"`;
      return '""';
    });
    summaryRowContent = '\r\n' + summaryCells.join(',');
  }

  return (
    BOM +
    [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n') +
    summaryRowContent
  );
}

export function generateItemSummaryCSVString(
  data: SalesRecord[],
  options: CustomExcelOptions
): string {
  const BOM = '\uFEFF';
  const items = aggregateItemSummaries(data);
  const activeFields = ITEM_SUMMARY_EXCEL_FIELDS.filter((f) =>
    options.selectedFieldIds.includes(f.id)
  );

  const headers = activeFields.map((f) => `"${f.labelAr} (${f.labelEn})"`);
  const rows = items.map((it) => {
    return activeFields.map((f) => {
      switch (f.id) {
        case 'itemName':
          return `"${it.itemName.replace(/"/g, '""')}"`;
        case 'category':
          return `"${it.category.replace(/"/g, '""')}"`;
        case 'genericName':
          return `"${it.genericName.replace(/"/g, '""')}"`;
        case 'totalQuantity':
          return it.totalQuantity;
        case 'avgUnitPrice':
          return it.avgUnitPrice.toFixed(2);
        case 'totalSales':
          return it.totalSales.toFixed(2);
        case 'percentageOfTotal':
          return `"${it.percentageOfTotal.toFixed(1)}%"`;
        case 'currency':
          return `"${options.currency || 'SDG'}"`;
        default:
          return '""';
      }
    });
  });

  let summaryRowContent = '';
  if (options.includeTotalsRow && items.length > 0) {
    const totalSales = items.reduce((s, it) => s + it.totalSales, 0);
    const totalQty = items.reduce((s, it) => s + it.totalQuantity, 0);

    const summaryCells = activeFields.map((field, i) => {
      if (i === 0) return '"الإجمالي الكلي"';
      if (field.id === 'itemName') return `"عدد الأصناف: ${items.length}"`;
      if (field.id === 'category') return '""';
      if (field.id === 'genericName') return '""';
      if (field.id === 'totalQuantity') return totalQty;
      if (field.id === 'avgUnitPrice') return (totalQty > 0 ? (totalSales / totalQty).toFixed(2) : '0');
      if (field.id === 'totalSales') return totalSales.toFixed(2);
      if (field.id === 'percentageOfTotal') return '"100%"';
      if (field.id === 'currency') return `"${options.currency || 'SDG'}"`;
      return '""';
    });
    summaryRowContent = '\r\n' + summaryCells.join(',');
  }

  return (
    BOM +
    [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n') +
    summaryRowContent
  );
}

export function generateCustomerSummaryXMLString(
  data: SalesRecord[],
  options: CustomExcelOptions
): string {
  const customers = aggregateCustomerSummaries(data);
  const activeFields = CUSTOMER_SUMMARY_EXCEL_FIELDS.filter((f) =>
    options.selectedFieldIds.includes(f.id)
  );

  const totalSales = customers.reduce((s, c) => s + c.totalSales, 0);
  const totalQty = customers.reduce((s, c) => s + c.totalQuantity, 0);
  const totalOrders = customers.reduce((s, c) => s + c.orderCount, 0);

  const headerCells = activeFields
    .map(
      (f) =>
        `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(
          f.labelAr
        )}</Data></Cell>`
    )
    .join('');

  const rowsXml = customers
    .map((c) => {
      const cells = activeFields
        .map((field) => {
          switch (field.id) {
            case 'customerName':
              return `<Cell ss:StyleID="BoldString"><Data ss:Type="String">${escapeXml(
                c.customerName
              )}</Data></Cell>`;
            case 'segment':
              return `<Cell ss:StyleID="String"><Data ss:Type="String">${escapeXml(
                c.segment
              )}</Data></Cell>`;
            case 'totalSales':
              return `<Cell ss:StyleID="CurrencyBold"><Data ss:Type="Number">${c.totalSales.toFixed(
                2
              )}</Data></Cell>`;
            case 'percentageOfTotal':
              return `<Cell ss:StyleID="String"><Data ss:Type="String">${c.percentageOfTotal.toFixed(
                1
              )}%</Data></Cell>`;
            case 'totalQuantity':
              return `<Cell ss:StyleID="Number"><Data ss:Type="Number">${c.totalQuantity}</Data></Cell>`;
            case 'orderCount':
              return `<Cell ss:StyleID="Number"><Data ss:Type="Number">${c.orderCount}</Data></Cell>`;
            case 'avgOrderValue':
              return `<Cell ss:StyleID="Currency"><Data ss:Type="Number">${c.avgOrderValue.toFixed(
                2
              )}</Data></Cell>`;
            case 'currency':
              return `<Cell ss:StyleID="String"><Data ss:Type="String">${escapeXml(
                options.currency || 'SDG'
              )}</Data></Cell>`;
            default:
              return '<Cell ss:StyleID="String"><Data ss:Type="String"></Data></Cell>';
          }
        })
        .join('');
      return `<Row>${cells}</Row>`;
    })
    .join('');

  let totalRowXml = '';
  if (options.includeTotalsRow && customers.length > 0) {
    const totalCells = activeFields
      .map((field, i) => {
        if (i === 0) {
          return `<Cell ss:StyleID="TotalHeader"><Data ss:Type="String">الإجمالي الكلي</Data></Cell>`;
        }
        if (field.id === 'customerName') {
          return `<Cell ss:StyleID="TotalHeader"><Data ss:Type="String">عدد العملاء: ${customers.length}</Data></Cell>`;
        }
        if (field.id === 'totalSales') {
          return `<Cell ss:StyleID="TotalCurrency"><Data ss:Type="Number">${totalSales.toFixed(
            2
          )}</Data></Cell>`;
        }
        if (field.id === 'percentageOfTotal') {
          return `<Cell ss:StyleID="TotalHeader"><Data ss:Type="String">100%</Data></Cell>`;
        }
        if (field.id === 'totalQuantity') {
          return `<Cell ss:StyleID="TotalNumber"><Data ss:Type="Number">${totalQty}</Data></Cell>`;
        }
        if (field.id === 'orderCount') {
          return `<Cell ss:StyleID="TotalNumber"><Data ss:Type="Number">${totalOrders}</Data></Cell>`;
        }
        if (field.id === 'avgOrderValue') {
          const aov = totalOrders > 0 ? totalSales / totalOrders : 0;
          return `<Cell ss:StyleID="TotalCurrency"><Data ss:Type="Number">${aov.toFixed(
            2
          )}</Data></Cell>`;
        }
        if (field.id === 'currency') {
          return `<Cell ss:StyleID="TotalHeader"><Data ss:Type="String">${escapeXml(
            options.currency || 'SDG'
          )}</Data></Cell>`;
        }
        return `<Cell ss:StyleID="TotalHeader"><Data ss:Type="String"></Data></Cell>`;
      })
      .join('');
    totalRowXml = `<Row ss:StyleID="TotalRow">${totalCells}</Row>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#0f172a"/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#059669"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="11" ss:Bold="1" ss:Color="#ffffff"/>
   <Interior ss:Color="#059669" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="String">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="BoldString">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#0f172a"/>
  </Style>
  <Style ss:ID="Number">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="#,##0"/>
  </Style>
  <Style ss:ID="Currency">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="#,##0.00"/>
  </Style>
  <Style ss:ID="CurrencyBold">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#065f46"/>
   <NumberFormat ss:Format="#,##0.00"/>
  </Style>
  <Style ss:ID="TotalRow">
   <Interior ss:Color="#ecfdf5" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="TotalHeader">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="11" ss:Bold="1" ss:Color="#064e3b"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#059669"/>
   </Borders>
  </Style>
  <Style ss:ID="TotalNumber">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="11" ss:Bold="1" ss:Color="#064e3b"/>
   <NumberFormat ss:Format="#,##0"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#059669"/>
   </Borders>
  </Style>
  <Style ss:ID="TotalCurrency">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="11" ss:Bold="1" ss:Color="#064e3b"/>
   <NumberFormat ss:Format="#,##0.00"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#059669"/>
   </Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="ملخص المبيعات حسب العملاء">
  <Table ss:DefaultRowHeight="20">
   <Row ss:Height="26">${headerCells}</Row>
   ${rowsXml}
   ${totalRowXml}
  </Table>
 </Worksheet>
</Workbook>`;
}

export function generateItemSummaryXMLString(
  data: SalesRecord[],
  options: CustomExcelOptions
): string {
  const items = aggregateItemSummaries(data);
  const activeFields = ITEM_SUMMARY_EXCEL_FIELDS.filter((f) =>
    options.selectedFieldIds.includes(f.id)
  );

  const totalSales = items.reduce((s, it) => s + it.totalSales, 0);
  const totalQty = items.reduce((s, it) => s + it.totalQuantity, 0);

  const headerCells = activeFields
    .map(
      (f) =>
        `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(
          f.labelAr
        )}</Data></Cell>`
    )
    .join('');

  const rowsXml = items
    .map((it) => {
      const cells = activeFields
        .map((field) => {
          switch (field.id) {
            case 'itemName':
              return `<Cell ss:StyleID="BoldString"><Data ss:Type="String">${escapeXml(
                it.itemName
              )}</Data></Cell>`;
            case 'category':
              return `<Cell ss:StyleID="String"><Data ss:Type="String">${escapeXml(
                it.category
              )}</Data></Cell>`;
            case 'genericName':
              return `<Cell ss:StyleID="String"><Data ss:Type="String">${escapeXml(
                it.genericName
              )}</Data></Cell>`;
            case 'totalQuantity':
              return `<Cell ss:StyleID="Number"><Data ss:Type="Number">${it.totalQuantity}</Data></Cell>`;
            case 'avgUnitPrice':
              return `<Cell ss:StyleID="Currency"><Data ss:Type="Number">${it.avgUnitPrice.toFixed(
                2
              )}</Data></Cell>`;
            case 'totalSales':
              return `<Cell ss:StyleID="CurrencyBold"><Data ss:Type="Number">${it.totalSales.toFixed(
                2
              )}</Data></Cell>`;
            case 'percentageOfTotal':
              return `<Cell ss:StyleID="String"><Data ss:Type="String">${it.percentageOfTotal.toFixed(
                1
              )}%</Data></Cell>`;
            case 'currency':
              return `<Cell ss:StyleID="String"><Data ss:Type="String">${escapeXml(
                options.currency || 'SDG'
              )}</Data></Cell>`;
            default:
              return '<Cell ss:StyleID="String"><Data ss:Type="String"></Data></Cell>';
          }
        })
        .join('');
      return `<Row>${cells}</Row>`;
    })
    .join('');

  let totalRowXml = '';
  if (options.includeTotalsRow && items.length > 0) {
    const totalCells = activeFields
      .map((field, i) => {
        if (i === 0) {
          return `<Cell ss:StyleID="TotalHeader"><Data ss:Type="String">الإجمالي الكلي</Data></Cell>`;
        }
        if (field.id === 'itemName') {
          return `<Cell ss:StyleID="TotalHeader"><Data ss:Type="String">عدد الأصناف: ${items.length}</Data></Cell>`;
        }
        if (field.id === 'totalQuantity') {
          return `<Cell ss:StyleID="TotalNumber"><Data ss:Type="Number">${totalQty}</Data></Cell>`;
        }
        if (field.id === 'avgUnitPrice') {
          const avg = totalQty > 0 ? totalSales / totalQty : 0;
          return `<Cell ss:StyleID="TotalCurrency"><Data ss:Type="Number">${avg.toFixed(
            2
          )}</Data></Cell>`;
        }
        if (field.id === 'totalSales') {
          return `<Cell ss:StyleID="TotalCurrency"><Data ss:Type="Number">${totalSales.toFixed(
            2
          )}</Data></Cell>`;
        }
        if (field.id === 'percentageOfTotal') {
          return `<Cell ss:StyleID="TotalHeader"><Data ss:Type="String">100%</Data></Cell>`;
        }
        if (field.id === 'currency') {
          return `<Cell ss:StyleID="TotalHeader"><Data ss:Type="String">${escapeXml(
            options.currency || 'SDG'
          )}</Data></Cell>`;
        }
        return `<Cell ss:StyleID="TotalHeader"><Data ss:Type="String"></Data></Cell>`;
      })
      .join('');
    totalRowXml = `<Row ss:StyleID="TotalRow">${totalCells}</Row>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#0f172a"/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#2563eb"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="11" ss:Bold="1" ss:Color="#ffffff"/>
   <Interior ss:Color="#2563eb" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="String">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="BoldString">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#0f172a"/>
  </Style>
  <Style ss:ID="Number">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="#,##0"/>
  </Style>
  <Style ss:ID="Currency">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="#,##0.00"/>
  </Style>
  <Style ss:ID="CurrencyBold">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#1e3a8a"/>
   <NumberFormat ss:Format="#,##0.00"/>
  </Style>
  <Style ss:ID="TotalRow">
   <Interior ss:Color="#eff6ff" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="TotalHeader">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="11" ss:Bold="1" ss:Color="#1e3a8a"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#2563eb"/>
   </Borders>
  </Style>
  <Style ss:ID="TotalNumber">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="11" ss:Bold="1" ss:Color="#1e3a8a"/>
   <NumberFormat ss:Format="#,##0"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#2563eb"/>
   </Borders>
  </Style>
  <Style ss:ID="TotalCurrency">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="11" ss:Bold="1" ss:Color="#1e3a8a"/>
   <NumberFormat ss:Format="#,##0.00"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#2563eb"/>
   </Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="تحليل المبيعات حسب الأصناف">
  <Table ss:DefaultRowHeight="20">
   <Row ss:Height="26">${headerCells}</Row>
   ${rowsXml}
   ${totalRowXml}
  </Table>
 </Worksheet>
</Workbook>`;
}

function escapeXml(unsafe: string): string {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateAllReportsCombinedCSVString(
  data: SalesRecord[],
  options: CustomExcelOptions
): string {
  const BOM = '\uFEFF';
  const currency = options.currency || 'SDG';
  const customers = aggregateCustomerSummaries(data);
  const items = aggregateItemSummaries(data);
  const totalSales = data.reduce((s, it) => s + (it.totalSales || 0), 0);
  const totalQty = data.reduce((s, it) => s + (it.quantity || 0), 0);

  const sections: string[] = [];

  // Section 1: Executive KPI Dashboard Summary
  sections.push('========================================================================');
  sections.push('حزمة التقارير الشاملة: لوحة المؤشرات التنفيذية (Executive KPI Summary)');
  sections.push('========================================================================');
  sections.push('المؤشر المالي والإداري,القيمة المحققة,البيان');
  sections.push(`إجمالي قيمة المبيعات,${totalSales.toFixed(2)},${currency}`);
  sections.push(`إجمالي عدد العبوات المباعة,${totalQty},عبوة / كرتونة`);
  sections.push(`إجمالي عدد الفواتير والطلبيات,${data.length},عملية بيع`);
  sections.push(`متوسط قيمة الفاتورة (AOV),${(data.length > 0 ? totalSales / data.length : 0).toFixed(2)},${currency}`);
  sections.push(`عدد الصيدليات والعملاء المتعاملين,${customers.length},عميل`);
  sections.push(`عدد الأصناف والمستحضرات المباعة,${items.length},صنف دوائي`);
  sections.push(`تاريخ استخراج التقرير,"${new Date().toLocaleString('ar-SA')}",النظام الرسمي`);
  sections.push('\n');

  // Section 2: Customers Summary Table
  sections.push('========================================================================');
  sections.push('الجدول 1: ملخص وتحليل مبيعات العملاء والصيدليات (Sales by Customer)');
  sections.push('========================================================================');
  const custCsv = generateCustomerSummaryCSVString(data, {
    ...options,
    selectedFieldIds: CUSTOMER_SUMMARY_EXCEL_FIELDS.map((f) => f.id),
  });
  sections.push(custCsv.replace(/^\uFEFF/, ''));
  sections.push('\n');

  // Section 3: Items Summary Table
  sections.push('========================================================================');
  sections.push('الجدول 2: تحليل مبيعات وكميات الأصناف والأدوية (Sales by Item)');
  sections.push('========================================================================');
  const itemCsv = generateItemSummaryCSVString(data, {
    ...options,
    selectedFieldIds: ITEM_SUMMARY_EXCEL_FIELDS.map((f) => f.id),
  });
  sections.push(itemCsv.replace(/^\uFEFF/, ''));
  sections.push('\n');

  // Section 4: Detailed Sales Records
  sections.push('========================================================================');
  sections.push('الجدول 3: سجلات وفواتير المبيعات التفصيلية (Detailed Sales Records)');
  sections.push('========================================================================');
  const detailedCsv = generateCustomCSVString(data, {
    ...options,
    selectedFieldIds: AVAILABLE_EXCEL_FIELDS.map((f) => f.id),
  });
  sections.push(detailedCsv.replace(/^\uFEFF/, ''));

  return BOM + sections.join('\r\n');
}

export async function generateMultiSheetXlsxBlob(
  data: SalesRecord[],
  options: CustomExcelOptions
): Promise<Blob> {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  const currency = options.currency || 'SDG';
  const mode = options.reportMode || 'allReports';

  // Helper to add Detailed sheet
  const addDetailedSheet = () => {
    const activeFields = AVAILABLE_EXCEL_FIELDS.filter(
      (f) => mode === 'allReports' || (options.selectedFieldIds || []).includes(f.id)
    );
    const headers = activeFields.map((f) => f.labelAr);
    const rows = data.map((item, idx) =>
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
          case 'salesRep': return item.salesRep || DEFAULT_SALES_REP;
          case 'notes': return item.notes || '';
          default: return '';
        }
      })
    );

    if (options.includeTotalsRow && data.length > 0) {
      const totQty = data.reduce((s, it) => s + (it.quantity || 0), 0);
      const totSales = data.reduce((s, it) => s + (it.totalSales || 0), 0);
      const totalCells = activeFields.map((f, i) => {
        if (i === 0) return 'الإجمالي الكلي';
        if (f.id === 'customerName') return `عدد الفواتير: ${data.length}`;
        if (f.id === 'quantity') return totQty;
        if (f.id === 'totalSales') return totSales;
        if (f.id === 'currency') return currency;
        return '';
      });
      rows.push(totalCells);
    }
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, 'المبيعات_التفصيلية');
  };

  // Helper to add Customers sheet
  const addCustomersSheet = () => {
    const customers = aggregateCustomerSummaries(data);
    const activeFields = CUSTOMER_SUMMARY_EXCEL_FIELDS.filter(
      (f) => mode === 'allReports' || (options.selectedFieldIds || []).includes(f.id)
    );
    const headers = activeFields.map((f) => f.labelAr);
    const rows = customers.map((c) =>
      activeFields.map((f) => {
        switch (f.id) {
          case 'customerName': return c.customerName;
          case 'segment': return c.segment;
          case 'totalSales': return Number(c.totalSales.toFixed(2));
          case 'percentageOfTotal': return `${c.percentageOfTotal.toFixed(1)}%`;
          case 'totalQuantity': return c.totalQuantity;
          case 'orderCount': return c.orderCount;
          case 'avgOrderValue': return Number(c.avgOrderValue.toFixed(2));
          case 'currency': return currency;
          default: return '';
        }
      })
    );

    if (options.includeTotalsRow && customers.length > 0) {
      const totSales = customers.reduce((s, c) => s + c.totalSales, 0);
      const totQty = customers.reduce((s, c) => s + c.totalQuantity, 0);
      const totOrders = customers.reduce((s, c) => s + c.orderCount, 0);
      const totalCells = activeFields.map((f, i) => {
        if (i === 0) return 'الإجمالي الكلي';
        if (f.id === 'customerName') return `عدد العملاء: ${customers.length}`;
        if (f.id === 'totalSales') return Number(totSales.toFixed(2));
        if (f.id === 'percentageOfTotal') return '100%';
        if (f.id === 'totalQuantity') return totQty;
        if (f.id === 'orderCount') return totOrders;
        if (f.id === 'avgOrderValue') return Number((totOrders > 0 ? totSales / totOrders : 0).toFixed(2));
        if (f.id === 'currency') return currency;
        return '';
      });
      rows.push(totalCells);
    }
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, 'ملخص_العملاء');
  };

  // Helper to add Items sheet
  const addItemsSheet = () => {
    const items = aggregateItemSummaries(data);
    const activeFields = ITEM_SUMMARY_EXCEL_FIELDS.filter(
      (f) => mode === 'allReports' || (options.selectedFieldIds || []).includes(f.id)
    );
    const headers = activeFields.map((f) => f.labelAr);
    const rows = items.map((it) =>
      activeFields.map((f) => {
        switch (f.id) {
          case 'itemName': return it.itemName;
          case 'category': return it.category;
          case 'genericName': return it.genericName;
          case 'totalQuantity': return it.totalQuantity;
          case 'avgUnitPrice': return Number(it.avgUnitPrice.toFixed(2));
          case 'totalSales': return Number(it.totalSales.toFixed(2));
          case 'percentageOfTotal': return `${it.percentageOfTotal.toFixed(1)}%`;
          case 'currency': return currency;
          default: return '';
        }
      })
    );

    if (options.includeTotalsRow && items.length > 0) {
      const totSales = items.reduce((s, it) => s + it.totalSales, 0);
      const totQty = items.reduce((s, it) => s + it.totalQuantity, 0);
      const totalCells = activeFields.map((f, i) => {
        if (i === 0) return 'الإجمالي الكلي';
        if (f.id === 'itemName') return `عدد الأصناف: ${items.length}`;
        if (f.id === 'totalQuantity') return totQty;
        if (f.id === 'avgUnitPrice') return Number((totQty > 0 ? totSales / totQty : 0).toFixed(2));
        if (f.id === 'totalSales') return Number(totSales.toFixed(2));
        if (f.id === 'percentageOfTotal') return '100%';
        if (f.id === 'currency') return currency;
        return '';
      });
      rows.push(totalCells);
    }
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, 'تحليل_الأصناف');
  };

  // Helper to add Executive KPIs sheet
  const addKpiSheet = () => {
    const customers = aggregateCustomerSummaries(data);
    const items = aggregateItemSummaries(data);
    const totSales = data.reduce((s, it) => s + (it.totalSales || 0), 0);
    const totQty = data.reduce((s, it) => s + (it.quantity || 0), 0);

    const kpiHeaders = ['المؤشر المالي والإداري', 'القيمة المحققة', 'البيان والتفصيل'];
    const kpiRows = [
      ['إجمالي قيمة المبيعات', Number(totSales.toFixed(2)), currency],
      ['إجمالي العبوات المفوترة', totQty, 'عبوة / كرتونة'],
      ['عدد الفواتير والعمليات', data.length, 'فاتورة بيع'],
      ['متوسط قيمة الفاتورة (AOV)', Number((data.length > 0 ? totSales / data.length : 0).toFixed(2)), currency],
      ['عدد العملاء والصيدليات', customers.length, 'صيدلية وعميل نشط'],
      ['عدد الأصناف والمستحضرات المباعة', items.length, 'مستحضر دوائي'],
      ['تاريخ وتوقيت التقرير', new Date().toLocaleString('ar-SA'), 'النظام المالي المعتمد'],
    ];
    const ws = XLSX.utils.aoa_to_sheet([kpiHeaders, ...kpiRows]);
    XLSX.utils.book_append_sheet(wb, ws, 'لوحة_المؤشرات_العامة');
  };

  if (mode === 'byCustomer') {
    addCustomersSheet();
  } else if (mode === 'byItem') {
    addItemsSheet();
  } else if (mode === 'detailed') {
    addDetailedSheet();
  } else {
    // allReports -> bundle all 4 sheets!
    addKpiSheet();
    addCustomersSheet();
    addItemsSheet();
    addDetailedSheet();
  }

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export async function exportCustomExcelFile(
  data: SalesRecord[],
  options: CustomExcelOptions,
  saveDirect = false
): Promise<{ method: 'folder' | 'picker' | 'download'; filename: string; path?: string }> {
  const format = options.fileFormat || 'xlsx';
  const mode = options.reportMode || 'detailed';
  const isXlsx = format === 'xlsx';
  const isXml = format === 'xml-excel';
  const defaultExt = isXlsx ? '.xlsx' : isXml ? '.xls' : '.csv';

  const modePrefix =
    mode === 'allReports'
      ? 'حزمة_كافة_التقارير_الشاملة'
      : mode === 'byCustomer'
      ? 'ملخص_مبيعات_العملاء'
      : mode === 'byItem'
      ? 'تحليل_مبيعات_الأصناف'
      : 'تقرير_المبيعات_المفصل';

  const defaultFilename = options.filename
    ? options.filename.endsWith(defaultExt)
      ? options.filename
      : `${options.filename}${defaultExt}`
    : `${modePrefix}_${new Date().toISOString().split('T')[0]}${defaultExt}`;

  let blob: Blob;

  if (isXlsx) {
    // Modern multi-sheet or single-sheet .xlsx
    blob = await generateMultiSheetXlsxBlob(data, options);
  } else if (isXml) {
    let content = '';
    if (mode === 'byCustomer') {
      content = generateCustomerSummaryXMLString(data, options);
    } else if (mode === 'byItem') {
      content = generateItemSummaryXMLString(data, options);
    } else {
      content = generateExcelXMLString(data, options);
    }
    blob = new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  } else {
    // CSV with UTF-8 BOM
    let content = '';
    if (mode === 'allReports') {
      content = generateAllReportsCombinedCSVString(data, options);
    } else if (mode === 'byCustomer') {
      content = generateCustomerSummaryCSVString(data, options);
    } else if (mode === 'byItem') {
      content = generateItemSummaryCSVString(data, options);
    } else {
      content = generateCustomCSVString(data, options);
    }
    blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  }

  const mimeType = isXlsx
    ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    : isXml
    ? 'application/vnd.ms-excel;charset=utf-8;'
    : 'text/csv;charset=utf-8;';

  const { isNativeCapacitorPlatform, saveFileToPhoneStorage } = await import(
    '../services/phoneStorageService'
  );

  if (saveDirect || isNativeCapacitorPlatform()) {
    try {
      const res = await saveFileToPhoneStorage(
        defaultFilename,
        blob,
        mimeType,
        isXlsx ? 'xlsx' : isXml ? 'xls' : 'csv'
      );
      return {
        method: res.method,
        filename: defaultFilename,
        path: res.path,
      };
    } catch {
      // Fallback below
    }
  }

  // Standard Download fallback for web
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = defaultFilename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 400);

  return { method: 'download', filename: defaultFilename };
}

export function exportDetailedExcelReport(
  data: SalesRecord[],
  filename = 'تقرير_المبيعات_والأصناف_المفصل.csv'
) {
  const activeFields = AVAILABLE_EXCEL_FIELDS.map((f) => f.id);
  const csvContent = generateCustomCSVString(data, {
    selectedFieldIds: activeFields,
    includeTotalsRow: true,
    fileFormat: 'csv',
    filename,
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  import('../services/phoneStorageService').then(({ isNativeCapacitorPlatform, saveFileNativeCapacitor }) => {
    if (isNativeCapacitorPlatform()) {
      saveFileNativeCapacitor(filename, blob, 'text/csv;charset=utf-8;').catch((err) => {
        console.error('Native detailed export failed:', err);
      });
      return;
    }

    try {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn('Web download failed', e);
    }
  });
}

export function copyForGoogleSheets(data: SalesRecord[]): Promise<boolean> {
  const headers = ['التاريخ', 'المندوب', 'اسم العميل', 'الصنف / المنتج', 'الاسم العلمي', 'الفئة', 'الكمية المباعة', 'سعر الوحدة', 'إجمالي المبيعات', 'رقم الفاتورة'];
  const rows = data.map((item) => [
    item.date,
    item.salesRep || DEFAULT_SALES_REP,
    item.customerName,
    item.itemName,
    item.genericName || '',
    item.category,
    item.quantity,
    item.unitPrice,
    item.totalSales,
    item.orderId,
  ]);

  const tsv = [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n');
  return navigator.clipboard.writeText(tsv).then(() => true).catch(() => false);
}

// ==========================================
// Robust CSV & TSV Parser for Sales Invoices
// ==========================================

export function parseCSV(text: string): SalesRecord[] {
  if (!text || !text.trim()) return [];

  // Remove UTF-8 / UTF-16 BOM if present
  const cleaned = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
  const rawLines = cleaned.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (rawLines.length === 0) return [];

  // 1. Detect delimiter by sampling the first non-empty lines (checks ;, \t, ,)
  const delimiter = detectCSVDelimiter(rawLines.slice(0, 15));

  // 2. Scan lines to find the true header row that contains sales/invoice columns
  let headerIndex = -1;
  let headers: string[] = [];
  let colIndexes: ReturnType<typeof detectCSVColumns> = detectCSVColumns([]);

  for (let i = 0; i < Math.min(rawLines.length, 40); i++) {
    const line = rawLines[i];
    // Skip banner lines or dividers
    if (line.startsWith('===') || line.startsWith('---') || line.startsWith('###')) continue;

    const cols = splitCSVLine(line, delimiter).map(cleanCSVHeader);
    const detected = detectCSVColumns(cols);

    // Count how many recognizable sales columns exist in this line
    const matchCount = [
      detected.colItem !== -1,
      detected.colCustomer !== -1,
      detected.colQuantity !== -1,
      detected.colPrice !== -1 || detected.colTotal !== -1,
      detected.colDate !== -1,
      detected.colOrderId !== -1,
    ].filter(Boolean).length;

    // A valid sales header must match at least 2 distinct sales columns (e.g. Item and Qty/Price)
    if (matchCount >= 2) {
      headerIndex = i;
      headers = cols;
      colIndexes = detected;
      break;
    }
  }

  // Fallback: if no multi-match header found, try line 0
  if (headerIndex === -1 && rawLines.length > 0) {
    headerIndex = 0;
    headers = splitCSVLine(rawLines[0], delimiter).map(cleanCSVHeader);
    colIndexes = detectCSVColumns(headers);
  }

  const records: SalesRecord[] = [];
  const startIndex = headerIndex + 1;

  for (let i = startIndex; i < rawLines.length; i++) {
    const line = rawLines[i];
    if (line.startsWith('===') || line.startsWith('---') || line.startsWith('###')) continue;

    const rawCols = splitCSVLine(line, delimiter);
    if (rawCols.length < 2) continue;

    // Skip section headers in multi-table combined reports
    if (rawCols.some((c) => c.includes('الجدول') || c.includes('لوحة المؤشرات') || c.includes('Executive KPI'))) {
      continue;
    }

    const {
      colDate,
      colRep,
      colCustomer,
      colSegment,
      colItem,
      colGeneric,
      colCategory,
      colQuantity,
      colPrice,
      colTotal,
      colOrderId,
      colPayment,
      colNotes,
    } = colIndexes;

    const rawItem = colItem !== -1 ? rawCols[colItem]?.trim() : '';
    const rawCustomer = colCustomer !== -1 ? rawCols[colCustomer]?.trim() : '';

    // If both item and customer are empty, skip row
    if (!rawItem && !rawCustomer) continue;

    // Check if this row is an accidental duplicate header row
    if (rawItem === 'item' || rawItem === 'الصنف' || rawItem === 'اسم الصنف' || rawItem === 'product') {
      continue;
    }

    const item = rawItem || 'صنف دوائي';
    const generic = colGeneric !== -1 ? rawCols[colGeneric]?.trim() || '' : '';
    const category = colCategory !== -1 ? rawCols[colCategory]?.trim() || 'عام' : 'عام';
    const customer = rawCustomer || 'صيدلية عامة';
    const segment = colSegment !== -1 && rawCols[colSegment]?.trim() ? (rawCols[colSegment].trim() as any) : undefined;
    const rep = colRep !== -1 && rawCols[colRep]?.trim() ? rawCols[colRep].trim() : DEFAULT_SALES_REP;
    const date = colDate !== -1 && rawCols[colDate]?.trim() ? normalizeCSVDate(rawCols[colDate].trim()) : new Date().toISOString().split('T')[0];

    const qty = colQuantity !== -1 ? parseCSVNumeric(rawCols[colQuantity], 1) : 1;
    const price = colPrice !== -1 ? parseCSVNumeric(rawCols[colPrice], 0) : 0;

    let total = colTotal !== -1 ? parseCSVNumeric(rawCols[colTotal], 0) : 0;
    if (total <= 0) {
      total = qty * price;
    }

    const orderId = colOrderId !== -1 && rawCols[colOrderId]?.trim()
      ? rawCols[colOrderId].trim()
      : `INV-${1000 + i}`;

    const paymentType = colPayment !== -1 ? rawCols[colPayment]?.trim() : undefined;
    const notes = colNotes !== -1 ? rawCols[colNotes]?.trim() : undefined;

    records.push({
      id: `imported-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      orderId,
      date,
      salesRep: rep,
      customerName: customer,
      customerSegment: segment,
      category,
      itemName: item,
      genericName: generic,
      quantity: Math.max(1, qty),
      unitPrice: Math.max(0, price),
      totalSales: total > 0 ? total : qty * price,
      paymentType,
      notes,
    });
  }

  return records;
}

function cleanCSVHeader(h: string): string {
  return h.replace(/["']/g, '').trim().toLowerCase();
}

function detectCSVDelimiter(sampleLines: string[]): string {
  let commaCount = 0;
  let semiCount = 0;
  let tabCount = 0;

  for (const line of sampleLines) {
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') inQuotes = !inQuotes;
      else if (!inQuotes) {
        if (c === ',') commaCount++;
        else if (c === ';') semiCount++;
        else if (c === '\t') tabCount++;
      }
    }
  }

  // Semicolon is heavily used by Excel in Arabic and European Windows locales
  if (semiCount > commaCount && semiCount > tabCount) return ';';
  if (tabCount > commaCount && tabCount > semiCount) return '\t';
  return ',';
}

function detectCSVColumns(headers: string[]) {
  return {
    colOrderId: findColIndex(headers, [
      'order id', 'order_id', 'orderid', 'order', 'invoice id', 'invoice_id', 'invoice no', 'invoice_no',
      'invoice', 'inv', 'رقم الفاتورة', 'رقم الطلب', 'رقم الطلبية', 'رقم الفاتورة / الطلبية', 'الفاتورة', 'كود الفاتورة', 'معرف الفاتورة'
    ]),
    colDate: findColIndex(headers, [
      'date', 'invoice date', 'order date', 'sale date', 'تاريخ', 'التاريخ', 'تاريخ الفاتورة', 'تاريخ الطلب', 'تاريخ العملية', 'تاريخ البيع'
    ]),
    colRep: findColIndex(headers, [
      'sales rep', 'sales_rep', 'salesrep', 'rep', 'medical rep', 'مندوب', 'المندوب', 'اسم المندوب', 'مندوب المبيعات', 'المندوب الطبي', 'مسؤول المبيعات'
    ]),
    colCustomer: findColIndex(headers, [
      'customer name', 'customer_name', 'customer', 'pharmacy', 'client', 'hospital',
      'اسم العميل', 'العميل', 'اسم الصيدلية', 'الصيدلية', 'العميل / الصيدلية', 'اسم العميل / الصيدلية', 'المستشفى', 'الزبون', 'اسم الزبون', 'الجهة'
    ]),
    colSegment: findColIndex(headers, [
      'customer segment', 'segment', 'تصنيف العميل', 'شريحة العميل', 'الشريحة', 'تصنيف وشريحة', 'تصنيف العميل / الشريحة'
    ]),
    colItem: findColIndex(headers, [
      'item name', 'item_name', 'product name', 'product_name', 'item', 'product', 'drug', 'medicine', 'description',
      'اسم الصنف', 'الصنف', 'اسم المنتج', 'المنتج', 'اسم الدواء', 'الدواء', 'اسم المستحضر', 'المستحضر', 'الصنف الدوائي', 'اسم الصنف الدوائي', 'البيان'
    ]),
    colGeneric: findColIndex(headers, [
      'generic name', 'generic_name', 'generic', 'formulation', 'الاسم العلمي', 'الاسم العلمي والتركيبة', 'التركيبة', 'المادة الفعالة'
    ]),
    colCategory: findColIndex(headers, [
      'category', 'therapeutic category', 'التصنيف', 'الفئة', 'القسم', 'التصنيف العلاجي', 'المجموعة العلاجية'
    ]),
    colQuantity: findColIndex(headers, [
      'quantity', 'qty', 'units', 'count', 'الكمية المباعة', 'الكمية', 'العدد', 'عدد العبوات', 'العبوات', 'الكمية المباعة (عبوة)', 'الكميات'
    ]),
    colPrice: findColIndex(headers, [
      'unit price', 'unit_price', 'unitprice', 'w.price', 'w_price', 'price',
      'سعر الوحدة', 'السعر', 'سعر العبوة', 'سعر البيع', 'سعر الصنف', 'سعر الجملة'
    ]),
    colTotal: findColIndex(headers, [
      'total sales', 'total_sales', 'totalsales', 'total amount', 'total', 'amount',
      'إجمالي المبيعات', 'الاجمالي', 'الإجمالي', 'المبلغ', 'القيمة', 'إجمالي القيمة', 'إجمالي القيمة (sum sales)', 'صافي الفاتورة', 'المجموع'
    ]),
    colPayment: findColIndex(headers, [
      'payment type', 'payment_type', 'payment', 'طريقة السداد', 'شروط السداد', 'السداد', 'الدفع'
    ]),
    colNotes: findColIndex(headers, [
      'notes', 'note', 'الملاحظات', 'ملاحظات', 'الملاحظات وحالة الفاتورة'
    ]),
  };
}

function findColIndex(headers: string[], aliases: string[]): number {
  // 1. Exact match check
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].replace(/["']/g, '').trim().toLowerCase();
    for (const alias of aliases) {
      if (h === alias) return i;
    }
  }
  // 2. Substring match check
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].replace(/["']/g, '').trim().toLowerCase();
    for (const alias of aliases) {
      if (h.includes(alias) || alias.includes(h)) return i;
    }
  }
  return -1;
}

export function parseCSVNumeric(val: any, fallback: number = 0): number {
  if (val === undefined || val === null) return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : val;

  let str = String(val).trim();
  if (!str) return fallback;

  // Convert Eastern Arabic numerals (٠-٩) to Latin (0-9)
  const easternDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  for (let i = 0; i < 10; i++) {
    str = str.split(easternDigits[i]).join(String(i));
  }

  // Remove currency signs, letters, and spaces
  str = str.replace(/[^\d.,\-+]/g, '');

  // Handle thousand separators: "15,000.00" vs "15.000,00"
  if (str.includes(',') && str.includes('.')) {
    if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
      // European 15.000,00 -> 15000.00
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // US 15,000.00 -> 15000.00
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    const parts = str.split(',');
    if (parts.length === 2 && parts[1].length !== 3) {
      // Decimal comma: e.g. "15,5"
      str = str.replace(',', '.');
    } else {
      // Thousand comma: e.g. "15,000"
      str = str.replace(/,/g, '');
    }
  }

  const num = parseFloat(str);
  return isNaN(num) ? fallback : num;
}

function normalizeCSVDate(raw: string): string {
  if (!raw) return new Date().toISOString().split('T')[0];
  const s = raw.trim().replace(/\//g, '-');
  const parts = s.split('-');
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      const mm = parts[1].padStart(2, '0');
      const dd = parts[2].padStart(2, '0');
      return `${parts[0]}-${mm}-${dd}`;
    } else if (parts[2].length === 4) {
      // DD-MM-YYYY
      const dd = parts[0].padStart(2, '0');
      const mm = parts[1].padStart(2, '0');
      return `${parts[2]}-${mm}-${dd}`;
    }
  }
  return s;
}

export function splitCSVLine(line: string, delimiter: string = ','): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

