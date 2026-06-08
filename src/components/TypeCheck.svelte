<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildTypeCheck } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  let buggy = $state(false);
  const stepper = useStepper(() => buildTypeCheck({ buggy }), { speed: 1000 });
  const { idx, version } = stepper;
  let s = $derived(($version, stepper.all()[$idx]));
  function toggle() { buggy = !buggy; stepper.rebuild(() => buildTypeCheck({ buggy })); }
</script>
<div class="widget">
  <div class="csbar">
    <span class="csmini">type checking · inferring types up the tree</span>
    <span class="spacer"></span>
    <button type="button" class="csbtn" aria-pressed={buggy} onclick={toggle}>program: {buggy ? 'has a bug' : 'well-typed'}</button>
  </div>
  <div class="w-label">step the checker — infer a type for each node and verify every operator</div>
  <div class="tc-expr"><code>{s.expr}</code></div>
  <div class="tc-rows">
    {#each s.checked as c}
      <div class="tc-row" class:err={c.error}>
        <code class="tc-sub">{c.expr}</code>
        <span class="tc-arrow">→</span>
        <span class="tc-type" class:bad={c.error}>{c.type}</span>
        {#if c.error}<span class="tc-msg">{c.error}</span>{/if}
      </div>
    {/each}
    {#if s.checked.length === 0}<div class="tc-empty">step to infer each node’s type…</div>{/if}
  </div>
  {#if s.ok}<div class="tc-verdict ok">✓ well-typed — safe to compile</div>{/if}
  {#if s.errored && s.checked.some((c) => c.error)}<div class="tc-verdict bad">✗ type error — rejected before codegen</div>{/if}
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .csbtn{font-family:var(--mono);font-size:12px;padding:4px 10px;border:1px solid var(--border);border-radius:7px;background:var(--surface);color:var(--dim);cursor:pointer}
  .csbtn[aria-pressed="true"]{border-color:var(--red);color:var(--red);background:rgba(255,107,107,.1)}
  .tc-expr{text-align:center;font-family:var(--mono);font-size:18px;color:var(--ink);margin-bottom:16px}
  .tc-rows{display:flex;flex-direction:column;gap:7px;font-family:var(--mono);min-height:44px}
  .tc-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;border:1px solid var(--border);border-radius:9px;padding:8px 12px;background:var(--surface)}
  .tc-row.err{border-color:var(--red);background:rgba(255,107,107,.08)}
  .tc-sub{color:var(--dim);font-size:14px}
  .tc-arrow{color:var(--faint)}
  .tc-type{font-weight:700;color:var(--violet);border:1px solid var(--violet);border-radius:6px;padding:2px 9px;font-size:13px;background:var(--violet-d)}
  .tc-type.bad{color:var(--red);border-color:var(--red);background:transparent}
  .tc-msg{font-size:12px;color:var(--red)}
  .tc-empty{font-size:13px;color:var(--faint)}
  .tc-verdict{margin-top:14px;text-align:center;font-family:var(--mono);font-weight:700;border-radius:10px;padding:9px}
  .tc-verdict.ok{color:var(--signal);border:1px solid var(--signal);background:var(--signal-d)}
  .tc-verdict.bad{color:var(--red);border:1px solid var(--red);background:rgba(255,107,107,.08)}
</style>
