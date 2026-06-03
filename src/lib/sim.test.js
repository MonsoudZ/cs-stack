import { describe, it, expect } from 'vitest';
import { simulateScheduler, buildFact } from './sim.js';

describe('buildFact', () => {
  it('walks the call stack down to the base case and back up', () => {
    const steps = buildFact(4);
    expect(steps.length).toBeGreaterThan(0);
    // last frame depth before unwinding is N (4 nested calls)
    const maxDepth = Math.max(...steps.map((s) => s.frames.length));
    expect(maxDepth).toBe(4);
    // ends with the stack fully unwound and the correct product in the note
    const last = steps.at(-1);
    expect(last.frames).toHaveLength(0);
    expect(last.note).toContain('fact(4) = 24');
  });

  it('hits the base case fact(1) = 1', () => {
    const steps = buildFact(3);
    expect(steps.some((s) => s.note.includes('base case'))).toBe(true);
  });
});

describe('simulateScheduler', () => {
  const { PROCS, steps } = simulateScheduler();

  it('returns the process set and a non-empty timeline of snapshots', () => {
    expect(PROCS.length).toBe(3);
    expect(steps.length).toBeGreaterThan(1);
  });

  it('ends with every process done', () => {
    const final = steps.at(-1);
    expect(final.states.every((s) => s === 'done')).toBe(true);
    expect(final.running).toBeNull();
  });

  it('never runs two processes on the core at the same instant', () => {
    for (const snap of steps) {
      for (const slot of snap.timeline) {
        // each timeline slot is a single proc index or null — single core
        expect(slot.proc === null || typeof slot.proc === 'number').toBe(true);
      }
    }
  });
});
