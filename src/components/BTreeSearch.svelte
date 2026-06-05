<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildBTreeSearch, BTREE } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = useStepper(() => buildBTreeSearch({ target: 10 }), { speed: 950 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
  const leaves = ['n0', 'n1', 'n2', 'n3'];
</script>
<div class="widget">
  <div class="csbar"><span class="csmini">an index on the key column · finding the row with key 10</span></div>
  <div class="w-label">step the lookup — descend the tree instead of scanning all 15 rows</div>
  <div class="btree">
    <div class="bt-row">
      <div class="bt-node" class:on={s.current === 'root'} class:path={s.path.includes('root')}>
        {#each BTREE.root.keys as k}<span class="bt-key">{k}</span>{/each}
      </div>
    </div>
    <div class="bt-row bt-leaves">
      {#each leaves as id}
        <div class="bt-node" class:on={s.current === id} class:path={s.path.includes(id)} aria-current={s.current === id ? 'true' : undefined}>
          {#each BTREE[id].keys as k}<span class="bt-key" class:found={s.found && s.foundKey === k && s.current === id}>{k}</span>{/each}
        </div>
      {/each}
    </div>
  </div>
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .btree{display:flex;flex-direction:column;align-items:center;gap:20px;font-family:var(--mono);margin-bottom:6px}
  .bt-row{display:flex;justify-content:center;gap:14px;flex-wrap:wrap}
  .bt-leaves{gap:10px}
  .bt-node{display:flex;gap:4px;border:1px solid var(--border);border-radius:10px;padding:8px 10px;background:var(--surface);transition:.18s;opacity:.55}
  .bt-node.path{opacity:1}
  .bt-node.on{border-color:var(--blue);box-shadow:0 0 16px var(--blue-d);opacity:1}
  .bt-key{min-width:24px;text-align:center;font-size:15px;font-weight:700;color:var(--dim)}
  .bt-key.found{color:var(--signal);text-shadow:0 0 12px var(--signal)}
</style>
