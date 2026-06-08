<script>
  import { nextTokenDist } from '../lib/widgets.js';
  let temp = $state(0.8);
  let dist = $derived(nextTokenDist(temp));
  let max = $derived(Math.max(...dist.map((d) => d.prob)));
</script>
<div class="widget">
  <div class="csbar">
    <span class="csmini">a language model · the next-token distribution</span>
    <span class="spacer"></span>
    <span class="csmini nt-temp">temperature {temp}</span>
  </div>
  <div class="w-label">drag the temperature — low sharpens to the top guess, high spreads it out</div>
  <div class="nt-prompt">The cat sat on the <span class="nt-blank">___</span></div>
  <div class="nt-bars">
    {#each dist as { token, prob }}
      <div class="nt-row">
        <span class="nt-tok">{token}</span>
        <span class="nt-track"><span class="nt-fill" class:topp={prob === max} style:width={`${prob * 100}%`}></span></span>
        <span class="nt-pct">{(prob * 100).toFixed(prob < 0.01 ? 2 : 0)}%</span>
      </div>
    {/each}
  </div>
  <label class="nt-knob">temperature <input type="range" min="0.2" max="2" step="0.1" bind:value={temp} class="slider" /> <span>{temp}</span></label>
  <div class="csnote" role="status" aria-live="polite">
    {temp <= 0.5 ? 'low temperature → the model almost always picks the top token; nearly deterministic.' : temp >= 1.4 ? 'high temperature → the distribution flattens; the model gets creative (and risks nonsense).' : 'the model outputs a probability for every possible next token; sampling one, then repeating, is all an LLM does.'}
  </div>
</div>

<style>
  .nt-temp{color:var(--amber)}
  .nt-prompt{font-family:var(--mono);font-size:15px;color:var(--dim);text-align:center;margin-bottom:16px}
  .nt-blank{color:var(--signal);font-weight:700}
  .nt-bars{display:flex;flex-direction:column;gap:7px;font-family:var(--mono)}
  .nt-row{display:flex;align-items:center;gap:12px}
  .nt-tok{width:56px;text-align:right;color:var(--ink);font-weight:700;font-size:14px}
  .nt-track{flex:1;height:20px;background:var(--fill);border-radius:5px;overflow:hidden}
  .nt-fill{display:block;height:100%;background:var(--blue);border-radius:5px;transition:width .2s}
  .nt-fill.topp{background:var(--signal)}
  .nt-pct{width:48px;font-size:12px;color:var(--faint)}
  .nt-knob{display:flex;align-items:center;gap:10px;justify-content:center;margin-top:18px;font-family:var(--mono);font-size:13px;color:var(--dim)}
  .nt-knob span{color:var(--ink);font-weight:700;min-width:26px}
</style>
