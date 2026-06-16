<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildRaftLog } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = useStepper(() => buildRaftLog(), { speed: 1100 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
</script>
<div class="widget">
  <div class="csbar">
    <span class="csmini">leader appends · replicate · commit on a majority · apply</span>
    <span class="spacer"></span>
    {#if s.client}<span class="rl-client">client → {s.client}</span>{/if}
  </div>
  <div class="w-label">step a command through the cluster — green once a majority makes it safe to commit</div>
  <div class="rl-nodes">
    {#each s.nodes as n}
      <div class="rl-node {n.role}" class:acting={s.action === 'replicate' && n.role === 'follower'}>
        <div class="rl-head"><span class="rl-id">{n.id}</span><span class="rl-role">{n.role}</span></div>
        <div class="rl-log">
          {#each n.log as e, i}
            <span class="rl-entry" class:committed={i < n.commit}>{e.cmd}</span>
          {/each}
          {#if n.log.length === 0}<span class="rl-entry empty">empty</span>{/if}
        </div>
        <div class="rl-commit">commit {n.commit}</div>
      </div>
    {/each}
  </div>
  <div class="rl-state">applied state machine: <b>{s.state}</b></div>
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .rl-client{font-size:12px;color:var(--amber);font-weight:700}
  .rl-nodes{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;font-family:var(--mono)}
  .rl-node{border:1px solid var(--border);border-radius:12px;padding:12px 14px;background:var(--surface);min-width:150px;transition:.18s}
  .rl-node.leader{border-color:var(--signal)}
  .rl-node.acting{box-shadow:0 0 14px var(--blue-d);border-color:var(--blue)}
  .rl-head{display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin-bottom:8px}
  .rl-id{font-size:15px;font-weight:700;color:var(--ink)}
  .rl-role{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--faint)}
  .rl-node.leader .rl-role{color:var(--signal)}
  .rl-log{display:flex;gap:5px;flex-wrap:wrap;min-height:30px;align-items:center}
  .rl-entry{font-size:12px;padding:5px 8px;border-radius:7px;border:1px dashed var(--border);color:var(--dim);background:var(--panel2)}
  .rl-entry.committed{border-style:solid;border-color:var(--signal);color:var(--signal);background:var(--signal-d)}
  .rl-entry.empty{border-style:dashed;color:var(--faint)}
  .rl-commit{font-size:11px;color:var(--faint);margin-top:8px}
  .rl-state{margin-top:12px;font-family:var(--mono);font-size:13px;color:var(--dim);text-align:center}
  .rl-state b{color:var(--signal)}
  @media(max-width:560px){.rl-node{min-width:46%;padding:10px}}
</style>
