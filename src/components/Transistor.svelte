<script>
  let gate = $state(false);
</script>
<div class="widget">
  <div class="w-label">flip the gate voltage — watch the channel open</div>
  <div class="w-row">
    <button type="button" class="toggle" class:hi={gate} aria-pressed={gate} aria-label={`gate voltage ${gate ? 'on' : 'off'}`}
         onclick={() => gate = !gate}>
      <div class="st">GATE</div><div class="v">{gate ? 1 : 0}</div>
    </button>
    <div class="tube">
      <div class="lead"><div class="node live"></div><small>in</small></div>
      <div class="wire live"></div>
      <div class="gate-sym" class:open={gate}><div class="ctrl"></div><div class="body">{gate ? 'on' : 'off'}</div></div>
      <div class="wire" class:live={gate}></div>
      <div class="lead"><div class="node" class:live={gate}></div><small>out</small></div>
    </div>
  </div>
</div>
