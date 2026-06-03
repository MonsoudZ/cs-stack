<script>
  let gate = $state(false);
</script>
<div class="widget">
  <div class="w-label">flip the gate voltage — watch the channel open</div>
  <div class="w-row">
    <div class="toggle" class:hi={gate} style="cursor:pointer" role="button" tabindex="0"
         aria-pressed={gate} aria-label="flip the gate voltage"
         onclick={() => gate = !gate} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); gate = !gate; } }}>
      <div class="st">GATE</div><div class="v">{gate ? 1 : 0}</div>
    </div>
    <div class="tube">
      <div class="lead"><div class="node live"></div><small>in</small></div>
      <div class="wire live"></div>
      <div class="gate-sym" class:open={gate}><div class="ctrl"></div><div class="body">{gate ? 'on' : 'off'}</div></div>
      <div class="wire" class:live={gate}></div>
      <div class="lead"><div class="node" class:live={gate}></div><small>out</small></div>
    </div>
  </div>
</div>
