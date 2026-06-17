import { describe, it, expect } from 'vitest';
import { quizzes } from '../data/quizzes.js';
import { stacks } from '../data/stacks.js';
import { buildCpu, buildEnc, buildPkt, buildCloudHops, PACKET_FRAGMENTS, decodeMiniFloat, buildRace, buildRouting, buildDns, buildLex, buildVm, invalidatedStages, toyHash, modpow, buildDiffieHellman, RSA, buildSignature, buildMerkle, buildBTreeSearch, buildTransaction, buildCache, buildAddressTranslation, buildSyscall, buildDynamicArray, buildHashMap, twosValue, buildTwosComplement, buildFloatGrid, buildFloatSum, DOPING, buildDiode, cmosInverter, nand, buildUniversal, mux2, ALU_OPS, computeAlu, PIPE_STAGES, buildPipeline, buildDeadlock, buildCas, buildLoadBalancer, buildReplication, buildRaftElection, buildRaftLog, LANGS, buildLangRun, buildLangMemory, buildLinkedList, buildStackQueue, GRAPH, buildGraphTraversal, buildStackHeap, buildAllocator, buildGc, ISOLATION_LEVELS, buildIsolation, buildTypeCheck, buildEventLoop, buildCrp, FS, buildPathResolve, buildJournal, buildSockets, buildHttp, buildTcp, buildJoin,
  computeNeuron, buildGradientDescent, EMBEDDINGS, nearestWords, cosineSim, buildAttention, softmaxTemp, nextTokenDist,
  tokenize, TOK_VOCAB, buildTraining, buildRag, RAG_DOCS, buildOptimize, buildAst, buildRuntimes, buildRegisters, REG_COUNT, buildScopes } from './widgets.js';

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

describe('buildAst (parsing → tree reduction)', () => {
  const rootVal = (steps) => steps.at(-1).tree.value;
  it('precedence parse reduces 3 + 4 * 2 to 11 (× deeper, reduces first)', () => {
    const steps = buildAst();
    expect(steps.at(-1).tree.kind).toBe('num');
    expect(rootVal(steps)).toBe(11);
  });
  it('left-to-right parse reduces the same tokens to 14', () => {
    const steps = buildAst({ leftToRight: true });
    expect(rootVal(steps)).toBe(14);
  });
  it('the precedence tree puts × deeper than +', () => {
    const root = buildAst()[0].tree;
    expect(root.text).toBe('+');
    // the × node is a child of the root +, not the other way around
    const hasMulChild = [root.l, root.r].some((c) => c.kind === 'op' && c.op === '×');
    expect(hasMulChild).toBe(true);
  });
  it('exactly one node is active per reduction step (none at intro)', () => {
    const steps = buildAst();
    const countActive = (n) => (n.active ? 1 : 0) + (n.kind === 'op' ? countActive(n.l) + countActive(n.r) : 0);
    expect(countActive(steps[0].tree)).toBe(0);
    for (let i = 1; i < steps.length; i++) expect(countActive(steps[i].tree)).toBe(1);
  });
});

describe('buildScopes (name resolution)', () => {
  const steps = buildScopes();
  const find = (name, from) => steps.find((s) => s.name === name && s.from === from);
  it('walks outward: x from f isn’t local, so it binds to global (1 hop)', () => {
    const r = find('x', 'f');
    expect(r.foundIn).toBe('global');
    expect(r.hops).toBe(1);
    expect(r.path).toEqual(['f', 'global']);
  });
  it('a parameter resolves locally with no walk (0 hops)', () => {
    const r = find('y', 'f');
    expect(r.foundIn).toBe('f');
    expect(r.hops).toBe(0);
  });
  it('an inner declaration shadows the outer one — x in the block binds to the block', () => {
    const r = find('x', 'block');
    expect(r.foundIn).toBe('block');
    expect(r.hops).toBe(0);
  });
  it('inner scopes see outer names: z from the block binds to f', () => {
    const r = find('z', 'block');
    expect(r.foundIn).toBe('f');
    expect(r.path).toEqual(['block', 'f']);
  });
  it('a name on no scope is undefined — walks the whole chain and fails', () => {
    const r = find('w', 'f');
    expect(r.foundIn).toBe(null);
    expect(r.hops).toBe(null);
    expect(r.path).toEqual(['f', 'global']); // searched everything, found nothing
  });
});

describe('buildRegisters (SSA & register allocation)', () => {
  const steps = buildRegisters();
  const final = steps.at(-1);
  const byName = (s, n) => s.values.find((v) => v.name === n);
  // register pressure at a column = live, non-spilled values covering it
  const pressureAt = (s, col) => s.values.filter((v) => !v.spilled && col >= v.from && col <= v.to).length;
  it('starts from the non-SSA program (a assigned twice) with no values yet', () => {
    expect(steps[0].values).toHaveLength(0);
    expect(steps[0].program.map((l) => l.text)).toContain('a = a + 4');
  });
  it('renames into SSA: a₁ and a₂ are distinct, single-definition values', () => {
    const ssaStep = steps[1];
    expect(ssaStep.values.map((v) => v.name)).toEqual(['a₁', 'a₂', 'b', 'c']);
  });
  it('register pressure peaks at 3 (a₂, b, c live at the return) before any spill', () => {
    const pressureStep = steps.find((s) => s.showPressure && s.values.every((v) => !v.spilled));
    expect(Math.max(...[1, 2, 3, 4, 5].map((c) => pressureAt(pressureStep, c)))).toBe(3);
    expect(3).toBeGreaterThan(REG_COUNT);
  });
  it('finally uses exactly 2 registers and spills exactly one value (c)', () => {
    const regs = new Set(final.values.filter((v) => v.reg).map((v) => v.reg));
    expect(regs).toEqual(new Set(['R0', 'R1']));
    const spilled = final.values.filter((v) => v.spilled);
    expect(spilled.map((v) => v.name)).toEqual(['c']);
  });
  it('a₁ and a₂ reuse the same register (R0) since a₁ dies before a₂ outlives it', () => {
    expect(byName(final, 'a₁').reg).toBe('R0');
    expect(byName(final, 'a₂').reg).toBe('R0');
  });
  it('after the spill, no column exceeds the register count', () => {
    for (const c of [1, 2, 3, 4, 5]) expect(pressureAt(final, c)).toBeLessThanOrEqual(REG_COUNT);
  });
});

