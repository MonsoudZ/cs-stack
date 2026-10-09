<script>
  // Shared STEP / AUTO / RESET controls for every step-through widget, plus a
  // BACK button, a scrubber + "step n of m" counter, an AUTO speed cycler, and
  // ←/→/Home/End keys while focus is inside the controls. Everything drives
  // the pure stepper store, so widgets opt in by rendering <Stepper {stepper} />.
  let { stepper, stepLabel = 'STEP ▸' } = $props();
  const { idx, autoOn, version, rate } = stepper;
  // `$version` is read so the count recomputes when the steps array is rebuilt
  // (a toggle rebuilding at step 0 would otherwise leave the scrubber stale).
  let count = $derived(($version, stepper.all().length));
  let last = $derived($idx >= count - 1);
  let first = $derived($idx <= 0);
  const RATES = [1, 2, 0.5];
  const rateLabel = (r) => (r === 0.5 ? '½×' : r + '×');
  function cycleRate() { stepper.setRate(RATES[(RATES.indexOf($rate) + 1) % RATES.length]); }
  // Arrow keys step while a control has focus. The range input handles its own
  // arrows natively, so it's left alone; the event is stopped so an enclosing
  // keyboard region (the Tracer) doesn't move a second time.
  function onKey(event) {
    if (event.target?.tagName === 'INPUT' || event.metaKey || event.ctrlKey || event.altKey) return;
    let handled = true;
    if (event.key === 'ArrowRight') stepper.move(1);
    else if (event.key === 'ArrowLeft') stepper.move(-1);
    else if (event.key === 'Home') stepper.setIndex(0);
    else if (event.key === 'End') stepper.setIndex(count - 1);
    else handled = false;
    if (handled) { event.preventDefault(); event.stopPropagation(); }
  }
</script>
<div class="stepper" onkeydown={onKey} aria-keyshortcuts="ArrowLeft ArrowRight Home End">
  <div class="cpu-ctrl">
    <button type="button" class="btn step-btn" onclick={() => stepper.stepOrRestart()}>{last ? 'RESTART ↺' : stepLabel}</button>
    <button type="button" class="btn back-btn" onclick={() => stepper.move(-1)} disabled={first}>◂ BACK</button>
    <button type="button" class="btn auto-btn" onclick={() => stepper.toggleAuto()}>{$autoOn ? 'STOP ◼' : 'AUTO ▸▸'}</button>
    <button type="button" class="btn rate-btn" onclick={cycleRate} aria-label="auto-play speed {rateLabel($rate)}, click to change">{rateLabel($rate)}</button>
    <button type="button" class="btn reset-btn" onclick={() => stepper.reset()}>RESET ↺</button>
  </div>
  <div class="step-scrub">
    <input type="range" class="slider step-range" min="0" max={Math.max(0, count - 1)} step="1" value={$idx}
      aria-label="scrub to a step" aria-valuetext="step {$idx + 1} of {count}"
      oninput={(e) => stepper.setIndex(Number(e.currentTarget.value))} />
    <span class="step-count" aria-hidden="true"><b>{$idx + 1}</b> / {count}</span>
    <span class="step-keys" aria-hidden="true">← → step</span>
  </div>
</div>
