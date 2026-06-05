<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildDns } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = useStepper(() => buildDns(), { speed: 1100 });
  const { idx } = stepper;
  let steps = $derived(stepper.all());
  let i = $derived($idx);
  let s = $derived(steps[i]);
</script>
<div class="widget">
  <div class="csbar"><span class="csmini">resolving thestack.dev → an IP address</span></div>
  <div class="w-label">step the lookup — the resolver walks down the name hierarchy until something answers</div>
  <div class="dnswalk">
    {#each steps.slice(0, i + 1) as st, k}
      <div class="dns-row" class:active={k === i} aria-current={k === i ? 'true' : undefined}>
        <span class="dns-server">{st.server}</span>
        <span class="dns-kind dns-{st.kind}">{st.kind}</span>
        {#if st.answer}<span class="dns-ans">{st.answer}</span>{/if}
      </div>
    {/each}
  </div>
  <div class="csnote csnote-blue" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .dnswalk{display:flex;flex-direction:column;gap:7px;font-family:var(--mono);min-height:60px;margin-bottom:6px}
  .dns-row{display:flex;align-items:center;gap:10px;border:1px solid var(--border);border-radius:10px;padding:10px 13px;
    background:var(--surface);animation:framein .2s ease}
  .dns-row.active{border-color:var(--blue);box-shadow:0 0 14px var(--blue-d)}
  .dns-server{font-size:13px;color:var(--ink);font-weight:700;min-width:104px}
  .dns-kind{font-size:10px;letter-spacing:.1em;text-transform:uppercase;border:1px solid var(--border);border-radius:6px;padding:2px 8px;color:var(--faint)}
  .dns-referral{border-color:var(--amber);color:var(--amber)}
  .dns-answer{border-color:var(--signal);color:var(--signal)}
  .dns-cache{border-color:var(--violet);color:var(--violet)}
  .dns-ans{font-size:13px;color:var(--signal);margin-left:auto;font-weight:700}
</style>
