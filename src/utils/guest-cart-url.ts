import { multiplyMoney, sumMoney } from '@/utils/money';
import { sameLines, totalUnits, type CartLine } from '@/utils/guest-cart';
import type { GuestPaidItem, GuestQuote, GuestQuoteLine } from '@/types/guest-checkout';

// Same shape as the kiosk's Pay by App QR, so both entry points land on one checkout.
export function payUrlFor(machineId: string, lines: CartLine[]): string {
  const ids = lines.map((line) => encodeURIComponent(line.productId)).join(',');
  const quantities = lines.map((line) => line.quantity).join(',');
  return `/pay?m=${encodeURIComponent(machineId)}&p=${ids}&q=${quantities}`;
}

export function machineUrl(machineId: string): string {
  return `/machine?m=${encodeURIComponent(machineId)}`;
}

export function machineIdFromPayUrl(payUrl: string | null): string | null {
  if (!payUrl?.startsWith('/pay?')) return null;
  const machineId = new URLSearchParams(payUrl.slice('/pay?'.length)).get('m');
  return machineId && machineId.trim() ? machineId.trim() : null;
}

export function quoteMatches(quote: GuestQuote, lines: CartLine[]): boolean {
  const quoted = quote.lines.map((line) => ({ productId: line.productId, quantity: line.quantity }));
  return sameLines(quoted, lines);
}

export interface CheckoutView {
  lines: GuestQuoteLine[];
  total: number;
  units: number;
}

// Shows an edit at once, priced from the last quote, while the new quote is on its way.
export function checkoutView(quote: GuestQuote, lines: CartLine[]): CheckoutView {
  if (quoteMatches(quote, lines)) {
    return { lines: quote.lines, total: quote.total, units: totalUnits(lines) };
  }
  const shown = lines.flatMap((line) => {
    const quoted = quote.lines.find((candidate) => candidate.productId === line.productId);
    if (!quoted) return [];
    return [{ ...quoted, quantity: line.quantity, lineTotal: multiplyMoney(quoted.unitPrice, line.quantity) }];
  });
  return { lines: shown, total: sumMoney(shown.map((line) => line.lineTotal)), units: totalUnits(lines) };
}

export function paidItems(quote: GuestQuote): GuestPaidItem[] {
  return quote.lines.map((line) => ({
    productId: line.productId,
    name: line.name,
    imageUrl: line.imageUrl,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
  }));
}
