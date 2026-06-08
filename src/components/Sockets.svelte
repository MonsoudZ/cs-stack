<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildSockets } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = useStepper(() => buildSockets(), { speed: 1000 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
</script>
<div class="widget">
  <div class="csbar">
    <span class="csmini">one server port, many connections</span>
    <span class="spacer"></span>
    <span class="csmini sk-server">server {s.server}</span>
  </div>
  <div class="w-label">step the arriving packets — the OS demuxes each to its socket by the 4-tuple</div>
  <div class="sk-packet" class:on={s.packet}>
    {#if s.packet}packet for :443 from <b>{s.packet}</b> → connection {s.routedTo}{:else}—{/if}
  </div>
  <div class="sk-conns">
    {#each s.conns as c}
      <div class="sk-conn" class:hit={c.id === s.routedTo}>
        <div class="sk-id">socket {c.id}</div>
        <div class="sk-tuple">{c.client}<span class="sk-arrow"> ↔ </span>{s.server}</div>
      </div>
    {/each}
  </div>
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .sk-server{color:var(--blue)}
  .sk-packet{font-family:var(--mono);font-size:14px;text-align:center;color:var(--faint);border:1px dashed var(--border);border-radius:10px;padding:10px;margin-bottom:14px;min-height:22px;transition:.15s}
  .sk-packet.on{border-style:solid;border-color:var(--amber);color:var(--dim)}
  .sk-packet b{color:var(--amber)}
  .sk-conns{display:flex;flex-direction:column;gap:8px;font-family:var(--mono)}
  .sk-conn{border:1px solid var(--border);border-radius:10px;padding:10px 14px;background:var(--surface);transition:.18s}
  .sk-conn.hit{border-color:var(--blue);box-shadow:0 0 14px var(--blue-d)}
  .sk-id{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--faint)}
  .sk-tuple{font-size:14px;color:var(--dim);margin-top:3px}
  .sk-conn.hit .sk-tuple{color:var(--blue)}
  .sk-arrow{color:var(--faint)}
</style>
