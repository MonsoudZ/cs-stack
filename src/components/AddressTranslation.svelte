<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildAddressTranslation } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const stepper = useStepper(() => buildAddressTranslation(), { speed: 1000 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
</script>
<div class="widget">
  <div class="csbar"><span class="csmini">virtual → physical · page size 16</span></div>
  <div class="w-label">step a translation — a virtual address becomes physical via the TLB or a page-table walk</div>
  <div class="vmt">
    <div class="vmt-addr">
      <span class="vmt-lab">virtual address {s.vaddr ?? ''}</span>
      <div class="vmt-parts">
        <span class="vmt-part" class:on={s.page != null}>page {s.page ?? '–'}</span>
        <span class="vmt-part" class:on={s.offset != null}>offset {s.offset ?? '–'}</span>
      </div>
    </div>
    <div class="vmt-tables">
      <div class="vmt-tbl">
        <div class="vmt-lab">TLB · translation cache</div>
        {#if s.tlb && Object.keys(s.tlb).length}
          {#each Object.entries(s.tlb) as [pg, fr]}<div class="vmt-row" class:on={s.tlbHit && +pg === s.page}>page {pg} → frame {fr}</div>{/each}
        {:else}<div class="vmt-empty">empty</div>{/if}
      </div>
      <div class="vmt-tbl">
        <div class="vmt-lab">page table</div>
        {#each Object.entries(s.table) as [pg, fr]}<div class="vmt-row" class:on={!s.tlbHit && +pg === s.page && s.frame != null}>page {pg} → frame {fr}</div>{/each}
      </div>
    </div>
    <div class="vmt-phys" class:show={s.phys != null}>{s.phys != null ? 'physical address = ' + s.phys : 'translating…'}</div>
  </div>
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .vmt{display:flex;flex-direction:column;gap:14px;font-family:var(--mono)}
  .vmt-addr{text-align:center}
  .vmt-lab{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint)}
  .vmt-parts{display:flex;gap:8px;justify-content:center;margin-top:8px}
  .vmt-part{border:1px solid var(--border);border-radius:9px;padding:8px 16px;font-size:15px;font-weight:700;color:var(--dim);background:var(--surface);transition:.18s}
  .vmt-part.on{border-color:var(--blue);color:var(--blue);background:var(--blue-d)}
  .vmt-tables{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  @media(max-width:520px){.vmt-tables{grid-template-columns:1fr}}
  .vmt-tbl{border:1px solid var(--border);border-radius:12px;padding:12px;background:var(--surface)}
  .vmt-row{font-size:13px;color:var(--dim);padding:5px 8px;border-radius:7px;margin-top:4px}
  .vmt-row.on{background:var(--signal-d);color:var(--signal)}
  .vmt-empty{font-size:12px;color:var(--faint);padding:5px 8px}
  .vmt-phys{font-family:var(--mono);font-size:16px;font-weight:700;color:var(--faint);text-align:center;min-height:22px}
  .vmt-phys.show{color:var(--signal)}
</style>
