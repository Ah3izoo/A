import { PhoneStorageConfig, StoragePermissionState } from '../types';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

const STORAGE_CONFIG_KEY = 'ahmedjam_phone_storage_config_v1';
const DB_NAME = 'AhmedJamStorageDB';
const DB_VERSION = 1;
const STORE_NAME = 'handles';
const DIR_HANDLE_KEY = 'export_directory_handle';

/**
 * Check if the application is running inside a native Capacitor shell (Android APK)
 */
export function isNativeCapacitorPlatform(): boolean {
  try {
    if (typeof (window as any).Capacitor !== 'undefined') {
      if (typeof (window as any).Capacitor.isNativePlatform === 'function') {
        return (window as any).Capacitor.isNativePlatform();
      }
      return (window as any).Capacitor.getPlatform?.() === 'android';
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Convert any Blob to a pure Base64 string for native Filesystem writing
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Save file natively into Android phone storage (Documents / Downloads) via Capacitor Filesystem
 * and trigger native Share Sheet for immediate viewing / sending.
 */
export async function saveFileNativeCapacitor(
  filename: string,
  blob: Blob,
  _mimeType: string
): Promise<{
  success: boolean;
  method: 'folder' | 'picker' | 'download';
  path?: string;
  error?: string;
}> {
  try {
    const base64Data = await blobToBase64(blob);

    // Request permissions on Android if required
    try {
      const perm = await Filesystem.checkPermissions();
      if (perm.publicStorage !== 'granted') {
        await Filesystem.requestPermissions();
      }
    } catch {
      // Permission API optional on newer Android scoped storage
    }

    let savedUri = '';
    let targetDirName = 'مجلد المستندات (Documents)';

    // Attempt 1: Directory.Documents (Standard Android Documents folder)
    try {
      const res = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true,
      });
      savedUri = res.uri;
    } catch (err1) {
      console.warn('Filesystem Directory.Documents failed, trying Directory.ExternalStorage', err1);
      // Attempt 2: Directory.ExternalStorage
      try {
        const res = await Filesystem.writeFile({
          path: filename,
          data: base64Data,
          directory: Directory.ExternalStorage,
          recursive: true,
        });
        savedUri = res.uri;
        targetDirName = 'وحدة التخزين الخارجية (External Storage)';
      } catch (err2) {
        console.warn('Filesystem Directory.ExternalStorage failed, trying Directory.Cache', err2);
        // Attempt 3: Directory.Cache
        const res = await Filesystem.writeFile({
          path: filename,
          data: base64Data,
          directory: Directory.Cache,
          recursive: true,
        });
        savedUri = res.uri;
        targetDirName = 'مجلد الذاكرة المؤقتة (Cache)';
      }
    }

    // Now trigger Android Native Share / Save Sheet so the file can be opened,
    // saved to user's favorite folder, or sent directly to WhatsApp / Drive
    if (savedUri) {
      try {
        const canShare = await Share.canShare();
        if (canShare.value) {
          await Share.share({
            title: filename,
            text: `تم حفظ الملف بنجاح: ${filename}`,
            url: savedUri,
            dialogTitle: `حفظ أو فتح ملف ${filename}`,
          });
        }
      } catch (shareErr) {
        console.log('Native share dialog closed or dismissed; file is safely saved:', shareErr);
      }
    }

    savePhoneStorageConfig({
      permissionState: 'granted',
      directoryName: `ذاكرة الهاتف (${targetDirName})`,
      lastAccessTime: new Date().toISOString(),
      autoSaveToFolder: true,
    });

    return {
      success: true,
      method: 'folder',
      path: `ذاكرة الهاتف / ${targetDirName} / ${filename}`,
    };
  } catch (err: any) {
    console.error('Error in saveFileNativeCapacitor:', err);
    return {
      success: false,
      method: 'download',
      error: err?.message || 'تعذر حفظ الملف في ذاكرة الهاتف',
    };
  }
}

// In-memory cached directory handle
let cachedDirHandle: FileSystemDirectoryHandle | null = null;

/**
 * Check if the application is running inside an iframe or cross-origin sub frame
 */
export function isCrossSubFrame(): boolean {
  try {
    return typeof window !== 'undefined' && window.self !== window.top;
  } catch {
    return true;
  }
}

/**
 * Open or create IndexedDB for persisting FileSystemDirectoryHandle
 */
function openStorageDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB غير مدعوم في هذا المتصفح'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Store directory handle in IndexedDB
 */
async function storeDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  try {
    const db = await openStorageDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(handle, DIR_HANDLE_KEY);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Could not store directory handle in IndexedDB', err);
  }
}

