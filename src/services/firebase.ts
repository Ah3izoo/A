import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  getDocFromServer,
  writeBatch,
} from 'firebase/firestore';
import {
  getAuth,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { ProductItem, SalesRecord } from '../types';

// 1. Initialize Firebase App (singleton pattern)
export const firebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// 2. Initialize Firestore (using project database ID if available)
const configWithDb = firebaseConfig as typeof firebaseConfig & { firestoreDatabaseId?: string };
export const db = configWithDb.firestoreDatabaseId
  ? getFirestore(firebaseApp, configWithDb.firestoreDatabaseId)
  : getFirestore(firebaseApp);

// 3. Initialize Firebase Auth
export const auth = getAuth(firebaseApp);

// 4. Configure Google Auth Provider with Google Drive file scope
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// 5. Test connection on boot per Firebase guidelines
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network restricted.');
      return false;
    }
    // If doc doesn't exist, it still connected to server successfully
    return true;
  }
}

// In-memory token cache for Google Workspace OAuth per security guidelines
let cachedAccessToken: string | null = null;

export const getDriveAccessToken = (): string | null => {
  return cachedAccessToken;
};

// 6. Sign in with Google (returns user & Google Drive access token)
export async function loginWithGoogle(): Promise<{
  user: User;
  driveAccessToken: string | null;
}> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const driveAccessToken = credential?.accessToken || null;

    if (driveAccessToken) {
      cachedAccessToken = driveAccessToken;
    }

    return {
      user: result.user,
      driveAccessToken,
    };
  } catch (error: any) {
    if (error?.code === 'auth/unauthorized-domain') {
      console.warn('Firebase domain authorization required for current preview host.');
      throw new Error('النطاق الحالي قيد ربط الاعتماد في Google Workspace. يمكنك استخدام خيار "حفظ بذاكرة الهاتف" أو "تنزيل PDF" فوراً.');
    }
    throw error;
  }
}

export async function ensureDriveAccessToken(): Promise<string> {
  if (cachedAccessToken) return cachedAccessToken;
  const { driveAccessToken } = await loginWithGoogle();
  if (!driveAccessToken) {
    throw new Error('لم يتم استلام تصريح الوصول إلى Google Drive. يرجى إعادة تسجيل الدخول بحساب Google والموافقة على الأذونات.');
  }
  return driveAccessToken;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
  cachedAccessToken = null;
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, (user) => {
    if (!user) {
      cachedAccessToken = null;
    }
    callback(user);
  });
}

// 7. Sync Sales Records to Cloud Firestore
export async function saveSalesRecordToFirestore(record: SalesRecord): Promise<void> {
  const docRef = doc(db, 'salesRecords', record.id);
  await setDoc(docRef, {
    ...record,
    syncedAt: new Date().toISOString(),
  });
}

export async function batchSyncSalesToFirestore(records: SalesRecord[]): Promise<number> {
  if (records.length === 0) return 0;
  const batch = writeBatch(db);

  // Firestore allows up to 500 writes in a batch
  const recordsToSync = records.slice(0, 450);
  for (const rec of recordsToSync) {
    const docRef = doc(db, 'salesRecords', rec.id);
    batch.set(docRef, {
      ...rec,
      syncedAt: new Date().toISOString(),
    });
  }

  await batch.commit();
  return recordsToSync.length;
}

export async function fetchSalesRecordsFromFirestore(): Promise<SalesRecord[]> {
  const colRef = collection(db, 'salesRecords');
  const snapshot = await getDocs(colRef);
  const records: SalesRecord[] = [];
  snapshot.forEach((d) => {
    records.push(d.data() as SalesRecord);
  });
  return records;
}

// 8. Catalog Sync
export async function batchSyncCatalogToFirestore(catalog: ProductItem[]): Promise<number> {
  if (catalog.length === 0) return 0;
  const batch = writeBatch(db);
  for (const item of catalog) {
    const docRef = doc(db, 'products', item.id);
    batch.set(docRef, {
      ...item,
      syncedAt: new Date().toISOString(),
    });
  }
  await batch.commit();
  return catalog.length;
}

export async function fetchCatalogFromFirestore(): Promise<ProductItem[]> {
  const colRef = collection(db, 'products');
  const snapshot = await getDocs(colRef);
  const items: ProductItem[] = [];
  snapshot.forEach((d) => {
    items.push(d.data() as ProductItem);
  });
  return items;
}

// 9. Google Drive Upload helper (Uses standard Google Drive REST API v3)
export async function uploadToGoogleDrive(
  token: string,
  fileName: string,
  content: Blob | string,
  contentType: string = 'application/json'
): Promise<{ id: string; name: string; webViewLink?: string }> {
  const metadata = {
    name: fileName,
    mimeType: contentType,
    description: 'نسخة احتياطية مبيعات ahmed jam - المندوب أحمد عزالدين عثمان (ahmed jam)',
  };

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );

  const fileBlob = typeof content === 'string' ? new Blob([content], { type: contentType }) : content;
  form.append('file', fileBlob);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google Drive upload failed: ${res.statusText} - ${errorText}`);
  }

  return await res.json();
}
