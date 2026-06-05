<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildVm } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = useStepper(() => buildVm(), { speed: 800 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
</script>
<div class="widget">
  <div class="csbar"><span class="csmini">3 + 4 * 2, compiled to stack-machine bytecode</span></div>
  <div class="w-label">step the VM — operands push, operators pop two and push the result</div>
  <div class="vm">
    <div class="vm-prog">{#each s.prog as line, i}<div class="vm-op" class:cur={i === s.cur} aria-current={i === s.cur ? 'true' : undefined}>{line}</div>{/each}</div>
    <div class="vm-stack">
      <div class="vm-lab">operand stack</div>
      <div class="vm-cells">{#if s.stack.length}{#each s.stack as v}<span class="vm-cell">{v}</span>{/each}{:else}<span class="csmini">empty</span>{/if}</div>
      <div class="vm-result" class:show={s.result != null}>{s.result != null ? 'result = ' + s.result : ''}</div>
    </div>
  </div>
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .vm{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:6px}
  @media(max-width:600px){.vm{grid-template-columns:1fr}}
  .vm-prog{font-family:var(--mono);font-size:14px;border:1px solid var(--border);border-radius:12px;overflow:hidden;background:var(--surface)}
  .vm-op{padding:9px 14px;border-bottom:1px solid var(--border);color:var(--dim)}
  .vm-op:last-child{border-bottom:none}
  .vm-op.cur{background:var(--blue-d);color:var(--blue)}
  .vm-stack{font-family:var(--mono);border:1px solid var(--border);border-radius:12px;padding:14px;background:var(--surface);display:flex;flex-direction:column;gap:10px}
  .vm-lab{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint)}
  .vm-cells{display:flex;gap:7px;flex-wrap:wrap;min-height:44px;align-items:flex-end}
  .vm-cell{min-width:40px;height:42px;display:flex;align-items:center;justify-content:center;border:1px solid var(--amber);border-radius:9px;
    background:var(--amber-d);color:var(--amber);font-size:18px;font-weight:700;animation:framein .2s ease}
  .vm-result{font-size:16px;font-weight:700;color:var(--faint);min-height:20px}
  .vm-result.show{color:var(--signal)}
</style>
