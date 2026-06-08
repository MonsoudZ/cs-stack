<script>
  import { tokenize, TOK_EXAMPLES } from '../lib/widgets.js';
  let phrase = $state(TOK_EXAMPLES[0]);
  let toks = $derived(tokenize(phrase));
  // a stable hue per token id so the same piece keeps its colour
  const HUES = ['var(--blue)', 'var(--violet)', 'var(--signal)', 'var(--amber)', 'var(--red)'];
  const hue = (id, i) => HUES[((id >= 0 ? id : i) * 2 + 1) % HUES.length];
</script>
<div class="widget">
  <div class="csbar">
    <span class="csmini">text → tokens · a toy subword vocabulary</span>
    <span class="spacer"></span>
    <span class="csmini tk-count">{toks.length} tokens</span>
  </div>
  <div class="tk-pick" role="group" aria-label="example text">
    {#each TOK_EXAMPLES as ex}
      <button type="button" class="tk-btn" class:on={phrase === ex} aria-pressed={phrase === ex} onclick={() => (phrase = ex)}>{ex}</button>
    {/each}
  </div>
  <div class="w-label">the model never sees letters or words — only these token ids</div>
  <div class="tk-stream">
    {#each toks as t, i}
      {#if t.firstInWord && i > 0}<span class="tk-gap"></span>{/if}
      <span class="tk-tok" style:--c={hue(t.id, i)}>
        <span class="tk-text">{t.text}</span><span class="tk-id">{t.id >= 0 ? t.id : '?'}</span>
      </span>
    {/each}
  </div>
  <div class="csnote" role="status" aria-live="polite">
    “{phrase}” → {toks.length} tokens. {toks.length > phrase.split(' ').length ? 'A rarer word splits into pieces — which is why a model that only sees “straw”+“berry” can miscount the letters in “strawberry”.' : 'Common words are a single token each.'}
  </div>
</div>

<style>
  .tk-count{color:var(--signal)}
  .tk-pick{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-bottom:14px}
  .tk-btn{font-family:var(--mono);font-size:12px;padding:5px 11px;border:1px solid var(--border);border-radius:7px;background:var(--surface);color:var(--dim);cursor:pointer;transition:.15s}
  .tk-btn.on{border-color:var(--signal);color:var(--signal);background:var(--signal-d)}
  .tk-stream{display:flex;align-items:flex-end;flex-wrap:wrap;gap:4px;font-family:var(--mono);min-height:48px;justify-content:center}
  .tk-gap{width:10px}
  .tk-tok{display:flex;flex-direction:column;align-items:center;border:1px solid var(--c);border-radius:8px;overflow:hidden;background:color-mix(in srgb, var(--c) 12%, var(--surface))}
  .tk-text{padding:6px 9px;font-size:15px;font-weight:700;color:var(--c);white-space:pre}
  .tk-id{font-size:10px;color:var(--faint);padding:2px 0;width:100%;text-align:center;border-top:1px solid var(--c)}
</style>
