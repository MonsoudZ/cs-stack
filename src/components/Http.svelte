<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildHttp } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = useStepper(() => buildHttp(), { speed: 1100 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
  // accumulate the request and response lines revealed so far
  let all = $derived(stepper.all().slice(0, $idx + 1));
  let reqLines = $derived(all.filter((r) => r.side === 'client' && r.line));
  let resLines = $derived(all.filter((r) => r.side === 'server' && r.line));
</script>
<div class="widget">
  <div class="csbar"><span class="csmini">HTTP · request → response, as plain text</span></div>
  <div class="w-label">step the exchange — a request goes up, a response comes back</div>
  <div class="http-cols">
    <div class="http-panel" class:active={s.side === 'client'}>
      <div class="http-lab">▲ request <span>client → server</span></div>
      {#each reqLines as r, i}
        <div class="http-line" class:first={i === 0}>{r.line}</div>
      {/each}
      {#if reqLines.length === 0}<div class="http-empty">…</div>{/if}
    </div>
    <div class="http-panel" class:active={s.side === 'server'}>
      <div class="http-lab">▼ response <span>server → client</span></div>
      {#each resLines as r, i}
        <div class="http-line" class:status={r.status} class:body={r.done}>{r.line}</div>
      {/each}
      {#if resLines.length === 0}<div class="http-empty">…</div>{/if}
    </div>
  </div>
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .http-cols{display:grid;grid-template-columns:1fr 1fr;gap:14px;font-family:var(--mono)}
  @media(max-width:560px){.http-cols{grid-template-columns:1fr}}
  .http-panel{border:1px solid var(--border);border-radius:12px;padding:14px;background:var(--surface);transition:.18s}
  .http-panel.active{border-color:var(--signal);box-shadow:0 0 14px var(--signal-d)}
  .http-lab{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:10px;display:flex;justify-content:space-between;gap:6px}
  .http-lab span{text-transform:none;letter-spacing:0;opacity:.8}
  .http-line{font-size:13px;color:var(--dim);padding:3px 0;word-break:break-all}
  .http-line.first{color:var(--ink);font-weight:700}
  .http-line.status{color:var(--signal);font-weight:700;font-size:15px}
  .http-line.body{color:var(--blue)}
  .http-empty{color:var(--faint)}
</style>
