<script>
  import { decodeMiniFloat } from '../lib/widgets.js';
  // a toy 8-bit float: 1 sign · 4 exponent (bias 7) · 3 mantissa. Default = 1.5
  let bits = $state([0, 0, 1, 1, 1, 1, 0, 0]);
  let dec = $derived(decodeMiniFloat(bits));

  const FIELDS = [
    { name: 'sign', cls: 'f-sign', idx: [0] },
    { name: 'exponent · bias 7', cls: 'f-exp', idx: [1, 2, 3, 4] },
    { name: 'mantissa', cls: 'f-man', idx: [5, 6, 7] },
  ];
  const PLACE = ['±', '8', '4', '2', '1', '½', '¼', '⅛'];

  const fmt = (v) => {
    if (Number.isNaN(v)) return 'NaN';
    if (!Number.isFinite(v)) return v > 0 ? '+∞' : '−∞';
    if (v === 0) return '0';
    return String(Math.round(v * 1e6) / 1e6);
  };
  const toBits = (n) => Array.from({ length: 8 }, (_, i) => (n >> (7 - i)) & 1);
  let code = $derived(bits.reduce((a, b) => (a << 1) | b, 0));
  // distance to the next representable value — it doubles each octave (the "lie")
  let gap = $derived.by(() => {
    if (code >= 255) return null;
    const next = decodeMiniFloat(toBits(code + 1)).value;
    return Number.isFinite(next) && Number.isFinite(dec.value) ? Math.abs(next - dec.value) : null;
  });
  let formula = $derived.by(() => {
    if (dec.kind === 'inf') return 'exponent all 1s, mantissa 0 → infinity';
    if (dec.kind === 'nan') return 'exponent all 1s, mantissa ≠ 0 → not a number';
    const lead = dec.kind === 'subnormal' ? '0.' : '1.';
    return (dec.sign ? '−' : '+') + lead + bits.slice(5).join('') + ' × 2^' + dec.exp;
  });
</script>
<div class="widget">
  <div class="w-label">flip the bits — a real number appears, and so do the gaps between them</div>
  <div class="floatbits">
    {#each FIELDS as field}
      <div class="ffield {field.cls}">
        <div class="frow">
          {#each field.idx as i}
            <button type="button" class="fbit" class:set={bits[i]} aria-pressed={!!bits[i]}
                    onclick={() => bits[i] = bits[i] ? 0 : 1}>
              <span class="fb">{bits[i]}</span><span class="fp">{PLACE[i]}</span><span class="sr-only">{field.name.split(' ')[0]} bit, place {PLACE[i]}, {bits[i] ? 'on' : 'off'}</span>
            </button>
          {/each}
        </div>
        <div class="flab">{field.name}</div>
      </div>
    {/each}
  </div>
  <div class="floatout">
    <div class="ro"><div class="k">value</div><div class="val">{fmt(dec.value)} <span class="fkind">{dec.kind}</span></div></div>
    <div class="ro"><div class="k">decode</div><div class="formula">{formula}</div></div>
    {#if gap != null}<div class="ro"><div class="k">gap to next</div><div class="formula gapval">{fmt(gap)}</div></div>{/if}
  </div>
</div>

<style>
  .floatbits{display:flex;gap:16px;flex-wrap:wrap;justify-content:center;font-family:var(--mono)}
  .ffield{display:flex;flex-direction:column;align-items:center;gap:8px}
  .frow{display:flex;gap:6px}
  .fbit{display:flex;flex-direction:column;align-items:center;gap:4px;border:0;background:none;padding:0;cursor:pointer;font-family:inherit}
  .fbit .fb{width:44px;height:50px;border:1px solid var(--border);border-radius:9px;display:flex;align-items:center;justify-content:center;
    font-size:20px;font-weight:700;color:var(--faint);background:var(--panel2);transition:.15s}
  .fbit .fp{font-size:11px;color:var(--faint)}
  .f-sign .fbit.set .fb{border-color:var(--violet);color:var(--violet);background:var(--violet-d)}
  .f-exp .fbit.set .fb{border-color:var(--blue);color:var(--blue);background:var(--blue-d)}
  .f-man .fbit.set .fb{border-color:var(--signal);color:var(--signal);background:var(--signal-d)}
  .flab{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint)}
  .f-sign .flab{color:var(--violet)} .f-exp .flab{color:var(--blue)} .f-man .flab{color:var(--signal)}
  .floatout{display:flex;gap:28px;flex-wrap:wrap;justify-content:center;margin-top:22px;font-family:var(--mono)}
  .floatout .val{font-size:26px;font-weight:700;color:var(--amber)}
  .fkind{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--faint);font-weight:400}
  .formula{font-size:14px;color:var(--ink);margin-top:4px}
  .gapval{color:var(--amber)}
</style>
