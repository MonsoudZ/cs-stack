<script>
  import { mux2 } from '../lib/widgets.js';
  let a = $state(0), b = $state(1), sel = $state(0);
  let m = $derived(mux2(sel, a, b));
</script>
<div class="widget">
  <div class="w-label">flip the select line — it picks which input reaches the output</div>
  <div class="mux-wrap">
    <div class="mux-inputs">
      <button type="button" class="mux-in" class:hi={a === 1} class:routed={sel === 0} aria-pressed={a === 1} onclick={() => (a = a ? 0 : 1)}>
        <span class="mux-lab">input a</span><span class="mux-bit">{a}</span>
      </button>
      <button type="button" class="mux-in" class:hi={b === 1} class:routed={sel === 1} aria-pressed={b === 1} onclick={() => (b = b ? 0 : 1)}>
        <span class="mux-lab">input b</span><span class="mux-bit">{b}</span>
      </button>
    </div>
    <div class="mux-box">
      <div class="mux-name">MUX</div>
      <div class="mux-routed">routing {sel === 0 ? 'a' : 'b'}</div>
    </div>
    <div class="mux-out" class:hi={m.out === 1}>
      <span class="mux-lab">output</span><span class="mux-bit">{m.out}</span>
    </div>
  </div>
  <div class="mux-sel">
    <button type="button" class="mux-selbtn" aria-pressed={sel === 1} onclick={() => (sel = sel ? 0 : 1)}>select s = {sel}</button>
    <code class="mux-formula">out = {m.formula}</code>
  </div>
  <div class="csnote" role="status" aria-live="polite">select = {sel} → the output follows input {sel === 0 ? 'a' : 'b'} (= {m.out}); the other input is ignored. That’s how hardware <em>chooses</em>.</div>
</div>

<style>
  .mux-wrap{display:flex;align-items:center;justify-content:center;gap:16px;font-family:var(--mono);flex-wrap:wrap}
  .mux-inputs{display:flex;flex-direction:column;gap:10px}
  .mux-in,.mux-out{display:flex;flex-direction:column;align-items:center;gap:3px;border:1px solid var(--border);border-radius:10px;padding:10px 16px;background:var(--surface);min-width:88px}
  .mux-in{cursor:pointer;transition:.15s}
  .mux-in.hi,.mux-out.hi{border-color:var(--signal);color:var(--signal);background:var(--signal-d)}
  .mux-in.routed{box-shadow:0 0 14px var(--blue-d);border-color:var(--blue)}
  .mux-lab{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--faint)}
  .mux-bit{font-size:20px;font-weight:700}
  .mux-box{display:flex;flex-direction:column;align-items:center;gap:3px;border:1px solid var(--border);border-radius:12px;padding:16px;background:var(--fill);min-width:96px}
  .mux-name{font-weight:700;color:var(--ink);letter-spacing:.1em}
  .mux-routed{font-size:11px;color:var(--blue)}
  .mux-sel{display:flex;align-items:center;justify-content:center;gap:14px;margin-top:16px;flex-wrap:wrap}
  .mux-selbtn{font-family:var(--mono);font-size:13px;padding:6px 14px;border:1px solid var(--border);border-radius:8px;background:var(--surface);color:var(--dim);cursor:pointer}
  .mux-selbtn[aria-pressed="true"]{border-color:var(--blue);color:var(--blue);background:var(--blue-d)}
  .mux-formula{font-size:13px;color:var(--faint)}
</style>
