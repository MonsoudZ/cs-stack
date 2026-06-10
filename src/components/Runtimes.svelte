<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildRuntimes } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = useStepper(() => buildRuntimes(), { speed: 1100 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
  let max = $derived(Math.max(...s.rows.map((r) => r.cost)));
</script>
<div class="widget">
  <div class="csbar"><span class="csmini">the same hot loop, run three ways — cumulative cost vs iterations</span></div>
  <div class="w-label">step to run more iterations — watch which strategy is cheapest change</div>
  <div class="rt-iters">after <b>{s.iters}</b> {s.iters === 1 ? 'iteration' : 'iterations'}</div>
  <div class="rt-rows">
    {#each s.rows as r}
      <div class="rt-row" class:lead={r.name === s.lead}>
        <div class="rt-name">{r.name}{#if r.native}<span class="rt-badge">native</span>{/if}</div>
        <div class="rt-track"><div class="rt-bar" class:nat={r.native} style:width={(r.cost / max) * 100 + '%'}></div></div>
        <div class="rt-cost">{r.cost}<span class="rt-unit">u</span></div>
      </div>
    {/each}
  </div>
  <div class="rt-lead" role="status" aria-live="polite">cheapest so far: <b>{s.lead}</b></div>
  <div class="csnote">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .rt-iters{font-family:var(--mono);font-size:13px;color:var(--dim);margin-bottom:10px}
  .rt-rows{display:flex;flex-direction:column;gap:10px}
  .rt-row{display:grid;grid-template-columns:130px 1fr 56px;align-items:center;gap:10px;border:1px solid var(--border);border-radius:10px;padding:9px 12px;background:var(--surface)}
  .rt-row.lead{border-color:var(--signal);background:var(--signal-d)}
  .rt-name{font-family:var(--mono);font-size:13px;color:var(--ink);display:flex;flex-direction:column;gap:3px}
  .rt-badge{font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:var(--signal);border:1px solid var(--signal);border-radius:5px;padding:0 5px;width:fit-content}
  .rt-track{height:18px;border-radius:6px;background:var(--border);overflow:hidden}
  .rt-bar{height:100%;background:var(--amber);border-radius:6px;transition:width .35s ease}
  .rt-bar.nat{background:var(--signal)}
  .rt-cost{font-family:var(--mono);font-size:14px;font-weight:700;color:var(--dim);text-align:right}
  .rt-unit{font-size:10px;color:var(--faint);margin-left:1px}
  .rt-lead{font-family:var(--mono);font-size:13px;color:var(--dim);margin-top:12px}
  .rt-lead b{color:var(--signal)}
</style>
