<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildMerkle } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = useStepper(() => buildMerkle(), { speed: 1000 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
  const isOn = (id) => s.active === id;
</script>
<div class="widget">
  <div class="csbar"><span class="csmini">hash the blocks pairwise up to one root — change anything, the root changes</span></div>
  <div class="w-label">step the build — four blocks become four leaves, two halves, one root; then a tampered block breaks it</div>
  <div class="mk">
    <div class="mk-tier mk-rootrow">
      <div class="mk-node root" class:on={isOn('root')} class:bad={s.broken}>{s.root || '·'}</div>
    </div>
    <div class="mk-cap">root hash</div>
    <div class="mk-tier">
      {#each s.mids as m, i}
        <div class="mk-node mid" class:on={isOn('mid' + i)} class:bad={s.tampered !== null && i === 1}>{m || '·'}</div>
      {/each}
    </div>
    <div class="mk-cap">pair hashes</div>
    <div class="mk-tier">
      {#each s.leaves as l, i}
        <div class="mk-node leaf" class:on={isOn('leaf' + i)} class:bad={s.tampered === i}>{l || '·'}</div>
      {/each}
    </div>
    <div class="mk-cap">leaf hashes</div>
    <div class="mk-tier">
      {#each s.blocks as b, i}
        <div class="mk-block" class:bad={s.tampered === i}>{b}</div>
      {/each}
    </div>
    <div class="mk-cap">data blocks</div>
  </div>
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .mk{display:flex;flex-direction:column;align-items:center;gap:4px;font-family:var(--mono);margin-top:4px}
  .mk-tier{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
  .mk-rootrow{margin-top:2px}
  .mk-cap{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint);margin:2px 0 8px}
  .mk-node{min-width:78px;padding:9px 10px;border:1px solid var(--border);border-radius:10px;background:var(--panel2);
    color:var(--dim);font-size:13px;text-align:center;transition:.15s}
  .mk-node.root{color:var(--amber);border-color:var(--amber);font-weight:700;min-width:104px}
  .mk-node.on{border-color:var(--signal);color:var(--signal);box-shadow:0 0 14px var(--signal-d)}
  .mk-node.bad{border-color:var(--red);color:var(--red);box-shadow:0 0 12px rgba(255,107,107,.25)}
  .mk-block{min-width:104px;padding:8px 10px;border:1px dashed var(--border);border-radius:9px;background:var(--surface);
    color:var(--ink);font-size:12px;text-align:center}
  .mk-block.bad{border-color:var(--red);color:var(--red)}
  @media(max-width:560px){
    .mk-node{min-width:64px;font-size:11px;padding:7px 6px}
    .mk-block{min-width:84px;font-size:11px}
  }
</style>
