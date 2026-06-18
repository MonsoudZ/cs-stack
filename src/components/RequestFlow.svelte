<script>
  // Generic "trace an operation through a system" diagram for the system-design
  // case studies. Driven entirely by a `flow` prop: { nodes:[{id,label}], steps:[…] }.
  // Each step: { active: nodeId, phase?: 'WRITE'|…, note: string,
  //   meta?: { nodeId: 'short state text' }, warn?: nodeId (flag red),
  //   response?: 'string' }. Authored per design — no per-design component needed.
  import { useStepper } from '../lib/stepper.svelte.js';
  import Stepper from './Stepper.svelte';
  let { flow, label = 'step a request through the system — watch what each component does' } = $props();
  const stepper = useStepper(() => flow.steps, { speed: 1150 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
</script>
<div class="widget">
  <div class="csbar">
    <span class="csmini">one operation, end to end — {flow.nodes.map((n) => n.label).join(' → ')}</span>
    <span class="spacer"></span>
    {#if s.phase}<span class="rf-phase">{s.phase}</span>{/if}
  </div>
  <div class="w-label">{label}</div>
  <div class="rf-flow">
    {#each flow.nodes as n, i}
      <div class="rf-node" class:on={s.active === n.id} class:warn={s.warn === n.id}>
        <div class="rf-label">{n.label}</div>
        <div class="rf-meta">{(s.meta && s.meta[n.id]) || ''}</div>
      </div>
      {#if i < flow.nodes.length - 1}<span class="rf-arrow">→</span>{/if}
    {/each}
  </div>
  <div class="rf-response">{#if s.response}response → <b>{s.response}</b>{/if}</div>
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .rf-phase{font-family:var(--mono);font-size:12px;font-weight:700;letter-spacing:.04em;color:var(--blue)}
  .rf-flow{display:flex;align-items:stretch;gap:6px;flex-wrap:wrap;justify-content:center;font-family:var(--mono);margin-top:2px}
  .rf-node{display:flex;flex-direction:column;justify-content:center;border:1px solid var(--border);border-radius:12px;
    padding:12px 12px;background:var(--surface);min-width:104px;text-align:center;transition:.18s}
  .rf-label{font-size:13px;font-weight:700;color:var(--ink)}
  .rf-meta{font-size:11px;color:var(--faint);margin-top:5px;min-height:14px}
  .rf-node.on{border-color:var(--signal);box-shadow:0 0 14px var(--signal-d)}
  .rf-node.on .rf-label{color:var(--signal)}
  .rf-node.warn{border-color:var(--red);box-shadow:0 0 12px rgba(255,107,107,.25)}
  .rf-node.warn .rf-label,.rf-node.warn .rf-meta{color:var(--red)}
  .rf-arrow{align-self:center;color:var(--faint);font-size:14px}
  .rf-response{font-family:var(--mono);font-size:13px;color:var(--dim);text-align:center;margin-top:12px;min-height:18px}
  .rf-response b{color:var(--signal)}
  @media(max-width:560px){.rf-node{min-width:42%;padding:10px 8px}.rf-arrow{display:none}}
</style>
