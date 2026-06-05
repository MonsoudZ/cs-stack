<script>
  import { toyHash } from '../lib/widgets.js';
  let text = $state('hello');
  // a "twin" input one character apart, to show how far the hashes diverge
  let twin = $derived(text.length ? text.slice(0, -1) + String.fromCharCode(text.charCodeAt(text.length - 1) + 1) : 'x');
  const bits = (hex) => { const n = parseInt(hex, 16) >>> 0; return Array.from({ length: 32 }, (_, i) => (n >>> (31 - i)) & 1); };
  let hashA = $derived(toyHash(text));
  let hashB = $derived(toyHash(twin));
  let bitsA = $derived(bits(hashA));
  let bitsB = $derived(bits(hashB));
  let diff = $derived(bitsA.reduce((c, b, i) => c + (b !== bitsB[i] ? 1 : 0), 0));
</script>
<div class="widget">
  <div class="w-label">type anything — the hash is a fixed-size fingerprint; change one character and watch it scramble</div>
  <div class="hash-in">
    <label for="hashtext">input</label>
    <input id="hashtext" type="text" bind:value={text} maxlength="24" autocomplete="off" spellcheck="false" />
  </div>
  <div class="hash-rows">
    <div class="hash-row">
      <span class="hash-lab">“{text}”</span><span class="hash-hex">{hashA}</span>
      <span class="hash-bits">{#each bitsA as b}<span class="hbit" class:on={b}></span>{/each}</span>
    </div>
    <div class="hash-row">
      <span class="hash-lab">“{twin}”</span><span class="hash-hex">{hashB}</span>
      <span class="hash-bits">{#each bitsB as b, i}<span class="hbit" class:on={b} class:diff={b !== bitsA[i]}></span>{/each}</span>
    </div>
  </div>
  <div class="csnote" role="status" aria-live="polite">one character apart, yet <b>{diff} of 32</b> hash bits differ — the avalanche effect. A tiny change scrambles the whole output, and you can't run it backwards to recover the input.</div>
</div>

<style>
  .hash-in{display:flex;align-items:center;gap:10px;font-family:var(--mono);margin-bottom:18px}
  .hash-in label{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--faint)}
  .hash-in input{font-family:var(--mono);font-size:16px;color:var(--ink);background:var(--surface);border:1px solid var(--border);
    border-radius:9px;padding:9px 13px;min-width:200px}
  .hash-rows{display:flex;flex-direction:column;gap:12px}
  .hash-row{display:flex;align-items:center;gap:14px;flex-wrap:wrap;font-family:var(--mono)}
  .hash-lab{min-width:90px;color:var(--dim);font-size:13px}
  .hash-hex{font-size:18px;font-weight:700;color:var(--amber);letter-spacing:.04em}
  .hash-bits{display:flex;gap:2px}
  .hbit{width:9px;height:18px;border-radius:2px;background:var(--fill);border:1px solid var(--border)}
  .hbit.on{background:var(--blue);border-color:var(--blue)}
  .hbit.diff{background:var(--red);border-color:var(--red);box-shadow:0 0 6px rgba(255,107,107,.5)}
</style>
