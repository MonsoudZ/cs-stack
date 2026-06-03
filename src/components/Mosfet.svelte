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
  <div class="w-row" style="margin-top:18px;gap:24px;align-items:center">
    <div style="flex:1;min-width:200px">
      <div class="rgb-row">
        <label style="width:auto">V<sub>gate</sub></label>
        <input type="range" min="0" max="33" bind:value={raw} class="slider" id="mosV" />
        <span style="font-family:var(--mono);color:var(--signal)">{(+raw / 10).toFixed(1)} V</span>
      </div>
      <div style="font-family:var(--mono);font-size:11px;color:var(--faint);margin-top:6px">threshold ≈ 1.5 V — below it, no channel</div>
    </div>
    <div class="lead">
      <div class="toggle" class:hi={on} style="cursor:default;min-width:96px"><div class="st">CHANNEL</div><div class="v">{on ? 'ON' : 'OFF'}</div></div>
      <small style="font-family:var(--mono)">{on ? 'current flows source → drain' : 'no current'}</small>
    </div>
  </div>
</div>
