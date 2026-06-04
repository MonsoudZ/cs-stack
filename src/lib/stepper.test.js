import { describe, it, expect, vi } from 'vitest';
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

  it('moves by delta and clamps to the available steps', () => {
    const s = createStepper(build3);
    s.move(2);
    expect(get(s.idx)).toBe(2);
    s.move(1);
    expect(get(s.idx)).toBe(2);
    s.move(-5);
    expect(get(s.idx)).toBe(0);
  });

  it('sets the index directly and clamps out-of-range values', () => {
    const s = createStepper(build3);
    s.setIndex(99);
    expect(get(s.idx)).toBe(2);
    s.setIndex(1);
    expect(get(s.idx)).toBe(1);
    s.setIndex(-1);
    expect(get(s.idx)).toBe(0);
  });

  it('rebuild swaps the source and resets to the start', () => {
    const s = createStepper(build3);
    s.stepOrRestart();
    s.rebuild(() => [{ y: 9 }]);
    expect(get(s.idx)).toBe(0);
    expect(s.current()).toEqual({ y: 9 });
    expect(s.isLast()).toBe(true);
  });

  it('bumps version on rebuild/reset at step 0 (idx alone would not change)', () => {
    const s = createStepper(build3);
    expect(get(s.idx)).toBe(0);
    const v0 = get(s.version);
    s.stepOrRestart();
    expect(get(s.version)).toBe(v0); // plain stepping must NOT bump
    s.reset();
    expect(get(s.idx)).toBe(0);
    s.rebuild(() => [{ y: 9 }]);
    expect(get(s.idx)).toBe(0);            // index never left 0...
    expect(get(s.version)).toBe(v0 + 2);   // ...but version signals both swaps
  });

  it('a manual step cancels auto-play instead of double-advancing', () => {
    vi.useFakeTimers();
    const s = createStepper(build3, { speed: 100 });
    s.toggleAuto();
    expect(get(s.autoOn)).toBe(true);
    s.stepOrRestart();
    expect(get(s.autoOn)).toBe(false); // auto stopped
    expect(get(s.idx)).toBe(1);
    vi.advanceTimersByTime(500);
    expect(get(s.idx)).toBe(1);        // timer gone — no extra advance
    vi.useRealTimers();
  });

  it('destroy clears the auto-play timer', () => {
    vi.useFakeTimers();
    const s = createStepper(build3, { speed: 100 });
    s.toggleAuto();
    s.destroy();
    vi.advanceTimersByTime(1000);
    expect(get(s.idx)).toBe(0);        // never advanced after destroy
    expect(get(s.autoOn)).toBe(false);
    vi.useRealTimers();
  });
});
