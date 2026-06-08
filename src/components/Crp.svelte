<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildCrp } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  let defer = $state(false);
  const stepper = useStepper(() => buildCrp({ defer }), { speed: 1100 });
  const { idx, version } = stepper;
  let s = $derived(($version, stepper.all()[$idx]));
  function toggle() { defer = !defer; stepper.rebuild(() => buildCrp({ defer })); }
</script>
<div class="widget">
  <div class="csbar">
    <span class="csmini">page load · what gates the first paint</span>
    <span class="spacer"></span>
    <button type="button" class="csbtn" aria-pressed={defer} onclick={toggle}>script: {defer ? 'defer' : 'blocking'}</button>
  </div>
  <div class="w-label">step the load — then defer the script and watch first paint move earlier</div>
  <div class="crp-lanes">
    <div class="crp-lane" class:active={s.parsing}>
      <span class="crp-name">HTML</span>
      <span class="crp-state">{s.parsing ? 'parsing → DOM' : 'parser idle'}</span>
    </div>
    <div class="crp-lane css" class:active={s.cssBlocking}>
      <span class="crp-name">CSS</span>
      <span class="crp-state">render-blocking → CSSOM</span>
    </div>
    <div class="crp-lane js" class:active={s.scriptBlocking} class:done={s.scriptRan} class:deferred={s.defer}>
      <span class="crp-name">JS</span>
      <span class="crp-state">{s.scriptBlocking ? 'BLOCKING the parser' : s.defer ? 'deferred — off the path' : s.scriptRan ? 'ran' : 'app.js'}</span>
    </div>
  </div>
  <div class="crp-paint" class:on={s.painted}>{s.painted ? '🎨 first paint' : 'not painted yet'}</div>
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .csbtn{font-family:var(--mono);font-size:12px;padding:4px 10px;border:1px solid var(--border);border-radius:7px;background:var(--surface);color:var(--dim);cursor:pointer}
  .csbtn[aria-pressed="true"]{border-color:var(--signal);color:var(--signal);background:var(--signal-d)}
  .crp-lanes{display:flex;flex-direction:column;gap:8px;font-family:var(--mono)}
  .crp-lane{display:flex;align-items:center;gap:14px;border:1px solid var(--border);border-radius:10px;padding:11px 14px;background:var(--surface);transition:.18s}
  .crp-lane.active{border-color:var(--blue);box-shadow:0 0 12px var(--blue-d)}
  .crp-lane.css.active{border-color:var(--violet);box-shadow:0 0 12px var(--violet-d)}
  .crp-lane.js.active{border-color:var(--red);box-shadow:0 0 12px rgba(255,107,107,.18)}
  .crp-lane.js.deferred{opacity:.7}
  .crp-name{width:46px;font-weight:700;color:var(--ink)}
  .crp-state{font-size:13px;color:var(--dim)}
  .crp-lane.js.active .crp-state{color:var(--red);font-weight:700}
  .crp-lane.css .crp-name{color:var(--violet)}
  .crp-paint{margin-top:14px;text-align:center;font-family:var(--mono);font-weight:700;border:1px dashed var(--border);border-radius:10px;padding:10px;color:var(--faint);transition:.18s}
  .crp-paint.on{border-style:solid;border-color:var(--signal);color:var(--signal);background:var(--signal-d)}
</style>
