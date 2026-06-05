<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildTwosComplement } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = useStepper(() => buildTwosComplement(), { speed: 1100 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
  const PLACE = ['−8', '4', '2', '1']; // place values; the top bit is negative
</script>
<div class="widget">
  <div class="csbar">
    <span class="csmini">two’s complement · 4-bit signed · range −8…7</span>
    <span class="spacer"></span>
    <span class="csmini tc-val" class:neg={s.value < 0}>value = {s.value}</span>
  </div>
  <div class="w-label">step the negation — flip every bit, then add one</div>
  <div class="tc-bits">
    {#each s.bits as b, i}
      <div class="tc-bit" class:on={b === 1} class:sign={i === 0} class:hot={i === 0 && s.signBit}>
        <div class="tc-place">{PLACE[i]}</div>
        <div class="tc-val-cell">{b}</div>
      </div>
    {/each}
  </div>
  <div class="csnote" role="status" aria-live="polite" class:overflow={s.overflow}>{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .tc-val{color:var(--signal)}
  .tc-val.neg{color:var(--red)}
  .tc-bits{display:flex;gap:8px;justify-content:center;font-family:var(--mono)}
  .tc-bit{display:flex;flex-direction:column;align-items:center;border:1px solid var(--border);border-radius:10px;overflow:hidden;width:60px;background:var(--surface);transition:.18s}
  .tc-place{font-size:11px;color:var(--faint);padding:5px 0;width:100%;text-align:center;border-bottom:1px solid var(--border)}
  .tc-bit.sign .tc-place{color:var(--red)}
  .tc-val-cell{font-size:22px;font-weight:700;color:var(--dim);padding:8px 0}
  .tc-bit.on .tc-val-cell{color:var(--blue)}
  .tc-bit.on.sign .tc-val-cell{color:var(--red)}
  .tc-bit.hot{border-color:var(--red);box-shadow:0 0 14px var(--red)}
  .csnote.overflow{color:var(--red)}
</style>
