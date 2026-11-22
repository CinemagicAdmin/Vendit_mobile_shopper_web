export type GuestPaymentMethod = 'ALL' | 'KNET' | 'CARD';

export type GuestUnavailableReason =
  | 'FEATURE_DISABLED'
  | 'NOT_CONFIGURED'
  | 'MACHINE_OFFLINE'
  | 'OUT_OF_STOCK'
  | 'PRICE_UNAVAILABLE'
  | 'PRODUCT_UNAVAILABLE';

export interface GuestBasketLine {
  productId: string;
  quantity: number;
}

export interface GuestBasket {
  machineId: string;
  lines: GuestBasketLine[];
  key: string;
}

export interface GuestQuoteLine {
  productId: string;
  name: string | null;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  available: boolean;
}

export interface GuestPaidItem {
  productId: string;
  name: string | null;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number;
}

export interface GuestQuote {
  machine: {
    id: string;
    name: string | null;
    location: string | null;
    imageUrl?: string | null;
    online: boolean;
  };
  lines: GuestQuoteLine[];
  total: number;
  currency: string;
  sellable: boolean;
  unavailableReason: GuestUnavailableReason | null;
  paymentMethods: GuestPaymentMethod[];
}

export interface CreateGuestCheckoutPayload {
  machineId: string;
  products: GuestBasketLine[];
  amount: number;
  paymentMethod: GuestPaymentMethod;
}

export interface GuestCheckoutStart {
  paymentId: string;
  orderReference: string | null;
  // 'review' only when the same secret is sent again after the charge was held for review.
  outcome: 'pending' | 'succeeded' | 'review';
  status: string;
  amount: number;
  currency: string;
  checkoutUrl: string | null;
}

export type GuestOutcome = 'pending' | 'succeeded' | 'failed' | 'review';

export type GuestDispenseState =
  | 'not_started'
  | 'dispensing'
  | 'awaiting_next'
  | 'completed'
  | 'partial'
  | 'failed';

export interface GuestDispense {
  state: GuestDispenseState;
  isComplete: boolean;
  authorizedUnits: number;
  confirmedUnits: number;
  failedUnits: number;
  inFlightUnits: number;
}

export interface GuestCheckoutStatus {
  paymentId: string;
  orderReference: string | null;
  outcome: GuestOutcome;
  status: string;
  amount: number;
  currency: string;
  checkoutUrl: string | null;
  machine: { name: string | null };
  dispense: GuestDispense | null;
  pollIntervalMs: number;
}

export type GuestDispenseResult =
  | 'dispatched'
  | 'started'
  | 'not_paid'
  | 'machine_offline'
  | 'no_coil'
  | 'nothing_to_vend'
  | 'send_failed';

export interface GuestDispenseResponse {
  result: GuestDispenseResult;
  status: GuestCheckoutStatus;
}

// What the gateway sent the shopper back with: Tap's charge id or MyFatoorah's payment id.
export interface GuestReturnProof {
  tapId: string | null;
  mfPaymentId: string | null;
}

export interface GuestAuth extends GuestReturnProof {
  secret: string | null;
}

export interface GuestCheckoutLinkPayload {
  visitorId: string;
  visitId: string;
  paymentId: string;
}

export interface GuestEnvelope<T> {
  status: number;
  message: string;
  data: T;
}
