<script>
  let A = $state([0,1,0,1]);
  let B = $state([0,0,1,1]);
  function compute(A, B) {
    let carry = 0, sum = [0,0,0,0], carries = [0,0,0,0];
    for (let i = 3; i >= 0; i--) { const a = A[i], b = B[i]; sum[i] = a ^ b ^ carry; const c = (a & b) | (a & carry) | (b & carry); carries[i] = carry; carry = c; }
    return { sum, carries, overflow: carry };
  }
  let r = $derived(compute(A, B));
  const dec = (arr) => arr.reduce((s, b, i) => s + (b ? 8 >> i : 0), 0);
</script>
<div class="widget">
  <div class="w-label">click A and B bits — the sum computes through carries</div>
  <div class="adder-grid">
    <div class="adlabel"><span class="tag"></span><div class="carry-row">{#each r.carries as c}<div class="carry {c ? 'on' : ''}">{c ? '1' : ''}</div>{/each}</div></div>
    <div class="adlabel"><span class="tag">A</span><div class="nybble">{#each A as v, i}<div class="nb-cell {v ? 'set' : ''}" role="button" tabindex="0" onclick={() => A[i] = v ? 0 : 1} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') A[i] = v ? 0 : 1; }}>{v}</div>{/each}</div><span class="dec">= {dec(A)}</span></div>
    <div class="adlabel"><span class="tag">+ B</span><div class="nybble">{#each B as v, i}<div class="nb-cell {v ? 'set' : ''}" role="button" tabindex="0" onclick={() => B[i] = v ? 0 : 1} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') B[i] = v ? 0 : 1; }}>{v}</div>{/each}</div><span class="dec">= {dec(B)}</span></div>
    <div class="adlabel"><span class="tag">= SUM</span><div class="nybble">
      <div class="nb-cell sum ro {r.overflow ? 'set' : ''}" style={r.overflow ? '' : 'opacity:.25'}>{r.overflow ? 1 : 0}</div>
      {#each r.sum as v}<div class="nb-cell sum ro {v ? 'set' : ''}">{v}</div>{/each}
    </div><span class="dec">= {(r.overflow ? 16 : 0) + dec(r.sum)}</span></div>
  </div>
</div>
