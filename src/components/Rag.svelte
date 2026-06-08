<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildRag } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = useStepper(() => buildRag(), { speed: 1300 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
</script>
<div class="widget">
  <div class="csbar"><span class="csmini">RAG · grounding the model in real documents</span></div>
  <div class="w-label">step the retrieval — the answer goes from invented to sourced</div>
  <div class="rag-query">query: <b>{s.query}</b></div>
  {#if s.ranked}
    <div class="rag-docs">
      <div class="rag-lab">document store · ranked by similarity to the query</div>
      {#each s.ranked as d, i}
        <div class="rag-doc" class:top={i === 0 && s.retrieved} class:hit={d.text === s.retrieved}>
          <span class="rag-sim">{d.sim}</span><span class="rag-text">{d.text}</span>
        </div>
      {/each}
    </div>
  {/if}
  {#if s.answer}
    <div class="rag-answer" class:grounded={s.grounded}>
      <span class="rag-alab">{s.grounded ? '✓ grounded answer' : '⚠ ungrounded guess'}</span>
      <span class="rag-atext">{s.answer}</span>
    </div>
  {/if}
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .rag-query{font-family:var(--mono);font-size:13px;color:var(--dim);text-align:center;margin-bottom:14px}
  .rag-query b{color:var(--ink)}
  .rag-lab{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:8px}
  .rag-docs{font-family:var(--mono);margin-bottom:12px}
  .rag-doc{display:flex;align-items:baseline;gap:12px;border:1px solid var(--border);border-radius:9px;padding:8px 12px;margin-top:6px;background:var(--surface);transition:.18s}
  .rag-doc.hit{border-color:var(--signal);background:var(--signal-d)}
  .rag-sim{font-size:12px;color:var(--faint);min-width:42px}
  .rag-doc.hit .rag-sim{color:var(--signal);font-weight:700}
  .rag-text{font-size:13px;color:var(--dim)}
  .rag-doc.hit .rag-text{color:var(--ink)}
  .rag-answer{display:flex;flex-direction:column;gap:5px;border:1px solid var(--border);border-radius:11px;padding:12px 14px;font-family:var(--mono)}
  .rag-answer{border-color:var(--red);background:rgba(255,107,107,.07)}
  .rag-answer.grounded{border-color:var(--signal);background:var(--signal-d)}
  .rag-alab{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--red);font-weight:700}
  .rag-answer.grounded .rag-alab{color:var(--signal)}
  .rag-atext{font-size:14px;color:var(--ink)}
</style>
