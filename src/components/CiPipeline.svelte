<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildCiPipeline } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = useStepper(() => buildCiPipeline(), { speed: 950 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
</script>
<div class="widget">
  <div class="csbar">
    <span class="csmini">every commit runs the same gates — green ships, red stops</span>
    <span class="spacer"></span>
    <span class="ci-commit">commit {s.commit}</span>
  </div>
  <div class="w-label">step a push through the pipeline — watch a failing gate block the release</div>
  <div class="ci-stages">
    {#each s.stages as g}
      <div class="ci-stage {g.status}">
        <span class="ci-mark">{g.status === 'pass' ? '✓' : g.status === 'fail' ? '✗' : '·'}</span>
        <span class="ci-name">{g.name}</span>
      </div>
    {/each}
  </div>
  {#if s.verdict}
    <div class="ci-verdict" class:bad={s.verdict === 'blocked'} class:ok={s.verdict === 'deployable'}>
      {s.verdict === 'deployable' ? '✓ all gates green — a deployable artifact' : '✗ blocked — this commit cannot ship'}
    </div>
  {/if}
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .ci-commit{font-family:var(--mono);font-size:12px;color:var(--faint)}
  .ci-stages{display:flex;flex-wrap:wrap;gap:8px;font-family:var(--mono);margin-top:2px}
  .ci-stage{display:flex;align-items:center;gap:8px;border:1px solid var(--border);border-radius:10px;
    padding:9px 13px;background:var(--surface);color:var(--dim);font-size:13px;transition:.15s}
  .ci-mark{font-weight:700;min-width:12px;color:var(--faint)}
  .ci-stage.pass{border-color:var(--signal);color:var(--signal);background:var(--signal-d)}
  .ci-stage.pass .ci-mark{color:var(--signal)}
  .ci-stage.fail{border-color:var(--red);color:var(--red);background:rgba(255,107,107,.1)}
  .ci-stage.fail .ci-mark{color:var(--red)}
  .ci-verdict{margin-top:12px;padding:10px 14px;border-radius:10px;font-size:13px;font-weight:700;text-align:center;border:1px solid var(--border);font-family:var(--mono)}
  .ci-verdict.ok{color:var(--signal);border-color:var(--signal);background:var(--signal-d)}
  .ci-verdict.bad{color:var(--red);border-color:var(--red);background:rgba(255,107,107,.1)}
</style>
