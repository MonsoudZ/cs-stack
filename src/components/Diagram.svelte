<script>
  // The shared SVG topology diagram: boxes (nodes), the links between them
  // (edges), and a glowing token that slides to whichever node is `active`.
  // Layout is the pure layoutDiagram() (src/lib/diagram.js); this file only
  // draws. Props:
  //   nodes  [{ id, label, x?, y? }]   grid coords optional (default: a chain)
  //   edges  [[fromId, toId]]          optional (default: the chain)
  //   active nodeId                    highlighted + the token moves here
  //   warn   nodeId                    flagged red (a miss, a stale replica…)
  //   meta   { nodeId: 'short state' } one line of live state under each label
  //   label  string                    accessible name for the drawing
  // On narrow screens the grid is transposed so a chain reads top-to-bottom.
  import { layoutDiagram, NODE_W, NODE_H } from '../lib/diagram.js';
  let { nodes, edges = null, active = null, warn = null, meta = null, label = 'system diagram' } = $props();
  let vertical = $state(false);
  $effect(() => {
    if (typeof matchMedia !== 'function') return;
    const mq = matchMedia('(max-width: 560px)');
    const sync = () => (vertical = mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  });
  let d = $derived(layoutDiagram(nodes, edges, { vertical }));
  let activeNode = $derived(d.nodes.find((n) => n.id === active) || null);
  let activeLabel = $derived(activeNode ? activeNode.label : null);
  // The SVG scales with its container but never beyond 1.5× its natural size,
  // so a short vertical chain on a phone doesn't balloon (style:max-width above).
  // The token sits on the active node's top edge; `transform` transitions in
  // CSS so it visibly slides between nodes (and stays still under reduced motion).
  let tokenStyle = $derived(activeNode ? `translate(${activeNode.cx}px, ${activeNode.cy - NODE_H / 2}px)` : null);
</script>
<svg class="dg" class:vertical viewBox="0 0 {d.width} {d.height}" role="img" style:max-width={Math.min(720, Math.round(d.width * 1.5)) + 'px'}
     aria-label="{label}{activeLabel ? ' — ' + activeLabel + ' active' : ''}">
  {#each d.edges as e (e.a + '→' + e.b)}
    <line class="dg-edge" class:lit={e.a === active || e.b === active} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} />
  {/each}
  {#each d.nodes as n (n.id)}
    <g class="dg-node" class:on={n.id === active} class:warn={n.id === warn} transform="translate({n.cx - NODE_W / 2}, {n.cy - NODE_H / 2})">
      <rect class="dg-box" width={NODE_W} height={NODE_H} rx="11" />
      <text class="dg-label" x={NODE_W / 2} y="22" text-anchor="middle">{n.label}</text>
      <text class="dg-meta" x={NODE_W / 2} y="41" text-anchor="middle">{(meta && meta[n.id]) || ''}</text>
    </g>
  {/each}
  {#if tokenStyle}
    <g class="dg-token" style:transform={tokenStyle} aria-hidden="true">
      <circle r="7" class="dg-token-glow" />
      <circle r="4" class="dg-token-dot" />
    </g>
  {/if}
</svg>

<style>
  .dg{display:block;width:100%;height:auto;max-width:720px;margin:0 auto;font-family:var(--mono);overflow:visible}
  .dg-edge{stroke:var(--border);stroke-width:2;transition:stroke .18s}
  .dg-edge.lit{stroke:var(--faint)}
  .dg-box{fill:var(--surface);stroke:var(--border);stroke-width:1.5;transition:.18s}
  .dg-label{fill:var(--ink);font-size:13px;font-weight:700}
  .dg-meta{fill:var(--faint);font-size:10.5px}
  .dg-node.on .dg-box{stroke:var(--signal);filter:drop-shadow(0 0 8px var(--signal-d))}
  .dg-node.on .dg-label{fill:var(--signal)}
  .dg-node.warn .dg-box{stroke:var(--red);filter:drop-shadow(0 0 8px rgba(255,107,107,.3))}
  .dg-node.warn .dg-label,.dg-node.warn .dg-meta{fill:var(--red)}
  .dg-token{transition:transform .45s cubic-bezier(.2,.7,.2,1)}
  .dg-token-glow{fill:var(--signal);opacity:.25}
  .dg-token-dot{fill:var(--signal)}
  .dg-node.warn ~ .dg-token .dg-token-dot{fill:var(--signal)}
</style>
