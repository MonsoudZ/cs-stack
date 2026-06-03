<script>
  import { createStepper } from '../lib/stepper.svelte.js';
  import { buildFact } from '../lib/sim.js';
  import Stepper from './Stepper.svelte';
  let N = $state(4);
  const stepper = createStepper(() => buildFact(N), { speed: 850 });
  const { idx } = stepper;
  let step = $derived(stepper.all()[$idx]);
  function setDepth(n) { N = n; stepper.rebuild(() => buildFact(N)); }
</script>
<div class="widget">
  <div class="csbar">
    <span class="csmini">fact(n) = n ≤ 1 ? 1 : n × fact(n−1)</span>
    <span style="flex:1"></span>
    <span class="csmini">start depth:</span>
    <span class="idxbtns">
      {#each [3,4,5] as n}<button class="btn" class:sel={N === n} onclick={() => setDepth(n)}>{n}</button>{/each}
    </span>
  </div>
  <div class="w-label">the call stack — recursion grows down, then unwinds back up</div>
  <div class="csstack">
    {#if step.frames.length}
      {#each step.frames as f, i}
        <div class="csframe {f.ret ? 'ret' : (i === step.frames.length - 1 ? 'act' : '')}">
          <span class="fl">fact({f.n}) &nbsp;<span style="color:var(--faint);font-size:11px">local n={f.n}</span></span>
          {#if f.ret}<span class="rv">returns {f.val}</span>
          {:else if f.n <= 1}<span class="wait">base case → 1</span>
          {:else}<span class="wait">waiting for fact({f.n - 1})…</span>{/if}
        </div>
      {/each}
    {:else}<div class="csmini" style="padding:10px 2px">stack empty</div>{/if}
  </div>
  <div class="csnote">{step.note}</div>
  <Stepper {stepper} />
</div>
