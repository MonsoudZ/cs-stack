<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildHashMap } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = useStepper(() => buildHashMap(), { speed: 1000 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
</script>
<div class="widget">
  <div class="csbar">
    <span class="csmini">hash map · {s.buckets} buckets · separate chaining</span>
    <span class="spacer"></span>
    {#if s.key}<span class="csmini hm-op" class:lookup={s.op === 'lookup'}>{s.op} "{s.key}"{#if s.bucket != null} → bucket {s.bucket}{/if}</span>{/if}
  </div>
  <div class="w-label">step inserts and a lookup — a key hashes to a bucket; collisions chain</div>
  <div class="hm-buckets">
    {#each s.table as chain, i}
      <div class="hm-bucket" class:target={i === s.bucket} class:collision={i === s.bucket && s.collision}>
        <div class="hm-idx">bucket {i}</div>
        <div class="hm-chain">
          {#if chain.length}
            {#each chain as k, j}
              <span class="hm-key" class:hit={i === s.bucket && k === s.key && s.found}>{k}</span>{#if j < chain.length - 1}<span class="hm-arrow">→</span>{/if}
            {/each}
          {:else}<span class="hm-empty">—</span>{/if}
        </div>
      </div>
    {/each}
  </div>
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .hm-op{color:var(--blue)}
  .hm-op.lookup{color:var(--signal)}
  .hm-buckets{display:flex;flex-direction:column;gap:6px;font-family:var(--mono)}
  .hm-bucket{display:flex;align-items:center;gap:12px;border:1px solid var(--border);border-radius:10px;padding:8px 12px;background:var(--surface);transition:.18s}
  .hm-bucket.target{border-color:var(--blue);box-shadow:0 0 12px var(--blue-d)}
  .hm-bucket.collision{border-color:var(--amber)}
  .hm-idx{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--faint);min-width:64px}
  .hm-chain{display:flex;align-items:center;gap:6px;flex-wrap:wrap;min-height:24px}
  .hm-key{border:1px solid var(--border);border-radius:7px;padding:3px 10px;font-weight:700;color:var(--ink);background:var(--fill)}
  .hm-key.hit{border-color:var(--signal);color:var(--signal);background:var(--signal-d)}
  .hm-arrow{color:var(--faint)}
  .hm-empty{color:var(--faint)}
</style>
