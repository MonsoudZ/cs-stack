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
