<script>
  let bits = $state([0,0,0,0,0,0,0,0]);
  let val = $derived(bits.reduce((s,b,i) => s + (b ? 128 >> i : 0), 0));
  let hex = $derived('0x' + val.toString(16).toUpperCase().padStart(2,'0'));
</script>
<div class="widget">
  <div class="w-label">flip bits — the number reads itself</div>
  <div class="bits">
    {#each bits as b, i}
      <div class="bit" class:set={b} role="button" tabindex="0"
           onclick={() => bits[i] = b ? 0 : 1}
           onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') bits[i] = b ? 0 : 1; }}>
        <div class="cell">{b}</div><div class="pv">{128 >> i}</div>
      </div>
    {/each}
  </div>
  <div class="readout">
    <div class="ro"><div class="k">decimal</div><div class="val">{val}</div></div>
    <div class="ro"><div class="k">hex</div><div class="val teal">{hex}</div></div>
    <div class="ro"><div class="k">binary</div><div class="val violet" style="font-size:20px">{bits.join('')}</div></div>
  </div>
</div>
