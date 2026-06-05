import { describe, it, expect } from 'vitest';
import { buildCpu, buildEnc, buildPkt, buildCloudHops, PACKET_FRAGMENTS, decodeMiniFloat, buildRace, buildRouting, buildDns, buildLex, buildVm, invalidatedStages, toyHash, modpow, buildDiffieHellman, buildBTreeSearch, buildTransaction, buildCache, buildAddressTranslation, buildSyscall, buildDynamicArray, buildHashMap, twosValue, buildTwosComplement, buildFloatGrid, buildFloatSum } from './widgets.js';

const popcount = (n) => { let c = 0; n >>>= 0; while (n) { c += n & 1; n >>>= 1; } return c; };

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

describe('decodeMiniFloat (toy 8-bit IEEE-754)', () => {
  // bits are [s, e3,e2,e1,e0, m2,m1,m0]
  it('decodes a normal number: 0 0111 100 → 1.5', () => {
    const r = decodeMiniFloat([0, 0, 1, 1, 1, 1, 0, 0]);
    expect(r.kind).toBe('normal');
    expect(r.value).toBe(1.5); // 1.100b × 2^0
  });

  it('applies the sign and exponent: 1 0110 000 → −0.5', () => {
    expect(decodeMiniFloat([1, 0, 1, 1, 0, 0, 0, 0]).value).toBe(-0.5); // −1.0 × 2^(6−7)
  });

  it('zero is subnormal with value 0', () => {
    const r = decodeMiniFloat([0, 0, 0, 0, 0, 0, 0, 0]);
    expect(r.kind).toBe('subnormal');
    expect(r.value).toBe(0);
  });

  it('smallest positive subnormal is 1/8 × 2^-6', () => {
    expect(decodeMiniFloat([0, 0, 0, 0, 0, 0, 0, 1]).value).toBeCloseTo((1 / 8) * 2 ** -6, 12);
  });

  it('exponent all ones → infinity (m=0) or NaN (m≠0)', () => {
    expect(decodeMiniFloat([0, 1, 1, 1, 1, 0, 0, 0])).toMatchObject({ kind: 'inf', value: Infinity });
    expect(decodeMiniFloat([1, 1, 1, 1, 1, 0, 0, 0]).value).toBe(-Infinity);
    expect(decodeMiniFloat([0, 1, 1, 1, 1, 1, 0, 0]).kind).toBe('nan');
  });

});

describe('buildRace (concurrency)', () => {
  it('without a lock, a bad interleaving loses an update → counter ends at 1', () => {
    const steps = buildRace({ locked: false });
    expect(steps.at(-1).counter).toBe(1); // two increments, one lost
    expect(steps.some((s) => s.lost)).toBe(true);
  });

  it('with a lock, the critical section is serialized → counter ends at 2', () => {
    const steps = buildRace({ locked: true });
    expect(steps.at(-1).counter).toBe(2);
    expect(steps.some((s) => s.lost)).toBe(false);
    // only one thread ever holds the lock at a time (never both, never overlapping)
    expect(steps.every((s) => s.held === null || s.held === 'A' || s.held === 'B')).toBe(true);
  });
});

describe('buildRouting (IP + TTL)', () => {
  const { nodes, steps } = buildRouting();
  it('decrements TTL exactly once per hop and delivers at the last node', () => {
    expect(steps[0].ttl).toBe(6);
    const last = steps.at(-1);
    expect(last.at).toBe(nodes.length - 1);
    expect(last.delivered).toBe(true);
    expect(last.ttl).toBe(6 - (nodes.length - 1)); // one hop per node after the source
  });
  it('only the final step is a delivery', () => {
    expect(steps.filter((s) => s.delivered)).toHaveLength(1);
  });
});

describe('buildDns (resolver walk)', () => {
  const steps = buildDns();
  it('walks root → TLD → authoritative and ends with the IP', () => {
    expect(steps.map((s) => s.kind)).toEqual(['ask', 'referral', 'referral', 'answer', 'cache']);
    expect(steps.find((s) => s.kind === 'answer').answer).toBe('93.184.216.34');
    expect(steps.at(-1).answer).toBe('93.184.216.34'); // resolver returns the cached IP
  });
});

describe('buildLex (tokenizer)', () => {
  const steps = buildLex();
  it('turns "3 + 4 * 2" into 5 tokens, skipping whitespace', () => {
    const toks = steps.at(-1).tokens;
    expect(toks.map((t) => t.text)).toEqual(['3', '+', '4', '*', '2']);
    expect(toks.map((t) => t.type)).toEqual(['num', 'plus', 'num', 'star', 'num']);
  });
});

describe('buildVm (stack machine)', () => {
  const steps = buildVm();
  it('evaluates 3 + 4 * 2 = 11 with × binding tighter', () => {
    expect(steps.at(-1).result).toBe(11);
    expect(steps.at(-1).stack).toEqual([11]);
  });
  it('the operand stack peaks at 3 entries (PUSH 3, 4, 2)', () => {
    expect(Math.max(...steps.map((s) => s.stack.length))).toBe(3);
  });
});

