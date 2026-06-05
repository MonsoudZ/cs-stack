<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildDynamicArray } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = useStepper(() => buildDynamicArray(), { speed: 900 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
</script>
<div class="widget">
  <div class="csbar">
    <span class="csmini">dynamic array · grow by doubling</span>
    <span class="spacer"></span>
    <span class="csmini">length {s.len} / capacity {s.cap} · {s.copies} copies</span>
  </div>
  <div class="w-label">step the appends — most are cheap; a full array doubles and copies</div>
  <div class="da-cells" class:grew={s.grew}>
    {#each Array(s.cap) as _, i}
      <div class="da-cell" class:filled={i < s.len} class:fresh={i === s.placed} class:moved={s.grew && i < s.len}>
        {i < s.len ? i : ''}
      </div>
    {/each}
  </div>
  <div class="da-meta">
    <span class="da-bar" style:width={`${(s.len / s.cap) * 100}%`}></span>
  </div>
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .da-cells{display:flex;flex-wrap:wrap;gap:6px;font-family:var(--mono);min-height:44px}
  .da-cell{width:38px;height:38px;display:flex;align-items:center;justify-content:center;border:1px dashed var(--border);border-radius:8px;font-weight:700;color:var(--faint);background:transparent;transition:.18s}
  .da-cell.filled{border-style:solid;border-color:var(--blue);color:var(--blue);background:var(--blue-d)}
  .da-cell.fresh{border-color:var(--signal);color:var(--signal);background:var(--signal-d);box-shadow:0 0 12px var(--signal-d)}
  .da-cells.grew .da-cell.moved{border-color:var(--amber);color:var(--amber);background:var(--amber-d)}
  .da-meta{margin-top:10px;height:6px;border-radius:4px;background:var(--fill);overflow:hidden}
  .da-bar{display:block;height:100%;background:var(--blue);transition:width .18s}
</style>
