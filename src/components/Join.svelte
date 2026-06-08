<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildJoin, JOIN_USERS, JOIN_ORDERS } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = useStepper(() => buildJoin(), { speed: 900 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
</script>
<div class="widget">
  <div class="csbar">
    <span class="csmini">users ⋈ orders · inner join on user_id</span>
    <span class="spacer"></span>
    <span class="csmini jn-cmp">{s.comparisons} comparisons</span>
  </div>
  <div class="w-label">step the nested loop — each user is checked against every order</div>
  <div class="jn-tables">
    <table class="jn-tbl">
      <caption>users</caption>
      <thead><tr><th scope="col">id</th><th scope="col">name</th></tr></thead>
      <tbody>
        {#each JOIN_USERS as u}<tr class:on={u.id === s.left}><td>{u.id}</td><td>{u.name}</td></tr>{/each}
      </tbody>
    </table>
    <table class="jn-tbl">
      <caption>orders</caption>
      <thead><tr><th scope="col">id</th><th scope="col">user_id</th><th scope="col">item</th></tr></thead>
      <tbody>
        {#each JOIN_ORDERS as o}<tr class:on={o.id === s.right} class:hit={o.id === s.right && s.match}><td>{o.id}</td><td>{o.user_id}</td><td>{o.item}</td></tr>{/each}
      </tbody>
    </table>
  </div>
  <div class="jn-result">
    <div class="jn-rlab">result {s.result.length ? '· ' + s.result.length + ' rows' : ''}</div>
    {#if s.result.length}
      <table class="jn-tbl out">
        <thead><tr><th scope="col">name</th><th scope="col">item</th></tr></thead>
        <tbody>{#each s.result as r}<tr><td>{r.name}</td><td>{r.item}</td></tr>{/each}</tbody>
      </table>
    {:else}<div class="jn-empty">no rows yet</div>{/if}
  </div>
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .jn-cmp{color:var(--amber)}
  .jn-tables{display:flex;gap:16px;flex-wrap:wrap;font-family:var(--mono)}
  .jn-tbl{border-collapse:collapse;font-size:13px}
  .jn-tbl caption{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--faint);text-align:left;margin-bottom:6px}
  .jn-tbl th,.jn-tbl td{border:1px solid var(--border);padding:5px 12px;text-align:left;color:var(--dim)}
  .jn-tbl thead th{font-size:11px;color:var(--faint);font-weight:600}
  .jn-tbl tbody tr.on td{background:var(--blue-d);border-color:var(--blue);color:var(--blue)}
  .jn-tbl tbody tr.hit td{background:var(--signal-d);border-color:var(--signal);color:var(--signal);font-weight:700}
  .jn-result{margin-top:16px}
  .jn-rlab{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin-bottom:6px}
  .jn-tbl.out th,.jn-tbl.out td{border-color:var(--signal)}
  .jn-tbl.out td{color:var(--ink)}
  .jn-empty{font-family:var(--mono);font-size:13px;color:var(--faint)}
</style>
