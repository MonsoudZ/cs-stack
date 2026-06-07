<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildStackQueue } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = useStepper(() => buildStackQueue(), { speed: 1000 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
</script>
<div class="widget">
  <div class="csbar"><span class="csmini">same inputs · opposite removal order</span></div>
  <div class="w-label">step push then remove — the stack reverses, the queue preserves</div>
  <div class="sq-grid">
    <div class="sq-col">
      <div class="sq-head">Stack <span>LIFO · push/pop the top</span></div>
      <div class="sq-cells">
        {#each s.stack as v}<span class="sq-cell stk">{v}</span>{/each}
        {#if s.stack.length === 0}<span class="sq-empty">empty</span>{/if}
      </div>
      <div class="sq-out" class:on={s.stackOut != null}>{s.stackOut != null ? 'popped → ' + s.stackOut : ''}</div>
    </div>
    <div class="sq-col">
      <div class="sq-head">Queue <span>FIFO · enqueue back, dequeue front</span></div>
      <div class="sq-cells">
        {#each s.queue as v, i}<span class="sq-cell que" class:front={i === 0}>{v}</span>{/each}
        {#if s.queue.length === 0}<span class="sq-empty">empty</span>{/if}
      </div>
      <div class="sq-out" class:on={s.queueOut != null}>{s.queueOut != null ? 'dequeued → ' + s.queueOut : ''}</div>
    </div>
  </div>
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .sq-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;font-family:var(--mono)}
  @media(max-width:520px){.sq-grid{grid-template-columns:1fr}}
  .sq-col{border:1px solid var(--border);border-radius:12px;padding:14px;background:var(--surface)}
  .sq-head{font-weight:700;color:var(--ink);font-size:14px;display:flex;flex-direction:column;gap:2px;margin-bottom:12px}
  .sq-head span{font-size:11px;font-weight:400;color:var(--faint)}
  .sq-cells{display:flex;gap:6px;flex-wrap:wrap;min-height:40px;align-items:center}
  .sq-cell{width:36px;height:36px;display:flex;align-items:center;justify-content:center;border-radius:8px;font-weight:700;border:1px solid}
  .sq-cell.stk{border-color:var(--violet);color:var(--violet);background:var(--violet-d)}
  .sq-cell.que{border-color:var(--blue);color:var(--blue);background:var(--blue-d)}
  .sq-cell.que.front{box-shadow:0 0 12px var(--blue-d);border-width:2px}
  .sq-empty{font-size:12px;color:var(--faint)}
  .sq-out{min-height:20px;margin-top:10px;font-size:13px;color:var(--faint)}
  .sq-out.on{color:var(--signal);font-weight:700}
</style>
