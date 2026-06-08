<script>
  // A D flip-flop: Q captures D only on a clock tick (rising edge), then holds.
  let d = $state(0);
  let q = $state(0);
  let pending = $derived(d !== q); // D differs from the stored bit → a tick would change Q
  const tick = () => { q = d; };
</script>
<div class="widget">
  <div class="w-label">change D, then pulse the clock — Q only updates on the tick</div>
  <div class="flipflop">
    <div class="ff-port">
      <button type="button" class="toggle ff-d" class:hi={d} aria-pressed={!!d}
              onclick={() => d = d ? 0 : 1}><div class="st">D</div><div class="v">{d}</div><span class="sr-only">data input D, {d ? 'on' : 'off'}</span></button>
      <small>data in</small>
    </div>
    <div class="ff-clkwrap">
      <button type="button" class="btn ff-clk" class:armed={pending} onclick={tick}>CLK ▸ tick</button>
      <small>clock</small>
    </div>
    <div class="ff-port">
      <div class="ff-out" class:on={q}>{q}</div>
      <small>Q · stored bit (Q̄ = {q ? 0 : 1})</small>
    </div>
  </div>
  <div class="csnote" role="status" aria-live="polite">
    {#if pending}D = {d}, but Q is still holding {q}. Pulse the clock to capture the new value.{:else}Q matches D. Now flip D and watch Q stay put — it won't move until the next tick.{/if}
  </div>
</div>

<style>
  .flipflop{display:flex;gap:30px;align-items:center;justify-content:center;flex-wrap:wrap;position:relative;font-family:var(--mono)}
  .ff-port{display:flex;flex-direction:column;align-items:center;gap:6px}
  .ff-port small,.ff-clkwrap small{font-size:11px;color:var(--faint)}
  .ff-clkwrap{display:flex;flex-direction:column;align-items:center;gap:6px}
  .ff-d{cursor:pointer}
  .ff-clk{font-size:13px;padding:11px 16px}
  .ff-clk.armed{border-color:var(--border-hot);color:var(--signal);box-shadow:0 0 18px var(--signal-d)}
  .ff-out{width:70px;height:70px;border-radius:14px;border:2px solid var(--border);display:flex;align-items:center;justify-content:center;
    font-size:32px;font-weight:700;color:var(--dim);background:var(--bg);transition:.2s}
  .ff-out.on{border-color:var(--signal);color:var(--signal);background:var(--signal-d);box-shadow:0 0 26px var(--signal-d)}
</style>
