<script>
  import { onDestroy } from 'svelte';
  import { createStepper } from '../lib/stepper.svelte.js';
  import { METHODS, METHOD_ORDER, LNAME, LCLASS, LID, LNUM } from '../lib/traces.js';
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
  const idx = stepper.idx;
  const version = stepper.version;
  idx.set(Math.min(init.step, stepper.all().length - 1)); // restore shared step
  let M = $derived(METHODS[cur]);
  // `$version` is read so the step + count recompute when the steps array is
  // rebuilt — switching method while on step 0 leaves $idx at 0, which alone
  // would not retrigger this derived.
  let stepCount = $derived(($version, stepper.all().length));
  let s = $derived(($version, stepper.all()[$idx]));
  let copied = $state(false);
  let copyReset;
  function pick(k) { cur = k; stepper.rebuild(() => METHODS[cur].build()); }
  const rv = (r) => Array.isArray(r) ? '[' + r.join(', ') + ']' : r;
  const pickNeighbor = (delta) => {
    const i = METHOD_ORDER.indexOf(cur);
    pick(METHOD_ORDER[(i + delta + METHOD_ORDER.length) % METHOD_ORDER.length]);
  };
  const traceHref = () => {
    const p = new URLSearchParams(location.search);
    p.set('trace', cur);
    p.set('step', String($idx));
    return location.origin + location.pathname + '?' + p + location.hash;
  };

  // Keep the URL in sync so the current trace + step is always shareable.
  $effect(() => {
    const p = new URLSearchParams(location.search);
    p.set('trace', cur);
    p.set('step', String($idx));
    history.replaceState(null, '', location.pathname + '?' + p + location.hash);
  });

  function fallbackCopy(text) {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.cssText = 'position:fixed;left:-9999px;top:0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  }

  onDestroy(() => { stepper.destroy(); clearTimeout(copyReset); });

  async function copyTraceLink() {
    if (typeof window === 'undefined') return;
    let ok = false;
    const href = traceHref();
    try {
      await navigator.clipboard.writeText(href);
      ok = true;
    } catch {
      ok = fallbackCopy(href);
    }
    copied = ok;
    clearTimeout(copyReset);
    copyReset = setTimeout(() => copied = false, 1800);
  }

  // A step's `touches` are the real layers it exercises — jump to them.
  function gotoLayer(t) {
    const el = document.getElementById(LID[t] || 'L' + t);
    if (!el) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  // Only the horizontal step keys + Home/End are captured. ArrowUp/Down are
  // left alone so the page can still scroll while focus is inside the region
  // (and AT browse-mode arrows keep working); method switching stays on the
  // visible, keyboard-focusable method buttons.
  function onTraceKey(event) {
    const tag = event.target?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); stepper.move(1); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); stepper.move(-1); }
    else if (event.key === 'Home') { event.preventDefault(); stepper.setIndex(0); }
    else if (event.key === 'End') { event.preventDefault(); stepper.setIndex(stepper.all().length - 1); }
  }
