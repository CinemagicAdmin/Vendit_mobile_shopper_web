// KWD has 3 minor digits (fils); the backend accepts at most 3 decimals.
const DECIMALS = 3;
const SCALE = 10 ** DECIMALS;

export function roundMoney(amount: number): number {
  return Math.round(amount * SCALE) / SCALE;
}

export function formatMoney(amount: number, currency: string): string {
  return `${currency} ${roundMoney(amount).toFixed(DECIMALS)}`;
}
