<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildAllocator } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = useStepper(() => buildAllocator(), { speed: 1000 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
  const COL = { A: 'var(--blue)', B: 'var(--amber)', C: 'var(--violet)', D: 'var(--signal)' };
</script>
<div class="widget">
  <div class="csbar">
    <span class="csmini">heap allocator · first-fit</span>
    <span class="spacer"></span>
    <span class="csmini" class:al-fail={s.failed}>{s.free} cells free{s.failed ? ' · but can’t fit!' : ''}</span>
  </div>
  <div class="w-label">step malloc and free — watch holes appear and a request fail to fit</div>
  <div class="al-heap" class:failed={s.failed}>
    {#each s.cells as c}
      <span class="al-cell" class:free={c === null} style:--c={c ? COL[c] : 'transparent'}>{c ?? ''}</span>
    {/each}
  </div>
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .al-fail{color:var(--red)}
  .al-heap{display:flex;gap:6px;font-family:var(--mono);margin:6px 0 4px;border:1px solid transparent;border-radius:10px;padding:6px;transition:.18s}
  .al-heap.failed{border-color:var(--red);background:rgba(255,107,107,.06)}
  .al-cell{flex:1;height:46px;display:flex;align-items:center;justify-content:center;border-radius:8px;font-weight:700;font-size:15px;border:1px solid var(--c);color:var(--c);background:color-mix(in srgb, var(--c) 14%, var(--surface));transition:.18s}
  .al-cell.free{border:1px dashed var(--border);color:var(--faint);background:var(--fill)}
</style>
