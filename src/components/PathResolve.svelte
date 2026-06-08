<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildPathResolve } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = useStepper(() => buildPathResolve(), { speed: 1100 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
</script>
<div class="widget">
  <div class="csbar">
    <span class="csmini">opening a file · path → inode → blocks</span>
    <span class="spacer"></span>
    {#if s.inode != null}<span class="csmini pr-inode">at inode {s.inode}</span>{/if}
  </div>
  <div class="w-label">step the lookup — each directory maps a name to the next inode</div>
  <div class="pr-path">
    <span class="pr-seg root">/</span>
    {#each s.segs as seg, i}
      <span class="pr-seg" class:on={s.want === seg || (s.resolved && i === s.segs.length - 1)}>{seg}</span>{#if i < s.segs.length - 1}<span class="pr-sep">/</span>{/if}
    {/each}
  </div>
  <div class="pr-node">
    {#if s.entries}
      <div class="pr-lab">inode {s.inode} · directory</div>
      <div class="pr-entries">
        {#each Object.entries(s.entries) as [name, ino]}
          <div class="pr-entry" class:hit={name === s.want}>{name} <span class="pr-arrow">→ inode {ino}</span></div>
        {/each}
      </div>
    {:else if s.blocks}
      <div class="pr-lab">inode {s.inode} · file</div>
      <div class="pr-blocks">
        {#each s.blocks as blk}<span class="pr-block">block {blk}</span>{/each}
      </div>
      <div class="pr-blocks-note">the bytes are scattered across these blocks — the inode gathers them</div>
    {:else}
      <div class="pr-lab pr-faint">the path is just a chain of directory lookups…</div>
    {/if}
  </div>
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .pr-inode{color:var(--blue)}
  .pr-path{font-family:var(--mono);font-size:18px;text-align:center;margin-bottom:16px;color:var(--dim)}
  .pr-seg{padding:2px 4px;border-radius:5px}
  .pr-seg.root{color:var(--faint)}
  .pr-seg.on{color:var(--signal);background:var(--signal-d);font-weight:700}
  .pr-sep{color:var(--faint)}
  .pr-node{border:1px solid var(--border);border-radius:12px;padding:14px;background:var(--surface);min-height:96px;font-family:var(--mono)}
  .pr-lab{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin-bottom:10px}
  .pr-lab.pr-faint{text-transform:none;letter-spacing:0;color:var(--faint);font-size:13px}
  .pr-entries{display:flex;flex-direction:column;gap:6px}
  .pr-entry{font-size:14px;color:var(--dim);padding:6px 10px;border-radius:7px;border:1px solid transparent}
  .pr-entry.hit{border-color:var(--signal);color:var(--signal);background:var(--signal-d)}
  .pr-arrow{color:var(--faint)}
  .pr-entry.hit .pr-arrow{color:var(--signal)}
  .pr-blocks{display:flex;gap:8px;flex-wrap:wrap}
  .pr-block{border:1px solid var(--blue);color:var(--blue);background:var(--blue-d);border-radius:8px;padding:6px 12px;font-weight:700;font-size:13px}
  .pr-blocks-note{margin-top:10px;font-size:12px;color:var(--faint)}
</style>
