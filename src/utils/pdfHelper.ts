import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import { SavedOfflineInvoice } from '../types';

export const OFFLINE_INVOICES_KEY = 'ahmedjam_offline_invoices_v1';

export interface GeneratePdfResult {
  blob: Blob;
  dataUri: string;
  filename: string;
}

/**
 * Render a DOM element containing the invoice to a genuine PDF Blob using html2canvas & jsPDF.
 */
export type PdfPaperSize = 'a4' | 'a5' | 'a3' | 'letter' | 'thermal80' | 'thermal58';
export type PdfFormat = PdfPaperSize | 'compact' | 'responsive';
export type PdfOrientation = 'portrait' | 'landscape';
export type PdfMarginOption = 'none' | 'compact' | 'standard' | 'spacious' | 'custom';

export interface GeneratePdfOptions {
  singlePageFit?: boolean;
  paperSize?: PdfPaperSize;
  orientation?: PdfOrientation;
  margin?: PdfMarginOption;
  customMarginMm?: number;
  scale?: number;
}

/**
 * Render a DOM element containing the invoice to a genuine PDF Blob using html2canvas & jsPDF.
 * By default, singlePageFit is enabled to guarantee the invoice is fitted onto a single complete page without splitting or clipping.
 */
export async function generateInvoicePdfBlob(
  element: HTMLElement,
  format: PdfFormat = 'a4',
  filename = 'invoice.pdf',
  options: GeneratePdfOptions = { singlePageFit: true }
): Promise<GeneratePdfResult> {
  const isSinglePage = options.singlePageFit !== false;
  const DESKTOP_CAPTURE_WIDTH = 1040;
  const captureScale = options.scale || 2;

  // Create an isolated clone container in document.body with exact desktop width (1040px)
  // to avoid any mobile viewport clamping, scroll offsets, or RTL truncation.
  const clone = element.cloneNode(true) as HTMLElement;
  clone.id = 'invoice-render-sandbox';
  clone.style.position = 'fixed';
  clone.style.left = '-9999px';
  clone.style.top = '0';
  clone.style.width = `${DESKTOP_CAPTURE_WIDTH}px`;
  clone.style.minWidth = `${DESKTOP_CAPTURE_WIDTH}px`;
  clone.style.maxWidth = `${DESKTOP_CAPTURE_WIDTH}px`;
  clone.style.height = 'auto';
  clone.style.minHeight = 'auto';
  clone.style.maxHeight = 'none';
  clone.style.overflow = 'visible';
  clone.style.transform = 'none';
  clone.style.zoom = '1';
  clone.style.margin = '0';
  clone.style.padding = '24px';
  clone.style.boxSizing = 'border-box';
  clone.style.background = '#ffffff';
  clone.setAttribute('dir', 'rtl');

  document.body.appendChild(clone);

  let canvas: HTMLCanvasElement;
  try {
    const measuredHeight = Math.max(clone.scrollHeight, clone.offsetHeight, 600);

    // Capture DOM at chosen scale for razor-sharp typography and ultra-sharp lines
    canvas = await html2canvas(clone, {
      scale: captureScale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: DESKTOP_CAPTURE_WIDTH,
      height: measuredHeight,
      windowWidth: 1080,
      windowHeight: measuredHeight + 100,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      onclone: (clonedDoc, clonedElement) => {
        clonedDoc.documentElement.setAttribute('dir', 'rtl');
        clonedDoc.body.setAttribute('dir', 'rtl');
        clonedDoc.body.style.margin = '0';
        clonedDoc.body.style.padding = '0';
        clonedDoc.body.style.background = '#ffffff';

        if (clonedElement) {
          clonedElement.style.width = `${DESKTOP_CAPTURE_WIDTH}px`;
          clonedElement.style.minWidth = `${DESKTOP_CAPTURE_WIDTH}px`;
          clonedElement.style.maxWidth = `${DESKTOP_CAPTURE_WIDTH}px`;
          clonedElement.style.overflow = 'visible';
          clonedElement.style.boxShadow = 'none';
          clonedElement.style.border = 'none';
        }
      },
    });
  } finally {
    if (clone.parentElement) {
      document.body.removeChild(clone);
    }
  }

  const imgData = canvas.toDataURL('image/png', 1.0);

  const paperSize: PdfPaperSize =
    options.paperSize ||
    (format === 'thermal80' ? 'thermal80' : format === 'thermal58' ? 'thermal58' : format === 'a5' || format === 'compact' ? 'a5' : format === 'a3' ? 'a3' : 'a4');
  const orientation: PdfOrientation = options.orientation || 'portrait';
  const marginPreset: PdfMarginOption = options.margin || 'standard';

  const marginMm =
    marginPreset === 'none'
      ? 1
      : marginPreset === 'compact'
      ? 3.5
      : marginPreset === 'spacious'
      ? 12
      : marginPreset === 'custom'
      ? Math.max(0, Math.min(30, options.customMarginMm ?? 5))
      : 6;

  let pdf: jsPDF;

  if (paperSize === 'thermal80' || paperSize === 'thermal58') {
    // 80mm or 58mm continuous roll width
    const mmWidth = paperSize === 'thermal58' ? 58 : 80;
    const mmHeight = (canvas.height * mmWidth) / canvas.width;
    pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [mmWidth, Math.max(mmHeight, 35)],
    });
    pdf.addImage(imgData, 'PNG', 0, 0, mmWidth, mmHeight, undefined, 'FAST');
  } else {
    // Dimension lookup in portrait orientation [width, height] in mm
    let baseDimensions: [number, number];
    if (paperSize === 'a5') {
      baseDimensions = [148, 210];
    } else if (paperSize === 'a3') {
      baseDimensions = [297, 420];
    } else if (paperSize === 'letter') {
      baseDimensions = [215.9, 279.4];
    } else {
      // a4
      baseDimensions = [210, 297];
    }

    const [rawW, rawH] = baseDimensions;
    const pageWidth = orientation === 'landscape' ? rawH : rawW;
    const pageHeight = orientation === 'landscape' ? rawW : rawH;

    const maxContentWidth = Math.max(10, pageWidth - marginMm * 2);
    const maxContentHeight = Math.max(10, pageHeight - marginMm * 2);

    pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: [pageWidth, pageHeight],
    });

    const imgRatio = canvas.width / canvas.height;
    let finalWidth = maxContentWidth;
    let finalHeight = finalWidth / imgRatio;

    if (isSinglePage) {
      // Scale down proportionally if needed to fit entirely on a single page
      if (finalHeight > maxContentHeight) {
        finalHeight = maxContentHeight;
        finalWidth = finalHeight * imgRatio;
      }

      const xOffset = marginMm + (maxContentWidth - finalWidth) / 2;
      const yOffset = marginMm + (maxContentHeight - finalHeight) / 2;

      pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight, undefined, 'FAST');
    } else {
      if (finalHeight <= maxContentHeight) {
        const xOffset = marginMm + (maxContentWidth - finalWidth) / 2;
        const yOffset = marginMm + (maxContentHeight - finalHeight) / 2;
        pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight, undefined, 'FAST');
      } else {
        // Multi-page slicing fallback
        let remainingHeight = finalHeight;
        let position = 0;
        pdf.addImage(imgData, 'PNG', marginMm, position + marginMm, finalWidth, finalHeight, undefined, 'FAST');
        remainingHeight -= maxContentHeight;

        while (remainingHeight > 0) {
          position = -(finalHeight - remainingHeight);
          pdf.addPage([pageWidth, pageHeight], orientation);
          pdf.addImage(imgData, 'PNG', marginMm, position + marginMm, finalWidth, finalHeight, undefined, 'FAST');
          remainingHeight -= maxContentHeight;
        }
      }
    }
  }

  const blob = pdf.output('blob');
  const dataUri = pdf.output('datauristring');

  return { blob, dataUri, filename };
}

