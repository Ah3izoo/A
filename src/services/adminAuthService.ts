/**
 * Admin / Manager Credentials Service
 * Manages admin authentication credentials with localStorage persistence
 * and safe default fallback.
 */

const STORAGE_USERNAME_KEY = 'ahmedjam_admin_username_v2';
const STORAGE_PASSWORD_KEY = 'ahmedjam_admin_password_v2';

export const DEFAULT_ADMIN_USERNAME = 'Ahmed';
export const DEFAULT_ADMIN_PASSWORD = 'osman1962';

export interface AdminCredentials {
  username: string;
  password: string;
}

export function getAdminCredentials(): AdminCredentials {
  try {
    // Clear legacy credentials if present
    localStorage.removeItem('ahmedjam_admin_username_v1');
    localStorage.removeItem('ahmedjam_admin_password_v1');

    const storedUsername = localStorage.getItem(STORAGE_USERNAME_KEY);
    const storedPassword = localStorage.getItem(STORAGE_PASSWORD_KEY);

    return {
      username: storedUsername !== null ? storedUsername : DEFAULT_ADMIN_USERNAME,
      password: storedPassword !== null ? storedPassword : DEFAULT_ADMIN_PASSWORD,
    };
  } catch {
    return {
      username: DEFAULT_ADMIN_USERNAME,
      password: DEFAULT_ADMIN_PASSWORD,
    };
  }
}

export function verifyAdminCredentials(inputUser: string, inputPass: string): boolean {
  const current = getAdminCredentials();
  return (
    inputUser.trim().toLowerCase() === current.username.trim().toLowerCase() &&
    inputPass.trim() === current.password.trim()
  );
}

export function updateAdminCredentials(
  currentPasswordInput: string,
  newUsername: string,
  newPassword: string
): { success: boolean; message: string } {
  const current = getAdminCredentials();

  if (currentPasswordInput.trim() !== current.password.trim()) {
    return {
      success: false,
      message: 'كلمة المرور الحالية غير صحيحة! يرجى التأكد والمحاولة مرة أخرى.',
    };
  }

  const cleanUser = newUsername.trim();
  const cleanPass = newPassword.trim();

  if (!cleanUser || cleanUser.length < 3) {
    return {
      success: false,
      message: 'اسم المستخدم الجديد يجب ألا يقل عن 3 أحرف أو أرقام.',
    };
  }

  if (!cleanPass || cleanPass.length < 4) {
    return {
      success: false,
      message: 'كلمة المرور الجديدة يجب ألا تقل عن 4 رموز.',
    };
  }

  try {
    localStorage.setItem(STORAGE_USERNAME_KEY, cleanUser);
    localStorage.setItem(STORAGE_PASSWORD_KEY, cleanPass);
    return {
      success: true,
      message: `✓ تم تحديث بيانات المدير بنجاح! اسم المستخدم الجديد: "${cleanUser}"`,
    };
  } catch (e: any) {
    return {
      success: false,
      message: 'تعذر الحفظ في الذاكرة المحلية للجهاز: ' + (e?.message || ''),
    };
  }
}

export function resetAdminCredentialsToDefault(): { success: boolean; message: string } {
  try {
    localStorage.removeItem(STORAGE_USERNAME_KEY);
    localStorage.removeItem(STORAGE_PASSWORD_KEY);
    return {
      success: true,
      message: `✓ تم استعادة بيانات الدخول الافتراضية بنجاح (${DEFAULT_ADMIN_USERNAME} / ${DEFAULT_ADMIN_PASSWORD})`,
    };
  } catch (e: any) {
    return {
      success: false,
      message: 'تعذر الاستعادة: ' + (e?.message || ''),
    };
  }
}