</script>
<div class="widget trace-widget" role="region" tabindex="0" aria-label="Trace explorer"
     aria-keyshortcuts="ArrowLeft ArrowRight Home End" aria-describedby="trace-keys" onkeydown={onTraceKey}>
  <div class="trace-hero">
    <div>
      <div class="trace-kicker">final trace</div>
      <div class="trace-title">{METHODS[cur].name}</div>
      <p>{M.intro}</p>
    </div>
    <div class="trace-progress" aria-label="Trace progress">
      <span>{$idx + 1}</span>
      <small>of {stepCount} steps</small>
    </div>
  </div>

  <div class="trace-controls">
    <span class="csmini">choose a method</span>
    <span class="idxbtns">
      {#each METHOD_ORDER as k}<button type="button" class="btn" class:sel={cur === k} onclick={() => pick(k)}>{METHODS[k].name}</button>{/each}
    </span>
    <button type="button" class="btn trace-share" onclick={copyTraceLink} aria-label="Copy link to current trace step">
      {copied ? 'copied ✓' : 'copy current trace link'}
    </button>
  </div>

  <div class="trace-touchbar">
    <span>{M.header}</span>
    {#if s.touches.length}
      <span class="trace-tags">
        touches
        {#each s.touches as t}<button type="button" class="ttag {LCLASS[t] || ''}" onclick={() => gotoLayer(t)} title="jump to layer {LNUM[t] || String(t).padStart(2,'0')} · {LNAME[t] || ''}">{LNUM[t] || String(t).padStart(2,'0')} {LNAME[t] || ''}</button>{/each}
      </span>
    {/if}
  </div>
  <div class="trace-keys" id="trace-keys">keys: ←/→ step · Home/End jump (use the buttons above to switch method)</div>

  <div class="trace-grid">
    <div class="tracepanel trace-source">
      <div class="tplab">① source · the story you wrote</div>
      <pre class="srccode">{#each M.src as ln, i}<span class="srcline" class:on={i === s.line} aria-current={i === s.line ? 'true' : undefined}>{ln}</span>{/each}</pre>
      <div class="tvars">{#each Object.entries(s.vars) as [k, v]}<span class="tvar"><div class="k">{k}</div><div class="v">{v}</div></span>{/each}</div>
    </div>
    <div class="tracepanel trace-vm">
      <div class="tplab">② VM · source becomes operations</div>
      <div class="vmops">{#each s.vm as o}<div class="vmop">{o}</div>{/each}</div>
    </div>
    <div class="tracepanel trace-structure">
      <div class="tplab">{M.structLabel}</div>
      <Struct struct={s.struct} />
    </div>
    <div class="tracepanel trace-cpu">
      <div class="tplab">④ CPU · arithmetic on bits</div>
      {#if s.cpu}
        <div class="alu"><div class="albits">{s.cpu.label}</div><div class="aexpr">{s.cpu.expr}</div></div>
      {:else}
        <div class="alu idle"><div class="albits">— no arithmetic this step —</div></div>
      {/if}
    </div>
  </div>

  <div class="trace-status">
    <div class="traceresult" class:show={s.result != null} role="status" aria-live="polite">
      {#if s.result != null}return value: {rv(s.result)}{s.finale ? '   ✓ and back up the stack →' : ''}{:else}running…{/if}
    </div>
    <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  </div>
  <Stepper {stepper} />
</div>

<style>
  .trace-widget{border-color:rgba(91,157,255,.32);background:linear-gradient(180deg,rgba(17,29,46,.96),var(--bg2));padding:30px}
  .trace-widget::before{background:radial-gradient(620px 220px at 50% 0%,rgba(91,157,255,.24),transparent 70%)}
  .trace-hero{position:relative;z-index:1;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:20px;align-items:start;margin-bottom:18px}
  .trace-kicker{font-family:var(--mono);font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--blue);margin-bottom:6px}
  .trace-title{font-family:var(--disp);font-size:clamp(28px,4vw,44px);font-weight:800;line-height:1;color:var(--ink);letter-spacing:-.02em}
  .trace-hero p{max-width:68ch;margin:10px 0 0;color:var(--dim);font-size:14px}
  .trace-progress{font-family:var(--mono);border:1px solid var(--border);border-radius:16px;padding:12px 16px;text-align:center;background:rgba(8,11,18,.56);min-width:104px}
  .trace-progress span{display:block;font-size:34px;font-weight:800;line-height:1;color:var(--blue)}
  .trace-progress small{display:block;margin-top:4px;color:var(--faint);font-size:11px}
  .trace-controls{position:relative;z-index:1;display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px;opacity:.9}
  .trace-share{margin-left:auto;border-color:rgba(91,157,255,.55);color:var(--blue);background:var(--blue-d)}
  .trace-share:hover{color:var(--ink)}
  .trace-touchbar{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;
    border:1px solid var(--border);border-radius:13px;padding:10px 12px;background:rgba(8,11,18,.46);font-family:var(--mono);font-size:12px;color:var(--faint)}
  .trace-widget:focus-visible{outline:2px solid var(--blue);outline-offset:5px;box-shadow:0 0 0 4px rgba(91,157,255,.16)}
  .trace-keys{position:relative;z-index:1;margin-top:9px;font-family:var(--mono);font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--faint);opacity:.72}
  .trace-tags{display:inline-flex;align-items:center;gap:5px;flex-wrap:wrap;color:var(--blue)}
  .trace-grid{position:relative;z-index:1;display:grid;grid-template-columns:minmax(0,1.18fr) minmax(280px,.82fr);gap:14px;margin-top:16px}
  .trace-source{grid-row:span 2}
  .trace-structure{grid-column:1 / span 2}
  .tracepanel{border:1px solid var(--border);border-radius:15px;padding:18px 20px;margin-top:0;background:rgba(10,15,24,.86)}
  .tplab{font-family:var(--mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--blue);margin-bottom:10px}
  .srccode{font-family:var(--mono);font-size:14px;line-height:1.8;margin:0;white-space:pre;overflow-x:auto;color:var(--dim)}
  .srcline{display:block;padding:2px 10px;border-radius:7px}
  .srcline.on{background:var(--blue-d);color:var(--ink);box-shadow:inset 3px 0 0 var(--blue),0 0 18px rgba(91,157,255,.1)}
  .tvars{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px;font-family:var(--mono)}
  .tvar{border:1px solid var(--border);border-radius:7px;padding:5px 10px;background:var(--panel2)}
  .tvar .k{color:var(--faint);font-size:10px}.tvar .v{color:var(--amber);font-weight:700;font-size:14px}
  .vmops{display:flex;flex-direction:column;gap:7px;font-family:var(--mono);font-size:14px}
  .vmop{color:var(--blue);padding:7px 11px;border-left:3px solid var(--blue);background:var(--blue-d);border-radius:0 8px 8px 0}
  .alu{font-family:var(--mono);display:flex;flex-direction:column;gap:6px}
  .alu .albits{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--faint)}
  .alu .aexpr{font-size:26px;font-weight:700;color:var(--signal)}
  .alu.idle .aexpr{display:none}
  .trace-status{position:relative;z-index:1;border:1px solid var(--border);border-radius:14px;margin-top:14px;padding:12px 14px;background:rgba(8,11,18,.5)}
  .trace-status .csnote{margin-top:6px}
  .traceresult{font-family:var(--mono);font-size:15px;min-height:22px;color:var(--faint)}
  .traceresult.show{color:var(--signal);font-weight:700}
  .ttag{display:inline-block;font-family:var(--mono);font-size:10px;border:1px solid var(--border);border-radius:5px;
    padding:2px 6px;margin-left:5px;color:var(--dim);background:none;cursor:pointer;transition:.15s}
  button.ttag:hover{filter:brightness(1.35);box-shadow:0 0 8px var(--border-hot)}
  .ttag.t-num{border-color:var(--amber);color:var(--amber)}
  .ttag.t-sys{border-color:var(--blue);color:var(--blue)}
  .ttag.t-mean{border-color:var(--violet);color:var(--violet)}
  .ttag.t-phys{border-color:var(--signal);color:var(--signal)}
  .ttag.t-sec{border-color:var(--amber);color:var(--amber)}
  @media(max-width:860px){
    .trace-hero{grid-template-columns:1fr}
    .trace-progress{justify-self:start}
    .trace-grid{grid-template-columns:1fr}
    .trace-source,.trace-structure{grid-column:auto;grid-row:auto}
  }
  @media(max-width:560px){
    .trace-widget{padding:20px 14px}
    .trace-title{font-size:30px}
    .trace-share{width:100%;margin-left:0}
    .trace-progress{padding:9px 12px;min-width:88px}
    .trace-progress span{font-size:28px}
    .trace-touchbar{align-items:flex-start;flex-direction:column}
    .tracepanel{padding:15px 13px}
    .srccode{font-size:12px;line-height:1.75}
    .vmops{font-size:12px}
    .alu .aexpr{font-size:21px}
  }
</style>
