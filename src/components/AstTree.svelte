<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildAst } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  let leftToRight = $state(false);
  const stepper = useStepper(() => buildAst({ leftToRight }), { speed: 1000 });
  const { idx, version } = stepper;
  let s = $derived(($version, stepper.all()[$idx]));
  function toggle() { leftToRight = !leftToRight; stepper.rebuild(() => buildAst({ leftToRight })); }
</script>
<div class="widget">
  <div class="csbar">
    <span class="csmini">3 + 4 * 2, as a tree — depth encodes precedence</span>
    <span class="spacer"></span>
    <button type="button" class="csbtn" aria-pressed={leftToRight} onclick={toggle}>parse: {leftToRight ? 'left-to-right' : 'precedence'}</button>
  </div>
  <div class="w-label">step the parse — the deepest operator reduces first, then collapses to its value</div>

  {#snippet node(n)}
    <div class="ast-node">
      <span class="ast-val" class:ast-op={n.kind === 'op'} class:ast-num={n.kind === 'num'} class:active={n.active}>{n.text}</span>
      {#if n.kind === 'op'}
        <div class="ast-kids">
          {@render node(n.l)}
          {@render node(n.r)}
        </div>
      {/if}
    </div>
  {/snippet}

  <div class="ast">{@render node(s.tree)}</div>
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .csbtn{font-family:var(--mono);font-size:12px;padding:4px 10px;border:1px solid var(--border);border-radius:7px;background:var(--surface);color:var(--dim);cursor:pointer}
  .csbtn[aria-pressed="true"]{border-color:var(--violet);color:var(--violet);background:var(--violet-d)}
  .ast{display:flex;justify-content:center;font-family:var(--mono);padding:14px 0 6px}
  .ast-node{display:flex;flex-direction:column;align-items:center;gap:12px}
  .ast-val{width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;border:2px solid var(--border);transition:transform .2s ease,box-shadow .2s ease}
  .ast-op{border-color:var(--blue);color:var(--blue);background:var(--blue-d)}
  .ast-num{border-color:var(--amber);color:var(--amber);background:var(--amber-d)}
  .ast-val.active{transform:scale(1.12);box-shadow:0 0 0 4px var(--signal-d);border-color:var(--signal);color:var(--signal)}
  .ast-kids{display:flex;gap:22px;align-items:flex-start;position:relative;padding-top:14px}
  .ast-kids::before{content:"";position:absolute;top:0;left:50%;width:1px;height:14px;background:var(--border)}
</style>
