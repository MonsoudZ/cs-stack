<script>
  // Generic "trace an operation through a system" diagram for the system-design
  // case studies. Driven entirely by a `flow` prop:
  //   { nodes:[{ id, label, x?, y? }], edges?: [[from, to]], steps:[…] }.
  // Nodes without grid coords draw as a left-to-right chain; give them x/y and
  // an edge list to draw a real topology (a fan-out, a cache beside a DB…).
  // Each step: { active: nodeId, phase?: 'WRITE'|…, note: string,
  //   meta?: { nodeId: 'short state text' }, warn?: nodeId (flag red),
  //   response?: 'string', detail?: 'a deeper paragraph (the Stepper shows it)' }.
  // Authored per design — no per-design component needed.
  import { useStepper } from '../lib/stepper.svelte.js';
  import Stepper from './Stepper.svelte';
  import Diagram from './Diagram.svelte';
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
    <Diagram nodes={flow.nodes} edges={flow.edges} active={s.active} warn={s.warn} meta={s.meta} label="request flow" />
  </div>
  <div class="rf-response">{#if s.response}response → <b>{s.response}</b>{/if}</div>
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .rf-phase{font-family:var(--mono);font-size:12px;font-weight:700;letter-spacing:.04em;color:var(--blue)}
  .rf-flow{position:relative;z-index:1;margin-top:2px}
  .rf-response{font-family:var(--mono);font-size:13px;color:var(--dim);text-align:center;margin-top:12px;min-height:18px}
  .rf-response b{color:var(--signal)}
</style>
