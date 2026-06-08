<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildGc } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = useStepper(() => buildGc(), { speed: 1100 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
  const POS = { 1: [70, 40], 2: [70, 130], 3: [180, 130], 4: [280, 40], 5: [280, 130] };
  let byId = $derived(Object.fromEntries(s.objects.map((o) => [o.id, o])));
  const state = (o) => (o.swept ? 'swept' : o.id === s.current ? 'cur' : o.marked ? 'marked' : 'unmarked');
</script>
<div class="widget">
  <div class="csbar">
    <span class="csmini">mark-and-sweep · reachability from the roots</span>
    <span class="spacer"></span>
    <span class="csmini gc-phase {s.phase}">{s.phase}</span>
  </div>
  <div class="w-label">step the collector — mark what the roots reach, sweep the rest</div>
  <svg class="gc" viewBox="0 0 350 180" role="img" aria-label="garbage collector object graph">
    <text x="70" y="16" text-anchor="middle" class="gc-root-lab">ROOT</text>
    <line x1="70" y1="20" x2="70" y2="24" class="gc-edge" />
    {#each s.objects as o}
      {#each o.refs as r}
        <line x1={POS[o.id][0]} y1={POS[o.id][1]} x2={POS[r][0]} y2={POS[r][1]} class="gc-edge" />
      {/each}
    {/each}
    {#each s.objects as o}
      <g class="gc-node {state(o)}">
        <circle cx={POS[o.id][0]} cy={POS[o.id][1]} r="18" />
        <text x={POS[o.id][0]} y={POS[o.id][1] + 5} text-anchor="middle">{o.id}</text>
      </g>
    {/each}
  </svg>
  <div class="gc-legend">
    <span><i class="sw marked"></i> reachable</span>
    <span><i class="sw swept"></i> collected</span>
  </div>
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .gc-phase{color:var(--faint);text-transform:uppercase;letter-spacing:.08em}
  .gc-phase.mark{color:var(--signal)}
  .gc-phase.sweep{color:var(--red)}
  .gc{width:100%;max-width:440px;display:block;margin:0 auto;height:auto}
  .gc-edge{stroke:var(--border);stroke-width:2}
  .gc-root-lab{fill:var(--faint);font-family:var(--mono);font-size:10px;letter-spacing:.1em}
  .gc-node circle{fill:var(--surface);stroke:var(--faint);stroke-width:2;transition:.18s}
  .gc-node text{fill:var(--dim);font-family:var(--mono);font-weight:700;font-size:14px}
  .gc-node.unmarked circle{stroke:var(--border)}
  .gc-node.marked circle{stroke:var(--signal);fill:var(--signal-d)}
  .gc-node.marked text{fill:var(--signal)}
  .gc-node.cur circle{stroke:var(--blue);fill:var(--blue-d);stroke-width:3}
  .gc-node.cur text{fill:var(--blue)}
  .gc-node.swept circle{stroke:var(--red);fill:rgba(255,107,107,.1);stroke-dasharray:3 3}
  .gc-node.swept text{fill:var(--red)}
  .gc-legend{display:flex;gap:18px;justify-content:center;font-family:var(--mono);font-size:11px;color:var(--faint);margin-top:4px}
  .gc-legend i{display:inline-block;width:11px;height:11px;border-radius:3px;margin-right:4px;vertical-align:middle}
  .gc-legend .sw.marked{border:1px solid var(--signal);background:var(--signal-d)}
  .gc-legend .sw.swept{border:1px solid var(--red);background:rgba(255,107,107,.1)}
</style>
