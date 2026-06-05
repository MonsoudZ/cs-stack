<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildEnc } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = useStepper(buildEnc, { speed: 1100 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
  let head = $derived(s.bytes - 22);
</script>
<div class="widget">
  <div class="csbar"><span class="csmini">one HTTP request · wrapped going down, unwrapped going up</span></div>
  <div class="w-label">step it down the stack and back up — watch the envelopes nest</div>
  <div class="netside"><span class="ar">{s.side}</span> &nbsp;·&nbsp; layer: <b>{s.layer}</b></div>
  <div class="encrow">{#each s.segs as g}<div class="seg {g.cls}"><span class="sl">{g.sl}</span><span class="sd">{g.sd}</span></div>{/each}</div>
  <div class="encbytes">on-the-wire size: {s.bytes} bytes{head > 0 ? '   (' + head + ' bytes of headers wrapping 22 bytes of actual request)' : '   (just the payload itself)'}</div>
  <div class="csnote csnote-blue" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>
