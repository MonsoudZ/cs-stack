<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildRaftElection } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = useStepper(() => buildRaftElection(), { speed: 1100 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
</script>
<div class="widget">
  <div class="csbar">
    <span class="csmini">terms · votes · majorities — how a cluster picks one leader</span>
    <span class="spacer"></span>
    {#if s.votes != null}<span class="rft-tally" class:win={s.votes >= s.majority}>{s.votes} / {s.majority} votes</span>{/if}
  </div>
  <div class="w-label">step an election — a candidate gathers a majority and leads, then crashes and the cluster re-elects</div>
  <div class="rft-nodes">
    {#each s.nodes as n}
      <div class="rft-node {n.role}" class:granted={n.granted}>
        <div class="rft-id">{n.id}</div>
        <div class="rft-role">{n.role}</div>
        <div class="rft-term">term {n.term}</div>
        <div class="rft-vote">{n.granted ? '✓ voted' : ''}</div>
      </div>
    {/each}
  </div>
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .rft-tally{font-size:12px;color:var(--faint)}
  .rft-tally.win{color:var(--signal);font-weight:700}
  .rft-nodes{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;font-family:var(--mono)}
  .rft-node{display:flex;flex-direction:column;align-items:center;gap:3px;border:1px solid var(--border);border-radius:12px;
    padding:12px 10px;background:var(--surface);min-width:92px;transition:.18s}
  .rft-id{font-size:15px;font-weight:700;color:var(--ink)}
  .rft-role{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--faint)}
  .rft-term{font-size:11px;color:var(--dim)}
  .rft-vote{font-size:11px;color:var(--signal);min-height:14px}
  .rft-node.candidate{border-color:var(--amber);box-shadow:0 0 14px var(--amber-d)}
  .rft-node.candidate .rft-role{color:var(--amber)}
  .rft-node.leader{border-color:var(--signal);box-shadow:0 0 16px var(--signal-d)}
  .rft-node.leader .rft-role{color:var(--signal)}
  .rft-node.down{border-color:var(--red);opacity:.55}
  .rft-node.down .rft-role{color:var(--red)}
  .rft-node.granted{border-color:var(--signal)}
  @media(max-width:560px){.rft-node{min-width:30%;padding:10px 6px}}
</style>
