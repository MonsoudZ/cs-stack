<script>
  let { stepper, stepLabel = 'STEP ▸' } = $props();
  let idx = $derived(stepper.idx);
  let autoOn = $derived(stepper.autoOn);
  let last = $derived($idx >= stepper.all().length - 1);
</script>
<div class="cpu-ctrl">
  <button type="button" class="btn" onclick={() => stepper.stepOrRestart()}>{last ? 'RESTART ↺' : stepLabel}</button>
  <button type="button" class="btn" onclick={() => stepper.toggleAuto()}>{$autoOn ? 'STOP ◼' : 'AUTO ▸▸'}</button>
  <button type="button" class="btn" onclick={() => stepper.reset()}>RESET ↺</button>
</div>
