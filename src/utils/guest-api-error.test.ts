import { describe, expect, it } from 'vitest';
import {
  GuestApiError,
  checkoutErrorMessage,
  conflictReason,
  isPriceMismatch,
  quoteErrorCopy,
  readDetailNumber,
  toGuestApiError,
} from '@/utils/guest-api-error';

const httpError = (status: number, data: unknown) => ({ isAxiosError: true, response: { status, data } });

describe('toGuestApiError', () => {
  it('reads code, message and details from an error body', () => {
    const error = toGuestApiError(
      httpError(409, {
        status: 409,
        error: 'Conflict',
        code: 'PRICE_MISMATCH',
        message: 'Price changed',
        details: { expectedAmount: 0.35 },
      }),
    );
    expect(error).toBeInstanceOf(GuestApiError);
    expect(error).toMatchObject({ status: 409, code: 'PRICE_MISMATCH', message: 'Price changed' });
    expect(isPriceMismatch(error)).toBe(true);
    expect(readDetailNumber(error, 'expectedAmount')).toBe(0.35);
  });

  it('accepts older bodies that only carry a message', () => {
    const error = toGuestApiError(httpError(400, { message: 'Bad input' }));
    expect(error).toMatchObject({ status: 400, code: null, message: 'Bad input', details: null });
  });

  it('survives a non-JSON body', () => {
    const error = toGuestApiError(httpError(502, '<html>Bad gateway</html>'));
    expect(error.status).toBe(502);
    expect(error.code).toBeNull();
    expect(error.message.length).toBeGreaterThan(0);
  });

  it('maps timeouts and network failures to status 0', () => {
    expect(toGuestApiError({ code: 'ECONNABORTED', message: 'timeout' })).toMatchObject({
      status: 0,
      code: 'TIMEOUT',
    });
    expect(toGuestApiError({ code: 'ERR_NETWORK', message: 'Network Error' })).toMatchObject({
      status: 0,
      code: 'NETWORK_ERROR',
    });
    expect(toGuestApiError('boom')).toMatchObject({ status: 0, code: 'UNKNOWN' });
  });

  it('passes an existing GuestApiError through', () => {
    const original = new GuestApiError({ status: 404, code: 'NOT_FOUND', message: 'x', details: null });
    expect(toGuestApiError(original)).toBe(original);
  });
});

describe('conflictReason', () => {
  it('reads the reason only on 409', () => {
    const conflict = toGuestApiError(httpError(409, { code: 'CONFLICT', details: { reason: 'IN_PROGRESS' } }));
    expect(conflictReason(conflict)).toBe('IN_PROGRESS');
    const other = toGuestApiError(httpError(400, { details: { reason: 'IN_PROGRESS' } }));
    expect(conflictReason(other)).toBeNull();
  });
});

describe('shopper copy', () => {
  it('words checkout failures', () => {
    const declined = toGuestApiError(httpError(402, { code: 'PAYMENT_FAILED' }));
    expect(checkoutErrorMessage(declined)).toContain('not been charged');
    const stock = toGuestApiError(httpError(409, { code: 'CONFLICT', message: 'Insufficient stock' }));
    expect(checkoutErrorMessage(stock)).toContain('sold out');
    const offline = toGuestApiError(httpError(503, { code: 'MACHINE_OFFLINE' }));
    expect(checkoutErrorMessage(offline)).toContain('offline');
    expect(checkoutErrorMessage(toGuestApiError({ code: 'ERR_NETWORK' }))).toContain('connection');
  });

  it('only offers a retry for quote errors that can recover', () => {
    expect(quoteErrorCopy(toGuestApiError(httpError(404, {}))).canRetry).toBe(false);
    expect(quoteErrorCopy(toGuestApiError(httpError(400, {}))).canRetry).toBe(false);
    expect(quoteErrorCopy(toGuestApiError(httpError(429, {}))).canRetry).toBe(true);
    expect(quoteErrorCopy(toGuestApiError({ code: 'ECONNABORTED' })).canRetry).toBe(true);
  });
});