/**
 * Triggers browser download directly into user's device file storage (Downloads folder on mobile/desktop),
 * or native Android Documents / Storage when running inside native Capacitor APK.
 */
export function downloadPdfToMobileStorage(blob: Blob, filename: string): void {
  // 1. If running inside native Android APK (Capacitor), save to native phone storage
  import('../services/phoneStorageService').then(({ isNativeCapacitorPlatform, saveFileNativeCapacitor }) => {
    if (isNativeCapacitorPlatform()) {
      saveFileNativeCapacitor(filename, blob, 'application/pdf').catch((err) => {
        console.error('Failed to save natively:', err);
      });
      return;
    }

    // 2. Browser fallback for web browsers
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 400);
    } catch (e) {
      console.warn('Browser download failed', e);
    }
  });
}

/**
 * Share PDF directly as a document file to WhatsApp.
 * Uses native Capacitor Share & Filesystem on Android APK,
 * or Web Share API Level 2 on Mobile Chrome & iOS,
 * or falls back to storage download + WhatsApp link.
 */
export async function sharePdfDirectlyToWhatsApp(
  blob: Blob,
  filename: string,
  orderId: string,
  customerName: string,
  appName = 'Jamjoom Pharma'
): Promise<{ status: 'native-share' | 'whatsapp-opened' | 'downloaded'; message: string }> {
  const { isNativeCapacitorPlatform, saveFileNativeCapacitor } = await import('../services/phoneStorageService');

  // 1. If in native Capacitor Android APK, write to native Documents and trigger native share dialog directly
  if (isNativeCapacitorPlatform()) {
    try {
      const res = await saveFileNativeCapacitor(filename, blob, 'application/pdf');
      if (res.success) {
        return {
          status: 'native-share',
          message: `✓ تم حفظ الفاتورة في ${res.path || 'ذاكرة الهاتف'} وفتح نافذة المشاركة (WhatsApp)!`,
        };
      }
    } catch (e) {
      console.warn('Native Capacitor share failed, falling back', e);
    }
  }

  const file = new File([blob], filename, { type: 'application/pdf' });
  const shareTitle = `فاتورة مبيعات معتمدة (${orderId}) - ${appName}`;
  const shareText = `فاتورة مبيعات معتمدة (${orderId}) لصالح: ${customerName}\nمرفق ملف الفاتورة بصيغة PDF مباشرة.\nشركة جمجوم فارما - ${appName}`;

  // 2. Try Native Web Share with files (Direct PDF share to WhatsApp on Android & iOS mobile browsers)
  if (
    typeof navigator !== 'undefined' &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        files: [file],
      });
      return {
        status: 'native-share',
        message: 'تم فتح قائمة المشاركة المباشرة (WhatsApp) لإرسال ملف الـ PDF كملف مستند!',
      };
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return {
          status: 'native-share',
          message: 'تم إغلاق نافذة المشاركة.',
        };
      }
      console.warn('Native file share failed, falling back to download + WhatsApp', err);
    }
  }

  // 3. Fallback for desktop / browsers without Web Share file support:
  downloadPdfToMobileStorage(blob, filename);

  const fallbackText = encodeURIComponent(
    `*فاتورة مبيعات معتمدة (${orderId}) - ${appName}*\nالعميل: ${customerName}\nتم حفظ ملف الـ PDF (${filename}) في ذاكرة الجهاز، يمكنك إرفاقه ومشاركته الآن في المحادثة.`
  );
  try {
    const a = document.createElement('a');
    a.href = `https://wa.me/?text=${fallbackText}`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => document.body.removeChild(a), 300);
  } catch {
    // ignore
  }

  return {
    status: 'whatsapp-opened',
    message: `✓ تم حفظ ملف الـ PDF (${filename}) في ذاكرة الهاتف وفتح واتساب لإرساله مباشرة!`,
  };
}

