// Pure layout for the shared SVG <Diagram>: turns a node list (optionally with
// grid coordinates) and an edge list into absolute positions and a viewBox.
// No DOM — unit-tested in diagram.test.js. A node is { id, label, x?, y? } where
// x is the column and y the row; when any node lacks a grid position the nodes
// are laid out as a left-to-right chain. Edges are [fromId, toId] pairs and
// default to that chain. `vertical` transposes the grid (rows become columns)
// so a chain reads top-to-bottom on a narrow screen.
export const NODE_W = 132, NODE_H = 54, COL = 162, ROW = 84, PAD = 16;

export function layoutDiagram(nodes, edges = null, { vertical = false } = {}) {
  const hasGrid = nodes.length > 0 && nodes.every((n) => Number.isFinite(n.x) && Number.isFinite(n.y));
  const grid = nodes.map((n, i) => (hasGrid ? { x: n.x, y: n.y } : { x: i, y: 0 }));
  const g = vertical ? grid.map((p) => ({ x: p.y, y: p.x })) : grid;
  const xs = g.map((p) => p.x), ys = g.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const placed = nodes.map((n, i) => ({
    ...n,
    cx: PAD + NODE_W / 2 + (g[i].x - minX) * COL,
    cy: PAD + NODE_H / 2 + (g[i].y - minY) * ROW,
  }));
  const byId = Object.fromEntries(placed.map((n) => [n.id, n]));
  const pairs = edges && edges.length ? edges : nodes.slice(1).map((n, i) => [nodes[i].id, n.id]);
  // Each edge runs border-to-border rather than centre-to-centre, so it never
  // shows through a translucent box: trim both ends to where the centre line
  // leaves the node's rectangle.
  const trim = (from, to) => {
    const dx = to.cx - from.cx, dy = to.cy - from.cy;
    const tx = dx ? (NODE_W / 2) / Math.abs(dx) : Infinity;
    const ty = dy ? (NODE_H / 2) / Math.abs(dy) : Infinity;
    const t = Math.min(tx, ty, 0.5);
    return { x: from.cx + dx * t, y: from.cy + dy * t };
  };
  const lines = pairs
    .filter(([a, b]) => byId[a] && byId[b])
    .map(([a, b]) => {
      const p = trim(byId[a], byId[b]), q = trim(byId[b], byId[a]);
      return { a, b, x1: p.x, y1: p.y, x2: q.x, y2: q.y };
    });
  return {
    nodes: placed,
    edges: lines,
    width: PAD * 2 + NODE_W + (maxX - minX) * COL,
    height: PAD * 2 + NODE_H + (maxY - minY) * ROW,
    vertical,
  };
}
