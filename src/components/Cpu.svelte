<script>
  import { onDestroy } from 'svelte';
  import { createStepper } from '../lib/stepper.svelte.js';
  import { buildCpu } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = createStepper(buildCpu, { speed: 650 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
  onDestroy(() => stepper.destroy());
</script>
<div class="widget">
  <div class="w-label">a tiny program · press STEP</div>
  <div class="cpu">
    <div class="rom">{#each s.prog as line, i}<div class="ln {i === s.cur ? 'cur' : ''}" aria-current={i === s.cur ? 'true' : undefined}><span class="ad">{String(i).padStart(2,'0')}</span><span class="op">{line}</span></div>{/each}</div>
    <div class="regs">
      <div class="reg"><span class="rn">PC · program counter</span><span class="rv">{s.PC >= s.prog.length ? '—' : s.PC}</span></div>
      <div class="reg"><span class="rn">A · register</span><span class="rv">{s.A}</span></div>
      <div class="reg"><span class="rn">B · register</span><span class="rv">{s.B}</span></div>
      <div class="cpu-out">{s.out ? ('OUTPUT ▸ ' + s.out) : ''}</div>
    </div>
  </div>
  <div class="csnote cpu-note" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>
