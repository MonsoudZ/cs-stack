<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildOptimize } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = useStepper(() => buildOptimize(), { speed: 900 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
</script>
<div class="widget">
  <div class="csbar"><span class="csmini">a tiny program — each step applies one optimization pass</span></div>
  <div class="w-label">step the optimizer — rewritten lines glow, dead ones are struck out then dropped</div>
  <div class="opt">
    <div class="opt-prog">
      {#each s.lines as line}
        <div class="opt-line" class:change={line.mark === 'change'} class:cut={line.mark === 'cut'}>
          <span class="opt-code">{line.text}</span>
          {#if line.mark === 'cut'}<span class="opt-tag">removed</span>{/if}
        </div>
      {/each}
    </div>
    <div class="opt-side">
      <div class="opt-pass">
        <div class="opt-lab">pass</div>
        <div class="opt-name">{s.pass ?? 'original'}</div>
      </div>
      <div class="opt-stats">
        <div class="opt-stat"><span class="opt-num">{s.linesLeft}</span><span class="opt-unit">instructions</span></div>
        <div class="opt-stat"><span class="opt-num">{s.ops}</span><span class="opt-unit">runtime ops</span></div>
      </div>
    </div>
  </div>
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .opt{display:grid;grid-template-columns:1.4fr 1fr;gap:18px;margin-top:6px}
  @media(max-width:600px){.opt{grid-template-columns:1fr}}
  .opt-prog{font-family:var(--mono);font-size:14px;border:1px solid var(--border);border-radius:12px;overflow:hidden;background:var(--surface)}
  .opt-line{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 14px;border-bottom:1px solid var(--border);color:var(--text)}
  .opt-line:last-child{border-bottom:none}
  .opt-line.change{background:var(--blue-d);color:var(--blue)}
  .opt-line.cut{color:var(--faint)}
  .opt-line.cut .opt-code{text-decoration:line-through}
  .opt-tag{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--red);border:1px solid var(--red);border-radius:6px;padding:1px 6px}
  .opt-side{display:flex;flex-direction:column;gap:14px}
  .opt-pass{border:1px solid var(--border);border-radius:12px;padding:14px;background:var(--surface)}
  .opt-lab{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint)}
  .opt-name{font-family:var(--mono);font-size:15px;font-weight:700;color:var(--signal);margin-top:4px}
  .opt-stats{display:flex;gap:12px}
  .opt-stat{flex:1;border:1px solid var(--border);border-radius:12px;padding:12px 14px;background:var(--surface);display:flex;flex-direction:column;gap:3px}
  .opt-num{font-size:24px;font-weight:700;color:var(--amber)}
  .opt-unit{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--faint)}
</style>
