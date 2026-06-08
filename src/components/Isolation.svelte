<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildIsolation, ISOLATION_LEVELS } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  let level = $state('READ COMMITTED');
  const stepper = useStepper(() => buildIsolation({ level }), { speed: 1200 });
  const { idx, version } = stepper;
  let s = $derived(($version, stepper.all()[$idx]));
  function pick(l) { level = l; stepper.rebuild(() => buildIsolation({ level })); }
</script>
<div class="widget">
  <div class="csbar">
    <span class="csmini">two concurrent transactions on row x</span>
    <span class="spacer"></span>
    <span class="csmini">x = {s.committed}{s.pending != null ? ' · T2 pending ' + s.pending : ''}</span>
  </div>
  <div class="iso-levels" role="group" aria-label="isolation level">
    {#each ISOLATION_LEVELS as l}
      <button type="button" class="iso-btn" class:on={level === l} aria-pressed={level === l} onclick={() => pick(l)}>{l}</button>
    {/each}
  </div>
  <div class="w-label">step the interleaving — change the level and watch what T1 is allowed to see</div>
  <div class="iso-grid">
    <div class="iso-txn" class:act={s.actor === 'T1'}>
      <div class="iso-name">T1 <span>the reader</span></div>
      <div class="iso-reads">
        {#each s.t1reads as r, i}
          <span class="iso-read" class:bad={(i === 1 && s.t1reads[1] === 120) || (i === 2 && s.t1reads[2] !== s.t1reads[0])}>read {i + 1}: x = {r}</span>
        {/each}
        {#if s.t1reads.length === 0}<span class="iso-empty">no reads yet</span>{/if}
      </div>
    </div>
    <div class="iso-txn" class:act={s.actor === 'T2'}>
      <div class="iso-name">T2 <span>the writer</span></div>
      <div class="iso-write" class:pending={s.pending != null}>
        {s.pending != null ? 'x = ' + s.pending + ' (uncommitted)' : s.committed === 120 ? 'x = 120 (committed)' : 'idle'}
      </div>
    </div>
  </div>
  {#if s.anomaly}
    <div class="iso-flag">{s.anomaly === 'dirty' ? '⚠ dirty read' : '⚠ non-repeatable read'}</div>
  {/if}
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .iso-levels{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:14px}
  .iso-btn{font-family:var(--mono);font-size:12px;padding:6px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface);color:var(--dim);cursor:pointer;transition:.15s}
  .iso-btn.on{border-color:var(--blue);color:var(--blue);background:var(--blue-d)}
  .iso-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;font-family:var(--mono)}
  @media(max-width:520px){.iso-grid{grid-template-columns:1fr}}
  .iso-txn{border:1px solid var(--border);border-radius:12px;padding:14px;background:var(--surface);transition:.18s}
  .iso-txn.act{border-color:var(--signal);box-shadow:0 0 14px var(--signal-d)}
  .iso-name{font-weight:700;color:var(--ink);margin-bottom:10px}
  .iso-name span{font-size:11px;font-weight:400;color:var(--faint);margin-left:6px}
  .iso-reads{display:flex;flex-direction:column;gap:6px}
  .iso-read{font-size:13px;color:var(--dim);border:1px solid var(--border);border-radius:7px;padding:5px 9px}
  .iso-read.bad{border-color:var(--red);color:var(--red);background:rgba(255,107,107,.08)}
  .iso-empty{font-size:12px;color:var(--faint)}
  .iso-write{font-size:13px;color:var(--dim)}
  .iso-write.pending{color:var(--amber)}
  .iso-flag{margin-top:14px;text-align:center;font-family:var(--mono);font-weight:700;color:var(--red);border:1px solid var(--red);border-radius:10px;padding:9px;background:rgba(255,107,107,.08)}
</style>
