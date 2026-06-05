<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildRace } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  let locked = $state(false);
  const stepper = useStepper(() => buildRace({ locked }), { speed: 900 });
  const { idx, version } = stepper;
  // $version so the step recomputes when the lock toggle rebuilds at step 0
  let s = $derived(($version, stepper.all()[$idx]));
  function toggleLock() { locked = !locked; stepper.rebuild(() => buildRace({ locked })); }
</script>
<div class="widget">
  <div class="csbar">
    <span class="csmini">two threads, both running counter += 1</span>
    <span class="spacer"></span>
    <button type="button" class="btn" onclick={toggleLock}>lock: {locked ? 'ON (safe)' : 'OFF (racy)'}</button>
  </div>
  <div class="w-label">step the interleaving — without a lock, a bad order loses an update</div>
  <div class="race">
    <div class="thread" class:act={s.thread === 'A'} aria-current={s.thread === 'A' ? 'true' : undefined}>
      <div class="th-name">Thread A</div>
      <div class="th-op">{s.thread === 'A' ? s.op : '—'}</div>
      <div class="th-tmp">tmp = {s.tmpA}</div>
    </div>
    <div class="shared">
      <div class="counter" class:lost={s.lost}>{s.counter}</div>
      <div class="sh-lab">counter</div>
      <div class="lockstate">{s.held ? 'locked · ' + s.held : 'unlocked'}</div>
    </div>
    <div class="thread" class:act={s.thread === 'B'} aria-current={s.thread === 'B' ? 'true' : undefined}>
      <div class="th-name">Thread B</div>
      <div class="th-op">{s.thread === 'B' ? s.op : '—'}</div>
      <div class="th-tmp">tmp = {s.tmpB}</div>
    </div>
  </div>
  <div class="csnote" class:race-lost={s.lost} role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .race{display:grid;grid-template-columns:1fr auto 1fr;gap:16px;align-items:center;font-family:var(--mono);margin-top:4px}
  .thread{border:1px solid var(--border);border-radius:14px;padding:16px;background:var(--surface);text-align:center;transition:.18s}
  .thread.act{border-color:var(--blue);box-shadow:0 0 18px var(--blue-d)}
  .th-name{font-size:13px;font-weight:700;color:var(--blue)}
  .th-op{font-size:18px;color:var(--ink);margin-top:8px;text-transform:uppercase;letter-spacing:.08em;min-height:22px}
  .th-tmp{font-size:12px;color:var(--faint);margin-top:6px}
  .shared{display:flex;flex-direction:column;align-items:center;gap:4px}
  .counter{width:74px;height:74px;border-radius:14px;border:2px solid var(--border-hot);display:flex;align-items:center;justify-content:center;
    font-size:32px;font-weight:700;color:var(--signal);background:var(--signal-d);transition:.2s}
  .counter.lost{border-color:var(--red);color:var(--red);background:rgba(255,107,107,.12)}
  .sh-lab{font-size:11px;color:var(--faint);text-transform:uppercase;letter-spacing:.1em}
  .lockstate{font-size:12px;color:var(--dim);margin-top:4px}
  .race-lost{color:var(--red)!important}
  @media(max-width:600px){.race{grid-template-columns:1fr;gap:12px}}
</style>
