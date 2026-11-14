const FALLBACK_MESSAGE = 'Something went wrong. Please try again.';

export interface GuestApiErrorInit {
  status: number;
  code: string | null;
  message: string;
  details: Record<string, unknown> | null;
}

export class GuestApiError extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly details: Record<string, unknown> | null;

  constructor(init: GuestApiErrorInit) {
    super(init.message);
    this.name = 'GuestApiError';
    this.status = init.status;
    this.code = init.code;
    this.details = init.details;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function transportError(error: Record<string, unknown>): GuestApiError {
  const timedOut = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
  return new GuestApiError({
    status: 0,
    code: timedOut ? 'TIMEOUT' : 'NETWORK_ERROR',
    message: timedOut ? 'The request timed out.' : 'The server could not be reached.',
    details: null,
  });
}

export function toGuestApiError(error: unknown): GuestApiError {
  if (error instanceof GuestApiError) return error;
  if (!isRecord(error)) {
    return new GuestApiError({ status: 0, code: 'UNKNOWN', message: FALLBACK_MESSAGE, details: null });
  }
  const response = isRecord(error.response) ? error.response : null;
  if (!response) return transportError(error);
  const body = isRecord(response.data) ? response.data : {};
  return new GuestApiError({
    status: typeof response.status === 'number' ? response.status : 0,
    code: readString(body, 'code'),
    message: readString(body, 'message') ?? FALLBACK_MESSAGE,
    details: isRecord(body.details) ? body.details : null,
  });
}

export function conflictReason(error: GuestApiError): string | null {
  if (error.status !== 409) return null;
  const reason = error.details?.reason;
  return typeof reason === 'string' ? reason : null;
}

export function isPriceMismatch(error: GuestApiError): boolean {
  return error.status === 409 && error.code === 'PRICE_MISMATCH';
}

export function readDetailNumber(error: GuestApiError, key: string): number | null {
  const value = error.details?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

const DECLINED_MESSAGE = 'Your payment was declined. You have not been charged.';

const CODE_MESSAGES: Partial<Record<string, string>> = {
  PAYMENT_FAILED: DECLINED_MESSAGE,
  MACHINE_OFFLINE: 'This machine is offline right now. You have not been charged.',
  FEATURE_DISABLED: 'Paying on the web is not available right now. You have not been charged.',
  VALIDATION_ERROR: 'This order could not be processed. Please scan the QR code on the machine again.',
  NOT_FOUND: 'This machine could not be found. Please scan the QR code on the machine again.',
};

const CONFLICT_MESSAGES: Partial<Record<string, string>> = {
  IN_PROGRESS: 'Your payment is still being set up. Please try again in a moment.',
  DIFFERENT_REQUEST: 'Your order changed while it was being set up. Please try again.',
};

export function checkoutErrorMessage(error: GuestApiError): string {
  if (error.status === 0) {
    return 'We could not reach the server. Check your connection and try again.';
  }
  const byCode = error.code ? CODE_MESSAGES[error.code] : undefined;
  if (byCode) return byCode;
  if (error.status === 402) return DECLINED_MESSAGE;
  if (error.status === 429) return 'Too many attempts. Please wait a moment and try again.';
  if (error.status === 409) {
    const reason = conflictReason(error);
    const byReason = reason ? CONFLICT_MESSAGES[reason] : undefined;
    return byReason ?? 'Some items just sold out or changed. We have refreshed your order.';
  }
  if (error.status >= 500) return 'Payments are temporarily unavailable. Please try again in a moment.';
  return FALLBACK_MESSAGE;
}

export interface QuoteErrorCopy {
  title: string;
  message: string;
  canRetry: boolean;
}

export function quoteErrorCopy(error: GuestApiError): QuoteErrorCopy {
  if (error.status === 404) {
    return {
      title: 'Machine not found',
      message: 'We could not find this machine. Please scan the QR code on the machine again.',
      canRetry: false,
    };
  }
  if (error.status === 400) {
    return {
      title: 'Invalid QR code',
      message: 'This QR code could not be read. Please scan the QR code on the machine again.',
      canRetry: false,
    };
  }
  if (error.status === 429) {
    return { title: 'Too many requests', message: 'Please wait a moment and try again.', canRetry: true };
  }
  if (error.status === 0) {
    return { title: 'Connection problem', message: 'Check your connection and try again.', canRetry: true };
  }
  return { title: 'Something went wrong', message: 'We could not load your order. Please try again.', canRetry: true };
}
