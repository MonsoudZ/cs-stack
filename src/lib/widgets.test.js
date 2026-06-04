import { describe, it, expect } from 'vitest';
import { buildCpu, buildEnc, buildPkt, buildCloudHops, PACKET_FRAGMENTS } from './widgets.js';

const sum = (arr) => arr.reduce((a, b) => a + b, 0);

describe('buildCpu', () => {
  const steps = buildCpu();

  it('starts cleared and ends halted with A = 5 + 3 − 2 = 6, output "6"', () => {
    expect(steps[0]).toMatchObject({ PC: 0, A: 0, B: 0, out: '' });
    const last = steps.at(-1);
    expect(last.note).toMatch(/HALT/);
    expect(last.A).toBe(6);
    expect(last.out).toBe('6');
  });

  it('computes each instruction in order (ADD → 8, SUB → 6, OUT prints A)', () => {
    expect(steps.find((s) => s.note.startsWith('ADD')).A).toBe(8);
    expect(steps.find((s) => s.note.startsWith('SUB')).A).toBe(6);
    expect(steps.find((s) => s.note.includes('output')).out).toBe('6');
  });

  it('emits one snapshot per instruction plus the initial ready state', () => {
    expect(steps).toHaveLength(8); // ready + 6 ops executed + HALT
  });
});

describe('buildEnc', () => {
  const steps = buildEnc();

  it('nests headers down then unwraps up, symmetric 22-byte payload at both ends', () => {
    expect(steps.map((s) => s.bytes)).toEqual([22, 42, 62, 80, 80, 62, 42, 22, 22]);
    expect(steps[0].segs).toHaveLength(1);
    expect(steps.at(-1).segs).toHaveLength(1);
    expect(steps[0].segs[0].bytes).toBe(22);
  });

  it('peaks at 80 bytes on the wire (22 payload + 58 of headers/trailer)', () => {
    const wire = steps.find((s) => s.side === '⇄ the wire');
    expect(wire.bytes).toBe(80);
    expect(wire.bytes - 22).toBe(58);
  });

  it('goes down on the sender then up on the receiver', () => {
    expect(steps.slice(0, 4).every((s) => s.side === 'sender ↓')).toBe(true);
    expect(steps.slice(5).every((s) => s.side === 'receiver ↑')).toBe(true);
  });
});

describe('buildPkt', () => {
  const steps = buildPkt();

  it('drops packets 2 and 5 in transit', () => {
    const dropped = steps.filter((s) => s.flight?.status === 'drop').map((s) => s.flight.seq);
    expect(dropped).toEqual([2, 5]);
  });

  it('leaves slots 2 and 5 empty before retransmission', () => {
    const gaps = steps.find((s) => s.note.includes('asks the sender to resend'));
    expect(gaps.slots[1]).toBeNull();
    expect(gaps.slots[4]).toBeNull();
    expect(gaps.slots.filter((x) => x !== null)).toHaveLength(4);
  });

  it('delivers exactly once, reassembling the original request in order', () => {
    const delivered = steps.filter((s) => s.delivered);
    expect(delivered).toHaveLength(1);
    expect(delivered[0]).toBe(steps.at(-1));
    expect(delivered[0].slots.join('')).toBe('GET /cases/42 HTTP/1.1');
    expect(PACKET_FRAGMENTS.join('')).toBe('GET /cases/42 HTTP/1.1');
  });
});

describe('buildCloudHops', () => {
  it('cache MISS hits Postgres; cache HIT skips it', () => {
    const miss = buildCloudHops({ cacheHit: false });
    const hit = buildCloudHops({ cacheHit: true });
    expect(miss.some((h) => h.loc === 'pg')).toBe(true);
    expect(hit.some((h) => h.loc === 'pg')).toBe(false);
  });

  it('miss is slower than hit by the ~20ms DB hop (37ms vs 16ms perceived)', () => {
    const lat = (hops) => sum(hops.filter((h) => !h.async).map((h) => h.ms));
    expect(lat(buildCloudHops({ cacheHit: false }))).toBe(37);
    expect(lat(buildCloudHops({ cacheHit: true }))).toBe(16);
  });

  it('excludes the async Sidekiq job from perceived latency', () => {
    const hops = buildCloudHops({ cacheHit: true });
    expect(hops.at(-1)).toMatchObject({ loc: 'sidekiq', async: true, ms: 0 });
    expect(hops.filter((h) => h.async)).toHaveLength(1);
  });

  it('round-robins the app server index into the note', () => {
    expect(buildCloudHops({ server: 0 }).some((h) => h.note.includes('app server #1'))).toBe(true);
    expect(buildCloudHops({ server: 2 }).some((h) => h.note.includes('app server #3'))).toBe(true);
  });
});
