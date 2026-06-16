<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildTcp } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = useStepper(() => buildTcp(), { speed: 1000 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
  const events = ['SYN', 'SYN-ACK', 'ACK'];
</script>
<div class="widget">
  <div class="csbar"><span class="csmini">open the connection, then probe for bandwidth — and back off on loss</span></div>
  <div class="w-label">step it — the 3-way handshake, then cwnd grows and collapses (TCP’s sawtooth)</div>
  <div class="tcp">
    <div class="tcp-hs">
      {#each events as e}
        <span class="tcp-pkt" class:on={s.event === e}>{e}</span>
      {/each}
      <span class="tcp-state" class:open={s.established}>{s.established ? 'connection open' : 'opening…'}</span>
    </div>
    <div class="tcp-meter">
      <div class="tcp-phase" class:lost={s.lost}>{s.phase}</div>
      <div class="tcp-win" class:lost={s.lost}>
        {#each Array.from({ length: s.cwnd }) as _, i}<span class="tcp-seg" class:over={i >= s.ssthresh}></span>{/each}
        {#if s.cwnd === 0}<span class="tcp-seg empty"></span>{/if}
      </div>
      <div class="tcp-nums">
        <b class="tcp-cwnd" class:lost={s.lost}>cwnd {s.cwnd}</b>
        <span>ssthresh {s.ssthresh}</span>
        <span>RTT {s.rtt}</span>
      </div>
    </div>
  </div>
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .tcp{display:flex;flex-direction:column;gap:14px;font-family:var(--mono);margin-top:4px}
  .tcp-hs{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  .tcp-pkt{font-size:12px;font-weight:700;color:var(--dim);border:1px solid var(--border);border-radius:8px;padding:6px 10px;background:var(--panel2);transition:.15s}
  .tcp-pkt.on{color:var(--blue);border-color:var(--blue);box-shadow:0 0 12px var(--blue-d)}
  .tcp-state{margin-left:auto;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--faint)}
  .tcp-state.open{color:var(--signal)}
  .tcp-meter{border:1px solid var(--border);border-radius:14px;background:var(--surface);padding:14px 16px;display:flex;flex-direction:column;gap:10px}
  .tcp-phase{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--amber)}
  .tcp-phase.lost{color:var(--red)}
  .tcp-win{display:flex;gap:4px;align-items:flex-end;min-height:30px;flex-wrap:wrap}
  .tcp-seg{width:18px;height:30px;border-radius:4px;background:var(--signal);opacity:.9}
  .tcp-seg.over{background:var(--amber)}
  .tcp-seg.empty{background:transparent;border:1px dashed var(--border)}
  .tcp-win.lost .tcp-seg{background:var(--red)}
  .tcp-nums{display:flex;gap:16px;align-items:baseline;font-size:13px;color:var(--faint)}
  .tcp-nums .tcp-cwnd{font-size:16px;color:var(--signal)}
  .tcp-nums .tcp-cwnd.lost{color:var(--red)}
</style>
