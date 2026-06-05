<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildFloatSum } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = useStepper(() => buildFloatSum(), { speed: 1300 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
  // rows accumulate as you step, so you can compare what's been revealed
  let rows = $derived(stepper.all().slice(0, $idx + 1).filter((r) => r.label));
</script>
<div class="widget">
  <div class="csbar"><span class="csmini">what the hardware actually stores · IEEE-754 double</span></div>
  <div class="w-label">step through the sum — each decimal is the nearest double, shown to 17 digits</div>
  <div class="fs-rows">
    {#each rows as r}
      <div class="fs-row" class:hot={r.highlight}>
        <span class="fs-lab">{r.label}</span>
        <span class="fs-eq">stores</span>
        <span class="fs-val">{r.stored}</span>
      </div>
    {/each}
    {#if rows.length === 0}<div class="fs-empty">step to reveal each stored value…</div>{/if}
  </div>
  {#if s.equal !== undefined}
    <div class="fs-verdict" class:no={!s.equal}>0.1 + 0.2 === 0.3 → {String(s.equal)}</div>
  {/if}
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .fs-rows{display:flex;flex-direction:column;gap:8px;font-family:var(--mono);min-height:48px}
  .fs-row{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;border:1px solid var(--border);border-radius:10px;padding:9px 14px;background:var(--surface);transition:.18s}
  .fs-row.hot{border-color:var(--signal);background:var(--signal-d)}
  .fs-lab{font-weight:700;color:var(--ink);min-width:74px}
  .fs-eq{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--faint)}
  .fs-val{color:var(--blue);font-size:15px}
  .fs-row.hot .fs-val{color:var(--signal)}
  .fs-empty{font-size:13px;color:var(--faint);font-family:var(--mono)}
  .fs-verdict{margin-top:14px;font-family:var(--mono);font-weight:700;text-align:center;color:var(--signal)}
  .fs-verdict.no{color:var(--red)}
</style>
