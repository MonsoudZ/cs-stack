<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildRouting } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const route = buildRouting();
  const nodes = route.nodes;
  const stepper = useStepper(() => route.steps, { speed: 850 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
</script>
<div class="widget">
  <div class="csbar"><span class="csmini">one packet, hop by hop, carrying a TTL hop-budget</span></div>
  <div class="w-label">step the packet across the internet — each router forwards it and drops TTL by one</div>
  <div class="route">
    {#each nodes as n, i}
      <div class="hop" class:active={i === s.at} class:done={i < s.at} aria-current={i === s.at ? 'true' : undefined}>
        <span class="hop-dot"></span>
        <span class="hop-name">{n}</span>
      </div>
      {#if i < nodes.length - 1}<span class="hop-arrow">→</span>{/if}
    {/each}
  </div>
  <div class="route-ttl">TTL <span class="ttlval" class:delivered={s.delivered}>{s.ttl}</span>{#if s.delivered}<span class="route-done"> · delivered ✓</span>{/if}</div>
  <div class="csnote csnote-blue" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .route{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px;font-family:var(--mono);margin-bottom:14px}
  .hop{display:flex;flex-direction:column;align-items:center;gap:6px;min-width:78px;text-align:center;transition:.18s;opacity:.5}
  .hop.active,.hop.done{opacity:1}
  .hop-dot{width:16px;height:16px;border-radius:50%;border:2px solid var(--border);background:var(--bg);transition:.18s}
  .hop.done .hop-dot{border-color:var(--signal);background:var(--signal-d)}
  .hop.active .hop-dot{border-color:var(--blue);background:var(--blue-d);box-shadow:0 0 14px var(--blue-d)}
  .hop-name{font-size:11px;color:var(--dim)}
  .hop.active .hop-name{color:var(--blue)}
  .hop-arrow{color:var(--faint);font-family:var(--mono)}
  .route-ttl{font-family:var(--mono);font-size:13px;color:var(--dim)}
  .ttlval{font-size:18px;font-weight:700;color:var(--amber);margin:0 4px}
  .ttlval.delivered{color:var(--signal)}
  .route-done{color:var(--signal)}
</style>
