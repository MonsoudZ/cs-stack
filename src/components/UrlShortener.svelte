<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildUrlShortener, URL_NODES } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = useStepper(() => buildUrlShortener(), { speed: 1150 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
</script>
<div class="widget">
  <div class="csbar">
    <span class="csmini">one request, end to end — client → edge → app → cache → database</span>
    <span class="spacer"></span>
    <span class="rf-phase p-{s.phase}">{s.phase === 'write' ? 'WRITE · shorten' : 'READ · redirect'}</span>
  </div>
  <div class="w-label">step a request through the system — watch the cache turn a DB lookup into a fast redirect</div>
  <div class="rf-flow">
    {#each URL_NODES as n, i}
      <div class="rf-node n-{n.id}" class:on={s.active === n.id}>
        <div class="rf-label">{n.label}</div>
        {#if n.id === 'cache'}
          <div class="rf-meta">{s.cacheKeys} key{s.cacheKeys === 1 ? '' : 's'}{#if s.cacheState} · <span class="rf-badge b-{s.cacheState}">{s.cacheState.toUpperCase()}</span>{/if}</div>
        {:else if n.id === 'db'}
          <div class="rf-meta">{s.dbKeys} row{s.dbKeys === 1 ? '' : 's'}</div>
        {/if}
      </div>
      {#if i < URL_NODES.length - 1}<span class="rf-arrow">→</span>{/if}
    {/each}
  </div>
  <div class="rf-response">{#if s.response}response → <b>{s.response}</b>{/if}</div>
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .rf-phase{font-family:var(--mono);font-size:12px;font-weight:700;letter-spacing:.04em}
  .rf-phase.p-write{color:var(--amber)}
  .rf-phase.p-read{color:var(--blue)}
  .rf-flow{display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:center;font-family:var(--mono);margin-top:2px}
  .rf-node{border:1px solid var(--border);border-radius:12px;padding:12px 12px;background:var(--surface);min-width:96px;text-align:center;transition:.18s}
  .rf-label{font-size:13px;font-weight:700;color:var(--ink)}
  .rf-meta{font-size:11px;color:var(--faint);margin-top:5px;min-height:14px}
  .rf-node.on{border-color:var(--signal);box-shadow:0 0 14px var(--signal-d)}
  .rf-node.on .rf-label{color:var(--signal)}
  .rf-arrow{color:var(--faint);font-size:14px}
  .rf-badge{font-weight:700;padding:1px 5px;border-radius:5px}
  .rf-badge.b-miss{color:var(--red)}
  .rf-badge.b-fill{color:var(--blue)}
  .rf-badge.b-hit{color:var(--signal)}
  .rf-response{font-family:var(--mono);font-size:13px;color:var(--dim);text-align:center;margin-top:12px;min-height:18px}
  .rf-response b{color:var(--signal)}
  @media(max-width:560px){.rf-node{min-width:42%;padding:10px 8px}.rf-arrow{display:none}}
</style>
