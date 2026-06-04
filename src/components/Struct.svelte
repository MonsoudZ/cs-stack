<script>
  // Renders the tracer's data structure for a step as real Svelte markup.
  // The builders in lib/traces.js emit a plain `struct` object per step
  // ({kind, ...}); this component owns all the presentation that used to be
  // hand-built HTML strings rendered as raw markup.
  let { struct } = $props();

  // graph layout (BFS/DFS) — pure presentation, lives with the view
  const GPOS = { A: [55, 40], B: [150, 28], C: [150, 112], D: [252, 40], E: [252, 120] };
  const GEDGES = [['A', 'B'], ['A', 'C'], ['B', 'D'], ['C', 'D'], ['C', 'E']];
  const GCOL = { cur: '#5b9dff', vis: '#2ee6c0', q: '#ffb454' };

  // ---- hash ----
  let op = $derived(struct.op);
  let hashFn = $derived(
    op
      ? (op.type === 'insert' ? 'insert: ' : op.type === 'hit' ? 'lookup: ' : 'probe: ') +
          'hash(' + op.key + ') = ' + op.key + ' % 8 = bucket ' + op.bucket +
          (op.type === 'hit' ? '  → walk chain → ✓ match' : '') +
          (op.collision ? '  ⚠ collision → chain it' : '')
      : 'the hash function turns a key into a bucket index — pure arithmetic on a number'
  );
  const bktClass = (chain, i) => {
    const active = op && op.bucket === i, hit = active && op.type === 'hit';
    return 'bkt' + (chain.length ? ' filled' : '') + (active ? (hit ? ' hit' : ' active') : '');
  };
  const entMatch = (i, ci) => op && op.type === 'hit' && op.bucket === i && op.chainIndex === ci;

  // ---- window (binary search) ----
  let winFn = $derived(
    struct.kind === 'window'
      ? struct.mid >= 0
        ? 'window [' + struct.lo + '..' + struct.hi + ']  ·  mid = (' + struct.lo + '+' + struct.hi + ')/2 = ' + struct.mid +
            (struct.compared ? '  ·  compare arr[' + struct.mid + ']=' + struct.arr[struct.mid] + ' vs target ' + struct.target : '')
        : 'window [' + struct.lo + '..' + struct.hi + ']  (' + (struct.hi - struct.lo + 1) + ' of ' + struct.arr.length + ' still in play)'
      : ''
  );
  const winMarks = (i) => {
    const marks = [];
    if (i === struct.lo) marks.push('lo');
    if (i === struct.hi) marks.push('hi');
    if (i === struct.mid) marks.push('mid');
    return marks.join(' ');
  };

  // ---- graph (BFS/DFS) ----
  let frontier = $derived(struct.frontier || struct.queue || []);
  let frontierKind = $derived(struct.frontierKind || 'queue');
  const gState = (n) =>
    n === struct.current ? 'cur' : struct.visited.includes(n) ? 'vis' : frontier.includes(n) ? 'q' : '';
</script>

