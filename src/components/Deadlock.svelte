<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildDeadlock } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  let ordered = $state(false);
  const stepper = useStepper(() => buildDeadlock({ ordered }), { speed: 1100 });
  const { idx, version } = stepper;
  // $version so the step recomputes when the ordering toggle rebuilds at step 0
  let s = $derived(($version, stepper.all()[$idx]));
  function toggle() { ordered = !ordered; stepper.rebuild(() => buildDeadlock({ ordered })); }
</script>
<div class="widget">
  <div class="csbar">
    <span class="csmini">2 threads · 2 locks · {ordered ? 'consistent order (safe)' : 'opposite order (bug)'}</span>
    <span class="spacer"></span>
    <button type="button" class="csbtn" aria-pressed={ordered} onclick={toggle}>lock ordering: {ordered ? 'ON' : 'OFF'}</button>
  </div>
  <div class="w-label">step the threads — watch a circular wait form, then turn on a lock ordering</div>
  <div class="dl-grid">
    <div class="dl-thread" class:stuck={s.deadlocked}>
      <div class="dl-name">Thread A</div>
      <div class="dl-state">holds: {s.aHolds.length ? s.aHolds.join(', ') : '—'}</div>
      <div class="dl-wait" class:on={s.aWait}>{s.aWait ? 'waiting for ' + s.aWait + '…' : ''}</div>
    </div>
    <div class="dl-locks">
      <div class="dl-lock" class:l1a={s.l1 === 'A'} class:l1b={s.l1 === 'B'}>L1<small>{s.l1 ? '→ ' + s.l1 : 'free'}</small></div>
      <div class="dl-lock" class:l1a={s.l2 === 'A'} class:l1b={s.l2 === 'B'}>L2<small>{s.l2 ? '→ ' + s.l2 : 'free'}</small></div>
    </div>
    <div class="dl-thread" class:stuck={s.deadlocked}>
      <div class="dl-name">Thread B</div>
      <div class="dl-state">holds: {s.bHolds.length ? s.bHolds.join(', ') : '—'}</div>
      <div class="dl-wait" class:on={s.bWait}>{s.bWait ? 'waiting for ' + s.bWait + '…' : ''}</div>
    </div>
  </div>
  {#if s.deadlocked}<div class="dl-banner">⊘ DEADLOCK — circular wait</div>{/if}
  {#if s.done}<div class="dl-banner ok">✓ both threads finished</div>{/if}
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .csbtn{font-family:var(--mono);font-size:12px;padding:4px 10px;border:1px solid var(--border);border-radius:7px;background:var(--surface);color:var(--dim);cursor:pointer}
  .csbtn[aria-pressed="true"]{border-color:var(--signal);color:var(--signal);background:var(--signal-d)}
  .dl-grid{display:grid;grid-template-columns:1fr auto 1fr;gap:14px;align-items:center;font-family:var(--mono)}
  @media(max-width:560px){.dl-grid{grid-template-columns:1fr;gap:10px}}
  .dl-thread{border:1px solid var(--border);border-radius:12px;padding:14px;background:var(--surface);transition:.18s}
  .dl-thread.stuck{border-color:var(--red);background:rgba(255,107,107,.08)}
  .dl-name{font-weight:700;color:var(--ink);margin-bottom:8px}
  .dl-state{font-size:13px;color:var(--dim)}
  .dl-wait{font-size:13px;color:var(--faint);min-height:20px;margin-top:4px}
  .dl-wait.on{color:var(--red)}
  .dl-locks{display:flex;flex-direction:column;gap:10px}
  @media(max-width:560px){.dl-locks{flex-direction:row;justify-content:center}}
  .dl-lock{width:74px;display:flex;flex-direction:column;align-items:center;border:1px solid var(--border);border-radius:10px;padding:10px 0;font-weight:700;color:var(--faint);background:var(--surface);transition:.18s}
  .dl-lock small{font-size:10px;font-weight:400;margin-top:3px}
  .dl-lock.l1a{border-color:var(--blue);color:var(--blue);background:var(--blue-d)}
  .dl-lock.l1b{border-color:var(--amber);color:var(--amber);background:var(--amber-d)}
  .dl-banner{margin-top:16px;text-align:center;font-family:var(--mono);font-weight:700;color:var(--red);border:1px solid var(--red);border-radius:10px;padding:10px;background:rgba(255,107,107,.1)}
  .dl-banner.ok{color:var(--signal);border-color:var(--signal);background:var(--signal-d)}
</style>
