import { CurrencyCode, CurrencyConfig } from '../types';

export const CURRENCY_CONFIGS: Record<CurrencyCode, CurrencyConfig> = {
  SDG: { code: 'SDG', symbol: 'ج.س', nameAr: 'جنيه سوداني', rateFromSAR: 1 },
  SAR: { code: 'SAR', symbol: 'ر.س', nameAr: 'ريال سعودي', rateFromSAR: 1 },
  USD: { code: 'USD', symbol: '$', nameAr: 'دولار أمريكي', rateFromSAR: 0.267 },
  AED: { code: 'AED', symbol: 'د.إ', nameAr: 'درهم إماراتي', rateFromSAR: 0.98 },
  EGP: { code: 'EGP', symbol: 'ج.م', nameAr: 'جنيه مصري', rateFromSAR: 13.0 },
  EUR: { code: 'EUR', symbol: '€', nameAr: 'يورو', rateFromSAR: 0.245 },
};

export function formatCurrency(
  amountInSAR: number,
  currencyCode: CurrencyCode = 'SAR',
  showSymbol: boolean = true
): string {
  const config = CURRENCY_CONFIGS[currencyCode] || CURRENCY_CONFIGS.SAR;
  const converted = amountInSAR * config.rateFromSAR;

  const formattedNum = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: converted % 1 === 0 ? 0 : 2,
  }).format(converted);

  if (!showSymbol) return formattedNum;
  return `${formattedNum} ${config.symbol}`;
}

export function formatNumber(val: number): string {
  return new Intl.NumberFormat('en-US').format(val);
}

export function formatPercent(fraction: number, decimals: number = 1): string {
  const p = fraction * 100;
  return `${p.toFixed(decimals)}%`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return dateStr;
}
