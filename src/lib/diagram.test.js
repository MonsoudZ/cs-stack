import { describe, it, expect } from 'vitest';
import { layoutDiagram, NODE_W, NODE_H, COL, ROW, PAD } from './diagram.js';

const chain = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }];

describe('layoutDiagram', () => {
  it('lays an ungridded node list out as a left-to-right chain with chained edges', () => {
    const d = layoutDiagram(chain);
    expect(d.nodes.map((n) => n.cx)).toEqual([PAD + NODE_W / 2, PAD + NODE_W / 2 + COL, PAD + NODE_W / 2 + 2 * COL]);
    expect(new Set(d.nodes.map((n) => n.cy)).size).toBe(1); // one row
    expect(d.edges.map((e) => [e.a, e.b])).toEqual([['a', 'b'], ['b', 'c']]);
    expect(d.width).toBe(PAD * 2 + NODE_W + 2 * COL);
    expect(d.height).toBe(PAD * 2 + NODE_H);
  });

  it('honours grid coordinates and explicit edges (a fan-out topology)', () => {
    const nodes = [
      { id: 'c', label: 'Client', x: 0, y: 1 },
      { id: 'k', label: 'Coord', x: 1, y: 1 },
      { id: 'r1', label: 'R1', x: 2, y: 0 },
      { id: 'r2', label: 'R2', x: 2, y: 2 },
    ];
    const d = layoutDiagram(nodes, [['c', 'k'], ['k', 'r1'], ['k', 'r2']]);
    const by = Object.fromEntries(d.nodes.map((n) => [n.id, n]));
    expect(by.r1.cx).toBe(by.r2.cx);            // same column
    expect(by.r2.cy - by.r1.cy).toBe(2 * ROW);  // two rows apart
    expect(by.k.cy).toBe(by.r1.cy + ROW);       // coordinator on the middle row
    expect(d.edges).toHaveLength(3);
    // edges run border-to-border: the horizontal one leaves the client's right
    // edge and arrives at the coordinator's left edge, on the shared centre line
    expect(d.edges[0]).toMatchObject({ a: 'c', b: 'k', x1: by.c.cx + NODE_W / 2, y1: by.c.cy, x2: by.k.cx - NODE_W / 2, y2: by.k.cy });
    // the diagonal one starts on the coordinator's boundary and ends on R1's
    const e = d.edges[1];
    expect(e).toMatchObject({ a: 'k', b: 'r1' });
    const onBorder = (n, x, y) => Math.abs(Math.abs(x - n.cx) - NODE_W / 2) < 1e-9 || Math.abs(Math.abs(y - n.cy) - NODE_H / 2) < 1e-9;
    expect(onBorder(by.k, e.x1, e.y1)).toBe(true);
    expect(onBorder(by.r1, e.x2, e.y2)).toBe(true);
    // and it points from k toward r1 (up and to the right)
    expect(e.x2).toBeGreaterThan(e.x1);
    expect(e.y2).toBeLessThan(e.y1);
    expect(d.height).toBe(PAD * 2 + NODE_H + 2 * ROW);
  });

  it('vertical transposes the grid so a chain runs top-to-bottom', () => {
    const d = layoutDiagram(chain, null, { vertical: true });
    expect(new Set(d.nodes.map((n) => n.cx)).size).toBe(1); // one column
    expect(d.nodes.map((n) => n.cy)).toEqual([PAD + NODE_H / 2, PAD + NODE_H / 2 + ROW, PAD + NODE_H / 2 + 2 * ROW]);
    expect(d.height).toBeGreaterThan(d.width);
    expect(d.vertical).toBe(true);
  });

  it('drops an edge that names an unknown node instead of throwing', () => {
    const d = layoutDiagram(chain, [['a', 'b'], ['b', 'zzz']]);
    expect(d.edges.map((e) => e.b)).toEqual(['b']);
  });

  it('falls back to the chain when only some nodes carry coordinates', () => {
    const d = layoutDiagram([{ id: 'a', x: 0, y: 0 }, { id: 'b' }]);
    expect(d.nodes[1].cx - d.nodes[0].cx).toBe(COL);
    expect(d.nodes[1].cy).toBe(d.nodes[0].cy);
  });
});
