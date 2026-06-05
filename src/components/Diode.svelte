<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildDiode } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = useStepper(() => buildDiode(), { speed: 1200 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
</script>
<div class="widget">
  <div class="csbar">
    <span class="csmini">PN junction · a one-way valve for current</span>
    <span class="spacer"></span>
    <span class="csmini di-state" class:flow={s.conducts}>{s.bias === 'none' ? 'no bias' : s.bias + ' bias'} · {s.conducts ? 'CURRENT FLOWS' : 'blocked'}</span>
  </div>
  <div class="w-label">step the bias — see the depletion region narrow or widen</div>
  <div class="di-junction" class:flow={s.conducts}>
    <div class="di-region p">p-type<small>holes ○</small></div>
    <div class="di-dep" class:narrow={s.depletion === 'narrow'} class:wide={s.depletion === 'wide'}>
      <span class="di-dep-lab">depletion</span>
    </div>
    <div class="di-region n">n-type<small>electrons e⁻</small></div>
    {#if s.conducts}<div class="di-flow" aria-hidden="true">→ → →</div>{/if}
  </div>
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .di-state{color:var(--faint)}
  .di-state.flow{color:var(--signal)}
  .di-junction{position:relative;display:flex;align-items:stretch;height:120px;border:1px solid var(--border);border-radius:14px;overflow:hidden;font-family:var(--mono);background:linear-gradient(#0e1622,#0b1018)}
  .di-region{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:700;font-size:15px}
  .di-region small{font-size:11px;font-weight:400;color:var(--faint);margin-top:4px}
  .di-region.p{color:var(--red);background:rgba(255,107,107,.08)}
  .di-region.n{color:var(--blue);background:rgba(91,157,255,.08)}
  .di-dep{width:56px;background:repeating-linear-gradient(45deg,#2a3346,#2a3346 3px,#1d2533 3px,#1d2533 6px);display:flex;align-items:center;justify-content:center;transition:width .3s}
  .di-dep.narrow{width:14px}
  .di-dep.wide{width:96px}
  .di-dep-lab{font-size:9px;letter-spacing:.06em;text-transform:uppercase;color:var(--faint);writing-mode:vertical-rl;transform:rotate(180deg)}
  .di-flow{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--signal);letter-spacing:.5em;font-size:18px;text-shadow:0 0 12px var(--signal-d);animation:di-pulse 1.1s ease-in-out infinite}
  @keyframes di-pulse{50%{opacity:.4}}
  @media(prefers-reduced-motion:reduce){.di-flow{animation:none}}
</style>
