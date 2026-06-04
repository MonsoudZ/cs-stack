<script>
  let raw = $state(0);
  let on = $derived(+raw >= 15);
</script>
<div class="widget">
  <div class="w-label">drive the gate voltage — pull a channel into existence</div>
  <div class="mosfet">
    <div class="mos-gatewrap">
      <div class="mos-terminal">gate</div>
      <div class="mos-gate" class:on>metal gate</div>
      <div class="mos-oxide"></div>
    </div>
    <div class="mos-body">
      <div class="mos-region nsrc">n+<small>source</small></div>
      <div class="mos-channel-zone">
        <div class="mos-channel" class:on></div>
        <div class="mos-carriers">{on ? 'e⁻ → → → e⁻' : ''}</div>
      </div>
      <div class="mos-region ndrn">n+<small>drain</small></div>
      <div class="mos-sub">p-type silicon body</div>
    </div>
  </div>
  <div class="w-row mos-control-row">
    <div class="control-fill">
      <div class="rgb-row">
        <label for="mosV" class="label-auto">V<sub>gate</sub></label>
        <input type="range" min="0" max="33" bind:value={raw} class="slider" id="mosV" aria-valuetext={(+raw / 10).toFixed(1) + ' volts'} />
        <span class="meter-value">{(+raw / 10).toFixed(1)} V</span>
      </div>
      <div class="slider-hint">threshold ≈ 1.5 V — below it, no channel</div>
    </div>
    <div class="lead">
      <div class="toggle display-toggle channel-toggle" class:hi={on}><div class="st">CHANNEL</div><div class="v">{on ? 'ON' : 'OFF'}</div></div>
      <small class="mono-small">{on ? 'current flows source → drain' : 'no current'}</small>
    </div>
  </div>
</div>

<style>
  .mosfet{max-width:620px;margin:8px auto 0;font-family:var(--mono);transform:scale(1.06);transform-origin:center}
  .mos-gatewrap{display:flex;flex-direction:column;align-items:center}
  .mos-terminal{font-size:11px;color:var(--faint);margin-bottom:4px}
  .mos-gate{width:230px;height:34px;background:linear-gradient(#3a4660,#222c3e);border:1px solid var(--border);
    border-radius:5px 5px 0 0;display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--dim);transition:.2s}
  .mos-gate.on{border-color:var(--signal);box-shadow:0 0 22px var(--signal-d);color:var(--signal)}
  .mos-oxide{width:260px;height:12px;background:repeating-linear-gradient(45deg,#2a3346,#2a3346 4px,#1d2533 4px,#1d2533 8px);
    border-left:1px solid var(--border);border-right:1px solid var(--border)}
  .mos-body{position:relative;border:1px solid var(--border);border-top:none;border-radius:0 0 14px 14px;
    background:linear-gradient(#0e1622,#0b1018);display:flex;align-items:stretch;height:138px}
  .mos-region{width:122px;margin:12px;background:rgba(91,157,255,.15);border:1px solid rgba(91,157,255,.35);
    border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--blue);font-size:14px;font-weight:700}
  .mos-region small{font-size:11px;color:var(--faint);font-weight:400;margin-top:3px}
  .mos-channel-zone{flex:1;position:relative;display:flex;align-items:flex-start;justify-content:center;padding-top:10px}
  .mos-channel{width:100%;height:10px;border-radius:999px;background:var(--faint);opacity:.18;transition:opacity .25s,background .25s}
  .mos-channel.on{opacity:1;background:linear-gradient(90deg,var(--signal),#0c141e,var(--signal));background-size:200% 100%;
    box-shadow:0 0 16px var(--signal-d);animation:mos-flow 1.1s linear infinite}
  @keyframes mos-flow{from{background-position:0 0}to{background-position:-200% 0}}
  .mos-carriers{position:absolute;top:22px;left:0;right:0;text-align:center;font-size:11px;color:var(--signal);letter-spacing:.3em;min-height:14px}
  .mos-sub{position:absolute;bottom:6px;left:0;right:0;text-align:center;font-size:11px;color:var(--faint)}
  #mosV::-webkit-slider-thumb{background:var(--signal)}#mosV::-moz-range-thumb{background:var(--signal)}
  @media(max-width:560px){
    .mosfet{max-width:100%;transform:none}
    .mos-gate{width:180px}
    .mos-oxide{width:210px}
    .mos-body{height:118px}
    .mos-region{width:82px;margin:8px;font-size:12px}
    .mos-carriers{letter-spacing:.16em}
  }
  @media(max-width:390px){
    .mos-region{width:68px;margin:7px}
    .mos-gate{width:160px}
    .mos-oxide{width:190px}
  }
</style>
