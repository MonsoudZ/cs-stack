<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildGradientDescent } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = useStepper(() => buildGradientDescent(), { speed: 850 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
  let loss0 = $derived(stepper.all()[0].loss || 1);
</script>
<div class="widget">
  <div class="csbar">
    <span class="csmini">learning · gradient descent · fit ŷ = w·2 to y = 6</span>
    <span class="spacer"></span>
    <span class="csmini gd-w">w = {s.w}</span>
  </div>
  <div class="w-label">step the descent — w slides downhill until the prediction matches</div>
  <div class="gd-readout">
    <div class="gd-cell"><span class="gd-k">weight w</span><span class="gd-v">{s.w}</span></div>
    <div class="gd-cell"><span class="gd-k">prediction ŷ</span><span class="gd-v" class:ok={Math.abs(s.pred - 6) < 0.2}>{s.pred}</span></div>
    <div class="gd-cell"><span class="gd-k">target y</span><span class="gd-v">6</span></div>
  </div>
  <div class="gd-loss">
    <div class="gd-losslab">loss (ŷ − y)² = {s.loss}</div>
    <div class="gd-bar"><span class="gd-fill" style:width={`${Math.min(100, (s.loss / loss0) * 100)}%`}></span></div>
  </div>
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .gd-w{color:var(--signal)}
  .gd-readout{display:flex;gap:12px;justify-content:center;font-family:var(--mono);flex-wrap:wrap}
  .gd-cell{display:flex;flex-direction:column;align-items:center;gap:4px;border:1px solid var(--border);border-radius:11px;padding:12px 18px;background:var(--surface);min-width:96px}
  .gd-k{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--faint)}
  .gd-v{font-size:20px;font-weight:700;color:var(--ink)}
  .gd-v.ok{color:var(--signal)}
  .gd-loss{margin-top:16px;font-family:var(--mono)}
  .gd-losslab{font-size:13px;color:var(--dim);margin-bottom:6px}
  .gd-bar{height:8px;border-radius:5px;background:var(--fill);overflow:hidden}
  .gd-fill{display:block;height:100%;background:var(--red);border-radius:5px;transition:width .3s}
</style>
