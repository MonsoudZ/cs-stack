<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildJournal } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  let journaled = $state(true);
  const stepper = useStepper(() => buildJournal({ journaled }), { speed: 1200 });
  const { idx, version } = stepper;
  let s = $derived(($version, stepper.all()[$idx]));
  function toggle() { journaled = !journaled; stepper.rebuild(() => buildJournal({ journaled })); }
</script>
<div class="widget">
  <div class="csbar">
    <span class="csmini">a metadata update interrupted by a crash</span>
    <span class="spacer"></span>
    <button type="button" class="csbtn" aria-pressed={journaled} onclick={toggle}>journal: {journaled ? 'ON' : 'OFF'}</button>
  </div>
  <div class="w-label">step the write — then turn the journal on and off, and watch the crash</div>
  {#if s.journal.length}
    <div class="jr-journal">
      <div class="jr-lab">journal (write-ahead)</div>
      <div class="jr-entries">
        {#each s.journal as e}<span class="jr-entry" class:commit={e === 'COMMIT'}>{e}</span>{/each}
      </div>
    </div>
  {/if}
  {#if s.crashed}<div class="jr-banner crash">⚡ CRASH — power lost mid-update</div>{/if}
  {#if s.consistent === true}<div class="jr-banner ok">✓ filesystem consistent on restart</div>{/if}
  {#if s.consistent === false}<div class="jr-banner bad">✗ filesystem corrupt — a dangling directory entry</div>{/if}
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .csbtn{font-family:var(--mono);font-size:12px;padding:4px 10px;border:1px solid var(--border);border-radius:7px;background:var(--surface);color:var(--dim);cursor:pointer}
  .csbtn[aria-pressed="true"]{border-color:var(--signal);color:var(--signal);background:var(--signal-d)}
  .jr-journal{border:1px solid var(--border);border-radius:12px;padding:14px;background:var(--surface);font-family:var(--mono)}
  .jr-lab{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin-bottom:10px}
  .jr-entries{display:flex;gap:8px;flex-wrap:wrap}
  .jr-entry{border:1px solid var(--border);border-radius:7px;padding:6px 11px;font-size:13px;color:var(--dim);background:var(--bg)}
  .jr-entry.commit{border-color:var(--signal);color:var(--signal);background:var(--signal-d);font-weight:700}
  .jr-banner{margin-top:14px;text-align:center;font-family:var(--mono);font-weight:700;border-radius:10px;padding:10px}
  .jr-banner.crash{color:var(--amber);border:1px solid var(--amber);background:var(--amber-d)}
  .jr-banner.ok{color:var(--signal);border:1px solid var(--signal);background:var(--signal-d)}
  .jr-banner.bad{color:var(--red);border:1px solid var(--red);background:rgba(255,107,107,.08)}
</style>
