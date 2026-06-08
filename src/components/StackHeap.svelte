<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildStackHeap } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = useStepper(() => buildStackHeap(), { speed: 1100 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
</script>
<div class="widget">
  <div class="csbar"><span class="csmini">stack (automatic) vs heap (manual)</span></div>
  <div class="w-label">step a call — the frame is freed on return, the heap block isn’t</div>
  <div class="sh-grid">
    <div class="sh-col">
      <div class="sh-head">Stack <span>grows down · freed on return</span></div>
      <div class="sh-frames">
        {#each [...s.stack].reverse() as fr}
          <div class="sh-frame" class:hot={fr === s.highlight}>{fr}</div>
        {/each}
        {#if s.stack.length === 0}<div class="sh-empty">empty</div>{/if}
      </div>
    </div>
    <div class="sh-col">
      <div class="sh-head">Heap <span>manual · persists until freed</span></div>
      <div class="sh-frames">
        {#each s.heap as blk}
          <div class="sh-block" class:hot={s.highlight === 'block'}>{blk.id}<small>from {blk.owner}</small></div>
        {/each}
        {#if s.heap.length === 0}<div class="sh-empty">empty</div>{/if}
      </div>
    </div>
  </div>
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .sh-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;font-family:var(--mono)}
  @media(max-width:520px){.sh-grid{grid-template-columns:1fr}}
  .sh-col{border:1px solid var(--border);border-radius:12px;padding:14px;background:var(--surface)}
  .sh-head{font-weight:700;color:var(--ink);font-size:14px;display:flex;flex-direction:column;gap:2px;margin-bottom:12px}
  .sh-head span{font-size:11px;font-weight:400;color:var(--faint)}
  .sh-frames{display:flex;flex-direction:column;gap:6px;min-height:90px}
  .sh-frame{border:1px solid var(--blue);border-radius:8px;padding:10px 12px;color:var(--blue);background:var(--blue-d);font-weight:700;transition:.18s}
  .sh-frame.hot{border-color:var(--signal);color:var(--signal);background:var(--signal-d)}
  .sh-block{display:flex;flex-direction:column;border:1px solid var(--amber);border-radius:8px;padding:10px 12px;color:var(--amber);background:var(--amber-d);font-weight:700;transition:.18s}
  .sh-block small{font-size:10px;font-weight:400;color:var(--faint);margin-top:2px}
  .sh-block.hot{box-shadow:0 0 14px var(--amber-d)}
  .sh-empty{font-size:12px;color:var(--faint)}
</style>
