import { describe, it, expect } from 'vitest';
import { get } from 'svelte/store';
import { createStepper } from './stepper.svelte.js';

const build3 = () => [{ x: 0 }, { x: 1 }, { x: 2 }];

describe('createStepper', () => {
  it('starts at index 0', () => {
    const s = createStepper(build3);
    expect(get(s.idx)).toBe(0);
    expect(s.current()).toEqual({ x: 0 });
  });

  it('advances with stepOrRestart and stops clamped at the last step', () => {
    const s = createStepper(build3);
    s.stepOrRestart();
    expect(get(s.idx)).toBe(1);
    s.stepOrRestart();
    expect(get(s.idx)).toBe(2);
    expect(s.isLast()).toBe(true);
    // one more wraps back to the start (restart)
    s.stepOrRestart();
    expect(get(s.idx)).toBe(0);
  });

  it('reset returns to index 0 and re-runs the builder', () => {
    let calls = 0;
    const s = createStepper(() => { calls++; return build3(); });
    expect(calls).toBe(1);
    s.stepOrRestart();
    s.reset();
    expect(get(s.idx)).toBe(0);
    expect(calls).toBe(2);
  });

  it('rebuild swaps the source and resets to the start', () => {
    const s = createStepper(build3);
    s.stepOrRestart();
    s.rebuild(() => [{ y: 9 }]);
    expect(get(s.idx)).toBe(0);
    expect(s.current()).toEqual({ y: 9 });
    expect(s.isLast()).toBe(true);
  });
});
