<script>
  let { stepper, stepLabel = 'STEP ▸' } = $props();
  const { idx, autoOn } = stepper;
  let last = $derived($idx >= stepper.all().length - 1);
</script>
<div class="cpu-ctrl">
  <button class="btn" onclick={() => stepper.stepOrRestart()}>{last ? 'RESTART ↺' : stepLabel}</button>
  <button class="btn" onclick={() => stepper.toggleAuto()}>{$autoOn ? 'STOP ◼' : 'AUTO ▸▸'}</button>
  <button class="btn" onclick={() => stepper.reset()}>RESET ↺</button>
</div>
