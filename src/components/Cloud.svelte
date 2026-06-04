<script>
  import { onDestroy } from 'svelte';
  import { createStepper } from '../lib/stepper.svelte.js';
  import { buildCloudHops } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  let cacheHit = $state(false);
  // round-robin app-server index, bumped on each (re)build so successive
  // requests land on different servers. Starts at -1 so the first build → 0.
  let server = $state(-1);
  const nextHops = () => { server = (server + 1) % 3; return buildCloudHops({ cacheHit, server }); };
  const stepper = createStepper(nextHops, { speed: 850 });
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
  <div class="cnode {at(key) ? 'active' : (visited.has(key) ? 'visited' : '')} {dim ? 'dim' : ''}" aria-current={at(key) ? 'true' : undefined}><div class="cn">{cn}</div><div class="cd">{cd}</div></div>
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
        <div class="cnode {at('app') && sel ? 'active' : (sel && visited.has('app') ? 'visited' : '')} {sel ? '' : 'dim'}" aria-current={at('app') && sel ? 'true' : undefined}><div class="cn">App #{si + 1}</div><div class="cd">{sel ? 'Rails' : 'Rails · idle'}</div></div>
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
