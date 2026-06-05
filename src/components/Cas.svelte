<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildCas } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = useStepper(() => buildCas(), { speed: 1200 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
  // the log of attempts revealed so far
  let log = $derived(stepper.all().slice(0, $idx + 1).filter((r) => r.cas));
</script>
<div class="widget">
  <div class="csbar">
    <span class="csmini">lock-free increment · compare-and-swap</span>
    <span class="spacer"></span>
    {#if s.actor}<span class="cas-actor" class:b={s.actor === 'B'}>thread {s.actor}{s.old != null ? ' · read ' + s.old : ''}</span>{/if}
  </div>
  <div class="w-label">step the threads — the loser’s swap fails and it simply retries, no lock</div>
  <div class="cas-mem">
    <span class="cas-lab">shared memory</span>
    <span class="cas-counter">counter = {s.counter}</span>
  </div>
  <div class="cas-log">
    {#each log as r}
      <div class="cas-attempt" class:fail={r.cas === 'fail'} class:ok={r.cas === 'ok'}>
        <span class="cas-th" class:b={r.actor === 'B'}>{r.actor}</span>
        <span class="cas-call">CAS({r.expected} → {r.newval})</span>
        <span class="cas-badge">{r.cas === 'ok' ? 'SWAPPED' : 'FAILED · retry'}</span>
      </div>
    {/each}
    {#if log.length === 0}<div class="cas-empty">step to watch the compare-and-swap attempts…</div>{/if}
  </div>
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .cas-actor{color:var(--blue)}
  .cas-actor.b{color:var(--amber)}
  .cas-mem{display:flex;align-items:center;justify-content:space-between;border:1px solid var(--border);border-radius:12px;padding:12px 16px;background:var(--surface);font-family:var(--mono);margin-bottom:14px}
  .cas-lab{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--faint)}
  .cas-counter{font-size:20px;font-weight:700;color:var(--signal)}
  .cas-log{display:flex;flex-direction:column;gap:8px;font-family:var(--mono);min-height:44px}
  .cas-attempt{display:flex;align-items:center;gap:12px;border:1px solid var(--border);border-radius:10px;padding:8px 14px;background:var(--surface)}
  .cas-attempt.ok{border-color:var(--signal)}
  .cas-attempt.fail{border-color:var(--red);opacity:.85}
  .cas-th{width:24px;height:24px;display:flex;align-items:center;justify-content:center;border-radius:6px;font-weight:700;color:var(--blue);background:var(--blue-d)}
  .cas-th.b{color:var(--amber);background:var(--amber-d)}
  .cas-call{flex:1;color:var(--dim)}
  .cas-badge{font-size:11px;font-weight:700;letter-spacing:.06em}
  .cas-attempt.ok .cas-badge{color:var(--signal)}
  .cas-attempt.fail .cas-badge{color:var(--red)}
  .cas-empty{font-size:13px;color:var(--faint);font-family:var(--mono)}
</style>
