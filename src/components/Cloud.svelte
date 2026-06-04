<script>
  import { onDestroy } from 'svelte';
  import { createStepper } from '../lib/stepper.svelte.js';
  import Stepper from './Stepper.svelte';
  let cacheHit = $state(false);
  let server = $state(0);
  function buildHops() {
    server = (server + 1) % 3;
    const sv = server, h = [], add = (loc, ms, note, async) => h.push({ loc, ms, note, async: !!async });
    add('browser', 0, 'a user clicks — the browser fires GET /cases/42');
    add('lb', 2, 'across the internet to the load balancer — the one public door');
    add('app', 1, 'load balancer forwards to app server #' + (sv + 1) + ' of 3 (spreading the load)');
    add('app', 3, 'Rails routes it → CasesController#show — your code starts running');
    add('redis', 1, 'check Redis: is case 42 already cached?');
    if (cacheHit) { add('redis', 0, 'cache HIT ✓ — answer is in memory, skip the database entirely'); }
    else {
      add('redis', 0, 'cache MISS ✗ — Redis does not have it, must ask the database');
      add('pg', 20, 'Postgres runs the SQL and returns the row — the slow part (~20ms)');
      add('redis', 1, 'write the result into Redis so the next request is a hit (cache now warm)');
    }
    add('sidekiq', 1, 'enqueue an audit-log job to Sidekiq — fire-and-forget, returns instantly');
    add('app', 4, 'render the response — JSON for the case');
    add('lb', 2, 'response travels back up through the load balancer');
    add('browser', 2, 'the browser receives the response and paints the screen ✓');
    add('sidekiq', 0, 'meanwhile, async: a Sidekiq worker pulls the job off the queue and runs it — the user already has their answer', true);
    return h;
  }
  server = -1;
  const stepper = createStepper(buildHops, { speed: 850 });
  const { idx, version } = stepper;
  // `$version` is the dependency that makes the hop list recompute when
  // toggleCache rebuilds the steps (the cache hit/miss path) — without it this
  // derived has no reactive trigger and the toggle would show stale hops.
  let hops = $derived(($version, stepper.all()));
  let i = $derived($idx);
  let hop = $derived(hops[i]);
  let visited = $derived(new Set(hops.slice(0, i + 1).map((h) => h.loc)));
  let lat = $derived(hops.slice(0, i + 1).filter((h) => !h.async).reduce((a, h) => a + h.ms, 0));
  function toggleCache() { cacheHit = !cacheHit; server = (server - 1 + 3) % 3; stepper.reset(); }
  const at = (k) => hop.loc === k;
  onDestroy(() => stepper.destroy());
</script>
{#snippet node(key, cn, cd, dim)}
  <div class="cnode {at(key) ? 'active' : (visited.has(key) ? 'visited' : '')} {dim ? 'dim' : ''}"><div class="cn">{cn}</div><div class="cd">{cd}</div></div>
{/snippet}
<div class="widget">
  <div class="csbar">
    <span class="csmini">a real Rails request lifecycle · GET /cases/42</span>
    <span class="spacer"></span>
    <button type="button" class="btn" onclick={toggleCache}>cache: {cacheHit ? 'WARM (hit)' : 'COLD (miss)'}</button>
  </div>
  <div class="w-label">step a request → through the stack, and the response back ←</div>
  <div class="cloudwrap"><div class="cloud">
    <div class="tier"><div class="tierlab">client</div>{@render node('browser','Browser','the user',false)}</div>
    <div class="carrow">→</div>
    <div class="tier"><div class="tierlab">edge</div>{@render node('lb','Load Balancer','one public door',false)}</div>
    <div class="carrow">→</div>
    <div class="tier"><div class="tierlab">app tier · round-robin</div>
      {#each [0,1,2] as si}
        {@const sel = si === server}
        <div class="cnode {at('app') && sel ? 'active' : (sel && visited.has('app') ? 'visited' : '')} {sel ? '' : 'dim'}"><div class="cn">App #{si + 1}</div><div class="cd">{sel ? 'Rails' : 'Rails · idle'}</div></div>
      {/each}
    </div>
    <div class="carrow">→</div>
    <div class="tier"><div class="tierlab">data + jobs</div>
      {@render node('redis','Redis','cache · in-memory',false)}
      {@render node('pg','Postgres','database · truth',false)}
      {@render node('sidekiq','Sidekiq','job queue',false)}
    </div>
  </div></div>
  <div class="cloudlat {cacheHit ? 'warm' : 'cold'}">perceived latency: <span class="ms">{lat} ms</span><span class="tag">{cacheHit ? 'cache hit' : 'cache miss'}</span>{hop.async ? '  ·  background job runs off the critical path' : ''}</div>
  <div class="csnote csnote-blue" role="status" aria-live="polite">{hop.note}</div>
  <Stepper {stepper} />
</div>