describe('invalidatedStages (render pipeline)', () => {
  it('a geometry change re-runs Layout, Paint, and Composite', () => {
    expect(invalidatedStages('layout').map((s) => s.rerun)).toEqual([true, true, true]);
  });
  it('a paint-only change skips Layout', () => {
    expect(invalidatedStages('paint').map((s) => s.rerun)).toEqual([false, true, true]);
  });
  it('transform/opacity only re-composite (the cheap GPU path)', () => {
    const r = invalidatedStages('composite');
    expect(r.map((s) => s.rerun)).toEqual([false, false, true]);
    expect(r.filter((s) => s.rerun)).toHaveLength(1);
  });
});

describe('toyHash (avalanche)', () => {
  it('is deterministic and 8 hex chars', () => {
    expect(toyHash('hello')).toBe(toyHash('hello'));
    expect(toyHash('hello')).toMatch(/^[0-9a-f]{8}$/);
  });
  it('a one-character change flips many output bits (avalanche)', () => {
    const diff = popcount(parseInt(toyHash('hello'), 16) ^ parseInt(toyHash('hellp'), 16));
    expect(diff).toBeGreaterThanOrEqual(8); // out of 32; a good hash averages ~16
  });
});

describe('Diffie–Hellman key exchange', () => {
  it('modpow is correct (5^6 mod 23 = 8, 5^15 mod 23 = 19)', () => {
    expect(modpow(5, 6, 23)).toBe(8);
    expect(modpow(5, 15, 23)).toBe(19);
  });
  it('both parties derive the same shared secret without sending it', () => {
    const last = buildDiffieHellman().at(-1);
    expect(last.alice.shared).toBe(last.bob.shared);
    expect(last.alice.shared).toBe(2);
    // the secret is never on the wire — only A and B are
    expect(buildDiffieHellman().every((s) => s.wire === null || /^[AB] =/.test(s.wire))).toBe(true);
  });
});

describe('buildBTreeSearch (index lookup)', () => {
  it('finds key 10 by descending root → right-middle leaf in 2 node reads', () => {
    const last = buildBTreeSearch({ target: 10 }).at(-1);
    expect(last.found).toBe(true);
    expect(last.foundKey).toBe(10);
    expect(last.path).toEqual(['root', 'n2']);
  });
});

describe('buildTransaction (ACID atomicity)', () => {
  it('a transaction rolls back the crash — total preserved (350)', () => {
    const last = buildTransaction({ atomic: true }).at(-1);
    expect(last.total).toBe(350);
    expect(last.A).toBe(300);
  });
  it('without a transaction the debit sticks — $100 lost (total 250)', () => {
    const steps = buildTransaction({ atomic: false });
    expect(steps.at(-1).total).toBe(250);
    expect(steps.some((s) => s.lost)).toBe(true);
  });
});

describe('buildCache (locality + eviction)', () => {
  const steps = buildCache();
  it('spatial locality: one miss per line, then neighbours hit', () => {
    const last = steps.at(-1);
    expect(last.hits).toBe(3); // 1,2,3 hit after line 0 loads
    expect(last.misses).toBe(6);
  });
  it('an evicted line misses again (capacity miss): address 0 misses twice', () => {
    expect(steps.filter((s) => s.addr === 0 && s.hit === false)).toHaveLength(2);
  });
});

describe('buildAddressTranslation (virtual memory)', () => {
  const steps = buildAddressTranslation();
  it('translates 42 → physical 122 via a page-table walk', () => {
    const done = steps.find((s) => s.vaddr === 42 && s.phys !== undefined);
    expect(done.phys).toBe(122); // page 2 → frame 7; 7*16 + 10
  });
  it('a second access to the same page is a TLB hit', () => {
    expect(steps.some((s) => s.tlbHit === true)).toBe(true);
    const second = steps.find((s) => s.vaddr === 40 && s.phys !== undefined);
    expect(second.phys).toBe(120); // frame 7; 7*16 + 8
  });
});

describe('buildDynamicArray (amortized growth)', () => {
  const steps = buildDynamicArray(); // n = 8
  const last = steps[steps.length - 1];
  it('ends at length 8 in a capacity-8 block — the last append fills it exactly, no wasted doubling', () => {
    expect(last.len).toBe(8);
    expect(last.cap).toBe(8);
  });
  it('doubles capacity at 1→2→4→8 (three growths)', () => {
    const caps = [...new Set(steps.map((s) => s.cap))];
    expect(caps).toEqual([1, 2, 4, 8]);
    expect(steps.filter((s) => s.grew)).toHaveLength(3);
  });
  it('total copies (7) stay below 2n — that is the amortization', () => {
    expect(last.copies).toBe(7);
    expect(last.copies).toBeLessThan(2 * 8);
  });
});

