<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildScopes } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = useStepper(() => buildScopes(), { speed: 1300 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
  let labelOf = $derived(Object.fromEntries(s.scopes.map((sc) => [sc.id, sc.label])));
</script>
<div class="widget">
  <div class="csbar"><span class="csmini">resolving names through nested scopes — inner shadows outer</span></div>
  <div class="w-label">step each reference — the resolver walks outward until a declaration matches</div>

  <div class="sc-resolve" role="status" aria-live="polite">
    {#if s.name}
      <span class="sc-q">resolve <code>{s.name}</code> in <code>{labelOf[s.from]}</code></span>
      {#each s.path as id, i}
        <span class="sc-arrow">→</span>
        <span class="sc-hop" class:bind={id === s.foundIn}>{labelOf[id]}</span>
      {/each}
      <span class="sc-arrow">⇒</span>
      {#if s.foundIn}
        <span class="sc-result ok">{s.name} = {labelOf[s.foundIn]}{s.hops === 0 ? ' (local)' : ` (${s.hops} hop${s.hops > 1 ? 's' : ''} out)`}</span>
      {:else}
        <span class="sc-result bad">undefined name “{s.name}”</span>
      {/if}
    {:else}
      <span class="sc-q sc-idle">step to resolve a reference…</span>
    {/if}
  </div>

  {#snippet box(i)}
    {#if i < s.scopes.length}
      {@const sc = s.scopes[i]}
      <div class="scope" class:walked={s.path.includes(sc.id)} class:bind={sc.id === s.foundIn} class:from={sc.id === s.from}>
        <div class="scope-head">
          <span class="scope-label">{sc.label}</span>
          {#if sc.id === s.foundIn}<span class="scope-tag">binds here</span>{:else if sc.id === s.from}<span class="scope-tag from">reference</span>{/if}
        </div>
        <div class="scope-syms">
          {#each sc.symbols as sym}<span class="sym" class:match={sc.id === s.foundIn && sym === s.name}>{sym}</span>{/each}
        </div>
        {@render box(i + 1)}
      </div>
    {/if}
  {/snippet}
  <div class="sc-tree">{@render box(0)}</div>

  <div class="csnote">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .sc-resolve{font-family:var(--mono);font-size:13px;display:flex;flex-wrap:wrap;align-items:center;gap:7px;min-height:30px;margin-bottom:12px;padding:8px 12px;border:1px solid var(--border);border-radius:10px;background:var(--surface)}
  .sc-resolve code{color:var(--ink)}
  .sc-q{color:var(--dim)}
  .sc-idle{color:var(--faint)}
  .sc-arrow{color:var(--faint)}
  .sc-hop{color:var(--dim);border:1px solid var(--border);border-radius:6px;padding:1px 7px}
  .sc-hop.bind{color:var(--signal);border-color:var(--signal);background:var(--signal-d)}
  .sc-result{font-weight:700;border-radius:6px;padding:2px 9px}
  .sc-result.ok{color:var(--signal);border:1px solid var(--signal);background:var(--signal-d)}
  .sc-result.bad{color:var(--red);border:1px solid var(--red);background:rgba(255,107,107,.08)}
  .sc-tree{font-family:var(--mono)}
  .scope{border:1px solid var(--border);border-radius:11px;padding:11px 12px;background:var(--surface);margin-top:9px}
  .scope .scope{margin-top:11px}
  .scope.walked{border-color:var(--blue)}
  .scope.bind{border-color:var(--signal);background:var(--signal-d)}
  .scope-head{display:flex;align-items:center;gap:8px;margin-bottom:8px}
  .scope-label{font-size:12px;color:var(--dim);font-weight:700}
  .scope-tag{font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--signal);border:1px solid var(--signal);border-radius:5px;padding:0 6px}
  .scope-tag.from{color:var(--blue);border-color:var(--blue)}
  .scope-syms{display:flex;flex-wrap:wrap;gap:6px}
  .sym{font-size:13px;color:var(--amber);border:1px solid var(--amber);background:var(--amber-d);border-radius:6px;padding:2px 9px}
  .sym.match{color:var(--signal);border-color:var(--signal);background:var(--signal-d);font-weight:700;transform:scale(1.06)}
</style>