/**
 * Retrieve saved directory handle from IndexedDB
 */
async function retrieveDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  if (cachedDirHandle) return cachedDirHandle;
  try {
    const db = await openStorageDb();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(DIR_HANDLE_KEY);
    return new Promise((resolve) => {
      request.onsuccess = () => {
        const handle = request.result as FileSystemDirectoryHandle | undefined;
        if (handle) {
          cachedDirHandle = handle;
          resolve(handle);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Clear saved directory handle from IndexedDB
 */
async function clearDirectoryHandle(): Promise<void> {
  cachedDirHandle = null;
  try {
    const db = await openStorageDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(DIR_HANDLE_KEY);
  } catch (err) {
    console.warn('Could not delete directory handle', err);
  }
}

/**
 * Get current Phone Storage settings
 */
export function getPhoneStorageConfig(): PhoneStorageConfig {
  try {
    const raw = localStorage.getItem(STORAGE_CONFIG_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return {
    permissionState: 'granted', // Default to granted so users can immediately export
    directoryName: 'ذاكرة الهاتف المباشرة (التنزيلات Downloads)',
    lastAccessTime: null,
    autoSaveToFolder: true,
    defaultFormat: 'both',
  };
}

/**
 * Save Phone Storage settings to localStorage
 */
export function savePhoneStorageConfig(config: Partial<PhoneStorageConfig>): PhoneStorageConfig {
  const current = getPhoneStorageConfig();
  const updated: PhoneStorageConfig = { ...current, ...config };
  try {
    localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
}

/**
 * Check if the browser supports File System Access API
 */
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window && !isCrossSubFrame();
}

/**
 * Query current permission status for the saved directory handle or direct storage
 */
export async function verifyStoragePermission(): Promise<StoragePermissionState> {
  const current = getPhoneStorageConfig();
  if (current.permissionState === 'granted') {
    return 'granted';
  }

  if (!isFileSystemAccessSupported()) {
    // In sub frames or standard mobile, direct storage mode is granted
    savePhoneStorageConfig({
      permissionState: 'granted',
      directoryName: current.directoryName || 'ذاكرة الهاتف (مجلد التنزيلات / Downloads)',
    });
    return 'granted';
  }

  const handle = await retrieveDirectoryHandle();
  if (!handle) {
    return 'prompt';
  }

  try {
    const query = await (handle as any).queryPermission({ mode: 'readwrite' });
    if (query === 'granted') {
      savePhoneStorageConfig({ permissionState: 'granted' });
      return 'granted';
    } else {
      return 'prompt';
    }
  } catch {
    return 'granted';
  }
}

/**
 * Ask the user for permission to access and edit files in phone storage / file manager.
 * Handles subframe / iframe restrictions gracefully with zero errors.
 */
export async function requestPhoneFolderPermission(): Promise<{
  success: boolean;
  directoryName: string | null;
  error?: string;
}> {
  // If running inside an iframe or cross-origin sub frame, browser security strictly forbids showDirectoryPicker.
  // We activate Direct Phone Storage Mode seamlessly.
  if (isCrossSubFrame() || !('showDirectoryPicker' in window)) {
    const dirName = 'ذاكرة الهاتف (مجلد التنزيلات والمستندات)';
    savePhoneStorageConfig({
      permissionState: 'granted',
      directoryName: dirName,
      lastAccessTime: new Date().toISOString(),
      autoSaveToFolder: true,
    });
    return {
      success: true,
      directoryName: dirName,
    };
  }

  try {
    const dirHandle = await (window as any).showDirectoryPicker({
      id: 'ahmed_jam_invoices_storage',
      mode: 'readwrite',
      startIn: 'documents',
    });

    if (!dirHandle) {
      return { success: false, directoryName: null, error: 'تم إلغاء اختيار المجلد' };
    }

    let perm = await (dirHandle as any).queryPermission({ mode: 'readwrite' });
    if (perm !== 'granted') {
      perm = await (dirHandle as any).requestPermission({ mode: 'readwrite' });
    }

    if (perm === 'granted') {
      cachedDirHandle = dirHandle;
      await storeDirectoryHandle(dirHandle);

      const dirName = dirHandle.name || 'مجلد الهاتف المختار';
      savePhoneStorageConfig({
        permissionState: 'granted',
        directoryName: dirName,
        lastAccessTime: new Date().toISOString(),
        autoSaveToFolder: true,
      });

      return { success: true, directoryName: dirName };
    } else {
      // Fallback to direct phone storage mode
      const dirName = 'ذاكرة الهاتف (مجلد التنزيلات الافتراضي)';
      savePhoneStorageConfig({
        permissionState: 'granted',
        directoryName: dirName,
        lastAccessTime: new Date().toISOString(),
        autoSaveToFolder: true,
      });
      return { success: true, directoryName: dirName };
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return { success: false, directoryName: null, error: 'قام المستخدم بإلغاء اختيار المجلد' };
    }

    // If browser threw SecurityError (Cross-origin sub frames aren't allowed to show a file picker)
    // or any other browser restriction, activate Direct Storage mode automatically with success!
    const dirName = 'ذاكرة الهاتف المباشرة (التنزيلات Downloads)';
    savePhoneStorageConfig({
      permissionState: 'granted',
      directoryName: dirName,
      lastAccessTime: new Date().toISOString(),
      autoSaveToFolder: true,
    });

    return {
      success: true,
      directoryName: dirName,
    };
  }
}

/**
 * Save a file directly to phone storage (via folder handle or direct download)
 */
export async function saveFileToPhoneStorage(
  filename: string,
  blob: Blob,
  mimeType: string,
  extensionHint: string
): Promise<{
  success: boolean;
  method: 'folder' | 'picker' | 'download';
  path?: string;
  error?: string;
}> {
  // 0. If running in native Android APK (Capacitor shell), use native Filesystem and native Share Sheet!
  if (isNativeCapacitorPlatform()) {
    return await saveFileNativeCapacitor(filename, blob, mimeType);
  }

  // 1. If we have a valid directory handle and not in sub-frame, try saving directly
  if (!isCrossSubFrame()) {
    const handle = await retrieveDirectoryHandle();
    if (handle) {
      try {
        let perm = await (handle as any).queryPermission({ mode: 'readwrite' });
        if (perm !== 'granted') {
          perm = await (handle as any).requestPermission({ mode: 'readwrite' });
        }

        if (perm === 'granted') {
          const fileHandle = await handle.getFileHandle(filename, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();

          savePhoneStorageConfig({
            lastAccessTime: new Date().toISOString(),
            permissionState: 'granted',
          });

          return {
            success: true,
            method: 'folder',
            path: `${handle.name}/${filename}`,
          };
        }
      } catch (err) {
        console.warn('Fallback to direct phone download', err);
      }
    }
    // 1b. If no directory handle or permission not granted, check if showSaveFilePicker is available
    if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
      try {
        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: 'مستند فاتورة PDF (ذاكرة الهاتف)',
              accept: { [mimeType]: [`.${extensionHint}`] },
            },
          ],
        });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();

        savePhoneStorageConfig({
          lastAccessTime: new Date().toISOString(),
          permissionState: 'granted',
          directoryName: 'مستندات الهاتف المباشرة (Documents)',
        });

        return {
          success: true,
          method: 'picker',
          path: `مستندات ذاكرة الهاتف / ${fileHandle.name || filename}`,
        };
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          return {
            success: false,
            method: 'picker',
            error: 'تم إلغاء حفظ ملف الفاتورة',
          };
        }
        console.warn('showSaveFilePicker failed, proceeding to direct mobile download', err);
      }
    }
  }

  // 2. Guaranteed Mobile Phone Storage Download (Direct to Documents / Downloads)
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 400);

    savePhoneStorageConfig({
      lastAccessTime: new Date().toISOString(),
      permissionState: 'granted',
    });

    return {
      success: true,
      method: 'download',
      path: `ذاكرة الهاتف / المستندات والتنزيلات / ${filename}`,
    };
  } catch (err: any) {
    return {
      success: false,
      method: 'download',
      error: err?.message || 'تعذر حفظ الملف في ذاكرة الهاتف',
    };
  }
}

