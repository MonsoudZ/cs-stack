<script>
  import { cmosInverter } from '../lib/widgets.js';
  let input = $state(0);
  let r = $derived(cmosInverter(input));
</script>
<div class="widget">
  <div class="w-label">flip the input — one transistor pulls the output the opposite way</div>
  <div class="inv-wrap">
    <button type="button" class="inv-in" class:hi={input === 1} aria-pressed={input === 1} onclick={() => (input = input ? 0 : 1)}>
      <span class="inv-lab">input</span><span class="inv-bit">{input ? 'HIGH' : 'LOW'}</span>
    </button>
    <div class="inv-core">
      <div class="inv-rail">+V (HIGH)</div>
      <div class="inv-fet p" class:on={r.pmos}>
        <span class="inv-fname">pMOS</span><span class="inv-fstate">{r.pmos ? 'conducting' : 'off'}</span>
      </div>
      <div class="inv-node" class:hi={r.output === 1}>output node</div>
      <div class="inv-fet n" class:on={r.nmos}>
        <span class="inv-fname">nMOS</span><span class="inv-fstate">{r.nmos ? 'conducting' : 'off'}</span>
      </div>
      <div class="inv-rail">0 V (LOW)</div>
    </div>
    <div class="inv-out" class:hi={r.output === 1}>
      <span class="inv-lab">output</span><span class="inv-bit">{r.output ? 'HIGH' : 'LOW'}</span>
    </div>
  </div>
  <div class="csnote" role="status" aria-live="polite">input {input ? 'HIGH' : 'LOW'} → the {r.path} transistor conducts → output {r.output ? 'HIGH' : 'LOW'}. That’s a NOT gate, built from two transistors.</div>
</div>

<style>
  .inv-wrap{display:flex;align-items:center;justify-content:center;gap:18px;font-family:var(--mono);flex-wrap:wrap}
  .inv-in,.inv-out{display:flex;flex-direction:column;align-items:center;gap:4px;border:1px solid var(--border);border-radius:12px;padding:14px 18px;background:var(--surface);min-width:96px}
  .inv-in{cursor:pointer;transition:.15s}
  .inv-in.hi,.inv-out.hi{border-color:var(--signal);color:var(--signal);background:var(--signal-d)}
  .inv-lab{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint)}
  .inv-bit{font-size:18px;font-weight:700}
  .inv-core{display:flex;flex-direction:column;align-items:center;gap:6px;min-width:150px}
  .inv-rail{font-size:10px;color:var(--faint);letter-spacing:.06em}
  .inv-fet{width:100%;display:flex;justify-content:space-between;gap:10px;border:1px solid var(--border);border-radius:9px;padding:8px 12px;background:var(--surface);color:var(--dim);transition:.18s}
  .inv-fet.on.p{border-color:var(--red);color:var(--red);box-shadow:0 0 12px rgba(255,107,107,.18)}
  .inv-fet.on.n{border-color:var(--blue);color:var(--blue);box-shadow:0 0 12px var(--blue-d)}
  .inv-fname{font-weight:700}
  .inv-fstate{font-size:12px}
  .inv-node{width:100%;text-align:center;font-size:12px;color:var(--faint);border:1px dashed var(--border);border-radius:8px;padding:6px}
  .inv-node.hi{color:var(--signal);border-color:var(--signal)}
</style>
