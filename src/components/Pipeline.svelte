<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildPipeline } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = useStepper(() => buildPipeline(), { speed: 800 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
  const SCLASS = { IF: 'st-if', ID: 'st-id', EX: 'st-ex', MEM: 'st-mem', WB: 'st-wb' };
</script>
<div class="widget">
  <div class="csbar">
    <span class="csmini">5-stage pipeline · {s.stages.join(' · ')}</span>
    <span class="spacer"></span>
    <span class="csmini pl-done">{s.done}/{s.lanes.length} retired · cycle {Math.max(0, s.cycle + 1)}/{s.total}</span>
  </div>
  <div class="w-label">step the clock — one instruction enters each cycle, so the stages overlap</div>
  <div class="pl-lanes">
    {#each s.lanes as lane}
      <div class="pl-lane">
        <span class="pl-ins">{lane.ins}</span>
        <span class="pl-stage {lane.stage != null ? SCLASS[s.stages[lane.stage]] : ''}" class:done={lane.stage == null && s.cycle >= 0}>
          {lane.stage != null ? s.stages[lane.stage] : (s.cycle >= 0 ? '·' : '')}
        </span>
      </div>
    {/each}
  </div>
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .pl-done{color:var(--signal)}
  .pl-lanes{display:flex;flex-direction:column;gap:8px;font-family:var(--mono)}
  .pl-lane{display:flex;align-items:center;gap:14px}
  .pl-ins{width:54px;text-align:right;color:var(--dim);font-weight:700}
  .pl-stage{width:64px;height:34px;display:flex;align-items:center;justify-content:center;border:1px solid var(--border);border-radius:8px;font-size:13px;font-weight:700;color:var(--faint);background:var(--surface);transition:.15s}
  .pl-stage.done{color:var(--faint);opacity:.4}
  .st-if{border-color:var(--blue);color:var(--blue);background:var(--blue-d)}
  .st-id{border-color:var(--violet);color:var(--violet);background:var(--violet-d)}
  .st-ex{border-color:var(--signal);color:var(--signal);background:var(--signal-d)}
  .st-mem{border-color:var(--amber);color:var(--amber);background:var(--amber-d)}
  .st-wb{border-color:var(--ink);color:var(--ink);background:var(--fill)}
</style>
