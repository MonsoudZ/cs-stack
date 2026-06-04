<script>
  import { onDestroy } from 'svelte';
  import { createStepper } from '../lib/stepper.svelte.js';
  import { simulateScheduler } from '../lib/sim.js';
  import Stepper from './Stepper.svelte';
  const sim = simulateScheduler();
  const PROCS = sim.PROCS;
  const stepper = createStepper(() => sim.steps, { speed: 600 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
  let doneIds = $derived(s.states.map((st, i) => st === 'done' ? i : -1).filter((i) => i >= 0));
  onDestroy(() => stepper.destroy());
</script>
{#snippet chip(i, sub)}
  <span class="pchip"><span class="dot proc-dot proc-{i}"></span>{PROCS[i].name}{#if sub}<span class="sub">{sub}</span>{/if}</span>
{/snippet}
<div class="widget">
  <div class="csbar"><span class="csmini">round-robin · quantum = 2 ticks · ONE cpu core · 3 processes</span></div>
  <div class="w-label">step the scheduler — watch one core fake running everything at once</div>
  <div class="sched">
    <div class="cpucore">
      {#if s.running != null}
        <div class="core proc-core proc-{s.running}">
          <div class="lab">CPU CORE</div><div class="who">{PROCS[s.running].name}</div>
        </div>
      {:else}
        <div class="core"><div class="lab">CPU CORE</div><div class="who">idle</div></div>
      {/if}
      <div class="core-note">only one process runs at any single instant →</div>
    </div>
    <div class="qrow"><div class="qlab">Ready queue</div><div class="qchips">{#if s.ready.length}{#each s.ready as i}{@render chip(i)}{/each}{:else}<span class="csmini">—</span>{/if}</div></div>
    <div class="qrow"><div class="qlab">Blocked · I/O</div><div class="qchips">{#if s.blocked.length}{#each s.blocked as b}{@render chip(b.i, 'I/O ' + b.remaining)}{/each}{:else}<span class="csmini">—</span>{/if}</div></div>
    <div class="qrow"><div class="qlab">Finished</div><div class="qchips">{#if doneIds.length}{#each doneIds as i}{@render chip(i, '✓')}{/each}{:else}<span class="csmini">—</span>{/if}</div></div>
    <div>
      <div class="csmini timeline-label">timeline — who held the CPU each tick</div>
      <div class="gantt-wrap"><div class="gantt">{#each s.timeline as c}<div class="gcell {c.proc != null ? `proc-${c.proc}` : 'idle'}"></div>{/each}</div></div>
    </div>
  </div>
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>
