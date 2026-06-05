<script>
  import { invalidatedStages } from '../lib/widgets.js';
  const CHANGES = [
    { kind: 'layout', label: 'width: 200px' },
    { kind: 'paint', label: 'color: crimson' },
    { kind: 'composite', label: 'transform: translateX(40px)' },
  ];
  let kind = $state('layout');
  let stages = $derived(invalidatedStages(kind));
  let cost = $derived(stages.filter((s) => s.rerun).length);
</script>
<div class="widget">
  <div class="w-label">change a property — watch which pipeline stages have to re-run</div>
  <div class="ri-picks">
    {#each CHANGES as c}
      <button type="button" class="btn" class:sel={kind === c.kind} aria-pressed={kind === c.kind} onclick={() => kind = c.kind}>{c.label}</button>
    {/each}
  </div>
  <div class="ri-stages">
    {#each stages as s, i}
      <div class="ri-stage" class:rerun={s.rerun}>
        <span class="ri-name">{s.name}</span>
        <span class="ri-state">{s.rerun ? 're-runs' : 'skipped'}</span>
      </div>
      {#if i < stages.length - 1}<span class="ri-arrow">→</span>{/if}
    {/each}
  </div>
  <div class="ri-cost">{cost} of 3 stages re-run</div>
  <div class="csnote" role="status" aria-live="polite">
    {#if cost === 3}A geometry change forces the whole tail — Layout, then Paint, then Composite. The most expensive kind of change.
    {:else if cost === 2}A paint-only change skips Layout: the boxes don't move, only their pixels change.
    {:else}transform and opacity skip Layout and Paint entirely — the compositor just shifts an existing layer on the GPU. This is why smooth animations stick to them.{/if}
  </div>
</div>

<style>
  .ri-picks{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:18px}
  .ri-picks .btn.sel{border-color:var(--signal);color:var(--signal);background:var(--signal-d)}
  .ri-stages{display:flex;align-items:stretch;justify-content:center;gap:8px;flex-wrap:wrap;font-family:var(--mono)}
  .ri-stage{display:flex;flex-direction:column;align-items:center;gap:4px;border:1px solid var(--border);border-radius:11px;
    padding:12px 16px;background:var(--surface);min-width:96px;opacity:.45;transition:.18s}
  .ri-stage.rerun{opacity:1;border-color:var(--blue);background:var(--blue-d);box-shadow:0 0 16px var(--blue-d)}
  .ri-name{font-size:14px;font-weight:700;color:var(--dim)}
  .ri-stage.rerun .ri-name{color:var(--blue)}
  .ri-state{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--faint)}
  .ri-stage.rerun .ri-state{color:var(--blue)}
  .ri-arrow{display:flex;align-items:center;color:var(--faint);font-family:var(--mono)}
  .ri-cost{font-family:var(--mono);font-size:13px;color:var(--amber);text-align:center;margin-top:14px}
</style>
