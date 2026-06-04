<script>
  import { onDestroy } from 'svelte';
  import { createStepper } from '../lib/stepper.svelte.js';
  import Stepper from './Stepper.svelte';
  const FRAG = ['GET ','/cas','es/','42 ','HTTP','/1.1'];
  function buildPkt() {
    const N = FRAG.length, dropFirst = new Set([2,5]), slots = Array(N).fill(null), out = [];
    const snap = (flight, note, delivered) => out.push({ flight, slots: slots.slice(), note, delivered: !!delivered });
    snap(null, '6 packets queued — each carries a sequence number so the receiver can reorder them later', false);
    for (let s = 1; s <= N; s++) {
      if (dropFirst.has(s)) snap({ seq: s, status: 'drop' }, 'packet ' + s + ' sent → LOST in transit (a congested router dropped it)', false);
      else { slots[s-1] = FRAG[s-1]; snap({ seq: s, status: 'arrive' }, 'packet ' + s + ' arrives → placed in slot ' + s + ' by its sequence number', false); }
    }
    snap(null, 'receiver has 1,3,4,6 but slots 2 & 5 are empty — TCP spots the gaps and asks the sender to resend', false);
    [2,5].forEach((s) => { slots[s-1] = FRAG[s-1]; snap({ seq: s, status: 'arrive' }, 'packet ' + s + ' retransmitted → arrives, fills slot ' + s, false); });
    snap(null, 'every slot full → TCP reassembles in order and hands the complete request up the stack', true);
    return out;
  }
  const stepper = createStepper(buildPkt, { speed: 750 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
  let preview = $derived(s.slots.map((f) => f === null ? '····' : f).join(''));
  onDestroy(() => stepper.destroy());
</script>
<div class="widget">
  <div class="csbar"><span class="csmini">the same request, chopped into 6 packets crossing a lossy internet</span></div>
  <div class="w-label">step the transmission — packets drop, TCP notices the gaps and retransmits</div>
  <div class="pktsender">{#each FRAG as f, k}<div class="pkt {s.slots[k] !== null ? 'done' : ''} {s.flight && s.flight.seq === k + 1 ? 'flight' : ''}"><span class="pn">P{k + 1}</span><span class="pf">{f.trim() || '·'}</span></div>{/each}</div>
  <div class="channel">
    {#if s.flight}<span>the internet:</span><span class="flightchip {s.flight.status === 'arrive' ? 'ok' : 'drop'}">P{s.flight.seq} {s.flight.status === 'arrive' ? '✓ arrived' : '✗ dropped'}</span>
    {:else}<span class="muted">— channel idle —</span>{/if}
  </div>
  <div class="slots">{#each s.slots as f, k}{#if f !== null}<div class="slot full"><span class="sn">slot {k + 1}</span><span class="sf">{f.trim() || '·'}</span></div>{:else}<div class="slot empty"><span class="sn">slot {k + 1}</span><span class="sf">gap</span></div>{/if}{/each}</div>
  <div class="recon" class:done={s.delivered}>{s.delivered ? '✓ delivered in order:  "' : 'reassembly buffer:  "'}{preview}"</div>
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>
