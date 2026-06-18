<script>
  // The cross-link strip that makes the stack <-> system-design relationship
  // navigable both ways:
  //   - on a deep-dive stack page: the system designs that build on this stack
  //   - on a /design case study: the stacks that case study builds on
  // Driven by each design's `uses` list in designs.js, so it can't drift from
  // the in-page SeeAlso references. Rendered statically by Astro (no client
  // directive → zero JS); a Svelte component only so the per-item accent can use
  // the `style:` directive the audit allows. Renders nothing on other pages.
  import { stacks } from '../data/stacks.js';
  import { designs } from '../data/designs.js';
  let { stack = null, design = null } = $props();

  let heading = null;
  let items = []; // { href, label, sub, accent }
  if (design) {
    // stacks this design builds on, in stacks.js (bottom → top) order
    heading = 'Built from the stacks';
    items = stacks
      .filter((s) => (design.uses || []).includes(s.slug))
      .map((s) => ({ href: `/${s.slug}`, label: `${s.name} ${s.kind}`, sub: s.blurb, accent: s.accent }));
  } else if (stack) {
    // system designs that name this stack in their `uses`
    const built = designs.filter((d) => d.ready && (d.uses || []).includes(stack.slug));
    if (built.length) {
      heading = 'Put to work in system design';
      items = built.map((d) => ({ href: `/design/${d.slug}`, label: d.name, sub: d.blurb, accent: stack.accent }));
    }
  }
</script>

{#if items.length > 0}
  <nav class="xlink" aria-label={heading}>
    <p class="xlink-h">{heading}</p>
    <ul class="xlink-list">
      {#each items as it}
        <li><a href={it.href} style:--c={it.accent}>
          <span class="xlink-label">{it.label}</span>
          <span class="xlink-sub">{it.sub}</span>
        </a></li>
      {/each}
    </ul>
  </nav>
{/if}

<style>
  .xlink{max-width:760px;margin:48px auto 0;padding:0 20px}
  .xlink-h{
    font-family:var(--mono);font-size:12px;font-weight:700;letter-spacing:.12em;
    text-transform:uppercase;color:var(--faint);margin:0 0 14px;
  }
  .xlink-list{list-style:none;margin:0;padding:0;display:grid;gap:10px;
    grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}
  .xlink-list a{
    display:block;border:1px solid var(--border);border-left:3px solid var(--c,var(--signal));
    border-radius:10px;padding:11px 14px;background:var(--surface);
    text-decoration:none;transition:border-color .18s,box-shadow .18s,transform .18s;
  }
  .xlink-list a:hover,.xlink-list a:focus-visible{
    border-color:var(--c,var(--signal));box-shadow:0 0 14px -4px var(--c,var(--signal));transform:translateY(-1px);
  }
  .xlink-label{display:block;font-weight:700;font-size:15px;color:var(--ink)}
  .xlink-sub{display:block;font-size:12.5px;color:var(--dim);margin-top:3px;line-height:1.45}
</style>
