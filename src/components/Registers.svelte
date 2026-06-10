<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildRegisters } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = useStepper(() => buildRegisters(), { speed: 1200 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
  // register pressure per line = live, non-spilled values covering that column
  let cols = $derived(Array.from({ length: s.cols }, (_, i) => i + 1));
  let pressure = $derived(cols.map((c) => s.values.filter((v) => !v.spilled && c >= v.from && c <= v.to).length));
  function cellClass(v, c) {
    if (c < v.from || c > v.to) return 'off';
    if (v.spilled) return 'spill';
    return v.reg ? 'r' + v.reg.slice(1) : 'unassigned';
  }
</script>
<div class="widget">
  <div class="csbar"><span class="csmini">SSA values competing for {s.regCount} registers — one will spill</span></div>
  <div class="w-label">step the allocator — rename to SSA, find live ranges, then fit them into registers</div>
  <div class="reg">
    <div class="reg-prog">
      {#each s.program as line, i}
        <div class="reg-line" class:hl={line.hl}><span class="reg-ln">{i + 1}</span>{line.text}</div>
      {/each}
    </div>
    <div class="reg-grid">
      <div class="reg-head">
        <span class="reg-corner"></span>
        {#each cols as c}<span class="reg-col">{c}</span>{/each}
        <span class="reg-slot">reg</span>
      </div>
      {#if s.values.length === 0}
        <div class="reg-empty">step to rename into SSA…</div>
      {:else}
        {#each s.values as v}
          <div class="reg-row" class:nofit={v.nofit}>
            <span class="reg-name">{v.name}</span>
            {#each cols as c}<span class="reg-cell {cellClass(v, c)}"></span>{/each}
            <span class="reg-badge {v.spilled ? 'b-spill' : v.reg ? 'b-' + v.reg.slice(1) : v.nofit ? 'b-none' : 'b-idle'}">
              {v.spilled ? 'stack' : v.reg ? v.reg : v.nofit ? '✗' : '—'}
            </span>
          </div>
        {/each}
        {#if s.showPressure}
          <div class="reg-row reg-pressure">
            <span class="reg-name">live</span>
            {#each cols as c, i}<span class="reg-cell count" class:over={pressure[i] > s.regCount}>{pressure[i]}</span>{/each}
            <span class="reg-badge b-idle">/{s.regCount}</span>
          </div>
        {/if}
      {/if}
    </div>
  </div>
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .reg{display:grid;grid-template-columns:0.9fr 1.1fr;gap:18px;margin-top:6px}
  @media(max-width:640px){.reg{grid-template-columns:1fr}}
  .reg-prog{font-family:var(--mono);font-size:13px;border:1px solid var(--border);border-radius:12px;overflow:hidden;background:var(--surface);height:fit-content}
  .reg-line{display:flex;gap:10px;padding:8px 12px;border-bottom:1px solid var(--border);color:var(--text)}
  .reg-line:last-child{border-bottom:none}
  .reg-line.hl{background:var(--violet-d);color:var(--violet)}
  .reg-ln{color:var(--faint);min-width:14px;text-align:right}
  .reg-grid{font-family:var(--mono);font-size:13px;display:flex;flex-direction:column;gap:6px}
  .reg-head,.reg-row{display:grid;grid-template-columns:28px repeat(5,1fr) 46px;gap:5px;align-items:center}
  .reg-col,.reg-corner,.reg-slot{font-size:11px;color:var(--faint);text-align:center}
  .reg-slot{text-align:right}
  .reg-name{color:var(--dim);font-size:12px}
  .reg-cell{height:22px;border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700}
  .reg-cell.off{background:transparent;border:1px dashed var(--border)}
  .reg-cell.unassigned{background:var(--amber-d);border:1px solid var(--amber)}
  .reg-cell.r0{background:var(--blue-d);border:1px solid var(--blue)}
  .reg-cell.r1{background:var(--violet-d);border:1px solid var(--violet)}
  .reg-cell.spill{background:repeating-linear-gradient(45deg,var(--surface),var(--surface) 3px,rgba(255,107,107,.35) 3px,rgba(255,107,107,.35) 6px);border:1px solid var(--red)}
  .reg-row.nofit .reg-name{color:var(--red)}
  .reg-row.nofit .reg-cell.unassigned{border-color:var(--red);background:rgba(255,107,107,.12);animation:framein .2s ease}
  .reg-badge{font-size:11px;font-weight:700;text-align:center;border-radius:6px;padding:2px 4px;border:1px solid var(--border);color:var(--faint)}
  .reg-badge.b-0{color:var(--blue);border-color:var(--blue);background:var(--blue-d)}
  .reg-badge.b-1{color:var(--violet);border-color:var(--violet);background:var(--violet-d)}
  .reg-badge.b-spill{color:var(--red);border-color:var(--red)}
  .reg-badge.b-none{color:var(--red);border-color:var(--red)}
  .reg-pressure{margin-top:4px;border-top:1px solid var(--border);padding-top:8px}
  .reg-cell.count{background:var(--surface);border:1px solid var(--border);color:var(--dim)}
  .reg-cell.count.over{background:rgba(255,107,107,.12);border-color:var(--red);color:var(--red)}
  .reg-empty{font-size:13px;color:var(--faint);padding:8px 0}
</style>
