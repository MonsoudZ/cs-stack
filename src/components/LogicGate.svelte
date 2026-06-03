<script>
  const GATES = { AND:(a,b)=>a&&b, OR:(a,b)=>a||b, XOR:(a,b)=>a!==b, NAND:(a,b)=>!(a&&b), NOR:(a,b)=>!(a||b), NOT:(a)=>!a };
  const names = Object.keys(GATES);
  let cur = $state('AND');
  let A = $state(false), B = $state(false);
  let single = $derived(cur === 'NOT');
  let out = $derived(single ? GATES.NOT(A) : GATES[cur](A, B));
  let rows = $derived(single ? [[0],[1]] : [[0,0],[0,1],[1,0],[1,1]]);
  const num = (x) => x ? 1 : 0;
</script>
<div class="widget">
  <div class="w-label">pick a gate, flip the inputs</div>
  <div class="gate-pick">
    {#each names as k}
      <button class="btn" class:sel={cur === k} onclick={() => cur = k}>{k}</button>
    {/each}
  </div>
  <div class="w-row" style="gap:34px">
    <div class="lead"><div class="toggle" class:hi={A} style="cursor:pointer" role="button" tabindex="0" onclick={() => A = !A} onkeydown={(e)=>{if(e.key==='Enter'||e.key===' ')A=!A;}}><div class="st">A</div><div class="v">{num(A)}</div></div></div>
    <div class="lead" style="opacity:{single ? 0.3 : 1}"><div class="toggle" class:hi={B} style="cursor:{single?'default':'pointer'}" role="button" tabindex="0" onclick={() => { if(!single) B = !B; }} onkeydown={(e)=>{if(!single&&(e.key==='Enter'||e.key===' '))B=!B;}}><div class="st">B</div><div class="v">{num(B)}</div></div></div>
    <div class="out-lamp"><div class="lamp" class:on={out}>{num(out)}</div><small>{cur}</small></div>
    <table class="ttable"><tbody>
      <tr><th>A</th>{#if !single}<th>B</th>{/if}<th>OUT</th></tr>
      {#each rows as r}
        {@const a = !!r[0]}
        {@const b = !!r[1]}
        {@const res = single ? GATES.NOT(a) : GATES[cur](a, b)}
        <tr class:active={a === A && (single || b === B)}>
          <td>{num(a)}</td>{#if !single}<td>{num(b)}</td>{/if}<td>{num(res)}</td>
        </tr>
      {/each}
    </tbody></table>
  </div>
</div>
