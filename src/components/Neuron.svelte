<script>
  import { computeNeuron } from '../lib/widgets.js';
  let x = $state([1, 0]);
  let w = $state([1, 1]);
  let bias = $state(-1.5);
  let r = $derived(computeNeuron(x, w, bias));
  // is this configuration acting as a familiar gate?
  let gate = $derived.by(() => {
    const out = (a, b) => computeNeuron([a, b], w, bias).output;
    const t = [out(0,0), out(0,1), out(1,0), out(1,1)].join('');
    return { '0001': 'an AND gate', '0111': 'an OR gate', '1110': 'a NAND gate', '1000': 'a NOR gate' }[t] || null;
  });
</script>
<div class="widget">
  <div class="w-label">flip the inputs and drag the weights — the neuron sums, adds a bias, and fires</div>
  <div class="nu-row">
    <div class="nu-inputs">
      {#each x as v, i}
        <button type="button" class="nu-x" class:on={v === 1} aria-pressed={v === 1} onclick={() => (x[i] = v ? 0 : 1)}>
          <span class="nu-xlab">x{i + 1}</span><span class="nu-xval">{v}</span>
        </button>
      {/each}
    </div>
    <div class="nu-calc">
      <code class="nu-sum">{x[0]}·{w[0]} + {x[1]}·{w[1]} + ({bias}) = {r.sum}</code>
      <div class="nu-fire" class:on={r.output === 1}>{r.sum} ≥ 0 ? → fires <b>{r.output}</b></div>
    </div>
    <div class="nu-out" class:on={r.output === 1}><span class="nu-olab">output</span><span class="nu-oval">{r.output}</span></div>
  </div>
  <div class="nu-knobs">
    <label class="nu-knob">w1 <input type="range" min="-2" max="2" step="0.5" bind:value={w[0]} class="slider" /> <span>{w[0]}</span></label>
    <label class="nu-knob">w2 <input type="range" min="-2" max="2" step="0.5" bind:value={w[1]} class="slider" /> <span>{w[1]}</span></label>
    <label class="nu-knob">bias <input type="range" min="-3" max="1" step="0.5" bind:value={bias} class="slider" /> <span>{bias}</span></label>
  </div>
  <div class="csnote" role="status" aria-live="polite">{gate ? 'with these weights the neuron behaves as ' + gate + ' — one neuron is a tunable logic gate.' : 'adjust the weights toward a threshold that fires the way you want — that tuning is what training does.'}</div>
</div>

<style>
  .nu-row{display:flex;align-items:center;justify-content:center;gap:18px;flex-wrap:wrap;font-family:var(--mono)}
  .nu-inputs{display:flex;flex-direction:column;gap:8px}
  .nu-x{display:flex;align-items:center;gap:8px;border:1px solid var(--border);border-radius:9px;padding:8px 14px;background:var(--surface);color:var(--dim);cursor:pointer;transition:.15s}
  .nu-x.on{border-color:var(--blue);color:var(--blue);background:var(--blue-d)}
  .nu-xlab{font-size:11px;color:var(--faint)}
  .nu-xval{font-size:18px;font-weight:700}
  .nu-calc{display:flex;flex-direction:column;gap:6px;align-items:center}
  .nu-sum{font-size:14px;color:var(--dim)}
  .nu-fire{font-size:13px;color:var(--faint)}
  .nu-fire.on{color:var(--signal)}
  .nu-fire b{font-size:15px}
  .nu-out{display:flex;flex-direction:column;align-items:center;gap:3px;border:1px solid var(--border);border-radius:12px;padding:12px 18px;background:var(--surface);transition:.18s}
  .nu-out.on{border-color:var(--signal);color:var(--signal);background:var(--signal-d)}
  .nu-olab{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint)}
  .nu-oval{font-size:22px;font-weight:700}
  .nu-knobs{display:flex;gap:18px;justify-content:center;flex-wrap:wrap;margin-top:18px}
  .nu-knob{display:flex;align-items:center;gap:8px;font-family:var(--mono);font-size:13px;color:var(--dim)}
  .nu-knob span{color:var(--ink);font-weight:700;min-width:28px}
</style>