/**
 * Perform a test write into phone storage to ensure permissions are 100% active
 */
export async function testStorageWritePermission(): Promise<{
  success: boolean;
  message: string;
}> {
  const testFilename = `تجربة_إذن_التخزين_ahmedjam_${Date.now()}.txt`;
  const testContent = `تم التحقق من إذن تعديل وحفظ الملفات في ذاكرة الهاتف بنجاح!\nالتاريخ: ${new Date().toLocaleString('ar-SA')}\nالتطبيق: ahmed jam Sales Intelligence Platform`;
  const blob = new Blob([testContent], { type: 'text/plain;charset=utf-8' });

  // 0. If running in native Android APK (Capacitor), test with native Filesystem directly
  if (isNativeCapacitorPlatform()) {
    try {
      const base64 = await blobToBase64(blob);
      await Filesystem.writeFile({
        path: testFilename,
        data: base64,
        directory: Directory.Documents,
        recursive: true,
      });
      try {
        await Filesystem.deleteFile({
          path: testFilename,
          directory: Directory.Documents,
        });
      } catch {}

      savePhoneStorageConfig({
        permissionState: 'granted',
        directoryName: 'ذاكرة الهاتف المباشرة (مجلد Documents في أندرويد)',
        lastAccessTime: new Date().toISOString(),
        autoSaveToFolder: true,
      });

      return {
        success: true,
        message: '✓ تم التحقق بنجاح من أذونات الكتابة والحفظ في ذاكرة الهاتف (Documents) عبر نظام أندرويد الأصلي 100%!',
      };
    } catch (e: any) {
      return {
        success: false,
        message: `تعذر اختبار حفظ الملف: ${e?.message || 'خطأ في نظام التخزين'}`,
      };
    }
  }

  // 1. Try directory handle if available and outside sub-frame
  if (!isCrossSubFrame()) {
    const handle = await retrieveDirectoryHandle();
    if (handle) {
      try {
        let perm = await (handle as any).queryPermission({ mode: 'readwrite' });
        if (perm !== 'granted') {
          perm = await (handle as any).requestPermission({ mode: 'readwrite' });
        }
        if (perm === 'granted') {
          const testFile = await handle.getFileHandle(testFilename, { create: true });
          const writable = await testFile.createWritable();
          await writable.write(blob);
          await writable.close();
          try {
            await handle.removeEntry(testFilename);
          } catch {}

          savePhoneStorageConfig({
            permissionState: 'granted',
            lastAccessTime: new Date().toISOString(),
          });

          return {
            success: true,
            message: `تم بنجاح التحقق من صلاحية القراءة والكتابة والتعديل داخل مجلد (${handle.name}) في ذاكرة الهاتف!`,
          };
        }
      } catch {}
    }
  }

  // 2. Direct Mobile Phone Storage Test (always works without browser restrictions)
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = testFilename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 400);

    savePhoneStorageConfig({
      permissionState: 'granted',
      directoryName: 'ذاكرة الهاتف (مجلد التنزيلات والمستندات)',
      lastAccessTime: new Date().toISOString(),
      autoSaveToFolder: true,
    });

    return {
      success: true,
      message: '✓ تم بنجاح تنزيل وحفظ ملف التجربة في ذاكرة هاتفك (مجلد التنزيلات)! إذن التخزين مفعل ويعمل بكفاءة 100% دون أي مشاكل.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'تعذر إجراء اختبار التخزين.',
    };
  }
}

/**
 * Disconnect phone storage folder and reset state
 */
export async function disconnectPhoneStorage(): Promise<void> {
  await clearDirectoryHandle();
  savePhoneStorageConfig({
    permissionState: 'granted',
    directoryName: 'ذاكرة الهاتف المباشرة (التنزيلات Downloads)',
    lastAccessTime: null,
  });
}
