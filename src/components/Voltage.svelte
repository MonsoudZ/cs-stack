<script>
  let hi = $state(false);
</script>
<div class="widget">
  <div class="w-label">tap the wire to drive it HIGH / LOW</div>
  <div class="w-row">
    <div class="tube">
      <div class="lead"><div class="node" class:live={hi}></div><small>source</small></div>
      <button type="button" class="wire" class:live={hi} aria-pressed={hi} aria-label={`wire voltage is ${hi ? 'high' : 'low'}`}
           onclick={() => hi = !hi}></button>
      <div class="lead"><div class="node" class:live={hi}></div><small>{hi ? '≈ 3.3V' : '≈ 0V'}</small></div>
    </div>
    <div class="lead">
      <div class="toggle display-toggle" class:hi><div class="st">STATE</div><div class="v">{hi ? 'HIGH' : 'LOW'}</div></div>
      <small>{hi ? '≈ 3.3 volts' : '≈ 0 volts'}</small>
    </div>
  </div>
</div>
