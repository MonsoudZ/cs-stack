import { describe, it, expect } from 'vitest';
import { METHODS, METHOD_ORDER, STRUCT_KINDS, LID, LNAME } from './traces.js';

// The README's central claim is that the traced algorithm logic is "validated"
// and "untouched from the tested single-file original." These tests lock that in:
// every step-builder must terminate and produce the answer shown in its header.

const EXPECTED = {
  twosum: [1, 3],
  bsearch: 4,
  bfs: ['A', 'B', 'C', 'D', 'E'],
  recursion: 10,
  twopointer: [1, 3],
  sliding: 9,
  dfs: ['A', 'B', 'D', 'C', 'E'],
  dp: 8,
  insort: '[1, 2, 3, 4, 5]',
  linear: 3,
  bubble: '[1, 2, 4, 5, 8]',
  kadane: 6,
  dijkstra: 9,
};

describe('method registry', () => {
  it('exposes every ordered method, with no orphans', () => {
    for (const key of METHOD_ORDER) expect(METHODS[key], `missing builder: ${key}`).toBeTruthy();
    expect(METHOD_ORDER.length).toBe(Object.keys(METHODS).length);
  });

  it('has an expectation pinned for every method', () => {
    expect(Object.keys(EXPECTED).sort()).toEqual([...METHOD_ORDER].sort());
  });
});

describe.each(METHOD_ORDER)('METHODS.%s', (key) => {
  const m = METHODS[key];
  const steps = m.build();

  it('builds a non-empty, deterministic sequence of steps', () => {
    expect(steps.length).toBeGreaterThan(0);
    // builders must be pure — a second build yields an identical trace
    expect(m.build()).toEqual(steps);
  });

  it('finishes on a single finale step that carries the result', () => {
    const finales = steps.filter((s) => s.finale);
    expect(finales).toHaveLength(1);
    expect(steps.at(-1).finale).toBe(true);
  });

  it('produces the answer shown in its header', () => {
    expect(steps.at(-1).result).toEqual(EXPECTED[key]);
  });

  it('every step has the shape the Tracer component reads', () => {
    for (const s of steps) {
      expect(typeof s.line).toBe('number');
      expect(s.vars).toBeTypeOf('object');
      expect(Array.isArray(s.vm)).toBe(true);
      expect(Array.isArray(s.touches)).toBe(true);
      expect(typeof s.note).toBe('string');
      expect(s.struct).toBeTypeOf('object');
    }
  });

  it('only references known layer touch targets', () => {
    for (const s of steps) {
      for (const touch of s.touches) {
        expect(LNAME[touch], `missing label for touch ${touch}`).toBeTruthy();
        expect(LID[touch], `missing target id for touch ${touch}`).toBeTruthy();
      }
    }
  });

  it('finale touches prove the result climbs through the expanded stack', () => {
    const finale = steps.at(-1);
    expect(finale.touches).toEqual(expect.arrayContaining([5.5, 6.5, 7.5, 8.5, 10.5, 10.8]));
  });

  it('every structure step declares a kind the Struct view can render', () => {
    for (const s of steps) expect(STRUCT_KINDS).toContain(s.struct.kind);
  });
});
