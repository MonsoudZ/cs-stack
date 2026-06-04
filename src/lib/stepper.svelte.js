import { writable } from 'svelte/store';

// createStepper(buildFn, {speed}) -> { steps, idx (store), step, reset, toggleAuto, autoOn (store), rebuild }
export function createStepper(buildFn, { speed = 900 } = {}) {
  let steps = buildFn();
  const idx = writable(0);
  const autoOn = writable(false);
  let i = 0, timer = null;
  idx.subscribe((v) => (i = v));

  function render() { idx.set(i); }
  function step() { if (i < steps.length - 1) { i++; render(); } else stop(); }
  function stop() { if (timer) { clearInterval(timer); timer = null; autoOn.set(false); } }
  function reset() { stop(); steps = buildFn(); i = 0; render(); }
  function setIndex(next) { stop(); i = Math.max(0, Math.min(next, steps.length - 1)); render(); }
  function move(delta) { setIndex(i + delta); }
  function stepOrRestart() { if (i >= steps.length - 1) { i = 0; render(); } else step(); }
  function toggleAuto() {
    if (timer) { stop(); return; }
    if (i >= steps.length - 1) { steps = buildFn(); i = 0; }
    autoOn.set(true);
    timer = setInterval(() => { step(); if (i >= steps.length - 1) stop(); }, speed);
  }
  function rebuild(newBuildFn) { stop(); buildFn = newBuildFn; steps = buildFn(); i = 0; render(); }
  function current() { return steps[i]; }
  function isLast() { return i >= steps.length - 1; }
  function all() { return steps; }

  return { idx, autoOn, stepOrRestart, reset, toggleAuto, rebuild, move, setIndex, current, isLast, all };
}
