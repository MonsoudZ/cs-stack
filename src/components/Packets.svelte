<script>
  import { onDestroy } from 'svelte';
  import { createStepper } from '../lib/stepper.svelte.js';
  import { buildPkt, PACKET_FRAGMENTS as FRAG } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = createStepper(buildPkt, { speed: 750 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
  let preview = $derived(s.slots.map((f) => f === null ? '····' : f).join(''));
  onDestroy(() => stepper.destroy());
</script>
<div class="widget">
  <div class="csbar"><span class="csmini">the same request, chopped into 6 packets crossing a lossy internet</span></div>
  <div class="w-label">step the transmission — packets drop, TCP notices the gaps and retransmits</div>
  <div class="pktsender">{#each FRAG as f, k}<div class="pkt {s.slots[k] !== null ? 'done' : ''} {s.flight && s.flight.seq === k + 1 ? 'flight' : ''}" aria-current={s.flight && s.flight.seq === k + 1 ? 'true' : undefined}><span class="pn">P{k + 1}</span><span class="pf">{f.trim() || '·'}</span></div>{/each}</div>
  <div class="channel">
    {#if s.flight}<span>the internet:</span><span class="flightchip {s.flight.status === 'arrive' ? 'ok' : 'drop'}">P{s.flight.seq} {s.flight.status === 'arrive' ? '✓ arrived' : '✗ dropped'}</span>
    {:else}<span class="muted">— channel idle —</span>{/if}
  </div>
  <div class="slots">{#each s.slots as f, k}{#if f !== null}<div class="slot full"><span class="sn">slot {k + 1}</span><span class="sf">{f.trim() || '·'}</span></div>{:else}<div class="slot empty"><span class="sn">slot {k + 1}</span><span class="sf">gap</span></div>{/if}{/each}</div>
  <div class="recon" class:done={s.delivered}>{s.delivered ? '✓ delivered in order:  "' : 'reassembly buffer:  "'}{preview}"</div>
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>
