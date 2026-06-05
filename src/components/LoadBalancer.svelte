<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildLoadBalancer } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = useStepper(() => buildLoadBalancer(), { speed: 800 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
  let maxLoad = $derived(Math.max(1, ...s.servers.map((sv) => sv.load)));
</script>
<div class="widget">
  <div class="csbar">
    <span class="csmini">load balancer · round-robin · health checks</span>
    <span class="spacer"></span>
    <span class="csmini lb-served">{s.served} served</span>
  </div>
  <div class="w-label">step the requests — the balancer spreads load and routes around a failure</div>
  <div class="lb-door" class:event={s.event}>{s.event === 'crash' ? '⚠ health check failed' : s.event === 'recover' ? '✓ back in the pool' : s.target ? '→ routing to ' + s.target : 'load balancer'}</div>
  <div class="lb-servers">
    {#each s.servers as sv}
      <div class="lb-server" class:down={!sv.healthy} class:target={sv.id === s.target}>
        <div class="lb-name">{sv.id}<span class="lb-health">{sv.healthy ? 'healthy' : 'DOWN'}</span></div>
        <div class="lb-bar-track"><span class="lb-bar" style:height={`${(sv.load / maxLoad) * 100}%`}></span></div>
        <div class="lb-load">{sv.load}</div>
      </div>
    {/each}
  </div>
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .lb-served{color:var(--signal)}
  .lb-door{text-align:center;font-family:var(--mono);font-size:13px;color:var(--dim);border:1px solid var(--border);border-radius:10px;padding:9px;margin-bottom:16px;background:var(--surface);transition:.15s}
  .lb-door.event{border-color:var(--amber);color:var(--amber)}
  .lb-servers{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;font-family:var(--mono)}
  .lb-server{display:flex;flex-direction:column;align-items:center;gap:8px;border:1px solid var(--border);border-radius:12px;padding:14px 10px;background:var(--surface);transition:.18s}
  .lb-server.target{border-color:var(--blue);box-shadow:0 0 16px var(--blue-d)}
  .lb-server.down{opacity:.5;border-color:var(--red)}
  .lb-name{font-weight:700;color:var(--ink);display:flex;flex-direction:column;align-items:center;gap:2px}
  .lb-health{font-size:10px;font-weight:400;letter-spacing:.06em;color:var(--faint)}
  .lb-server.down .lb-health{color:var(--red)}
  .lb-bar-track{width:30px;height:80px;display:flex;align-items:flex-end;border-radius:6px;background:var(--fill);overflow:hidden}
  .lb-bar{display:block;width:100%;background:var(--blue);border-radius:6px 6px 0 0;transition:height .2s}
  .lb-server.down .lb-bar{background:var(--faint)}
  .lb-load{font-size:14px;font-weight:700;color:var(--blue)}
  .lb-server.down .lb-load{color:var(--faint)}
</style>
