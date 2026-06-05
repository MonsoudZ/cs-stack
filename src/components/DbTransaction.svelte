<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildTransaction } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  let atomic = $state(true);
  const stepper = useStepper(() => buildTransaction({ atomic }), { speed: 1000 });
  const { idx, version } = stepper;
  let s = $derived(($version, stepper.all()[$idx]));
  function toggle() { atomic = !atomic; stepper.rebuild(() => buildTransaction({ atomic })); }
</script>
<div class="widget">
  <div class="csbar">
    <span class="csmini">transfer $100: Alice → Bob, with a crash mid-way</span>
    <span class="spacer"></span>
    <button type="button" class="btn" onclick={toggle}>transaction: {atomic ? 'ON (atomic)' : 'OFF (autocommit)'}</button>
  </div>
  <div class="w-label">step the transfer — the power dies before Bob is credited</div>
  <div class="txn">
    <div class="txn-acct" class:crashed={s.crashed}><div class="txn-lab">Alice</div><div class="txn-val">{s.A}</div></div>
    <div class="txn-acct" class:crashed={s.crashed}><div class="txn-lab">Bob</div><div class="txn-val">{s.B}</div></div>
    <div class="txn-acct total" class:lost={s.lost}><div class="txn-lab">total</div><div class="txn-val">{s.total}</div></div>
  </div>
  <div class="csnote" class:txn-lost={s.lost} role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .txn{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;font-family:var(--mono);margin-top:4px}
  @media(max-width:560px){.txn{grid-template-columns:1fr}}
  .txn-acct{border:1px solid var(--border);border-radius:14px;padding:16px;background:var(--surface);text-align:center;transition:.18s}
  .txn-acct.crashed{border-color:var(--red);box-shadow:0 0 16px rgba(255,107,107,.18)}
  .txn-acct.total{border-color:var(--border-hot)}
  .txn-acct.total.lost{border-color:var(--red)}
  .txn-lab{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint)}
  .txn-val{font-size:30px;font-weight:700;color:var(--ink);margin-top:6px}
  .total .txn-val{color:var(--signal)}
  .total.lost .txn-val{color:var(--red)}
  .txn-lost{color:var(--red)!important}
</style>
