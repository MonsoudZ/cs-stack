<script>
  import { buildUniversal } from '../lib/widgets.js';
  const built = buildUniversal();
  let gate = $state('AND');
  let g = $derived(built.find((x) => x.gate === gate));
</script>
<div class="widget">
  <div class="w-label">pick a gate — see it built from NAND alone, and proven equal</div>
  <div class="uni-pick" role="group" aria-label="target gate">
    {#each built as b}
      <button type="button" class="uni-btn" class:on={gate === b.gate} aria-pressed={gate === b.gate} onclick={() => (gate = b.gate)}>{b.gate}</button>
    {/each}
  </div>
  <div class="uni-formula"><code>{gate} = {g.formula}</code></div>
  <table class="uni-table">
    <thead>
      <tr>
        {#if g.unary}<th scope="col">a</th>{:else}<th scope="col">a</th><th scope="col">b</th>{/if}
        <th scope="col">{gate}</th>
        <th scope="col">from NAND</th>
        <th scope="col">ok?</th>
      </tr>
    </thead>
    <tbody>
      {#each g.rows as r}
        <tr>
          {#each r.inputs as v}<td class="uni-in">{v}</td>{/each}
          <td class="uni-out">{r.real}</td>
          <td class="uni-out built">{r.built}</td>
          <td class="uni-ok">{r.match ? '✓' : '✗'}</td>
        </tr>
      {/each}
    </tbody>
  </table>
  <div class="csnote" role="status" aria-live="polite">every row matches — {gate} built only from NAND gates behaves identically to the real {gate}. NAND alone can build the whole machine.</div>
</div>

<style>
  .uni-pick{display:flex;gap:8px;justify-content:center;margin-bottom:14px}
  .uni-btn{font-family:var(--mono);font-size:13px;padding:6px 18px;border:1px solid var(--border);border-radius:8px;background:var(--surface);color:var(--dim);cursor:pointer;transition:.15s}
  .uni-btn.on{border-color:var(--signal);color:var(--signal);background:var(--signal-d)}
  .uni-formula{text-align:center;font-family:var(--mono);font-size:15px;color:var(--ink);margin-bottom:14px}
  .uni-table{width:100%;max-width:420px;margin:0 auto;border-collapse:collapse;font-family:var(--mono);font-size:14px}
  .uni-table th,.uni-table td{padding:8px 10px;text-align:center;border-bottom:1px solid var(--border)}
  .uni-table thead th{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--faint);font-weight:600}
  .uni-in{color:var(--faint)}
  .uni-out{font-weight:700;color:var(--ink)}
  .uni-out.built{color:var(--signal)}
  .uni-ok{color:var(--signal);font-weight:700}
</style>
