<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildDiffieHellman } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = useStepper(() => buildDiffieHellman(), { speed: 1100 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
  let agreed = $derived(s.alice.shared !== '?' && s.alice.shared === s.bob.shared);
</script>
<div class="widget">
  <div class="csbar"><span class="csmini">agreeing on a secret over a public wire — never sending it</span></div>
  <div class="w-label">step the exchange — each side computes the same shared secret from its own private number</div>
  <div class="dh">
    <div class="dh-party">
      <div class="dh-name">Alice</div>
      <div class="dh-field"><span>secret</span><b class="dh-secret">{s.alice.secret}</b></div>
      <div class="dh-field"><span>public</span><b>{s.alice.pub}</b></div>
      <div class="dh-field"><span>shared</span><b class="dh-shared" class:on={agreed}>{s.alice.shared}</b></div>
    </div>
    <div class="dh-wire">
      <div class="dh-wire-lab">public wire</div>
      <div class="dh-wire-val">{s.wire || '—'}</div>
    </div>
    <div class="dh-party">
      <div class="dh-name">Bob</div>
      <div class="dh-field"><span>secret</span><b class="dh-secret">{s.bob.secret}</b></div>
      <div class="dh-field"><span>public</span><b>{s.bob.pub}</b></div>
      <div class="dh-field"><span>shared</span><b class="dh-shared" class:on={agreed}>{s.bob.shared}</b></div>
    </div>
  </div>
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .dh{display:grid;grid-template-columns:1fr auto 1fr;gap:16px;align-items:center;font-family:var(--mono);margin-top:4px}
  @media(max-width:620px){.dh{grid-template-columns:1fr;gap:12px}}
  .dh-party{border:1px solid var(--border);border-radius:14px;padding:14px 16px;background:var(--surface)}
  .dh-name{font-size:14px;font-weight:700;color:var(--blue);margin-bottom:10px;text-align:center}
  .dh-field{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:5px 0;border-top:1px solid var(--border)}
  .dh-field:first-of-type{border-top:none}
  .dh-field span{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--faint)}
  .dh-field b{font-size:18px;color:var(--ink)}
  .dh-secret{color:var(--violet)}
  .dh-shared.on{color:var(--signal)}
  .dh-wire{display:flex;flex-direction:column;align-items:center;gap:5px;min-width:96px}
  .dh-wire-lab{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint)}
  .dh-wire-val{font-size:14px;font-weight:700;color:var(--amber);border:1px dashed var(--border);border-radius:9px;padding:8px 12px;text-align:center;min-width:70px}
</style>
