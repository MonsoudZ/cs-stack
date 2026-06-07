<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildLinkedList } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = useStepper(() => buildLinkedList(), { speed: 1100 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
</script>
<div class="widget">
  <div class="csbar"><span class="csmini">linked list · insert in the middle is O(1)</span></div>
  <div class="w-label">step the insert — two pointer writes splice in a node, no shifting</div>
  {#if s.staged != null}
    <div class="ll-staged">
      <span class="ll-node new">{s.staged}<small>new</small></span>
      <span class="ll-staged-lab">allocated, not yet linked</span>
    </div>
  {/if}
  <div class="ll-chain">
    {#each s.chain as v, i}
      <span class="ll-node" class:hot={v === s.highlight}>{v}</span>
      {#if i < s.chain.length - 1}<span class="ll-ptr">→</span>{/if}
    {/each}
    <span class="ll-ptr">→</span><span class="ll-null">∅</span>
  </div>
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .ll-staged{display:flex;align-items:center;gap:12px;justify-content:center;margin-bottom:14px;font-family:var(--mono)}
  .ll-staged-lab{font-size:12px;color:var(--faint)}
  .ll-chain{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:center;font-family:var(--mono);min-height:48px}
  .ll-node{display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:44px;height:44px;border:1px solid var(--blue);border-radius:10px;color:var(--blue);background:var(--blue-d);font-weight:700;transition:.18s}
  .ll-node small{font-size:9px;font-weight:400;color:var(--faint)}
  .ll-node.new{border-color:var(--signal);color:var(--signal);background:var(--signal-d)}
  .ll-node.hot{border-color:var(--signal);color:var(--signal);background:var(--signal-d);box-shadow:0 0 14px var(--signal-d)}
  .ll-ptr{color:var(--faint);font-size:18px}
  .ll-null{color:var(--faint);font-size:18px}
</style>
