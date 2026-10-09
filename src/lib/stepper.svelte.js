import { writable } from 'svelte/store';
import { onDestroy } from 'svelte';

// createStepper(buildFn, {speed}) ->
//   { idx, autoOn, version, rate (stores), stepOrRestart, reset, toggleAuto,
//     rebuild, move, setIndex, setRate, current, isLast, all, destroy }
export function createStepper(buildFn, { speed = 900 } = {}) {
  let steps = buildFn();
  const idx = writable(0);
  const autoOn = writable(false);
  // Playback rate for AUTO as a multiplier of the widget's base `speed`
  // (1 = as authored, 2 = twice as fast, 0.5 = half speed).
  const rate = writable(1);
  let mult = 1;
  // Bumped whenever the steps array is replaced (method switch / reset / auto
  // restart). The index store can't signal this on its own: rebuilding while
  // already on step 0 leaves idx at 0, and writable.set(0) is a no-op, so
  // derived views reading all()[idx] would keep showing the old steps. Reading
  // `version` gives those views a dependency that always changes on rebuild.
  const version = writable(0);
  let i = 0, timer = null;
  const unsubscribe = idx.subscribe((v) => (i = v));

  function render() { idx.set(i); }
  function bump() { version.update((n) => n + 1); }
  function step() { if (i < steps.length - 1) { i++; render(); } else stop(); }
  function stop() { if (timer) { clearInterval(timer); timer = null; autoOn.set(false); } }
  function reset() { stop(); steps = buildFn(); i = 0; render(); bump(); }
  function setIndex(next) { stop(); i = Math.max(0, Math.min(next, steps.length - 1)); render(); }
  function move(delta) { setIndex(i + delta); }
  // A manual step always cancels auto-play first, otherwise the timer and the
  // click both advance and steps get skipped.
  function stepOrRestart() { stop(); if (i >= steps.length - 1) { i = 0; render(); } else step(); }
  function interval() {
    // Honour prefers-reduced-motion: still play, but at a calmer cadence so it
    // isn't rapid auto-animating content. (matchMedia is absent under SSR/tests
    // → treated as no preference.) The rate multiplier applies on top.
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const base = reduce ? Math.max(speed, 2200) : speed;
    return Math.max(80, Math.round(base / mult));
  }
  function start() { timer = setInterval(() => { step(); if (i >= steps.length - 1) stop(); }, interval()); }
  function toggleAuto() {
    if (timer) { stop(); return; }
    if (i >= steps.length - 1) { steps = buildFn(); i = 0; bump(); }
    autoOn.set(true);
    start();
  }
  // Change the AUTO playback rate. If auto-play is running the timer is
  // re-armed at the new cadence without pausing.
  function setRate(next) {
    mult = next > 0 ? next : 1;
    rate.set(mult);
    if (timer) { clearInterval(timer); start(); }
  }
  function rebuild(newBuildFn) { stop(); buildFn = newBuildFn; steps = buildFn(); i = 0; render(); bump(); }
  function current() { return steps[i]; }
  function isLast() { return i >= steps.length - 1; }
  function all() { return steps; }
  // Call from a component's onDestroy: clears the auto-play timer and releases
  // the idx subscription so an unmounted widget leaves nothing running.
  function destroy() { stop(); unsubscribe(); }

  return { idx, autoOn, version, rate, stepOrRestart, reset, toggleAuto, rebuild, move, setIndex, setRate, current, isLast, all, destroy };
}

// Component-facing wrapper: same as createStepper, but registers destroy() on
// the current component's onDestroy so a widget can never leak its timer or
// subscription. Call it at the top of a Svelte <script> (component init).
export function useStepper(buildFn, opts) {
  const stepper = createStepper(buildFn, opts);
  onDestroy(() => stepper.destroy());
  return stepper;
}