{#if struct.kind === 'hash'}
  <div class="hashfn">{hashFn}</div>
  <div class="buckets">
    {#each struct.buckets as chain, i}
      <div class={bktClass(chain, i)}>
        <div class="bn">bkt {i}</div>
        <div class="bents">
          {#if chain.length}
            {#each chain as e, ci}<span class="bent" class:m={entMatch(i, ci)}>{e.k}→{e.v}</span>{/each}
          {:else}
            <span class="bent dotc">·</span>
          {/if}
        </div>
      </div>
    {/each}
  </div>

{:else if struct.kind === 'window'}
  <div class="hashfn">{winFn}</div>
  <div class="buckets">
    {#each struct.arr as v, i}
      <div class="wcell" class:out={!(i >= struct.lo && i <= struct.hi)} class:mid={i === struct.mid}>
        <div class="wn">[{i}]</div>
        <div class="wv">{v}</div>
        <div class="wm">{winMarks(i)}</div>
      </div>
    {/each}
  </div>

{:else if struct.kind === 'array'}
  <div class="hashfn">{struct.info || ''}</div>
  <div class="buckets">
    {#each struct.arr as v, i}
      {@const c = (struct.cells && struct.cells[i]) || {}}
      <div class="wcell {c.role || ''}">
        <div class="wn">[{i}]</div>
        <div class="wv">{v}</div>
        <div class="wm">{c.mark || ''}</div>
      </div>
    {/each}
  </div>

{:else if struct.kind === 'graph'}
  <svg viewBox="0 0 310 150" class="graph-svg" role="img"
       aria-label="Graph traversal. {struct.current ? 'Now exploring ' + struct.current + '. ' : ''}Visited: {struct.visited.length ? struct.visited.join(', ') : 'none'}. {frontierKind === 'stack' ? 'Stack' : 'Queue'}: {frontier.length ? frontier.join(', ') : 'empty'}.">
    {#each GEDGES as [a, b]}
      <line x1={GPOS[a][0]} y1={GPOS[a][1]} x2={GPOS[b][0]} y2={GPOS[b][1]} stroke="rgba(120,200,255,.22)" stroke-width="2" />
    {/each}
    {#each Object.entries(GPOS) as [n, xy]}
      {@const s = gState(n)}
      {@const c = GCOL[s] || '#39465a'}
      <circle cx={xy[0]} cy={xy[1]} r="15" fill={s ? c + '33' : '#0d1623'} stroke={c} stroke-width="2" />
      <text x={xy[0]} y={xy[1] + 4} text-anchor="middle" font-family="monospace" font-size="13" fill={s ? c : '#9aa8ba'}>{n}</text>
    {/each}
  </svg>
  <div class="qrow struct-row">
    <div class="qlab">{frontierKind === 'stack' ? 'Stack · LIFO (top→)' : 'Queue · FIFO front→back'}</div>
    <div class="qchips">
      {#if frontier.length}
        {#each frontier as n}<span class="pchip"><span class="dot dot-amber"></span>{n}</span>{/each}
      {:else}<span class="csmini">empty</span>{/if}
    </div>
  </div>
  <div class="qrow">
    <div class="qlab">Visited</div>
    <div class="qchips">
      {#if struct.visited.length}
        {#each struct.visited as n}<span class="pchip"><span class="dot dot-signal"></span>{n}</span>{/each}
      {:else}<span class="csmini">none</span>{/if}
    </div>
  </div>

{:else if struct.kind === 'stack'}
  {#if !struct.frames.length}
    <div class="csmini empty-note">call stack empty</div>
  {:else}
    <div class="csstack">
      {#each struct.frames as f, i}
        <div class="csframe" class:ret={f.ret} class:act={!f.ret && i === struct.frames.length - 1}>
          <span class="fl">sum_to({f.n})&nbsp;<span class="local-note">n={f.n}</span></span>
          {#if f.ret}<span class="rv">returns {f.val}</span>
          {:else if f.n === 0}<span class="wait">base case → 0</span>
          {:else}<span class="wait">needs sum_to({f.n - 1})…</span>{/if}
        </div>
      {/each}
    </div>
  {/if}
{/if}

<style>
  .hashfn{font-family:var(--mono);font-size:13px;color:var(--signal);margin-bottom:12px;min-height:18px}
  .buckets{display:flex;gap:6px;flex-wrap:wrap}
  .bkt{width:76px;height:auto;min-height:54px;padding:7px 4px;border:1px solid var(--border);border-radius:11px;display:flex;flex-direction:column;
    align-items:center;justify-content:center;font-family:var(--mono);background:var(--panel2);transition:.15s}
  .bkt .bn{font-size:11px;color:var(--faint)}.bkt .bv{font-size:13px;color:var(--amber);margin-top:3px}
  .bkt.filled{border-color:var(--amber)}
  .bkt.active{border-color:var(--blue);box-shadow:0 0 16px var(--blue-d)}
  .bkt.hit{border-color:var(--signal);background:var(--signal-d)}.bkt.hit .bv{color:var(--signal)}
  .bents{display:flex;flex-direction:column;gap:2px;margin-top:3px;align-items:center}
  .bent{font-size:12px;color:var(--amber);font-weight:700}
  .bent.m{color:var(--signal)}.bent.dotc{color:var(--faint);font-weight:400}
  .wcell{width:66px;height:78px;border:1px solid var(--border);border-radius:11px;display:flex;flex-direction:column;
    align-items:center;justify-content:center;font-family:var(--mono);background:var(--panel2);transition:.15s}
  .wcell.out{opacity:.55}
  .wcell.mid{border-color:var(--blue);background:var(--blue-d);box-shadow:0 0 16px var(--blue-d)}
  .wcell .wn{font-size:11px;color:var(--faint)}
  .wcell .wv{font-size:22px;font-weight:700;color:var(--amber);margin-top:3px}
  .wcell .wm{font-size:11px;color:var(--blue);margin-top:3px;min-height:11px;letter-spacing:.03em}
  .wcell.cmp{border-color:var(--blue);background:var(--blue-d);box-shadow:0 0 14px var(--blue-d)}
  .wcell.cmp .wv{color:var(--blue)}
  .wcell.sorted{border-color:var(--signal);background:var(--signal-d)}
  .wcell.sorted .wv{color:var(--signal)}
  .wcell.win{border-color:var(--amber);background:var(--amber-d)}
  .wcell.win .wv{color:var(--amber)}
  .wcell.dimx{opacity:.55}
  .graph-svg{width:100%;max-width:340px;height:auto}
  .struct-row{margin-top:10px}
  .dot-amber{background:#ffb454}.dot-signal{background:#2ee6c0}
  .empty-note{padding:10px 2px}
  .local-note{color:var(--faint);font-size:11px}
  @media(max-width:560px){
    .buckets{gap:5px}
    .bkt{width:58px;min-height:52px}
    .wcell{width:54px;height:66px}
    .wcell .wv{font-size:18px}
  }
</style>
