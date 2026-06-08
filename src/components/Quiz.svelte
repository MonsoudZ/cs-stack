<script>
  import { quizzes } from '../data/quizzes.js';
  let { slug } = $props();
  const quiz = quizzes[slug];
  let picked = $state(null); // index of the chosen option, or null
  let chosen = $derived(picked == null ? null : quiz.options[picked]);

  function pick(i) {
    if (picked != null) return; // lock after first answer
    picked = i;
    if (quiz.options[i].correct) markDone();
  }
  function reset() { picked = null; }
  // A correct answer marks this lesson done in the same store /learn reads.
  function markDone() {
    try {
      const KEY = 'stack:progress';
      const set = new Set(JSON.parse(localStorage.getItem(KEY)) || []);
      set.add(slug);
      localStorage.setItem(KEY, JSON.stringify([...set]));
    } catch (e) { /* storage unavailable — quiz still works */ }
  }
</script>

{#if quiz}
  <section class="quiz" aria-label="Check your understanding">
    <div class="quiz-tag">Check your understanding</div>
    <p class="quiz-q">{quiz.question}</p>
    <ul class="quiz-opts" role="list">
      {#each quiz.options as opt, i}
        <li>
          <button
            type="button"
            class="quiz-opt"
            class:correct={picked != null && opt.correct}
            class:wrong={picked === i && !opt.correct}
            disabled={picked != null}
            aria-pressed={picked === i}
            onclick={() => pick(i)}
          >
            <span class="quiz-mark" aria-hidden="true">{picked != null && opt.correct ? '✓' : picked === i ? '✗' : ''}</span>
            <span class="quiz-label">{opt.label}</span>
          </button>
          {#if picked != null && (picked === i || opt.correct)}
            <p class="quiz-why" class:ok={opt.correct}>{opt.why}</p>
          {/if}
        </li>
      {/each}
    </ul>
    <div class="quiz-foot" role="status" aria-live="polite">
      {#if picked != null}
        <span class="quiz-verdict" class:ok={chosen.correct}>{chosen.correct ? '✓ Correct — lesson marked done on your path.' : '✗ Not quite — see the highlighted answer.'}</span>
        <button type="button" class="quiz-reset" onclick={reset}>try again</button>
      {/if}
    </div>
  </section>
{/if}

<style>
  .quiz{max-width:680px;margin:40px auto 0;border:1px solid var(--border);border-radius:16px;padding:22px 24px;background:var(--surface)}
  .quiz-tag{font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--signal);margin-bottom:10px}
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
