<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildReplication } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = useStepper(() => buildReplication(), { speed: 1100 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
</script>
<div class="widget">
  <div class="csbar">
    <span class="csmini">primary + read replicas · replication lag</span>
    <span class="spacer"></span>
    {#if s.readFrom}<span class="rp-read" class:stale={s.stale}>read {s.readFrom} → x = {s.readValue} {s.stale ? '(stale)' : '(fresh)'}</span>{/if}
  </div>
  <div class="w-label">step a write and a read — see a replica serve stale data until it catches up</div>
  <div class="rp-nodes">
    <div class="rp-node primary" class:write={s.action === 'write'}>
      <div class="rp-role">PRIMARY</div>
      <div class="rp-val">x = {s.primary}</div>
      <div class="rp-tag">takes all writes</div>
    </div>
    <div class="rp-arrow" class:on={s.action === 'replicate'}>replicate →</div>
    <div class="rp-replicas">
      {#each s.replicas as r}
        <div class="rp-node replica" class:behind={r.v !== s.primary} class:reading={r.id === s.readFrom}>
          <div class="rp-role">{r.id}</div>
          <div class="rp-val">x = {r.v}</div>
          <div class="rp-tag">{r.v === s.primary ? 'in sync' : 'behind'}</div>
        </div>
      {/each}
    </div>
  </div>
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .rp-read{color:var(--signal)}
  .rp-read.stale{color:var(--red)}
  .rp-nodes{display:flex;align-items:center;justify-content:center;gap:14px;font-family:var(--mono);flex-wrap:wrap}
  .rp-node{display:flex;flex-direction:column;align-items:center;gap:4px;border:1px solid var(--border);border-radius:12px;padding:14px 18px;background:var(--surface);min-width:120px;transition:.18s}
  .rp-node.primary.write{border-color:var(--signal);box-shadow:0 0 16px var(--signal-d)}
  .rp-node.replica.behind{border-color:var(--red);background:rgba(255,107,107,.06)}
  .rp-node.reading{box-shadow:0 0 16px var(--blue-d);border-color:var(--blue)}
  .rp-role{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint)}
  .rp-val{font-size:20px;font-weight:700;color:var(--ink)}
  .rp-tag{font-size:11px;color:var(--faint)}
  .rp-node.behind .rp-tag{color:var(--red)}
  .rp-replicas{display:flex;flex-direction:column;gap:10px}
  .rp-arrow{font-size:12px;color:var(--faint);transition:.18s}
  .rp-arrow.on{color:var(--signal);font-weight:700}
  @media(max-width:560px){.rp-arrow{transform:rotate(90deg)}}
</style>
