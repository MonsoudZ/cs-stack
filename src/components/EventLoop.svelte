<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildEventLoop } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = useStepper(() => buildEventLoop(), { speed: 1100 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
  const PHASE = { idle: 'idle', task: 'running a task', 'task-done': 'task done', micro: 'draining microtasks', raf: 'rAF callbacks', render: 'rendering' };
</script>
<div class="widget">
  <div class="csbar">
    <span class="csmini">the event loop · one turn</span>
    <span class="spacer"></span>
    <span class="csmini el-phase {s.phase}">{PHASE[s.phase]}</span>
  </div>
  <div class="w-label">step one turn — a task runs, microtasks drain, then a frame renders</div>
  <div class="el-stack">
    <div class="el-lab">call stack</div>
    <div class="el-frames">
      {#each s.stack as f}<span class="el-frame">{f}</span>{/each}
      {#if s.stack.length === 0}<span class="el-empty">empty</span>{/if}
    </div>
  </div>
  <div class="el-queues">
    <div class="el-q" class:hot={s.phase === 'micro'}>
      <div class="el-lab">microtasks <small>Promises</small></div>
      {#each s.micro as m}<span class="el-item micro">{m}</span>{/each}
      {#if s.micro.length === 0}<span class="el-empty">—</span>{/if}
    </div>
    <div class="el-q" class:hot={s.phase === 'raf'}>
      <div class="el-lab">animation frame <small>rAF</small></div>
      {#each s.raf as r}<span class="el-item raf">{r}</span>{/each}
      {#if s.raf.length === 0}<span class="el-empty">—</span>{/if}
    </div>
    <div class="el-q" class:hot={s.phase === 'task'}>
      <div class="el-lab">tasks <small>setTimeout, events</small></div>
      {#each s.tasks as t}<span class="el-item task">{t}</span>{/each}
      {#if s.tasks.length === 0}<span class="el-empty">—</span>{/if}
    </div>
  </div>
  <div class="el-render" class:on={s.phase === 'render'} class:done={s.rendered}>
    {s.rendered ? '✓ frame painted: style → layout → paint → composite' : 'render: style → layout → paint → composite'}
  </div>
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .el-phase{color:var(--faint);text-transform:uppercase;letter-spacing:.06em}
  .el-phase.micro{color:var(--violet)}
  .el-phase.raf{color:var(--amber)}
  .el-phase.render{color:var(--signal)}
  .el-phase.task{color:var(--blue)}
  .el-stack{border:1px solid var(--border);border-radius:10px;padding:10px 12px;background:var(--surface);margin-bottom:12px;font-family:var(--mono)}
  .el-lab{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin-bottom:6px}
  .el-lab small{text-transform:none;letter-spacing:0;opacity:.8}
  .el-frames{display:flex;gap:6px;flex-wrap:wrap;min-height:28px;align-items:center}
  .el-frame{border:1px solid var(--blue);border-radius:7px;padding:5px 10px;color:var(--blue);background:var(--blue-d);font-weight:700;font-size:13px}
  .el-queues{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;font-family:var(--mono)}
  @media(max-width:560px){.el-queues{grid-template-columns:1fr}}
  .el-q{border:1px solid var(--border);border-radius:10px;padding:10px;background:var(--surface);min-height:74px;transition:.18s}
  .el-q.hot{border-color:var(--signal);box-shadow:0 0 12px var(--signal-d)}
  .el-item{display:inline-block;border-radius:6px;padding:4px 8px;font-size:12px;font-weight:700;margin:3px 3px 0 0}
  .el-item.micro{border:1px solid var(--violet);color:var(--violet);background:var(--violet-d)}
  .el-item.raf{border:1px solid var(--amber);color:var(--amber);background:var(--amber-d)}
  .el-item.task{border:1px solid var(--blue);color:var(--blue);background:var(--blue-d)}
  .el-empty{font-size:12px;color:var(--faint)}
  .el-render{margin-top:12px;text-align:center;font-family:var(--mono);font-size:13px;color:var(--faint);border:1px dashed var(--border);border-radius:10px;padding:10px;transition:.18s}
  .el-render.on{border-style:solid;border-color:var(--signal);color:var(--signal);background:var(--signal-d)}
  .el-render.done{border-style:solid;border-color:var(--signal);color:var(--signal)}
</style>
