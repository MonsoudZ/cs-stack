<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildFloatGrid } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = useStepper(() => buildFloatGrid(), { speed: 1100 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
  const MAX = 8;
  const pct = (v) => (v / MAX) * 100;
</script>
<div class="widget">
  <div class="csbar">
    <span class="csmini">toy 8-bit float · representable values on the number line 0–8</span>
    <span class="spacer"></span>
    {#if s.gap != null}<span class="csmini fg-gap">gap in [{s.lo}, {s.hi}) = {s.gap}</span>{/if}
  </div>
  <div class="w-label">step the octaves — watch the spacing between representable values double</div>
  <div class="fg-line">
    {#if s.lo != null && s.hi != null && s.gap != null}
      <div class="fg-band" style:left={`${pct(s.lo)}%`} style:width={`${pct(s.hi - s.lo)}%`}></div>
    {/if}
    {#each s.values as v}
      <span class="fg-tick" class:in={s.gap != null && v >= s.lo && v < s.hi} style:left={`${pct(v)}%`}></span>
    {/each}
    {#each [0, 1, 2, 4, 8] as t}
      <span class="fg-axis" style:left={`${pct(t)}%`}><span class="fg-num">{t}</span></span>
    {/each}
  </div>
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .fg-gap{color:var(--signal)}
  .fg-line{position:relative;height:64px;margin:18px 0 8px;border-bottom:1px solid var(--border)}
  .fg-band{position:absolute;top:0;bottom:0;background:var(--signal-d);border-radius:6px;transition:.2s}
  .fg-tick{position:absolute;top:18px;width:2px;height:22px;background:var(--blue);transform:translateX(-1px);opacity:.45;transition:.18s}
  .fg-tick.in{opacity:1;height:30px;top:12px;background:var(--signal)}
  .fg-axis{position:absolute;bottom:-1px;width:1px;height:10px;background:var(--faint);transform:translateX(-.5px)}
  .fg-num{position:absolute;top:12px;left:50%;transform:translateX(-50%);font-family:var(--mono);font-size:11px;color:var(--faint)}
</style>
