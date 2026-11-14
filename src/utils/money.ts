// KWD has 3 minor digits (fils); the backend accepts at most 3 decimals.
const DECIMALS = 3;
const SCALE = 10 ** DECIMALS;

export function roundMoney(amount: number): number {
  return Math.round(amount * SCALE) / SCALE;
}

export function formatMoney(amount: number, currency: string): string {
  return `${currency} ${roundMoney(amount).toFixed(DECIMALS)}`;
}

export const DEFAULT_CURRENCY = 'KWD';

// The app prints the amount first: "0.250 KWD".
export function formatPrice(amount: number, currency: string = DEFAULT_CURRENCY): string {
  return `${roundMoney(amount).toFixed(DECIMALS)} ${currency}`;
}

// Whole fils keep repeated line math exact.
export function multiplyMoney(unitPrice: number, quantity: number): number {
  return (Math.round(unitPrice * SCALE) * quantity) / SCALE;
}

export function sumMoney(amounts: number[]): number {
  return amounts.reduce((total, amount) => total + Math.round(amount * SCALE), 0) / SCALE;
}
