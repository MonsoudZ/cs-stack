<script>
  let hi = $state(false);
</script>
<div class="widget">
  <div class="w-label">tap the wire to drive it HIGH / LOW</div>
  <div class="w-row">
    <div class="tube">
      <div class="lead"><div class="node" class:live={hi}></div><small>source</small></div>
      <div class="wire" class:live={hi} style="cursor:pointer" role="button" tabindex="0"
           aria-pressed={hi} aria-label="drive the wire HIGH or LOW"
           onclick={() => hi = !hi} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hi = !hi; } }}></div>
      <div class="lead"><div class="node" class:live={hi}></div><small>{hi ? '≈ 3.3V' : '≈ 0V'}</small></div>
    </div>
    <div class="lead">
      <div class="toggle" class:hi style="cursor:default"><div class="st">STATE</div><div class="v">{hi ? 'HIGH' : 'LOW'}</div></div>
      <small>{hi ? '≈ 3.3 volts' : '≈ 0 volts'}</small>
    </div>
  </div>
</div>
