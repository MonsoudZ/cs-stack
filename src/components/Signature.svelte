<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildSignature } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = useStepper(() => buildSignature(), { speed: 1100 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
</script>
<div class="widget">
  <div class="csbar"><span class="csmini">sign with the private key · anyone verifies with the public key</span></div>
  <div class="w-label">step it — a signature proves who sent the message, and that no one altered it in transit</div>
  <div class="sig">
    <div class="sig-row"><span class="sig-k">message</span><b class="sig-msg" class:bad={s.side === 'tamper'}>{s.message}</b></div>
    <div class="sig-row"><span class="sig-k">hash</span><b>{s.hash ?? '—'}</b></div>
    <div class="sig-row"><span class="sig-k">signature</span><b class="sig-sig">{s.sig ?? '—'}</b></div>
    <div class="sig-row"><span class="sig-k">verify → recovers</span><b>{s.recovered ?? '—'}</b></div>
    {#if s.verdict}
      <div class="sig-verdict" class:valid={s.verdict === 'valid'} class:forged={s.verdict === 'forged'}>
        {s.verdict === 'valid' ? '✓ authentic — the recovered hash matches the message' : '✗ forged — the hashes disagree, signature rejected'}
      </div>
    {/if}
  </div>
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .sig{display:flex;flex-direction:column;gap:1px;font-family:var(--mono);border:1px solid var(--border);border-radius:14px;background:var(--surface);padding:6px 16px;margin-top:4px}
  .sig-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:9px 0;border-top:1px solid var(--border)}
  .sig-row:first-child{border-top:none}
  .sig-k{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--faint)}
  .sig-row b{font-size:16px;color:var(--ink);text-align:right;word-break:break-word}
  .sig-msg.bad{color:var(--red)}
  .sig-sig{color:var(--violet)}
  .sig-verdict{margin:10px 0 4px;padding:9px 12px;border-radius:10px;font-size:13px;font-weight:700;text-align:center;border:1px solid var(--border)}
  .sig-verdict.valid{color:var(--signal);border-color:var(--signal);background:var(--signal-d)}
  .sig-verdict.forged{color:var(--red);border-color:var(--red);background:var(--red-d,rgba(255,107,107,.12))}
</style>