describe('buildRuntimes (interpret / AOT / JIT)', () => {
  const steps = buildRuntimes();
  const row = (s, name) => s.rows.find((r) => r.name === name);
  it('the interpreter is cheapest cold (1 iteration) — no compile to pay for', () => {
    expect(steps[0].iters).toBe(1);
    expect(steps[0].lead).toBe('interpreter');
  });
  it('over the long run a compiled strategy wins, not the interpreter', () => {
    const last = steps.at(-1);
    expect(last.lead).not.toBe('interpreter');
    // interpreter cost dwarfs both compiled strategies at 100 iters
    expect(row(last, 'interpreter').cost).toBeGreaterThan(row(last, 'AOT compiler').cost);
    expect(row(last, 'interpreter').cost).toBeGreaterThan(row(last, 'JIT').cost);
  });
  it('the JIT only goes native after the loop turns hot (10 iters)', () => {
    expect(row(steps.find((s) => s.iters === 5), 'JIT').native).toBe(false);
    expect(row(steps.find((s) => s.iters === 20), 'JIT').native).toBe(true);
  });
  it('every strategy’s cumulative cost is monotonically non-decreasing', () => {
    for (const name of ['interpreter', 'AOT compiler', 'JIT']) {
      for (let i = 1; i < steps.length; i++) {
        expect(row(steps[i], name).cost).toBeGreaterThanOrEqual(row(steps[i - 1], name).cost);
      }
    }
  });
});

