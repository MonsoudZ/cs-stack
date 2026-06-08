<script>
  import { buildAttention, ATTN_TOKENS } from '../lib/widgets.js';
  let query = $state('it');
  let a = $derived(buildAttention({ query }));
  let top = $derived([...a.weights].sort((x, y) => y.weight - x.weight)[0]);
  let max = $derived(Math.max(...a.weights.map((w) => w.weight)));
</script>
<div class="widget">
  <div class="csbar"><span class="csmini">attention · a token gathers context from the others</span></div>
  <div class="w-label">tap a word to make it the query — the bars show how much it attends to each token</div>
  <div class="at-sentence">
    {#each a.weights as { token, weight }}
      <button type="button" class="at-tok" class:query={token === query} class:top={token === top.token && token !== query}
              aria-pressed={token === query} onclick={() => (query = token)}>
        <span class="at-word">{token}</span>
        <span class="at-bar"><span class="at-fill" style:height={`${(weight / max) * 100}%`}></span></span>
        <span class="at-wt">{weight.toFixed(2)}</span>
      </button>
    {/each}
  </div>
  <div class="csnote" role="status" aria-live="polite">
    “{query}” attends most to “{top.token}”{query === 'it' && top.token === 'cat' ? ' — that’s how the model works out that “it” means the cat' : ''}. Each weight is softmax over how aligned the vectors are.
  </div>
</div>

<style>
  .at-sentence{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;align-items:flex-end;font-family:var(--mono);padding:8px 0}
  .at-tok{display:flex;flex-direction:column;align-items:center;gap:5px;border:1px solid var(--border);border-radius:10px;padding:8px 9px 6px;background:var(--surface);color:var(--dim);cursor:pointer;transition:.15s}
  .at-tok.query{border-color:var(--signal);color:var(--signal);background:var(--signal-d)}
  .at-tok.top{border-color:var(--violet);color:var(--violet)}
  .at-word{font-size:13px;font-weight:700}
  .at-bar{width:18px;height:48px;display:flex;align-items:flex-end;background:var(--fill);border-radius:4px;overflow:hidden}
  .at-fill{display:block;width:100%;background:var(--violet);border-radius:4px;transition:height .2s}
  .at-tok.query .at-fill{background:var(--signal)}
  .at-wt{font-size:11px;color:var(--faint)}
</style>
