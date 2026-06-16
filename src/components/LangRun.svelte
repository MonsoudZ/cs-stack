<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildLangRun, LANGS } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = useStepper(() => buildLangRun(), { speed: 1200 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
  let revealed = $derived(new Set(stepper.all().slice(0, $idx + 1).map((x) => x.active).filter(Boolean)));
  const modelLabel = { compiled: 'compiled · AOT', interpreted: 'interpreted', JIT: 'JIT' };
</script>
<div class="widget">
  <div class="csbar"><span class="csmini">source → ? → the CPU · how each language gets there</span></div>
  <div class="w-label">step through the languages — watch AOT-native, bytecode-VM, and JIT line up</div>
  <div class="lr-lanes">
    {#each LANGS as l}
      <div class="lr-lane m-{l.model}" class:shown={revealed.has(l.id)} class:active={s.active === l.id}>
        <div class="lr-id">{l.id}</div>
        <div class="lr-model">{modelLabel[l.model]}</div>
        <div class="lr-path">{revealed.has(l.id) ? l.run : '·'}</div>
      </div>
    {/each}
  </div>
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .lr-lanes{display:flex;flex-direction:column;gap:8px;font-family:var(--mono)}
  .lr-lane{display:grid;grid-template-columns:64px 130px 1fr;gap:12px;align-items:center;border:1px solid var(--border);
    border-radius:12px;padding:11px 14px;background:var(--surface);opacity:.4;transition:.18s}
  .lr-lane.shown{opacity:1}
  .lr-id{font-size:15px;font-weight:700;color:var(--ink)}
  .lr-model{font-size:11px;letter-spacing:.06em;text-transform:uppercase}
  .lr-path{font-size:13px;color:var(--dim)}
  .lr-lane.m-compiled .lr-model{color:var(--signal)}
  .lr-lane.m-interpreted .lr-model{color:var(--amber)}
  .lr-lane.m-JIT .lr-model{color:var(--violet)}
  .lr-lane.active{box-shadow:0 0 14px var(--signal-d);border-color:var(--signal)}
  .lr-lane.m-interpreted.active{box-shadow:0 0 14px var(--amber-d);border-color:var(--amber)}
  .lr-lane.m-JIT.active{box-shadow:0 0 14px var(--blue-d);border-color:var(--violet)}
  @media(max-width:560px){
    .lr-lane{grid-template-columns:48px 1fr;row-gap:2px}
    .lr-path{grid-column:1 / -1}
  }
</style>