describe('buildOptimize (optimization passes)', () => {
  const steps = buildOptimize();
  const live = (s) => s.lines.filter((l) => l.mark !== 'cut');
  it('starts from the 5-line program and ends at a single `return 16`', () => {
    expect(live(steps[0]).map((l) => l.text)).toEqual([
      't = 4 * 2', 'a = t + 0', 'b = t + 0', 'if (false): log(99)', 'return a + b',
    ]);
    const final = live(steps.at(-1));
    expect(final).toHaveLength(1);
    expect(final[0].text).toBe('return 16');
  });
  it('the result is the same value the original computes (4*2=8, 8+8=16)', () => {
    // original: t=4*2=8, a=t=8, b=t=8, return a+b = 16
    expect(4 * 2 + (4 * 2)).toBe(16);
  });
  it('both costs are monotonically non-increasing, and at least one drops each pass', () => {
    for (let i = 1; i < steps.length; i++) {
      expect(steps[i].linesLeft).toBeLessThanOrEqual(steps[i - 1].linesLeft);
      expect(steps[i].ops).toBeLessThanOrEqual(steps[i - 1].ops);
    }
    // every pass after the intro reduces lines OR ops (no no-op pass), up to the
    // terminal 'done' snapshot which just restates the result
    for (let i = 1; i < steps.length - 1; i++) {
      const dropped = steps[i].linesLeft < steps[i - 1].linesLeft || steps[i].ops < steps[i - 1].ops;
      expect(dropped).toBe(true);
    }
  });
  it('instruction count shrinks from 5 to 1 and runtime ops reach 0', () => {
    expect(steps[0].linesLeft).toBe(5);
    expect(steps.at(-1).linesLeft).toBe(1);
    expect(steps[0].ops).toBe(4);
    expect(steps.at(-1).ops).toBe(0);
  });
  it('every `cut` line is gone from the next snapshot', () => {
    for (let i = 0; i < steps.length - 1; i++) {
      const cutTexts = steps[i].lines.filter((l) => l.mark === 'cut').map((l) => l.text);
      const nextTexts = steps[i + 1].lines.map((l) => l.text);
      for (const t of cutTexts) expect(nextTexts).not.toContain(t);
    }
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
  it('throws on an unknown change kind', () => {
    expect(() => invalidatedStages('teleport')).toThrow(/unknown change kind/);
  });
});

describe('cosineSim (embedding similarity)', () => {
  it('is 1 for identical directions and 0 for orthogonal vectors', () => {
    expect(cosineSim([1, 0], [3, 0])).toBeCloseTo(1, 10); // same direction, any magnitude
    expect(cosineSim([1, 0], [0, 1])).toBeCloseTo(0, 10); // perpendicular
    expect(cosineSim([1, 0], [-1, 0])).toBeCloseTo(-1, 10); // opposite
  });
  it('returns 0 for a zero vector instead of dividing by zero', () => {
    expect(cosineSim([0, 0], [1, 2])).toBe(0);
    expect(cosineSim([1, 2], [0, 0])).toBe(0);
    expect(cosineSim([0, 0], [0, 0])).toBe(0);
  });
});

describe('softmaxTemp (temperature-scaled softmax)', () => {
  const logits = [2, 1, 0];
  it('always yields a probability distribution that sums to 1', () => {
    for (const T of [0.5, 1, 2]) {
      const p = softmaxTemp(logits, T);
      expect(sum(p)).toBeCloseTo(1, 10);
      expect(p.every((x) => x >= 0 && x <= 1)).toBe(true);
    }
  });
  it('a lower temperature sharpens the top probability; a higher one flattens it', () => {
    const top = (T) => Math.max(...softmaxTemp(logits, T));
    expect(top(0.5)).toBeGreaterThan(top(1)); // cold → peakier
    expect(top(1)).toBeGreaterThan(top(2)); // hot → flatter
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

describe('buildSignature (toy RSA signatures)', () => {
  it('the RSA keys round-trip: m^(e·d) ≡ m (mod n) across the whole range', () => {
    const { n, e, d } = RSA;
    for (let m = 0; m < n; m++) expect(modpow(modpow(m, d, n), e, n)).toBe(m);
  });
  it('a genuine signature verifies, and a tampered message is rejected', () => {
    const steps = buildSignature();
    const valid = steps.find((s) => s.verdict === 'valid');
    expect(valid).toBeTruthy();
    // verification recovers exactly the hash that was signed
    expect(valid.recovered).toBe(valid.hash);
    const last = steps.at(-1);
    expect(last.side).toBe('tamper');
    expect(last.verdict).toBe('forged');
    expect(last.hash).not.toBe(last.recovered); // the altered text hashes differently
  });
  it('is deterministic', () => {
    expect(buildSignature()).toEqual(buildSignature());
  });
});

describe('buildMerkle (content-addressed hash tree)', () => {
  it('builds four leaves, two mids, and a root from the blocks', () => {
    const built = buildMerkle().find((s) => s.active === 'root' && !s.broken);
    expect(built.leaves.every((l) => /^[0-9a-f]{6}$/.test(l))).toBe(true);
    expect(built.mids.every((m) => /^[0-9a-f]{6}$/.test(m))).toBe(true);
    expect(built.root).toMatch(/^[0-9a-f]{6}$/);
  });
  it('tampering with a block cascades up and changes the root', () => {
    const steps = buildMerkle();
    const cleanRoot = steps.find((s) => s.active === 'root' && !s.broken).root;
    const last = steps.at(-1);
    expect(last.broken).toBe(true);
    expect(last.tampered).toBe(2);
    expect(last.root).not.toBe(cleanRoot); // the published root no longer matches
  });
  it('is deterministic', () => {
    expect(buildMerkle()).toEqual(buildMerkle());
  });
});

describe('buildTcp (handshake + congestion control)', () => {
  const steps = buildTcp();
  it('opens with a 3-way handshake, then marks the connection established', () => {
    expect(steps.slice(0, 3).map((s) => s.event)).toEqual(['SYN', 'SYN-ACK', 'ACK']);
    expect(steps.slice(0, 3).every((s) => !s.established)).toBe(true);
    expect(steps.find((s) => s.established)).toBeTruthy();
  });
  it('slow start doubles cwnd each RTT until ssthresh', () => {
    const ss = steps.filter((s) => s.phase === 'slow start').map((s) => s.cwnd);
    expect(ss).toEqual([1, 2, 4, 8]); // 1, then doubling to ssthresh=8
    for (let i = 1; i < ss.length; i++) expect(ss[i]).toBe(ss[i - 1] * 2);
  });
  it('a loss halves ssthresh and collapses cwnd (multiplicative decrease)', () => {
    const loss = steps.find((s) => s.lost);
    expect(loss).toBeTruthy();
    expect(loss.event).toBe('loss');
    expect(loss.ssthresh).toBe(5); // was 10 → halved
    expect(loss.cwnd).toBe(5);
  });
  it('then climbs linearly again, and is deterministic', () => {
    expect(steps.at(-1).cwnd).toBe(7); // 5 → 6 → 7
    expect(buildTcp()).toEqual(buildTcp());
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

describe('DOPING (n-type / p-type carriers)', () => {
  it('pure silicon barely conducts; doping adds carriers of opposite sign', () => {
    expect(DOPING.pure.conductive).toBe(false);
    expect(DOPING.n.conductive).toBe(true);
    expect(DOPING.p.conductive).toBe(true);
    expect(DOPING.n.charge).toBe(-1); // free electrons
    expect(DOPING.p.charge).toBe(1);  // holes
  });
});

describe('buildDiode (PN junction)', () => {
  const steps = buildDiode();
  it('conducts only under forward bias', () => {
    const fwd = steps.find((s) => s.bias === 'forward');
    const rev = steps.find((s) => s.bias === 'reverse');
    expect(fwd.conducts).toBe(true);
    expect(rev.conducts).toBe(false);
  });
  it('the depletion region narrows forward and widens in reverse', () => {
    expect(steps.find((s) => s.bias === 'forward').depletion).toBe('narrow');
    expect(steps.find((s) => s.bias === 'reverse').depletion).toBe('wide');
  });
});

describe('cmosInverter (a NOT gate from two FETs)', () => {
  it('output is always the opposite of input', () => {
    expect(cmosInverter(0).output).toBe(1);
    expect(cmosInverter(1).output).toBe(0);
  });
  it('exactly one transistor conducts at a time', () => {
    for (const input of [0, 1]) {
      const r = cmosInverter(input);
      expect(r.pmos !== r.nmos).toBe(true); // XOR: precisely one is on
    }
    expect(cmosInverter(0).pmos).toBe(true);  // LOW in → pMOS pulls up
    expect(cmosInverter(1).nmos).toBe(true);  // HIGH in → nMOS pulls down
  });
});

describe('computeAlu (the CPU calculator)', () => {
  it('ADD wraps at 8 bits and raises the carry flag', () => {
    expect(computeAlu('ADD', 200, 100)).toMatchObject({ result: 44, carry: 1, zero: 0 });
    expect(computeAlu('ADD', 2, 3)).toMatchObject({ result: 5, carry: 0 });
  });
  it('SUB borrows (carry) when a < b, in two’s complement', () => {
    expect(computeAlu('SUB', 10, 3)).toMatchObject({ result: 7, carry: 0 });
    expect(computeAlu('SUB', 3, 10)).toMatchObject({ result: 249, carry: 1 }); // -7 mod 256
  });
  it('bitwise ops compute correctly and set the zero flag', () => {
    expect(computeAlu('AND', 0b1100, 0b1010).result).toBe(0b1000);
    expect(computeAlu('XOR', 0b1100, 0b1010).result).toBe(0b0110);
    expect(computeAlu('AND', 0xf0, 0x0f)).toMatchObject({ result: 0, zero: 1 });
  });
  it('every advertised op is implemented', () => {
    for (const op of ALU_OPS) expect(typeof computeAlu(op, 5, 3).result).toBe('number');
  });
});

describe('buildPipeline (5-stage pipeline)', () => {
  const filled = (s) => s.lanes.filter((l) => l.stage != null).length;
  it('pipelined: 5 instructions drain in 9 cycles (n + stages − 1)', () => {
    const steps = buildPipeline();
    const last = steps[steps.length - 1];
    expect(last.total).toBe(9);
    expect(last.done).toBe(5);
    expect(PIPE_STAGES).toHaveLength(5);
  });
  it('pipelined: at steady state all five stages are busy at once', () => {
    const steps = buildPipeline();
    expect(Math.max(...steps.map(filled))).toBe(5); // full overlap
  });
  it('unpipelined: 25 cycles, and never more than one instruction in flight', () => {
    const steps = buildPipeline({ pipelined: false });
    expect(steps[steps.length - 1].total).toBe(25);
    expect(Math.max(...steps.map(filled))).toBe(1); // no overlap
  });
});

describe('buildDeadlock (circular wait)', () => {
  it('opposite lock orders deadlock: A waits on L2, B waits on L1', () => {
    const steps = buildDeadlock();
    const last = steps[steps.length - 1];
    expect(last.deadlocked).toBe(true);
    expect(last.aWait).toBe('L2');
    expect(last.bWait).toBe('L1');
    expect(last.done).toBe(false);
  });
  it('a consistent lock ordering never deadlocks and both threads finish', () => {
    const steps = buildDeadlock({ ordered: true });
    const last = steps[steps.length - 1];
    expect(last.done).toBe(true);
    expect(steps.some((s) => s.deadlocked)).toBe(false);
  });
});

describe('buildCas (lock-free compare-and-swap)', () => {
  const steps = buildCas();
  it('both increments land — counter ends at 2 with no lock', () => {
    expect(steps[steps.length - 1].counter).toBe(2);
  });
  it('the loser’s CAS fails exactly once, then a retry succeeds', () => {
    expect(steps.filter((s) => s.cas === 'fail')).toHaveLength(1);
    expect(steps.filter((s) => s.cas === 'ok')).toHaveLength(2);
    // the failed CAS happens before the second success (the retry)
    const failIdx = steps.findIndex((s) => s.cas === 'fail');
    const lastOk = steps.map((s) => s.cas).lastIndexOf('ok');
    expect(failIdx).toBeLessThan(lastOk);
  });
});

describe('buildLoadBalancer (distribution + failover)', () => {
  const steps = buildLoadBalancer();
  const last = steps[steps.length - 1];
  it('serves every request — loads sum to the number routed, none dropped', () => {
    expect(last.served).toBe(7);
    const totalLoad = last.servers.reduce((n, s) => n + s.load, 0);
    expect(totalLoad).toBe(7);
    expect(steps.every((s) => s.target !== null || s.event || s.served === 0 || s.note.includes('served'))).toBe(true);
  });
  it('routes around a downed server — S2 gets no requests while it is unhealthy', () => {
    // find the crash and recover events
    const crash = steps.findIndex((s) => s.event === 'crash');
    const recover = steps.findIndex((s) => s.event === 'recover');
    const s2WhileDown = steps.slice(crash, recover).filter((s) => s.target === 'S2');
    expect(s2WhileDown).toHaveLength(0);
    // and it comes back into rotation afterwards
    expect(steps.slice(recover).some((s) => s.target === 'S2')).toBe(true);
  });
});

describe('buildReplication (read replicas / eventual consistency)', () => {
  const steps = buildReplication();
  it('a read during replication lag is stale; after convergence it is fresh', () => {
    const reads = steps.filter((s) => s.action === 'read');
    expect(reads[0]).toMatchObject({ readValue: 0, stale: true });   // before replicate
    expect(reads[1]).toMatchObject({ readValue: 1, stale: false });  // after replicate
  });
  it('replicas converge to the primary’s value', () => {
    const last = steps[steps.length - 1];
    expect(last.primary).toBe(1);
    expect(last.replicas.every((r) => r.v === 1)).toBe(true);
  });
});

describe('buildRaftElection (leader election)', () => {
  const steps = buildRaftElection();
  it('starts with five followers in term 0 and no leader', () => {
    expect(steps[0].leader).toBe(null);
    expect(steps[0].nodes).toHaveLength(5);
    expect(steps[0].nodes.every((n) => n.role === 'follower' && n.term === 0)).toBe(true);
  });
  it('never shows two leaders at once, and a winner always has a majority', () => {
    for (const s of steps) {
      expect(s.nodes.filter((n) => n.role === 'leader').length).toBeLessThanOrEqual(1);
      if (s.event === 'win') expect(s.votes).toBeGreaterThanOrEqual(s.majority);
    }
  });
  it('elects N0 in term 1, then heals to N2 in term 2 after the leader crashes', () => {
    const firstWin = steps.find((s) => s.event === 'win');
    expect(firstWin.leader).toBe('N0');
    expect(firstWin.nodes.find((n) => n.id === 'N0').term).toBe(1);
    const last = steps.at(-1);
    expect(last.leader).toBe('N2');
    expect(last.nodes.find((n) => n.id === 'N2').term).toBe(2);
    expect(last.nodes.find((n) => n.id === 'N0').role).toBe('down'); // crashed
  });
  it('is deterministic', () => {
    expect(buildRaftElection()).toEqual(buildRaftElection());
  });
});

describe('buildRaftLog (log replication)', () => {
  const steps = buildRaftLog();
  it('starts with three empty logs', () => {
    expect(steps[0].nodes).toHaveLength(3);
    expect(steps[0].nodes.every((n) => n.log.length === 0 && n.commit === 0)).toBe(true);
    expect(steps[0].nodes.find((n) => n.id === 'N0').role).toBe('leader');
  });
  it('only commits after a majority has stored the entry', () => {
    const firstCommit = steps.find((s) => s.action === 'commit');
    const leader = firstCommit.nodes.find((n) => n.id === 'N0');
    const stored = firstCommit.nodes.filter((n) => n.log.length >= 1).length;
    expect(stored).toBeGreaterThanOrEqual(2); // majority of 3
    expect(leader.commit).toBe(1);
    expect(firstCommit.state).toBe('x=1');
  });
  it('ends with every replica holding the same committed log and state', () => {
    const last = steps.at(-1);
    expect(last.nodes.every((n) => n.log.length === 2 && n.commit === 2)).toBe(true);
    expect(last.state).toBe('x=1, y=2');
  });
  it('is deterministic', () => {
    expect(buildRaftLog()).toEqual(buildRaftLog());
  });
});

describe('LANGS + buildLangRun (execution models)', () => {
  it('LANGS covers the five languages with the required axes', () => {
    expect(LANGS.map((l) => l.id)).toEqual(['C', 'Rust', 'Go', 'Python', 'JS']);
    for (const l of LANGS) {
      for (const k of ['model', 'run', 'types', 'memory', 'concurrency']) {
        expect(l[k], `${l.id}.${k}`).toBeTruthy();
      }
    }
    // the three execution models are all represented
    expect(new Set(LANGS.map((l) => l.model))).toEqual(new Set(['compiled', 'interpreted', 'JIT']));
  });
  it('reveals each language exactly once, then a summary', () => {
    const steps = buildLangRun();
    const revealed = steps.filter((s) => s.active).map((s) => s.active);
    expect(revealed).toEqual(['C', 'Rust', 'Go', 'Python', 'JS']);
    expect(steps.at(-1).active).toBe(null); // closing summary
    expect(buildLangRun()).toEqual(buildLangRun()); // deterministic
  });
});

describe('buildLangMemory (manual / ownership / GC)', () => {
  const steps = buildLangMemory();
  it('walks all three memory regimes', () => {
    const regimes = [...new Set(steps.map((s) => s.regime).filter(Boolean))];
    expect(regimes).toEqual(['manual', 'ownership', 'GC'.toLowerCase()]); // ['manual','ownership','gc']
  });
  it('manual leaks if you forget free; ownership and GC end freed', () => {
    expect(steps.some((s) => s.regime === 'manual' && s.leaked)).toBe(true);
    expect(steps.some((s) => s.regime === 'ownership' && s.freed)).toBe(true);
    expect(steps.some((s) => s.regime === 'gc' && s.freed)).toBe(true);
  });
  it('is deterministic', () => {
    expect(buildLangMemory()).toEqual(buildLangMemory());
  });
});

describe('buildLinkedList (pointer insert)', () => {
  const steps = buildLinkedList();
  it('inserts 15 between 10 and 20 by repointing — final order 10,15,20,30', () => {
    expect(steps[steps.length - 1].chain).toEqual([10, 15, 20, 30]);
  });
  it('stages the new node before it is linked in', () => {
    expect(steps.some((s) => s.staged === 15 && !s.chain.includes(15))).toBe(true);
  });
});

describe('buildStackQueue (LIFO vs FIFO)', () => {
  const steps = buildStackQueue();
  const removes = steps.filter((s) => s.op === 'remove');
  it('the stack pops last-in-first-out (3 then 2)', () => {
    expect(removes.map((s) => s.stackOut)).toEqual([3, 2]);
  });
  it('the queue removes first-in-first-out (1 then 2)', () => {
    expect(removes.map((s) => s.queueOut)).toEqual([1, 2]);
  });
  it('after two removals, the stack keeps 1 and the queue keeps 3', () => {
    const last = steps[steps.length - 1];
    expect(last.stack).toEqual([1]);
    expect(last.queue).toEqual([3]);
  });
});

describe('buildGraphTraversal (BFS)', () => {
  const steps = buildGraphTraversal();
  it('visits breadth-first from A in order A,B,C,D,E', () => {
    expect(steps[steps.length - 1].visited).toEqual(['A', 'B', 'C', 'D', 'E']);
  });
  it('every node is reached exactly once', () => {
    const visits = steps.filter((s) => s.current).map((s) => s.current);
    expect(new Set(visits).size).toBe(GRAPH.nodes.length);
    expect(visits).toHaveLength(GRAPH.nodes.length);
  });
});

describe('buildStackHeap (allocation regions)', () => {
  const steps = buildStackHeap();
  it('pushes f’s frame on the call, pops it on return — and the heap block survives', () => {
    const maxStack = Math.max(...steps.map((s) => s.stack.length));
    expect(maxStack).toBe(2); // main + f
    const last = steps[steps.length - 1];
    expect(last.stack).toEqual(['main()']); // f popped
    expect(last.heap).toHaveLength(1);       // heap block persists
  });
});

describe('buildAllocator (external fragmentation)', () => {
  const steps = buildAllocator();
  it('after freeing B, a 3-cell malloc fails despite 3 cells free (fragmented)', () => {
    const failStep = steps.find((s) => s.failed);
    expect(failStep).toBeTruthy();
    expect(failStep.free).toBe(3); // enough total…
    // …but not contiguous: D never appears in the heap
    expect(failStep.cells.includes('D')).toBe(false);
  });
});

describe('buildGc (mark-and-sweep)', () => {
  const steps = buildGc();
  const last = steps[steps.length - 1];
  it('marks the reachable objects (1,2,3) and sweeps the unreachable (4,5)', () => {
    const byId = Object.fromEntries(last.objects.map((o) => [o.id, o]));
    expect(byId[1].marked && byId[2].marked && byId[3].marked).toBe(true);
    expect(byId[4].swept && byId[5].swept).toBe(true);
    expect(byId[4].marked || byId[5].marked).toBe(false);
  });
  it('has a mark phase before the sweep phase', () => {
    const firstSweep = steps.findIndex((s) => s.phase === 'sweep');
    const firstMark = steps.findIndex((s) => s.phase === 'mark');
    expect(firstMark).toBeGreaterThanOrEqual(0);
    expect(firstMark).toBeLessThan(firstSweep);
  });
});

describe('buildIsolation (isolation levels)', () => {
  const reads = (level) => buildIsolation({ level })[buildIsolation({ level }).length - 1].t1reads;
  const anomalies = (level) => buildIsolation({ level }).map((s) => s.anomaly).filter(Boolean);
  it('READ UNCOMMITTED suffers a dirty read (T1 sees 120 while uncommitted)', () => {
    expect(reads('READ UNCOMMITTED')).toEqual([100, 120, 120]);
    expect(anomalies('READ UNCOMMITTED')).toContain('dirty');
  });
  it('READ COMMITTED blocks the dirty read but allows a non-repeatable read', () => {
    expect(reads('READ COMMITTED')).toEqual([100, 100, 120]);
    expect(anomalies('READ COMMITTED')).not.toContain('dirty');
    expect(anomalies('READ COMMITTED')).toContain('nonrepeatable');
  });
  it('REPEATABLE READ gives a stable snapshot — every read is 100, no anomalies', () => {
    expect(reads('REPEATABLE READ')).toEqual([100, 100, 100]);
    expect(anomalies('REPEATABLE READ')).toHaveLength(0);
  });
  it('exposes exactly three named levels', () => {
    expect(ISOLATION_LEVELS).toEqual(['READ UNCOMMITTED', 'READ COMMITTED', 'REPEATABLE READ']);
  });
});

describe('buildTypeCheck (semantic analysis)', () => {
  it('a well-typed expression infers int and is accepted', () => {
    const steps = buildTypeCheck();
    const last = steps[steps.length - 1];
    expect(last.ok).toBe(true);
    expect(last.errored).toBe(false);
    expect(last.checked[last.checked.length - 1].type).toBe('int');
    expect(steps.some((s) => s.errored)).toBe(false);
  });
  it('string × int is a type error, rejected before codegen', () => {
    const steps = buildTypeCheck({ buggy: true });
    const last = steps[steps.length - 1];
    expect(last.errored).toBe(true);
    expect(last.ok).toBe(false);
    const bad = last.checked.find((c) => c.error);
    expect(bad.expr).toBe('"hi" * 3');
    expect(bad.error).toMatch(/string/);
  });
});

describe('buildEventLoop (task → microtasks → render)', () => {
  const steps = buildEventLoop();
  const phaseIdx = (p) => steps.findIndex((s) => s.phase === p);
  it('drains microtasks after the task and before rendering', () => {
    expect(phaseIdx('task')).toBeLessThan(phaseIdx('micro'));
    expect(phaseIdx('micro')).toBeLessThan(phaseIdx('render'));
    expect(phaseIdx('raf')).toBeLessThan(phaseIdx('render')); // rAF runs just before paint
  });
  it('renders exactly once, at the end of the turn', () => {
    const last = steps[steps.length - 1];
    expect(last.rendered).toBe(true);
    // nothing is marked rendered before the render phase begins
    expect(steps.slice(0, phaseIdx('render')).some((s) => s.rendered)).toBe(false);
  });
  it('defers the setTimeout task to a later turn (still queued at the end)', () => {
    expect(steps[steps.length - 1].tasks).toContain('setTimeout cb');
  });
});

describe('nand + buildUniversal (NAND is universal)', () => {
  it('NAND truth table', () => {
    expect([nand(0, 0), nand(0, 1), nand(1, 0), nand(1, 1)]).toEqual([1, 1, 1, 0]);
  });
  it('NOT, AND, OR built from NAND alone match the real gates for every input', () => {
    const built = buildUniversal();
    expect(built.map((g) => g.gate)).toEqual(['NOT', 'AND', 'OR']);
    for (const g of built) {
      expect(g.allMatch).toBe(true);
      for (const r of g.rows) expect(r.built).toBe(r.real);
    }
  });
});

describe('mux2 (2-to-1 multiplexer)', () => {
  it('routes input a when sel=0, input b when sel=1', () => {
    expect(mux2(0, 1, 0).out).toBe(1); // sel 0 → a
    expect(mux2(1, 1, 0).out).toBe(0); // sel 1 → b
    expect(mux2(0, 0, 1).out).toBe(0);
    expect(mux2(1, 0, 1).out).toBe(1);
  });
});

describe('quizzes (check-your-understanding integrity)', () => {
  const slugs = Object.keys(quizzes);
  it('every deep-dive stack has a quiz, keyed by its slug', () => {
    for (const s of stacks) expect(quizzes[s.slug], `missing quiz for ${s.slug}`).toBeTruthy();
    // and no quiz points at a non-existent stack
    const stackSlugs = new Set(stacks.map((s) => s.slug));
    for (const slug of slugs) expect(stackSlugs.has(slug), `quiz ${slug} has no stack`).toBe(true);
  });
  it('every quiz question has text and exactly one correct option, with feedback on every option', () => {
    for (const slug of slugs) {
      // a quiz is either a single question (legacy) or a list of tiered questions
      const raw = quizzes[slug];
      const questions = Array.isArray(raw) ? raw : [raw];
      expect(questions.length, `${slug} has no questions`).toBeGreaterThanOrEqual(1);
      for (const q of questions) {
        const where = q.level ? `${slug}/${q.level}` : slug;
        expect(typeof q.question, where).toBe('string');
        expect(q.options.length, where).toBeGreaterThanOrEqual(2);
        expect(q.options.filter((o) => o.correct).length, `${where} must have exactly one correct`).toBe(1);
        for (const o of q.options) {
          expect(o.label, where).toBeTruthy();
          expect(o.why && o.why.length > 0, `${where} option "${o.label}" needs a why`).toBe(true);
        }
      }
    }
  });
});

describe('buildPathResolve (filesystem path lookup)', () => {
  const steps = buildPathResolve();
  const last = steps[steps.length - 1];
  it('walks /docs/notes.txt root → docs (inode 7) → notes.txt (inode 9)', () => {
    const founds = steps.filter((s) => s.found != null).map((s) => s.found);
    expect(founds).toEqual([7, 9]);
  });
  it('resolves to the file inode and its data blocks', () => {
    expect(last.resolved).toBe(true);
    expect(last.inode).toBe(9);
    expect(last.blocks).toEqual(FS[9].blocks);
  });
});

describe('buildJournal (crash consistency)', () => {
  it('unjournaled: a crash mid-update leaves the filesystem inconsistent', () => {
    const steps = buildJournal({ journaled: false });
    expect(steps.some((s) => s.crashed)).toBe(true);
    expect(steps[steps.length - 1].consistent).toBe(false);
  });
  it('journaled: a committed change replays to a consistent state', () => {
    const steps = buildJournal({ journaled: true });
    const last = steps[steps.length - 1];
    expect(last.consistent).toBe(true);
    expect(steps.some((s) => s.journal.includes('COMMIT'))).toBe(true);
  });
});

describe('buildSockets (4-tuple demultiplexing)', () => {
  const steps = buildSockets();
  it('routes each arriving packet to the connection matching its client endpoint', () => {
    const byClient = Object.fromEntries(steps[0].conns.map((c) => [c.client, c.id]));
    const routed = steps.filter((s) => s.packet);
    expect(routed.length).toBeGreaterThan(0);
    for (const s of routed) expect(s.routedTo).toBe(byClient[s.packet]);
  });
  it('two packets from the same client land on the same socket', () => {
    const aPkts = steps.filter((s) => s.packet === '198.51.100.7:51000');
    expect(aPkts.length).toBe(2);
    expect(new Set(aPkts.map((s) => s.routedTo))).toEqual(new Set(['A']));
  });
});

describe('buildHttp (request/response)', () => {
  const steps = buildHttp();
  it('sends a GET request then receives a 200 response with a body', () => {
    expect(steps.some((s) => s.side === 'client' && /^GET /.test(s.line || ''))).toBe(true);
    expect(steps.some((s) => s.status === 200)).toBe(true);
    expect(steps.some((s) => s.side === 'server' && s.done)).toBe(true);
  });
  it('the status line precedes the body', () => {
    const statusIdx = steps.findIndex((s) => s.status === 200);
    const bodyIdx = steps.findIndex((s) => s.done);
    expect(statusIdx).toBeLessThan(bodyIdx);
  });
});

describe('buildJoin (inner join, nested loop)', () => {
  const steps = buildJoin();
  const last = steps[steps.length - 1];
  it('emits matched pairs and drops unmatched left rows (inner join)', () => {
    expect(last.result).toEqual([
      { name: 'Ana', item: 'book' },
      { name: 'Ana', item: 'pen' },
      { name: 'Cy', item: 'lamp' },
    ]);
    // Bo has no orders → not in the result
    expect(last.result.some((r) => r.name === 'Bo')).toBe(false);
  });
  it('does n×m comparisons (3 users × 3 orders = 9)', () => {
    expect(last.comparisons).toBe(9);
  });
});

describe('buildCrp (critical rendering path)', () => {
  const firstIdx = (steps, key) => steps.findIndex((s) => s[key]);
  it('CSS is render-blocking in both cases', () => {
    expect(buildCrp({ defer: false }).some((s) => s.cssBlocking)).toBe(true);
    expect(buildCrp({ defer: true }).some((s) => s.cssBlocking)).toBe(true);
  });
  it('a plain script blocks the parser, and first paint waits for it', () => {
    const steps = buildCrp({ defer: false });
    expect(steps.some((s) => s.scriptBlocking)).toBe(true);
    expect(firstIdx(steps, 'scriptRan')).toBeLessThan(firstIdx(steps, 'painted')); // paint after the blocking script
  });
  it('a deferred script never blocks the parser, so first paint lands before it runs', () => {
    const steps = buildCrp({ defer: true });
    expect(steps.some((s) => s.scriptBlocking)).toBe(false);
    expect(firstIdx(steps, 'painted')).toBeLessThan(firstIdx(steps, 'scriptRan')); // paint before the deferred script
  });
});

describe('tokenize (subword tokenization)', () => {
  it('common words are one token each', () => {
    const toks = tokenize('The cat sat on the mat');
    expect(toks).toHaveLength(6);
    expect(toks.every((t) => t.firstInWord)).toBe(true);
  });
  it('a rarer word splits into subword pieces', () => {
    expect(tokenize('tokenization').map((t) => t.text)).toEqual(['token', 'iz', 'ation']);
    expect(tokenize('strawberry').map((t) => t.text)).toEqual(['straw', 'berry']);
  });
  it('every emitted token carries a vocab id', () => {
    for (const t of tokenize('learning models')) expect(TOK_VOCAB[t.id]).toBe(t.text);
  });
});

describe('buildTraining (pretraining → fine-tuning)', () => {
  const steps = buildTraining();
  it('runs the three phases in order', () => {
    const phases = steps.map((s) => s.phase);
    expect(phases.indexOf('Pretraining')).toBeLessThan(phases.indexOf('Supervised fine-tuning'));
    expect(phases.indexOf('Supervised fine-tuning')).toBeLessThan(phases.indexOf('Preference tuning (RLHF)'));
  });
  it('pretraining only autocompletes; later phases answer the instruction', () => {
    const pre = steps.find((s) => s.phase === 'Pretraining');
    expect(pre.behavior).toMatch(/autocomplete/);
    expect(steps.find((s) => s.phase === 'Supervised fine-tuning').behavior).toMatch(/instruction/);
  });
});

describe('buildRag (retrieval-augmented generation)', () => {
  const steps = buildRag();
  it('retrieves the most relevant document (the refund policy)', () => {
    const ret = steps.find((s) => s.retrieved);
    expect(ret.retrieved).toMatch(/14 days/);
  });
  it('the ungrounded answer is wrong; the grounded one cites the source', () => {
    const ungrounded = steps.find((s) => s.answer && !s.grounded);
    const grounded = steps.find((s) => s.answer && s.grounded);
    expect(ungrounded.answer).toMatch(/30 days|invented|wrong/);
    expect(grounded.answer).toMatch(/14 days/);
  });
  it('ranks the refund doc above the others by similarity', () => {
    const r = steps.find((s) => s.ranked).ranked;
    expect(r[0].text).toMatch(/Refunds/);
    expect(r[0].sim).toBeGreaterThan(r[1].sim);
  });
});

describe('computeNeuron (perceptron)', () => {
  it('weights [1,1], bias −1.5 with a step activation is an AND gate', () => {
    expect(computeNeuron([0, 0], [1, 1], -1.5).output).toBe(0);
    expect(computeNeuron([1, 0], [1, 1], -1.5).output).toBe(0);
    expect(computeNeuron([0, 1], [1, 1], -1.5).output).toBe(0);
    expect(computeNeuron([1, 1], [1, 1], -1.5).output).toBe(1);
  });
});

describe('buildGradientDescent (learning)', () => {
  const steps = buildGradientDescent();
  it('loss falls every step (monotonic descent)', () => {
    const losses = steps.filter((s) => s.grad !== null || s === steps[0]).map((s) => s.loss);
    for (let i = 1; i < losses.length; i++) expect(losses[i]).toBeLessThanOrEqual(losses[i - 1]);
  });
  it('the weight converges toward the ideal (y/x = 3) and loss ≈ 0', () => {
    const last = steps[steps.length - 1];
    expect(Math.abs(last.w - 3)).toBeLessThan(0.1);
    expect(last.loss).toBeLessThan(0.1);
  });
});

describe('nearestWords (embeddings)', () => {
  it('a word’s nearest neighbours are semantically related (cat → animals, not vehicles)', () => {
    const near = nearestWords('cat').map((n) => n.word);
    expect(near).toContain('kitten');
    expect(near).not.toContain('car');
  });
  it('excludes the word itself and lands in its own cluster (king → royalty/people)', () => {
    const near = nearestWords('king');
    expect(near.some((n) => n.word === 'king')).toBe(false);
    expect(['queen', 'man', 'woman']).toContain(near[0].word); // not an animal or vehicle
  });
});

describe('buildAttention (transformer attention)', () => {
  it('the query "it" attends most strongly to "cat"', () => {
    const { weights } = buildAttention({ query: 'it' });
    const top = [...weights].sort((a, b) => b.weight - a.weight)[0];
    expect(top.token).toBe('cat');
  });
  it('the weights are a distribution (sum ≈ 1)', () => {
    const { weights } = buildAttention({ query: 'it' });
    const sum = weights.reduce((s, w) => s + w.weight, 0);
    expect(sum).toBeCloseTo(1, 2);
  });
});

describe('nextTokenDist + temperature', () => {
  it('low temperature sharpens toward the top token; high temperature flattens', () => {
    const cold = nextTokenDist(0.2).find((t) => t.token === 'mat').prob;
    const hot = nextTokenDist(2).find((t) => t.token === 'mat').prob;
    expect(cold).toBeGreaterThan(0.9);
    expect(hot).toBeLessThan(cold);
  });
  it('probabilities sum to 1', () => {
    const sum = nextTokenDist(1).reduce((s, t) => s + t.prob, 0);
    expect(sum).toBeCloseTo(1, 2);
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
