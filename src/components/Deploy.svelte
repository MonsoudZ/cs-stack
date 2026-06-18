<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildDeploy } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = useStepper(() => buildDeploy(), { speed: 1050 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
</script>
<div class="widget">
  <div class="csbar">
    <span class="csmini">shift traffic gradually — catch a bad release on a few %, not everyone</span>
    <span class="spacer"></span>
    <span class="dp-health" class:bad={s.health === 'bad'}>{s.health === 'bad' ? 'errors ↑' : 'healthy'}</span>
  </div>
  <div class="w-label">step a canary rollout — a buggy v2 trips the error rate and auto-rolls-back</div>
  <div class="dp-versions">
    <div class="dp-ver">
      <div class="dp-vlabel">v1 <span>stable</span></div>
      <div class="dp-bar"><div class="dp-fill v1" style:width={s.v1 + '%'}></div></div>
      <div class="dp-pct">{s.v1}%</div>
    </div>
    <div class="dp-ver" class:bad={s.health === 'bad'}>
      <div class="dp-vlabel">v2 <span>new</span></div>
      <div class="dp-bar"><div class="dp-fill v2" class:bad={s.health === 'bad'} style:width={s.v2 + '%'}></div></div>
      <div class="dp-pct">{s.v2}%</div>
    </div>
  </div>
  {#if s.rolledBack}<div class="dp-flag bad">⟲ rolled back — 100% on v1</div>{/if}
  {#if s.phase === 'live'}<div class="dp-flag ok">✓ v2 fully live</div>{/if}
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .dp-health{font-family:var(--mono);font-size:12px;color:var(--signal)}
  .dp-health.bad{color:var(--red)}
  .dp-versions{display:flex;flex-direction:column;gap:12px;font-family:var(--mono);margin-top:2px}
  .dp-ver{display:grid;grid-template-columns:110px 1fr 48px;gap:12px;align-items:center}
  .dp-vlabel{font-size:13px;color:var(--ink);font-weight:700}
  .dp-vlabel span{font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--faint);font-weight:400;margin-left:4px}
  .dp-bar{height:18px;border:1px solid var(--border);border-radius:999px;background:var(--panel2);overflow:hidden}
  .dp-fill{height:100%;border-radius:999px;transition:width .35s ease}
  .dp-fill.v1{background:var(--blue)}
  .dp-fill.v2{background:var(--signal)}
  .dp-fill.v2.bad{background:var(--red)}
  .dp-pct{font-size:13px;color:var(--dim);text-align:right}
  .dp-flag{margin-top:12px;padding:9px 13px;border-radius:10px;font-size:13px;font-weight:700;text-align:center;border:1px solid var(--border);font-family:var(--mono)}
  .dp-flag.bad{color:var(--red);border-color:var(--red);background:rgba(255,107,107,.1)}
  .dp-flag.ok{color:var(--signal);border-color:var(--signal);background:var(--signal-d)}
  @media(max-width:560px){.dp-ver{grid-template-columns:84px 1fr 40px;gap:8px}}
</style>
