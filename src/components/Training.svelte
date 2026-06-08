<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildTraining } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = useStepper(() => buildTraining(), { speed: 1400 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
</script>
<div class="widget">
  <div class="csbar">
    <span class="csmini">same model, same prompt, three training phases</span>
    <span class="spacer"></span>
    <span class="csmini tr-phase">{s.phase}</span>
  </div>
  <div class="w-label">step the phases — watch an autocompleter become an assistant</div>
  <div class="tr-prompt">prompt: <b>{s.prompt}</b></div>
  <div class="tr-card">
    <div class="tr-meta">
      <span class="tr-k">trained on</span><span class="tr-v">{s.data}</span>
      <span class="tr-k">behaviour</span><span class="tr-v">{s.behavior}</span>
    </div>
    {#if s.reply}<div class="tr-reply">{s.reply}</div>{/if}
  </div>
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .tr-phase{color:var(--violet)}
  .tr-prompt{font-family:var(--mono);font-size:13px;color:var(--dim);text-align:center;margin-bottom:14px}
  .tr-prompt b{color:var(--ink)}
  .tr-card{border:1px solid var(--border);border-radius:12px;padding:14px 16px;background:var(--surface)}
  .tr-meta{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;font-family:var(--mono);font-size:12px;margin-bottom:10px}
  .tr-k{color:var(--faint);text-transform:uppercase;letter-spacing:.06em}
  .tr-v{color:var(--dim)}
  .tr-reply{border-top:1px solid var(--border);padding-top:10px;font-size:14px;color:var(--ink);line-height:1.5}
</style>
