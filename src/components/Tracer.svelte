<script>
  import { createStepper } from '../lib/stepper.svelte.js';
  import { METHODS, METHOD_ORDER, LNAME, LCLASS } from '../lib/traces.js';
  import Stepper from './Stepper.svelte';
  import Struct from './Struct.svelte';
  // Read a shareable starting point from the URL: ?trace=bfs&step=4
  function fromUrl() {
    if (typeof window === 'undefined') return { trace: 'twosum', step: 0 };
    const p = new URLSearchParams(location.search);
    const t = p.get('trace');
    return {
      trace: t && METHODS[t] ? t : 'twosum',
      step: Math.max(0, parseInt(p.get('step') ?? '0', 10) || 0),
    };
  }
  const init = fromUrl();
  let cur = $state(init.trace);
  const stepper = createStepper(() => METHODS[cur].build(), { speed: 950 });
  const { idx } = stepper;
  idx.set(Math.min(init.step, stepper.all().length - 1)); // restore shared step
  let M = $derived(METHODS[cur]);
  let s = $derived(stepper.all()[$idx]);
  function pick(k) { cur = k; stepper.rebuild(() => METHODS[cur].build()); }
  const rv = (r) => Array.isArray(r) ? '[' + r.join(', ') + ']' : r;

  // Keep the URL in sync so the current trace + step is always shareable.
  $effect(() => {
    const p = new URLSearchParams(location.search);
    p.set('trace', cur);
    p.set('step', String($idx));
    history.replaceState(null, '', location.pathname + '?' + p + location.hash);
  });

  // A step's `touches` are the real layers it exercises — jump to them.
  function gotoLayer(t) {
    const el = document.getElementById('L' + t);
    if (!el) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }
</script>
<div class="widget">
  <div class="csbar" style="gap:8px">
    <span class="csmini">trace:</span>
    <span class="idxbtns">
      {#each METHOD_ORDER as k}<button class="btn" class:sel={cur === k} onclick={() => pick(k)}>{METHODS[k].name}</button>{/each}
    </span>
  </div>
  <p class="prose" style="margin:6px 0 0;font-size:14px">{M.intro}</p>
  <div class="csbar" style="margin-top:10px">
    <span class="csmini">{M.header}</span>
    <span style="flex:1"></span>
    <span class="csmini">
      {#if s.touches.length}touches: {#each s.touches as t}<button class="ttag {LCLASS[t] || ''}" onclick={() => gotoLayer(t)} title="jump to layer {String(t).padStart(2,'0')} · {LNAME[t] || ''}">{String(t).padStart(2,'0')} {LNAME[t] || ''}</button>{/each}{/if}
    </span>
  </div>

  <div class="tracepanel">
    <div class="tplab">① source · Ruby — the story you wrote</div>
    <pre class="srccode">{#each M.src as ln, i}<span class="srcline" class:on={i === s.line}>{ln}</span>{/each}</pre>
    <div class="tvars">{#each Object.entries(s.vars) as [k, v]}<span class="tvar"><div class="k">{k}</div><div class="v">{v}</div></span>{/each}</div>
  </div>
  <div class="tracepanel">
    <div class="tplab">② virtual machine · what the line becomes</div>
    <div class="vmops">{#each s.vm as o}<div class="vmop">{o}</div>{/each}</div>
  </div>
  <div class="tracepanel">
    <div class="tplab">{M.structLabel}</div>
    <div><Struct struct={s.struct} /></div>
  </div>
  <div class="tracepanel">
    <div class="tplab">④ CPU · the actual arithmetic on numbers (layers 03–06)</div>
    {#if s.cpu}
      <div class="alu"><div class="albits">{s.cpu.label}</div><div class="aexpr">{s.cpu.expr}</div></div>
    {:else}
      <div class="alu idle"><div class="albits">— no arithmetic this step —</div></div>
    {/if}
  </div>
  <div class="traceresult" class:show={s.result != null}>
    {#if s.result != null}return value: {rv(s.result)}{s.finale ? '   ✓ and back up the stack →' : ''}{:else}(running…){/if}
  </div>
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>
