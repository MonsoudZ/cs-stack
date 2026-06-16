<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildLangMemory } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = useStepper(() => buildLangMemory(), { speed: 1200 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
  const label = { used: 'buffer', leaked: 'leaked 🚫', freed: 'freed ✓' };
</script>
<div class="widget">
  <div class="csbar">
    <span class="csmini">who frees the heap — and when</span>
    <span class="spacer"></span>
    {#if s.regime}<span class="lm-regime r-{s.regime}">{s.regime}{s.langs ? ' · ' + s.langs : ''}</span>{/if}
  </div>
  <div class="w-label">step one allocation through manual free, ownership, and a garbage collector</div>
  <div class="lm-heap">
    <div class="lm-lab">heap</div>
    {#if s.block}
      <div class="lm-block {s.block}">{label[s.block]}</div>
    {:else}
      <div class="lm-block empty">—</div>
    {/if}
  </div>
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .lm-regime{font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase}
  .lm-regime.r-manual{color:var(--red)}
  .lm-regime.r-ownership{color:var(--violet)}
  .lm-regime.r-gc{color:var(--signal)}
  .lm-heap{display:flex;align-items:center;gap:14px;border:1px solid var(--border);border-radius:14px;
    background:var(--surface);padding:18px 18px;min-height:84px;font-family:var(--mono)}
  .lm-lab{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint)}
  .lm-block{padding:14px 20px;border-radius:10px;border:1px solid var(--border);background:var(--panel2);
    color:var(--dim);font-size:14px;font-weight:700;transition:.18s}
  .lm-block.used{border-color:var(--amber);color:var(--amber)}
  .lm-block.leaked{border-color:var(--red);color:var(--red);box-shadow:0 0 14px rgba(255,107,107,.25)}
  .lm-block.freed{border-color:var(--signal);color:var(--signal);background:var(--signal-d)}
  .lm-block.empty{border-style:dashed;color:var(--faint)}
</style>
