<script>
  import { DOPING } from '../lib/widgets.js';
  let mode = $state('pure');
  let d = $derived(DOPING[mode]);
  const MODES = [['pure', 'pure'], ['n', 'n-type'], ['p', 'p-type']];
  // a little 4×4 lattice; one site becomes the dopant when doped
  const SITES = Array.from({ length: 16 }, (_, i) => i);
  const DOPANT_SITE = 5;
</script>
<div class="widget">
  <div class="w-label">dope the crystal — add a trace element and watch carriers appear</div>
  <div class="dope-modes" role="group" aria-label="doping type">
    {#each MODES as [val, label]}
      <button type="button" class="dope-btn" class:on={mode === val} aria-pressed={mode === val} onclick={() => (mode = val)}>{label}</button>
    {/each}
  </div>
  <div class="dope-lattice" class:n={mode === 'n'} class:p={mode === 'p'}>
    {#each SITES as i}
      <span class="dope-atom" class:dopant={mode !== 'pure' && i === DOPANT_SITE}>
        Si
        {#if mode === 'n' && i === DOPANT_SITE}<span class="dope-carrier el">e⁻</span>{/if}
        {#if mode === 'p' && i === DOPANT_SITE}<span class="dope-carrier hole">○</span>{/if}
      </span>
    {/each}
  </div>
  <div class="dope-info">
    <div class="dope-row"><span class="dope-k">dopant</span><span class="dope-v">{d.dopant}</span></div>
    <div class="dope-row"><span class="dope-k">carrier</span><span class="dope-v" class:el={d.charge < 0} class:hole={d.charge > 0}>{d.carrier}</span></div>
    <div class="dope-row"><span class="dope-k">conducts?</span><span class="dope-v">{d.conductive ? 'yes — it now carries current' : 'barely'}</span></div>
  </div>
  <div class="csnote" role="status" aria-live="polite">{d.note}</div>
</div>

<style>
  .dope-modes{display:flex;gap:8px;justify-content:center;margin-bottom:16px}
  .dope-btn{font-family:var(--mono);font-size:13px;padding:6px 16px;border:1px solid var(--border);border-radius:8px;background:var(--surface);color:var(--dim);cursor:pointer;transition:.15s}
  .dope-btn.on{border-color:var(--signal);color:var(--signal);background:var(--signal-d)}
  .dope-lattice{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;max-width:300px;margin:0 auto;font-family:var(--mono)}
  .dope-atom{position:relative;aspect-ratio:1;display:flex;align-items:center;justify-content:center;border:1px solid var(--border);border-radius:8px;color:var(--faint);font-size:13px;background:var(--surface);transition:.18s}
  .dope-atom.dopant{border-color:var(--amber);color:var(--amber);background:var(--amber-d)}
  .dope-carrier{position:absolute;top:-7px;right:-7px;font-size:12px;font-weight:700;border-radius:999px;padding:1px 5px;line-height:1.3}
  .dope-carrier.el{color:var(--blue);background:var(--blue-d);border:1px solid var(--blue)}
  .dope-carrier.hole{color:var(--red);background:rgba(255,107,107,.12);border:1px solid var(--red)}
  .dope-info{max-width:340px;margin:18px auto 0;font-family:var(--mono);font-size:13px}
  .dope-row{display:flex;justify-content:space-between;gap:12px;padding:5px 0;border-bottom:1px solid var(--border)}
  .dope-k{color:var(--faint);text-transform:uppercase;font-size:11px;letter-spacing:.08em}
  .dope-v{color:var(--dim);text-align:right}
  .dope-v.el{color:var(--blue)}
  .dope-v.hole{color:var(--red)}
</style>