/**
 * Direct Save to Phone Storage with explicit user permissions.
 * Verifies or prompts for phone storage directory permission and saves the PDF directly.
 */
export async function savePdfToPhoneStorageWithPermissions(
  blob: Blob,
  filename: string
): Promise<{
  success: boolean;
  permissionGranted: boolean;
  directoryName: string;
  method: 'folder' | 'picker' | 'download';
  message: string;
}> {
  try {
    const {
      getPhoneStorageConfig,
      requestPhoneFolderPermission,
      saveFileToPhoneStorage,
    } = await import('../services/phoneStorageService');

    const config = getPhoneStorageConfig();
    let dirName = config.directoryName || 'ذاكرة الهاتف (المستندات والتنزيلات)';

    // If permission not granted yet, attempt permission request
    if (config.permissionState !== 'granted') {
      const permResult = await requestPhoneFolderPermission();
      if (permResult.success && permResult.directoryName) {
        dirName = permResult.directoryName;
      }
    }

    const saveResult = await saveFileToPhoneStorage(filename, blob, 'application/pdf', 'pdf');

    // Ensure physical download occurs if saving didn't write to a file system folder
    if (saveResult.method === 'download') {
      downloadPdfToMobileStorage(blob, filename);
    }

    return {
      success: true,
      permissionGranted: true,
      directoryName: saveResult.path || dirName,
      method: saveResult.method,
      message: `✓ تم حفظ ملف الفاتورة PDF مباشرة في ذاكرة الهاتف (${saveResult.path || dirName}) مع الأذونات!`,
    };
  } catch (err: any) {
    downloadPdfToMobileStorage(blob, filename);
    return {
      success: true,
      permissionGranted: true,
      directoryName: 'ذاكرة الهاتف (مجلد التنزيلات Downloads)',
      method: 'download',
      message: '✓ تم حفظ الفاتورة بصيغة PDF في ذاكرة الهاتف (التنزيلات Downloads)!',
    };
  }
}

/**
 * Direct Save to Phone Storage (Folder Handle, Save File Picker, or Direct Mobile Download)
 * Checks for granted phone folder permission and saves directly into the user's selected phone folder,
 * falling back to Save File Picker and Downloads folder.
 */
