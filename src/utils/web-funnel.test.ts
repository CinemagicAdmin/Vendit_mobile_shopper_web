import { describe, expect, it } from 'vitest';
import { MAX_BATCH_EVENTS, isMachineId, isWebId, newWebId, toBatches, toWebEvent, type WebEvent } from '@/utils/web-funnel';

const AT = '2026-11-22T10:00:00.000Z';
const VISIT = { visitorId: 'V'.repeat(22), visitId: 'S'.repeat(22), platform: 'ios' as const };

describe('newWebId', () => {
  it('is 16 random bytes as 22 base64url characters', () => {
    const ids = Array.from({ length: 50 }, newWebId);
    ids.forEach((id) => expect(id).toMatch(/^[A-Za-z0-9_-]{22}$/));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every(isWebId)).toBe(true);
  });

  it('rejects ids the ingest would reject', () => {
    expect(isWebId('short')).toBe(false);
    expect(isWebId('A'.repeat(65))).toBe(false);
    expect(isWebId('has spaces in it okay')).toBe(false);
    expect(isWebId(null)).toBe(false);
  });
});

describe('toWebEvent', () => {
  it('keeps the machine id and drops a place on a page event', () => {
    expect(toWebEvent({ id: 'e1', type: 'menu_viewed', at: AT, machineId: 'VM-0042', place: 'machine' })).toEqual({
      id: 'e1',
      type: 'menu_viewed',
      at: AT,
      machineId: 'VM-0042',
    });
  });

  it('keeps the place on a promo event and omits an unknown machine', () => {
    expect(toWebEvent({ id: 'e2', type: 'promo_clicked', at: AT, machineId: null, place: 'general' })).toEqual({
      id: 'e2',
      type: 'promo_clicked',
      at: AT,
      place: 'general',
    });
  });

  it('drops a promo event without a place', () => {
    expect(toWebEvent({ id: 'e3', type: 'promo_viewed', at: AT })).toBeNull();
  });

  it('omits a machine id the ingest would reject instead of losing the batch', () => {
    expect(isMachineId('VM 42')).toBe(false);
    expect(isMachineId('M'.repeat(65))).toBe(false);
    expect(toWebEvent({ id: 'e4', type: 'checkout_viewed', at: AT, machineId: 'VM 42' })).toEqual({
      id: 'e4',
      type: 'checkout_viewed',
      at: AT,
    });
  });
});

describe('toBatches', () => {
  const events: WebEvent[] = Array.from({ length: 45 }, (_, index) => ({ id: `e${index}`, type: 'menu_viewed', at: AT }));

  it('splits into requests of at most 20 events, each carrying the visit', () => {
    const batches = toBatches(VISIT, events);
    expect(batches.map((batch) => batch.events.length)).toEqual([MAX_BATCH_EVENTS, MAX_BATCH_EVENTS, 5]);
    batches.forEach((batch) => expect(batch).toMatchObject(VISIT));
    expect(batches.flatMap((batch) => batch.events)).toEqual(events);
  });

  it('sends nothing for no events', () => {
    expect(toBatches(VISIT, [])).toEqual([]);
  });
});
