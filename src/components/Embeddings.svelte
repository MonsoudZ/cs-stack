<script>
  import { EMBEDDINGS, nearestWords } from '../lib/widgets.js';
  const words = Object.keys(EMBEDDINGS);
  let sel = $state('cat');
  let near = $derived(nearestWords(sel, 3));
  let nearSet = $derived(new Set(near.map((n) => n.word)));
  const px = (v) => 130 + v * 110;   // map x ∈ [-1,1] → svg
  const py = (v) => 130 - v * 110;   // flip y
</script>
<div class="widget">
  <div class="csbar"><span class="csmini">embeddings · meaning as geometry · cosine similarity</span></div>
  <div class="w-label">pick a word — the closest vectors are the most related</div>
  <div class="em-pick" role="group" aria-label="word">
    {#each words as w}
      <button type="button" class="em-btn" class:on={sel === w} aria-pressed={sel === w} onclick={() => (sel = w)}>{w}</button>
    {/each}
  </div>
  <div class="em-body">
    <svg class="em-plot" viewBox="0 0 260 260" role="img" aria-label="word vector space">
      <line x1="130" y1="10" x2="130" y2="250" class="em-axis" /><line x1="10" y1="130" x2="250" y2="130" class="em-axis" />
      {#each words as w}
        {@const v = EMBEDDINGS[w]}
        <g class="em-pt" class:sel={w === sel} class:near={nearSet.has(w)}>
          <line x1="130" y1="130" x2={px(v[0])} y2={py(v[1])} class="em-vec" />
          <circle cx={px(v[0])} cy={py(v[1])} r="4" />
          <text x={px(v[0])} y={py(v[1]) - 7} text-anchor="middle">{w}</text>
        </g>
      {/each}
    </svg>
    <div class="em-near">
      <div class="em-nlab">nearest to <b>{sel}</b></div>
      {#each near as n}
        <div class="em-nrow"><span>{n.word}</span><span class="em-sim">{n.sim}</span></div>
      {/each}
    </div>
  </div>
  <div class="csnote" role="status" aria-live="polite">“{sel}” sits closest to {near.map((n) => n.word).join(', ')} — similar meanings point the same way. Real models learn hundreds of such dimensions.</div>
</div>

<style>
  .em-pick{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-bottom:14px}
  .em-btn{font-family:var(--mono);font-size:12px;padding:5px 11px;border:1px solid var(--border);border-radius:7px;background:var(--surface);color:var(--dim);cursor:pointer;transition:.15s}
  .em-btn.on{border-color:var(--violet);color:var(--violet);background:var(--violet-d)}
  .em-body{display:flex;gap:18px;align-items:center;flex-wrap:wrap;justify-content:center}
  .em-plot{width:100%;max-width:300px;height:auto}
  .em-axis{stroke:var(--border);stroke-width:1}
  .em-vec{stroke:var(--border);stroke-width:1;opacity:.4}
  .em-pt circle{fill:var(--faint)}
  .em-pt text{fill:var(--faint);font-family:var(--mono);font-size:10px}
  .em-pt.near circle{fill:var(--violet)}.em-pt.near text{fill:var(--violet)}
  .em-pt.near .em-vec{stroke:var(--violet);opacity:.7}
  .em-pt.sel circle{fill:var(--signal);r:6}.em-pt.sel text{fill:var(--signal);font-weight:700}
  .em-pt.sel .em-vec{stroke:var(--signal);opacity:1;stroke-width:2}
  .em-near{font-family:var(--mono);min-width:150px}
  .em-nlab{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:8px}
  .em-nrow{display:flex;justify-content:space-between;gap:14px;padding:5px 0;border-bottom:1px solid var(--border);font-size:14px;color:var(--dim)}
  .em-sim{color:var(--violet);font-weight:700}
</style>
