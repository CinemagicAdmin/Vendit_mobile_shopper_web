import { toBase64Url } from '@/utils/guest-secret';
import type { Platform } from '@/utils/app-store';

export type WebEventType =
  | 'menu_viewed'
  | 'checkout_viewed'
  | 'payment_started'
  | 'promo_viewed'
  | 'promo_clicked'
  | 'promo_dismissed';

export type WebPromoPlace = 'machine' | 'checkout' | 'collect' | 'general' | 'app_only';

export interface WebEventDetails {
  machineId?: string | null;
  place?: WebPromoPlace;
}

export interface WebEvent {
  id: string;
  type: WebEventType;
  at: string;
  machineId?: string;
  place?: WebPromoPlace;
}

export interface WebVisit {
  visitorId: string;
  visitId: string;
  platform: Platform;
}

export interface WebEventBatch extends WebVisit {
  events: WebEvent[];
}

export const MAX_BATCH_EVENTS = 20;

const ID_BYTES = 16;
const ID_PATTERN = /^[A-Za-z0-9_-]{16,64}$/;
const MACHINE_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const PROMO_TYPES = new Set<WebEventType>(['promo_viewed', 'promo_clicked', 'promo_dismissed']);

function randomBytes(): Uint8Array {
  const bytes = new Uint8Array(ID_BYTES);
  try {
    crypto.getRandomValues(bytes);
  } catch {
    // An analytics id is not a secret; an old browser without Web Crypto still gets one.
    for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

export function newWebId(): string {
  return toBase64Url(randomBytes());
}

export function isWebId(value: unknown): value is string {
  return typeof value === 'string' && ID_PATTERN.test(value);
}

export function isMachineId(value: unknown): value is string {
  return typeof value === 'string' && MACHINE_ID_PATTERN.test(value);
}

// The ingest rejects a whole batch over one bad field, so a malformed event is shaped or dropped here.
export function toWebEvent(input: WebEventDetails & { id: string; type: WebEventType; at: string }): WebEvent | null {
  const { id, type, at, machineId, place } = input;
  const promo = PROMO_TYPES.has(type);
  if (promo && !place) return null;
  return {
    id,
    type,
    at,
    ...(isMachineId(machineId) ? { machineId } : {}),
    ...(promo && place ? { place } : {}),
  };
}

export function toBatches(visit: WebVisit, events: WebEvent[]): WebEventBatch[] {
  const batches: WebEventBatch[] = [];
  for (let start = 0; start < events.length; start += MAX_BATCH_EVENTS) {
    batches.push({ ...visit, events: events.slice(start, start + MAX_BATCH_EVENTS) });
  }
  return batches;
}
