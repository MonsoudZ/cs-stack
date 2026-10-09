<script>
  import { useStepper } from '../lib/stepper.svelte.js';
  import { buildLex } from '../lib/widgets.js';
  import Stepper from './Stepper.svelte';
  const DEFAULT = '3 + 4 * 2';
  let source = $state(DEFAULT);
  const stepper = useStepper(() => buildLex({ source }), { speed: 750 });
  const { idx, version } = stepper;
  let s = $derived(($version, stepper.all()[$idx]));
  let chars = $derived(s.source.split(''));
  // Keep the input to the toy lexer's alphabet (digits, letters, + − * / ( ) and
  // spaces) so every character maps to a token the widget can colour.
  function onInput(e) {
    const clean = e.currentTarget.value.replace(/[^0-9a-zA-Z+\-*/() ]/g, '').slice(0, 16);
    if (clean !== e.currentTarget.value) e.currentTarget.value = clean;
    source = clean.length ? clean : DEFAULT;
    stepper.rebuild(() => buildLex({ source }));
  }
</script>
<div class="widget">
  <div class="csbar">
    <span class="csmini">source text → token stream</span>
    <span class="spacer"></span>
    <label class="cspick">type an expression <input type="text" class="csinput lex-input" value={source} maxlength="16" spellcheck="false" autocomplete="off" aria-label="expression to tokenize" oninput={onInput} /></label>
  </div>
  <div class="w-label">step the scanner — characters group into tokens, whitespace falls away</div>
  <div class="lex-src">{#each chars as c, i}<span class="lex-ch" class:on={i === s.pos}>{c === ' ' ? '·' : c}</span>{/each}</div>
  <div class="lex-tokens">
    {#if s.tokens.length}{#each s.tokens as t}<span class="lex-tok tok-{t.type}"><span class="lex-ty">{t.type}</span><b>{t.text}</b></span>{/each}
    {:else}<span class="csmini">no tokens yet</span>{/if}
  </div>
  <div class="csnote" role="status" aria-live="polite">{s.note}</div>
  <Stepper {stepper} />
</div>

<style>
  .lex-input{width:150px}
  .lex-src{display:flex;gap:4px;flex-wrap:wrap;font-family:var(--mono);font-size:26px;justify-content:center;margin-bottom:18px}
  .lex-ch{width:32px;height:42px;display:flex;align-items:center;justify-content:center;border-radius:8px;color:var(--dim);transition:.12s}
  .lex-ch.on{background:var(--blue-d);color:var(--blue);box-shadow:inset 0 0 0 1px var(--blue)}
  .lex-tokens{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;min-height:46px;margin-bottom:6px}
  .lex-tok{display:flex;flex-direction:column;align-items:center;gap:2px;border:1px solid var(--border);border-radius:9px;padding:7px 12px;
    background:var(--surface);font-family:var(--mono);animation:framein .2s ease}
  .lex-ty{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint)}
  .lex-tok b{font-size:18px;color:var(--ink)}
  .tok-num{border-color:var(--amber)} .tok-num .lex-ty,.tok-num b{color:var(--amber)}
  .tok-plus,.tok-star,.tok-minus,.tok-slash{border-color:var(--blue)} :is(.tok-plus,.tok-star,.tok-minus,.tok-slash) :is(.lex-ty,b){color:var(--blue)}
  .tok-ident{border-color:var(--violet)} .tok-ident :is(.lex-ty,b){color:var(--violet)}
  .tok-paren{border-color:var(--signal)} .tok-paren :is(.lex-ty,b){color:var(--signal)}
</style>
