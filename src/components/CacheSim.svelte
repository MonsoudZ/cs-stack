<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildCache } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = useStepper(() => buildCache(), { speed: 850 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
  let lines = $derived([...s.cache].sort((a, b) => a - b)); // stable display order
</script>
<div class="widget">
  <div class="csbar">
    <span class="csmini">a 4-line cache · each line holds 4 consecutive addresses</span>
    <span class="spacer"></span>
    <span class="csmini">{s.hits} hits · {s.misses} misses</span>
  </div>
  <div class="w-label">step the accesses — a miss loads a whole line, so its neighbours then hit</div>
  <div class="cache-access">
    {#if s.addr != null}
      read address <b>{s.addr}</b> <span class="ca-line">(line {s.block})</span>
      <span class="ca-badge" class:hit={s.hit} class:miss={s.hit === false}>{s.hit ? 'HIT' : 'MISS'}</span>
    {:else}—{/if}
  </div>
  <div class="cache-lines">
    {#each Array(4) as _, i}
      {@const block = lines[i]}
      <div class="cache-slot" class:filled={block !== undefined} class:active={block === s.block && s.addr != null}>
        <div class="cs-lab">slot {i}</div>
        <div class="cs-val">{block !== undefined ? 'line ' + block : '—'}</div>
        <div class="cs-range">{block !== undefined ? block * 4 + '–' + (block * 4 + 3) : ''}</div>
      </div>
    {/each}
  </div>
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .cache-access{font-family:var(--mono);font-size:14px;color:var(--dim);text-align:center;margin-bottom:14px;min-height:24px}
  .cache-access b{color:var(--ink);font-size:18px}
  .ca-line{color:var(--faint)}
  .ca-badge{margin-left:8px;font-size:11px;font-weight:700;letter-spacing:.08em;border-radius:7px;padding:3px 9px}
  .ca-badge.hit{color:var(--signal);background:var(--signal-d);border:1px solid var(--signal)}
  .ca-badge.miss{color:var(--red);background:rgba(255,107,107,.12);border:1px solid var(--red)}
  .cache-lines{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;font-family:var(--mono)}
  @media(max-width:520px){.cache-lines{grid-template-columns:repeat(2,1fr)}}
  .cache-slot{border:1px solid var(--border);border-radius:11px;padding:12px;text-align:center;background:var(--surface);opacity:.5;transition:.18s}
  .cache-slot.filled{opacity:1}
  .cache-slot.active{border-color:var(--blue);box-shadow:0 0 16px var(--blue-d)}
  .cs-lab{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint)}
  .cs-val{font-size:16px;font-weight:700;color:var(--blue);margin-top:6px}
  .cs-range{font-size:11px;color:var(--faint);margin-top:3px;min-height:13px}
</style>
