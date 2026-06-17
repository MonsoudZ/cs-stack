<script>
  import { quizzes } from '../data/quizzes.js';
  let { slug } = $props();
  const raw = quizzes[slug];
  // Normalize to a list of questions. A legacy single-question entry
  // ({question, options}) becomes a one-element list, so stacks that haven't
  // been given tiered quizzes yet keep working unchanged.
  const questions = Array.isArray(raw)
    ? raw
    : raw ? [{ level: 'check', question: raw.question, options: raw.options }] : [];
  const multi = questions.length > 1;

  let active = $state(0);
  let picked = $state(questions.map(() => null)); // chosen option index per question
  let q = $derived(questions[active]);
  let here = $derived(picked[active]);
  let chosen = $derived(here == null ? null : q.options[here]);

  function pick(i) {
    if (picked[active] != null) return; // lock after first answer
    picked[active] = i;
    if (q.options[i].correct) markDone();
  }
  function reset() { picked[active] = null; }
  function select(i) { active = i; }
  const solved = (i) => picked[i] != null && questions[i].options[picked[i]].correct;

  // A correct answer (on any tier) marks this lesson done in the store /learn reads.
  function markDone() {
    try {
      const KEY = 'stack:progress';
      const set = new Set(JSON.parse(localStorage.getItem(KEY)) || []);
      set.add(slug);
      localStorage.setItem(KEY, JSON.stringify([...set]));
    } catch (e) { /* storage unavailable — quiz still works */ }
  }
</script>

{#if questions.length}
  <section class="quiz" aria-label="Check your understanding">
    <div class="quiz-tag">Check your understanding</div>
    {#if multi}
      <div class="quiz-levels" role="tablist" aria-label="Difficulty">
        {#each questions as qq, i}
          <button
            type="button"
            class="quiz-level lvl-{qq.level}"
            class:on={active === i}
            class:solved={solved(i)}
            role="tab"
            aria-selected={active === i}
            onclick={() => select(i)}
          >{qq.level}{solved(i) ? ' ✓' : ''}</button>
        {/each}
      </div>
    {/if}
    <p class="quiz-q">{q.question}</p>
    <ul class="quiz-opts" role="list">
      {#each q.options as opt, i}
        <li>
          <button
            type="button"
            class="quiz-opt"
            class:correct={here != null && opt.correct}
            class:wrong={here === i && !opt.correct}
            disabled={here != null}
            aria-pressed={here === i}
            onclick={() => pick(i)}
          >
            <span class="quiz-mark" aria-hidden="true">{here != null && opt.correct ? '✓' : here === i ? '✗' : ''}</span>
            <span class="quiz-label">{opt.label}</span>
          </button>
          {#if here != null && (here === i || opt.correct)}
            <p class="quiz-why" class:ok={opt.correct}>{opt.why}</p>
          {/if}
        </li>
      {/each}
    </ul>
    <div class="quiz-foot" role="status" aria-live="polite">
      {#if here != null}
        <span class="quiz-verdict" class:ok={chosen.correct}>{chosen.correct ? '✓ Correct — lesson marked done on your path.' : '✗ Not quite — see the highlighted answer.'}</span>
        <button type="button" class="quiz-reset" onclick={reset}>try again</button>
      {/if}
    </div>
  </section>
{/if}

<style>
  .quiz{max-width:680px;margin:40px auto 0;border:1px solid var(--border);border-radius:16px;padding:22px 24px;background:var(--surface)}
  .quiz-tag{font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--signal);margin-bottom:10px}
  .quiz-levels{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap}
  .quiz-level{font-family:var(--mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--faint);
    border:1px solid var(--border);border-radius:999px;padding:6px 13px;background:var(--bg);cursor:pointer;transition:.15s}
  .quiz-level:hover{color:var(--ink);border-color:var(--faint)}
  .quiz-level.on{color:var(--ink);border-color:var(--accent,var(--signal))}
  .quiz-level.lvl-easy.on{border-color:var(--signal);color:var(--signal)}
  .quiz-level.lvl-medium.on{border-color:var(--amber);color:var(--amber)}
  .quiz-level.lvl-hard.on{border-color:var(--red);color:var(--red)}
  .quiz-level.solved{border-color:var(--signal)}
  .quiz-q{margin:0 0 16px;font-size:17px;font-weight:500;color:var(--ink);line-height:1.45}
  .quiz-opts{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
  .quiz-opt{width:100%;display:flex;align-items:baseline;gap:10px;text-align:left;font:inherit;font-size:15px;color:var(--dim);
    border:1px solid var(--border);border-radius:10px;padding:11px 14px;background:var(--bg);cursor:pointer;transition:.15s}
  .quiz-opt:not(:disabled):hover{border-color:var(--faint);color:var(--ink)}
  .quiz-opt:disabled{cursor:default}
  .quiz-opt.correct{border-color:var(--signal);color:var(--signal);background:var(--signal-d)}
  .quiz-opt.wrong{border-color:var(--red);color:var(--red);background:rgba(255,107,107,.08)}
  .quiz-mark{font-family:var(--mono);font-weight:700;min-width:12px}
  .quiz-why{margin:4px 0 6px 36px;font-size:13px;color:var(--faint);line-height:1.5}
  .quiz-why.ok{color:var(--dim)}
  .quiz-foot{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-top:14px;min-height:20px;font-family:var(--mono);font-size:13px}
  .quiz-verdict{color:var(--red);font-weight:700}
  .quiz-verdict.ok{color:var(--signal)}
  .quiz-reset{font-family:var(--mono);font-size:12px;color:var(--faint);background:none;border:none;cursor:pointer;text-decoration:underline}
</style>