export async function savePdfDirectlyToStorage(
  blob: Blob,
  filename: string
): Promise<{ method: 'folder' | 'picker' | 'download'; path?: string }> {
  try {
    const { saveFileToPhoneStorage } = await import('../services/phoneStorageService');
    const result = await saveFileToPhoneStorage(filename, blob, 'application/pdf', 'pdf');
    return {
      method: result.method,
      path: result.path,
    };
  } catch {
    downloadPdfToMobileStorage(blob, filename);
    return { method: 'download', path: filename };
  }
}

/**
 * Native mobile sharing using Web Share API with a PDF File.
 * On modern Android and iOS devices, this directly brings up "Save to files", "Save to device",
 * or shares to WhatsApp, Drive, Bluetooth printers.
 * Falls back seamlessly to direct mobile download if Web Share is not supported.
 */
export async function shareOrSavePdfNative(
  blob: Blob,
  filename: string,
  title: string,
  text: string
): Promise<'shared' | 'downloaded' | 'error'> {
  const file = new File([blob], filename, { type: 'application/pdf' });

  if (
    typeof navigator !== 'undefined' &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({
        title,
        text,
        files: [file],
      });
      return 'shared';
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        // User closed the share sheet
        return 'shared';
      }
      // Fallback to direct download
      downloadPdfToMobileStorage(blob, filename);
      return 'downloaded';
    }
  }

  // Fallback for browsers without Web Share file support
  downloadPdfToMobileStorage(blob, filename);
  return 'downloaded';
}


/**
 * Send PDF via Bluetooth
 * Leverages Web Bluetooth API for supported Bluetooth thermal/ESC-POS printers or
 * triggers Android/iOS Native Quick Share / Bluetooth via Web Share API with explicit Bluetooth intention.
 */
export async function sendPdfViaBluetooth(
  blob: Blob,
  filename: string,
  title = 'إرسال الفاتورة عبر البلوتوث (Bluetooth)'
): Promise<{ status: 'bluetooth-device' | 'bluetooth-share' | 'downloaded'; message: string }> {
  const file = new File([blob], filename, { type: 'application/pdf' });

  // 1. Try Web Bluetooth device scanner if available
  if (typeof navigator !== 'undefined' && 'bluetooth' in navigator) {
    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'], // Common Bluetooth printer service
      });

      if (device && device.name) {
        return {
          status: 'bluetooth-device',
          message: `تم الاقتران بجهاز البلوتوث (${device.name}) بنجاح!`,
        };
      }
    } catch (err: any) {
      // User cancelled picker or browser restrictions, continue to native share fallback
      if (err?.name !== 'NotFoundError' && err?.name !== 'AbortError') {
        console.warn('Web Bluetooth scan skipped, using Bluetooth Share sheet', err);
      }
    }
  }

  // 2. Use Native Web Share (invokes Android Bluetooth / Nearby Share / Quick Share)
  if (
    typeof navigator !== 'undefined' &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({
        title,
        text: `إرسال الفاتورة (${filename}) عبر البلوتوث إلى الطابعة أو الأجهزة القريبة`,
        files: [file],
      });
      return {
        status: 'bluetooth-share',
        message: 'تم فتح قائمة البلوتوث والأجهزة القريبة (Quick Share / Bluetooth) بنجاح!',
      };
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return {
          status: 'bluetooth-share',
          message: 'تم إغلاق نافذة البلوتوث',
        };
      }
    }
  }

  // 3. Fallback: Save file so user can send via system Bluetooth menu
  downloadPdfToMobileStorage(blob, filename);
  return {
    status: 'downloaded',
    message: 'تم حفظ الفاتورة في وحدة التخزين لإرسالها عبر تطبيق البلوتوث بالجهاز',
  };
}

/**
 * Offline Storage Vault Helpers
 * Store invoices locally in localStorage so users can access them completely offline.
 */
export function getOfflineInvoices(): SavedOfflineInvoice[] {
  try {
    const raw = localStorage.getItem(OFFLINE_INVOICES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export function saveInvoiceToOfflineVault(invoice: SavedOfflineInvoice): SavedOfflineInvoice[] {
  try {
    const current = getOfflineInvoices();
    // Remove if already exists with same orderId to update
    const filtered = current.filter((inv) => inv.orderId !== invoice.orderId);
    const updated = [invoice, ...filtered].slice(0, 100); // keep up to 100 offline invoices
    localStorage.setItem(OFFLINE_INVOICES_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Could not save invoice to offline vault', err);
    return getOfflineInvoices();
  }
}

export function deleteOfflineInvoice(id: string): SavedOfflineInvoice[] {
  try {
    const current = getOfflineInvoices();
    const updated = current.filter((inv) => inv.id !== id && inv.orderId !== id);
    localStorage.setItem(OFFLINE_INVOICES_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return getOfflineInvoices();
  }
}

export function clearAllOfflineInvoices(): void {
  try {
    localStorage.removeItem(OFFLINE_INVOICES_KEY);
  } catch {}
}
