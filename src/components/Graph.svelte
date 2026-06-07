<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildGraphTraversal } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = useStepper(() => buildGraphTraversal(), { speed: 1000 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
  const POS = { A: [55, 100], B: [150, 38], C: [150, 162], D: [255, 70], E: [270, 160] };
  const EDGES = [['A', 'B'], ['A', 'C'], ['B', 'D'], ['C', 'D'], ['C', 'E']];
  const state = (n) => (n === s.current ? 'cur' : s.visited.includes(n) ? 'seen' : s.queue.includes(n) ? 'queued' : 'unseen');
</script>
<div class="widget">
  <div class="csbar">
    <span class="csmini">graph · breadth-first search</span>
    <span class="spacer"></span>
    <span class="csmini">visited: {s.visited.length ? s.visited.join(' ') : '—'}</span>
  </div>
  <div class="w-label">step the BFS — a queue holds the frontier, exploring level by level</div>
  <svg class="gr" viewBox="0 0 320 200" role="img" aria-label="graph traversal">
    {#each EDGES as [a, b]}
      <line x1={POS[a][0]} y1={POS[a][1]} x2={POS[b][0]} y2={POS[b][1]} class="gr-edge" />
    {/each}
    {#each Object.entries(POS) as [n, [x, y]]}
      <g class="gr-node {state(n)}">
        <circle cx={x} cy={y} r="18" />
        <text {x} y={y + 5} text-anchor="middle">{n}</text>
      </g>
    {/each}
  </svg>
  <div class="gr-queue">
    <span class="gr-qlab">queue (frontier):</span>
    {#if s.queue.length}{#each s.queue as q}<span class="gr-chip">{q}</span>{/each}{:else}<span class="gr-empty">empty</span>{/if}
  </div>
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .gr{width:100%;max-width:420px;display:block;margin:0 auto;height:auto}
  .gr-edge{stroke:var(--border);stroke-width:2}
  .gr-node circle{fill:var(--surface);stroke:var(--faint);stroke-width:2;transition:.18s}
  .gr-node text{fill:var(--dim);font-family:var(--mono);font-weight:700;font-size:14px}
  .gr-node.unseen circle{fill:var(--surface);stroke:var(--border)}
  .gr-node.queued circle{stroke:var(--amber);fill:var(--amber-d)}
  .gr-node.queued text{fill:var(--amber)}
  .gr-node.seen circle{stroke:var(--signal);fill:var(--signal-d)}
  .gr-node.seen text{fill:var(--signal)}
  .gr-node.cur circle{stroke:var(--blue);fill:var(--blue-d);stroke-width:3}
  .gr-node.cur text{fill:var(--blue)}
  .gr-queue{display:flex;align-items:center;gap:8px;justify-content:center;flex-wrap:wrap;font-family:var(--mono);margin-top:6px}
  .gr-qlab{font-size:12px;color:var(--faint)}
  .gr-chip{min-width:26px;height:26px;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--amber);border-radius:7px;color:var(--amber);background:var(--amber-d);font-weight:700;font-size:13px}
  .gr-empty{font-size:12px;color:var(--faint)}
</style>
