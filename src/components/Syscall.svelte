<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildSyscall } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = useStepper(() => buildSyscall(), { speed: 1100 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
</script>
<div class="widget">
  <div class="csbar">
    <span class="csmini">read(fd) · crossing the user/kernel boundary</span>
    <span class="spacer"></span>
    <span class="csmini sc-mode" class:kernel={s.mode === 'kernel'}>{s.mode} mode</span>
  </div>
  <div class="w-label">step a system call — control traps into the kernel and returns</div>
  <div class="sc-lanes">
    <div class="sc-lane" class:active={s.mode === 'user'}>
      <div class="sc-lane-lab">user mode <span class="sc-ring">ring 3 · no hardware access</span></div>
      <div class="sc-marker" class:on={s.mode === 'user'}>
        {#if s.mode === 'user'}● your program{/if}
      </div>
    </div>
    <div class="sc-bar" class:cross={s.switched}>
      <span>{s.switched ? '⇅ mode switch' : 'the boundary'}</span>
    </div>
    <div class="sc-lane kern" class:active={s.mode === 'kernel'}>
      <div class="sc-lane-lab">kernel mode <span class="sc-ring">ring 0 · owns the hardware</span></div>
      <div class="sc-marker" class:on={s.mode === 'kernel'} class:blocked={s.blocked}>
        {#if s.mode === 'kernel'}● {s.blocked ? 'blocked on I/O…' : 'kernel handler'}{/if}
      </div>
    </div>
  </div>
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .sc-mode{color:var(--blue)}
  .sc-mode.kernel{color:var(--red)}
  .sc-lanes{display:flex;flex-direction:column;gap:0;font-family:var(--mono)}
  .sc-lane{border:1px solid var(--border);border-radius:12px;padding:14px;background:var(--surface);opacity:.55;transition:.18s}
  .sc-lane.active{opacity:1}
  .sc-lane.kern.active{border-color:var(--red)}
  .sc-lane:not(.kern).active{border-color:var(--blue)}
  .sc-lane-lab{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint);display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px}
  .sc-ring{letter-spacing:0;text-transform:none;color:var(--faint);opacity:.8}
  .sc-marker{min-height:22px;margin-top:10px;font-size:14px;font-weight:700;color:var(--dim)}
  .sc-marker.on{color:var(--blue)}
  .sc-lane.kern .sc-marker.on{color:var(--red)}
  .sc-marker.blocked{animation:scpulse 1s ease-in-out infinite}
  @keyframes scpulse{50%{opacity:.45}}
  .sc-bar{display:flex;align-items:center;justify-content:center;height:30px;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint);position:relative}
  .sc-bar::before{content:'';position:absolute;left:8%;right:8%;top:50%;border-top:1px dashed var(--border)}
  .sc-bar span{position:relative;background:var(--bg, var(--surface));padding:0 10px}
  .sc-bar.cross span{color:var(--signal);font-weight:700}
  @media(prefers-reduced-motion:reduce){.sc-marker.blocked{animation:none}}
</style>