describe('buildHashMap (separate chaining)', () => {
  const steps = buildHashMap();
  const last = steps[steps.length - 1];
  it('"cat" and "bird" collide into the same bucket (a chain of 2)', () => {
    const inserts = steps.filter((s) => s.op === 'insert');
    expect(inserts.filter((s) => s.collision)).toHaveLength(1); // only bird collides
    const catBucket = inserts.find((s) => s.key === 'cat').bucket;
    const birdBucket = inserts.find((s) => s.key === 'bird').bucket;
    expect(birdBucket).toBe(catBucket);
    expect(last.table[catBucket]).toContain('cat');
    expect(last.table[catBucket]).toContain('bird');
  });
  it('looking up "bird" hashes to its bucket and finds it', () => {
    expect(last.op).toBe('lookup');
    expect(last.found).toBe(true);
  });
  it('every key lands in some bucket (none lost)', () => {
    const total = last.table.reduce((n, b) => n + b.length, 0);
    expect(total).toBe(6);
  });
});

describe('twosValue + buildTwosComplement (signed integers)', () => {
  it('reads the top bit as a negative place value', () => {
    expect(twosValue([0, 1, 0, 1])).toBe(5);   // 0101
    expect(twosValue([1, 0, 1, 1])).toBe(-5);  // 1011
    expect(twosValue([1, 0, 0, 0])).toBe(-8);  // most negative in 4 bits
    expect(twosValue([0, 1, 1, 1])).toBe(7);   // most positive in 4 bits
  });
  const steps = buildTwosComplement(); // negate +5 in 4 bits
  it('flip-and-add-one turns +5 (0101) into −5 (1011)', () => {
    const neg = steps[3]; // intro, +5, invert, +1
    expect(neg.bits).toEqual([1, 0, 1, 1]);
    expect(neg.value).toBe(-5);
  });
  it('demonstrates the overflow wraparound: +7 + 1 = −8', () => {
    const wrap = steps.find((s) => s.overflow);
    expect(wrap.bits).toEqual([1, 0, 0, 0]);
    expect(wrap.value).toBe(-8);
  });
});

describe('buildFloatGrid (the uneven grid)', () => {
  const steps = buildFloatGrid();
  it('the gap between representable values doubles each octave', () => {
    const gapAt = (lo) => steps.find((s) => s.lo === lo && s.gap != null).gap;
    expect(gapAt(1)).toBeCloseTo(0.125, 9);
    expect(gapAt(2)).toBeCloseTo(0.25, 9);
    expect(gapAt(4)).toBeCloseTo(0.5, 9);
  });
  it('lists representable values in ascending order, all within (0, 8]', () => {
    const { values } = steps[0];
    expect(values).toContain(1);
    expect(values).toContain(2);
    expect(values[0]).toBeGreaterThan(0);
    expect(values[values.length - 1]).toBeLessThanOrEqual(8);
    expect([...values].sort((a, b) => a - b)).toEqual(values);
  });
});

describe('buildFloatSum (0.1 + 0.2 ≠ 0.3)', () => {
  const steps = buildFloatSum();
  it('the stored sum differs from the stored 0.3', () => {
    const sum = steps.find((s) => s.label === '0.1 + 0.2').stored;
    const point3 = steps.find((s) => s.label === '0.3').stored;
    expect(sum).not.toBe(point3);
    expect(sum).toContain('0.30000000000000004');
  });
  it('concludes that the equality is false', () => {
    expect(steps[steps.length - 1].equal).toBe(false);
  });
});

describe('buildSyscall (user/kernel boundary)', () => {
  const steps = buildSyscall();
  it('starts and ends in user mode', () => {
    expect(steps[0].mode).toBe('user');
    expect(steps[steps.length - 1].mode).toBe('user');
  });
  it('crosses into the kernel to do the privileged I/O, and blocks there', () => {
    expect(steps.some((s) => s.mode === 'kernel')).toBe(true);
    expect(steps.some((s) => s.blocked)).toBe(true);
  });
  it('switches mode exactly twice — trap in, return-from-trap out', () => {
    expect(steps.filter((s) => s.switched)).toHaveLength(2);
  });
});

describe('decodeMiniFloat spacing', () => {
  it('representable steps are non-uniform (the "lie"): the gap doubles each octave', () => {
    // 1.0 (0 0111 000) → next code 0 0111 001 is 1.125; gap 0.125
    const a = decodeMiniFloat([0, 0, 1, 1, 1, 0, 0, 0]).value; // 1.0
    const b = decodeMiniFloat([0, 0, 1, 1, 1, 0, 0, 1]).value; // 1.125
    // 2.0 (0 1000 000) → next 0 1000 001 is 2.25; gap 0.25 (twice as coarse)
    const c = decodeMiniFloat([0, 1, 0, 0, 0, 0, 0, 0]).value; // 2.0
    const d = decodeMiniFloat([0, 1, 0, 0, 0, 0, 0, 1]).value; // 2.25
    expect(b - a).toBeCloseTo(0.125, 12);
    expect(d - c).toBeCloseTo(0.25, 12);
  });
});
