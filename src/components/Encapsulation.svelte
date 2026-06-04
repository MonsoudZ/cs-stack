<script>
  import { createStepper } from '../lib/stepper.svelte.js';
  import Stepper from './Stepper.svelte';
  function buildEnc() {
    const PAYLOAD = {cls:'payload',sl:'HTTP payload',sd:'GET /cases/42 HTTP/1.1',bytes:22};
    const TCP = {cls:'tcp',sl:'TCP header',sd:'sport 54321 → dport 443 · seq#',bytes:20};
    const IP = {cls:'ip',sl:'IP header',sd:'src 10.0.0.5 → dst 93.184.x.x',bytes:20};
    const ETH = {cls:'eth',sl:'Ethernet',sd:'src MAC → dst MAC',bytes:14};
    const FCS = {cls:'fcs',sl:'FCS',sd:'checksum',bytes:4};
    const S = [];
    const st = (segs, side, layer, note) => S.push({ segs, side, layer, note, bytes: segs.reduce((a, s) => a + s.bytes, 0) });
    st([PAYLOAD],'sender ↓','Application','your code hands the HTTP request to the OS — just text, the bytes from layer 03');
    st([TCP,PAYLOAD],'sender ↓','Transport','TCP wraps it: adds ports (which program?) and a sequence number (for reliability)');
    st([IP,TCP,PAYLOAD],'sender ↓','Network','IP wraps that: adds source + destination addresses so routers can forward it');
    st([ETH,IP,TCP,PAYLOAD,FCS],'sender ↓','Link','the link layer adds MAC addresses + a checksum — now a frame, ready for the wire');
    st([ETH,IP,TCP,PAYLOAD,FCS],'⇄ the wire','Physical','sent as voltage / light / radio — layer 00 — across switches and routers');
    st([IP,TCP,PAYLOAD],'receiver ↑','Link','server strips the frame, verifies the checksum — link layer done');
    st([TCP,PAYLOAD],'receiver ↑','Network','strips the IP header — "yes, this packet is addressed to me"');
    st([PAYLOAD],'receiver ↑','Transport','strips the TCP header, re-orders & acknowledges — hands the payload up');
    st([PAYLOAD],'receiver ↑','Application','the server receives the exact same bytes you sent: GET /cases/42');
    return S;
  }
  const stepper = createStepper(buildEnc, { speed: 1100 });
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
