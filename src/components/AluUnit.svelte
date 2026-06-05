<script>
  import { ALU_OPS, computeAlu } from '../lib/widgets.js';
  let op = $state('ADD');
  let a = $state(200);
  let b = $state(100);
  let r = $derived(computeAlu(op, a, b));
  const bin = (n) => (n & 0xff).toString(2).padStart(8, '0');
</script>
<div class="widget">
  <div class="w-label">pick an operation — the ALU computes it over two 8-bit inputs and sets the flags</div>
  <div class="alu-ops" role="group" aria-label="ALU operation">
    {#each ALU_OPS as o}
      <button type="button" class="alu-op" class:on={op === o} aria-pressed={op === o} onclick={() => (op = o)}>{o}</button>
    {/each}
  </div>
  <div class="alu-io">
    <div class="alu-in">
      <label for="aluA">A = {a}</label>
      <input id="aluA" type="range" min="0" max="255" bind:value={a} class="slider" />
      <code class="alu-bits">{bin(a)}</code>
    </div>
    <div class="alu-in">
      <label for="aluB">B = {b}</label>
      <input id="aluB" type="range" min="0" max="255" bind:value={b} class="slider" />
      <code class="alu-bits">{bin(b)}</code>
    </div>
  </div>
  <div class="alu-result">
    <span class="alu-rlab">{op} →</span>
    <code class="alu-bits big">{bin(r.result)}</code>
    <span class="alu-dec">= {r.result}</span>
    <span class="alu-flags">
      <span class="alu-flag" class:on={r.zero}>Z</span>
      <span class="alu-flag" class:on={r.carry}>C</span>
    </span>
  </div>
  <div class="csnote" role="status" aria-live="polite">
    {op} of {a} and {b} = {r.result}{r.carry ? (op === 'SUB' ? ' (borrow out)' : ' (carry out — it overflowed 8 bits)') : ''}{r.zero ? ' · the zero flag is set, which is how a branch knows two values were equal' : ''}.
  </div>
</div>

<style>
  .alu-ops{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:16px}
  .alu-op{font-family:var(--mono);font-size:13px;padding:6px 16px;border:1px solid var(--border);border-radius:8px;background:var(--surface);color:var(--dim);cursor:pointer;transition:.15s}
  .alu-op.on{border-color:var(--blue);color:var(--blue);background:var(--blue-d)}
  .alu-io{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:16px}
  @media(max-width:520px){.alu-io{grid-template-columns:1fr}}
  .alu-in{display:flex;flex-direction:column;gap:6px;font-family:var(--mono)}
  .alu-in label{font-size:13px;color:var(--dim)}
  .alu-bits{font-family:var(--mono);font-size:15px;color:var(--faint);letter-spacing:.12em}
  .alu-result{display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap;border:1px solid var(--border);border-radius:12px;padding:16px;background:var(--surface)}
  .alu-rlab{font-family:var(--mono);font-size:13px;color:var(--faint)}
  .alu-bits.big{font-size:22px;font-weight:700;color:var(--blue);letter-spacing:.16em}
  .alu-dec{font-family:var(--mono);font-size:16px;font-weight:700;color:var(--ink)}
  .alu-flags{display:flex;gap:6px;margin-left:6px}
  .alu-flag{font-family:var(--mono);font-size:12px;font-weight:700;width:24px;height:24px;display:flex;align-items:center;justify-content:center;border:1px solid var(--border);border-radius:6px;color:var(--faint)}
  .alu-flag.on{border-color:var(--signal);color:var(--signal);background:var(--signal-d)}
</style>
