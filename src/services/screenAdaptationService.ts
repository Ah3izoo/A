import { AndroidVersionProfile, ScreenDensity, ScreenSettings } from '../types';

const SCREEN_SETTINGS_KEY = 'ahmedjam_screen_settings_v1';

export interface DeviceInfo {
  isAndroid: boolean;
  detectedVersion: string;
  suggestedProfile: AndroidVersionProfile;
  screenWidth: number;
  screenHeight: number;
  windowWidth: number;
  windowHeight: number;
  devicePixelRatio: number;
  orientation: 'portrait' | 'landscape';
  touchPoints: number;
  screenCategory: 'compact' | 'standard' | 'large' | 'tablet';
  categoryLabelAr: string;
}

/**
 * Detect current Android and screen metrics
 */
export function detectCurrentDevice(): DeviceInfo {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isAndroid = /Android/i.test(ua);

  // Extract Android version number from user agent e.g. "Android 14; Pixel 8"
  let detectedVersion = 'غير معروف';
  let suggestedProfile: AndroidVersionProfile = 'android14';

  const androidMatch = ua.match(/Android\s+([0-9.]+)/i);
  if (androidMatch && androidMatch[1]) {
    detectedVersion = `أندرويد ${androidMatch[1]}`;
    const major = parseInt(androidMatch[1], 10);
    if (major >= 15) suggestedProfile = 'android15';
    else if (major === 14) suggestedProfile = 'android14';
    else if (major === 13) suggestedProfile = 'android13';
    else if (major === 12) suggestedProfile = 'android12';
    else if (major === 11) suggestedProfile = 'android11';
    else if (major === 10) suggestedProfile = 'android10';
    else suggestedProfile = 'legacy';
  } else if (!isAndroid) {
    // If testing on desktop / iOS, set a modern Android 14 default simulation profile
    detectedVersion = 'بيئة تجريبية (محاكاة أندرويد)';
    suggestedProfile = 'android14';
  }

  const screenWidth = typeof window !== 'undefined' ? window.screen.width : 390;
  const screenHeight = typeof window !== 'undefined' ? window.screen.height : 844;
  const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 390;
  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 844;
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const touchPoints = typeof navigator !== 'undefined' ? navigator.maxTouchPoints || 0 : 0;
  const orientation = windowWidth > windowHeight ? 'landscape' : 'portrait';

  // Categorize screen size
  let screenCategory: DeviceInfo['screenCategory'] = 'standard';
  let categoryLabelAr = 'هاتف قياسي (380 - 430px)';

  if (windowWidth < 380) {
    screenCategory = 'compact';
    categoryLabelAr = 'هاتف صغير / اقتصادي (< 380px)';
  } else if (windowWidth <= 430) {
    screenCategory = 'standard';
    categoryLabelAr = 'هاتف قياسي (380 - 430px)';
  } else if (windowWidth <= 600) {
    screenCategory = 'large';
    categoryLabelAr = 'هاتف كبير / Ultra / Plus (430 - 600px)';
  } else {
    screenCategory = 'tablet';
    categoryLabelAr = 'تابلت / شاشة قابلة للطي (> 600px)';
  }

  return {
    isAndroid,
    detectedVersion,
    suggestedProfile,
    screenWidth,
    screenHeight,
    windowWidth,
    windowHeight,
    devicePixelRatio: dpr,
    orientation,
    touchPoints,
    screenCategory,
    categoryLabelAr,
  };
}

/**
 * Get screen settings from localStorage with smart defaults
 */
export function getScreenSettings(): ScreenSettings {
  try {
    const raw = localStorage.getItem(SCREEN_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.scale === 95) {
        parsed.scale = 100;
      }
      return parsed;
    }
  } catch {}

  const device = detectCurrentDevice();
  return {
    androidVersion: 'auto',
    scale: 100,
    density: 'standard',
    edgeToEdge: true,
    notchPadding: true,
    bottomBarExtraPadding: true,
    hapticFeedback: true,
    fullWidthTables: true,
  };
}

/**
 * Save screen settings to localStorage and apply styles
 */
export function saveScreenSettings(settings: Partial<ScreenSettings>): ScreenSettings {
  const current = getScreenSettings();
  const updated: ScreenSettings = { ...current, ...settings };

  try {
    localStorage.setItem(SCREEN_SETTINGS_KEY, JSON.stringify(updated));
  } catch {}

  applyScreenSettingsToDOM(updated);
  return updated;
}

/**
 * Apply settings to document DOM without causing horizontal overflow or RTL margins
 */
export function applyScreenSettingsToDOM(settings: ScreenSettings): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const body = document.body;

  // Ensure body and root stretch naturally without breaking vertical scrolling
  root.style.maxWidth = '100%';
  body.style.maxWidth = '100%';
  body.style.width = '100%';
  root.style.removeProperty('overflow-x');
  body.style.removeProperty('overflow-x');

  // Completely eliminate body zoom which creates blank side columns in RTL
  body.style.zoom = '1';
  (body.style as any).removeProperty('zoom');

  // Safe font-size and CSS variable scaling
  root.style.setProperty('--app-scale', `${settings.scale / 100}`);
  if (settings.scale === 100) {
    root.style.removeProperty('font-size');
  } else {
    // Relative scaling from default 15px
    root.style.fontSize = `${(settings.scale / 100) * 15}px`;
  }

  // 2. Density Classes
  root.classList.remove('density-compact', 'density-standard', 'density-comfortable');
  root.classList.add(`density-${settings.density}`);

  // 3. Notch & Edge-to-Edge Padding
  if (settings.notchPadding) {
    root.classList.add('notch-padded');
  } else {
    root.classList.remove('notch-padded');
  }

  if (settings.bottomBarExtraPadding) {
    root.classList.add('android-gesture-padded');
  } else {
    root.classList.remove('android-gesture-padded');
  }

  // 4. Android Version attributes
  const device = detectCurrentDevice();
  const effectiveProfile =
    settings.androidVersion === 'auto' ? device.suggestedProfile : settings.androidVersion;
  root.setAttribute('data-android-profile', effectiveProfile);
}
