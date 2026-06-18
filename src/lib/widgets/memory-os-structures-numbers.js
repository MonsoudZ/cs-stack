// Part of the widgets builder set, split by area. The barrel at
// src/lib/widgets.js re-exports every module so existing imports keep working.

import { decodeMiniFloat } from './core.js';

// --- MEMORY STACK (/memory) ---

// A fully-associative cache, LRU eviction. A miss loads a whole line of
// `lineSize` consecutive addresses (spatial locality), so neighbours then hit;
// an evicted line misses again (a capacity miss). Returns the access trace.
export function buildCache({ accesses = [0, 1, 2, 3, 8, 12, 16, 20, 0], lineSize = 4, ways = 4 } = {}) {
  const out = [];
  let cache = []; // block ids, least-recently-used first
  let hits = 0, misses = 0;
  const snap = (addr, block, hit, evicted, note) => out.push({ addr, block, hit, evicted, cache: cache.slice(), hits, misses, note });
  snap(null, null, null, null, 'a cache holds a few ' + lineSize + '-address lines; a miss loads a whole line, betting you will want its neighbours next');
  for (const addr of accesses) {
    const block = Math.floor(addr / lineSize);
    const idx = cache.indexOf(block);
    if (idx >= 0) {
      hits++; cache.splice(idx, 1); cache.push(block);
      snap(addr, block, true, null, 'read address ' + addr + ' → line ' + block + ' is cached → HIT');
    } else {
      misses++;
      let evicted = null;
      if (cache.length >= ways) evicted = cache.shift();
      cache.push(block);
      snap(addr, block, false, evicted,
        'read address ' + addr + ' → line ' + block + ' not cached → MISS, load it' + (evicted != null ? ' (evict line ' + evicted + ', least-recently-used)' : ''));
    }
  }
  snap(null, null, null, null, hits + ' hits, ' + misses + ' misses — one miss covers a whole line, but a line you evict has to be fetched again');
  return out;
}

// Virtual → physical address translation. A virtual address splits into a page
// number + offset; the MMU finds the physical frame via the TLB (fast) or a
// page-table walk (slow), then combines frame × pageSize + offset.
export function buildAddressTranslation({ pageBits = 4 } = {}) {
  const pageSize = 1 << pageBits;
  const table = { 0: 5, 1: 2, 2: 7, 3: 1 }; // virtual page → physical frame
  const out = [];
  const tlb = {};
  const snap = (note, o = {}) => out.push({ pageSize, table, tlb: { ...tlb }, note, ...o });
  const translate = (vaddr) => {
    const page = vaddr >> pageBits, offset = vaddr & (pageSize - 1);
    snap('virtual address ' + vaddr + ' splits into page ' + page + ' and offset ' + offset, { vaddr, page, offset });
    if (tlb[page] !== undefined) {
      const frame = tlb[page], phys = frame * pageSize + offset;
      snap('TLB hit: page ' + page + ' → frame ' + frame + ' — no page-table walk needed', { vaddr, page, offset, frame, tlbHit: true });
      snap('physical = frame ' + frame + ' × ' + pageSize + ' + offset ' + offset + ' = ' + phys, { vaddr, page, offset, frame, phys });
      return;
    }
    snap('TLB miss → walk the page table for page ' + page, { vaddr, page, offset, tlbHit: false });
    const frame = table[page];
    tlb[page] = frame;
    snap('page table: page ' + page + ' → frame ' + frame + ', and cache it in the TLB', { vaddr, page, offset, frame });
    const phys = frame * pageSize + offset;
    snap('physical = frame ' + frame + ' × ' + pageSize + ' + offset ' + offset + ' = ' + phys, { vaddr, page, offset, frame, phys });
  };
  snap('programs use virtual addresses; the MMU translates each one to a physical address');
  translate(42); // page 2, offset 10 → TLB miss, walk
  translate(40); // page 2, offset 8 → TLB hit
  return out;
}

// --- OS STACK (/os) ---

// A system call: the user/kernel boundary. User code can't touch hardware
// directly, so read() is really a TRAP that switches the CPU into kernel mode,
// runs the privileged handler, then returns. Snapshots track the mode (ring),
// so the widget can show control crossing the line and coming back.
export function buildSyscall() {
  const out = [];
  const snap = (mode, loc, note, o = {}) => out.push({ mode, loc, note, ...o });
  snap('user', 'program', 'your program runs in user mode — it cannot touch the disk directly');
  snap('user', 'program', 'it calls read(fd) — which is really a TRAP instruction, a deliberate request to the kernel');
  snap('kernel', 'trap', 'the CPU switches to kernel mode and saves the user program’s registers', { switched: true });
  snap('kernel', 'handler', 'the kernel’s syscall handler validates the arguments (is fd really open? is the buffer yours?)');
  snap('kernel', 'io', 'the kernel asks the disk for the data and blocks this process until it arrives', { blocked: true });
  snap('kernel', 'handler', 'the bytes arrive; the kernel copies them into your buffer and sets the return value');
  snap('user', 'program', 'return-from-trap: restore the saved registers, switch back to user mode', { switched: true });
  snap('user', 'program', 'your program resumes with the bytes — never having seen the disk itself');
  return out;
}

// Path resolution in a filesystem. A path is a chain of directory lookups: a
// directory is just a file that maps names → inode numbers; an inode holds a
// file's metadata and the list of disk blocks its bytes actually live in. To
// open /docs/notes.txt the kernel walks root → docs → notes.txt, inode by inode.
export const FS = {
  2: { type: 'dir', name: '/', entries: { docs: 7, 'readme.txt': 4 } },
  7: { type: 'dir', name: 'docs', entries: { 'notes.txt': 9, 'todo.txt': 5 } },
  9: { type: 'file', name: 'notes.txt', blocks: [12, 27, 33] },
};
export function buildPathResolve({ path = '/docs/notes.txt' } = {}) {
  const segs = path.split('/').filter(Boolean); // ['docs','notes.txt']
  const out = [];
  const snap = (note, o = {}) => out.push({ path, segs, note, inode: o.inode ?? null, entries: o.entries ?? null, want: o.want ?? null, found: o.found ?? null, blocks: o.blocks ?? null, resolved: !!o.resolved });
  snap('a path is a chain of directory lookups — each directory maps a name to an inode number, and an inode points at the data blocks', {});
  let inode = 2; // root is always a known inode number
  snap('start at the root inode (#2) — the one inode the filesystem always knows how to find', { inode });
  for (const seg of segs) {
    const node = FS[inode];
    snap('read inode ' + inode + ' (' + (node.name === '/' ? 'root' : node.name) + ') — a directory; look up "' + seg + '" in its entries', { inode, entries: node.entries, want: seg });
    const next = node.entries[seg];
    snap('found "' + seg + '" → inode ' + next, { inode, entries: node.entries, want: seg, found: next });
    inode = next;
  }
  const file = FS[inode];
  snap('inode ' + inode + ' is a file; its bytes live in blocks [' + file.blocks.join(', ') + '] — scattered on disk, gathered by the inode', { inode, blocks: file.blocks, resolved: true });
  return out;
}

// Journaling: how a filesystem survives a crash mid-update. Changing metadata
// (e.g. linking a new file into a directory) touches several structures; a crash
// between them leaves the disk inconsistent. A journal write-aheads the intent
// and a commit marker, so a crash either replays a committed change or discards
// an incomplete one — never a half-applied mess. `journaled` toggles the two.
export function buildJournal({ journaled = true } = {}) {
  const out = [];
  const snap = (note, o = {}) => out.push({ journaled, journal: o.journal ?? [], applied: !!o.applied, crashed: !!o.crashed, consistent: o.consistent, note });
  if (!journaled) {
    snap('no journal. Creating a file means two writes: add the directory entry, and write the new inode');
    snap('write 1: add directory entry "report.txt → inode 18"');
    snap('CRASH — power dies before inode 18 is written', { crashed: true });
    snap('on restart: the directory points to inode 18, but it was never written → a dangling entry, a corrupt filesystem', { crashed: true, consistent: false });
  } else {
    snap('with a journal: write the whole intended change to the journal FIRST, then apply it to the real structures');
    snap('journal: record "add entry report.txt→18, write inode 18", then write a COMMIT marker', { journal: ['add report.txt→18', 'write inode 18', 'COMMIT'] });
    snap('CRASH — power dies right after the commit', { journal: ['add report.txt→18', 'write inode 18', 'COMMIT'], crashed: true });
    snap('on restart: the journal entry is COMMITTED → replay it, finishing both writes → the filesystem is consistent', { journal: ['add report.txt→18', 'write inode 18', 'COMMIT'], applied: true, consistent: true });
    snap('(had the crash hit before COMMIT, the entry would be discarded — the change simply never happened, still consistent)', { applied: true, consistent: true });
  }
  return out;
}

// --- DATA STRUCTURES STACK (/structures) ---

// A dynamic array (vector / ArrayList). It owns a fixed block of memory; when
// it fills, it allocates a block twice as big and copies everything over. Most
// appends are O(1); the rare doubling is O(n) but, spread out, it amortizes to
// O(1). Returns the append trace with capacity, length, and total copies made.
export function buildDynamicArray({ n = 8 } = {}) {
  const out = [];
  let cap = 1, len = 0, copies = 0;
  const snap = (note, o = {}) => out.push({ cap, len, copies, note, ...o });
  snap('a dynamic array starts with room for ' + cap + '; appending is cheap until it fills up');
  for (let i = 0; i < n; i++) {
    if (len === cap) {
      const old = cap;
      cap *= 2;
      copies += len;
      snap('append ' + i + ': full at capacity ' + old + ' → allocate ' + cap + ' and copy ' + len + ' items over', { grew: true, copiedNow: len });
    }
    len++;
    snap('append ' + i + ': room to spare → just place it (length ' + len + ' / capacity ' + cap + ')', { placed: i });
  }
  snap(n + ' appends, ' + copies + ' total copies — the doublings get rarer as it grows, so each append averages O(1)');
  return out;
}

// A hash map with separate chaining. A key is hashed to a bucket index; keys
// that collide share a bucket as a short list. Lookup hashes, then scans that
// one short chain. Returns insert + lookup snapshots with the bucket array.
export function buildHashMap({ keys = ['cat', 'dog', 'bird', 'fish', 'ant', 'bee'], buckets = 5, lookup = 'bird' } = {}) {
  const out = [];
  const table = Array.from({ length: buckets }, () => []);
  const hash = (k) => { let h = 0; for (let i = 0; i < k.length; i++) h += k.charCodeAt(i); return h % buckets; };
  const snap = (note, o = {}) => out.push({ table: table.map((b) => b.slice()), buckets, note, ...o });
  snap('a hash map turns a key into a bucket index, so lookups skip straight there instead of scanning everything');
  for (const k of keys) {
    const b = hash(k);
    const collision = table[b].length > 0;
    table[b].push(k);
    snap('insert "' + k + '": hash → bucket ' + b + (collision ? ' — already occupied, so chain it onto the bucket' : ''), { key: k, bucket: b, op: 'insert', collision });
  }
  const lb = hash(lookup);
  snap('look up "' + lookup + '": hash → bucket ' + lb + ', then scan just that chain', { key: lookup, bucket: lb, op: 'lookup' });
  const found = table[lb].includes(lookup);
  snap('bucket ' + lb + ' holds [' + table[lb].join(', ') + '] → ' + (found ? 'found "' + lookup + '" after a tiny scan, not a full sweep' : 'not present'), { key: lookup, bucket: lb, op: 'lookup', found });
  return out;
}

// --- NUMBERS STACK (/numbers) ---

// Read a fixed-width bit array as a two's-complement signed integer: the top
// bit carries a NEGATIVE place value, every other bit is positive as usual.
export function twosValue(bits) {
  const n = bits.length;
  let v = bits[0] ? -(2 ** (n - 1)) : 0;
  for (let i = 1; i < n; i++) v += bits[i] * 2 ** (n - 1 - i);
  return v;
}

// Two's complement: how a fixed width stores negatives with no minus sign.
// Negating is "flip every bit, then add 1"; the top bit ends up worth −2^(n−1),
// so +x and −x add to zero (the overflow bit falls off). Returns the trace for
// negating +5 in 4 bits, then shows the wraparound at the top of the range.
export function buildTwosComplement({ value = 5, width = 4 } = {}) {
  const out = [];
  const toBits = (v) => { const b = []; for (let i = width - 1; i >= 0; i--) b.push((v >> i) & 1); return b; };
  const snap = (bits, note, o = {}) => out.push({ bits: bits.slice(), value: twosValue(bits), note, ...o });
  snap(toBits(0), 'in ' + width + ' bits there is no minus sign — negatives are just a different reading of the same wires; the top bit is worth −' + 2 ** (width - 1));
  const pos = toBits(value);
  snap(pos, '+' + value + ' is the familiar binary ' + pos.join('') + ' (top bit 0, so it reads positive)');
  const inv = pos.map((b) => b ^ 1);
  snap(inv, 'to negate: flip every bit → ' + inv.join('') + ' (this is the ones’-complement, reading as ' + twosValue(inv) + ')');
  // add 1
  let carry = 1; const plus1 = inv.slice();
  for (let i = width - 1; i >= 0 && carry; i--) { const s = plus1[i] + carry; plus1[i] = s & 1; carry = s >> 1; }
  snap(plus1, 'then add 1 → ' + plus1.join('') + ', which reads as ' + twosValue(plus1) + ' — that is −' + value, { signBit: true });
  snap(plus1, 'check: ' + pos.join('') + ' + ' + plus1.join('') + ' overflows to 1·0000, the carry falls off the ' + width + '-bit word → 0. So +' + value + ' and −' + value + ' really cancel.');
  const maxBits = toBits((2 ** (width - 1)) - 1);
  snap(maxBits, 'the catch: the range is −' + 2 ** (width - 1) + '…' + ((2 ** (width - 1)) - 1) + '. Here is the largest, +' + twosValue(maxBits) + ' = ' + maxBits.join(''));
  let c = 1; const wrap = maxBits.slice();
  for (let i = width - 1; i >= 0 && c; i--) { const s = wrap[i] + c; wrap[i] = s & 1; c = s >> 1; }
  snap(wrap, 'add 1 and it wraps to ' + wrap.join('') + ' = ' + twosValue(wrap) + ' — overflow silently flips the biggest positive to the most negative', { signBit: true, overflow: true });
  return out;
}

// The float "grid": with a fixed mantissa, the gap between representable values
// DOUBLES every octave (it scales with the exponent). So floats are dense near
// zero and sparse far from it. Uses the toy 8-bit float; returns the list of
// representable positive values plus per-octave snapshots showing the gap grow.
export function buildFloatGrid() {
  const values = [];
  for (let e = 0; e < 15; e++) for (let m = 0; m < 8; m++) {
    const { value } = decodeMiniFloat([0, (e >> 3) & 1, (e >> 2) & 1, (e >> 1) & 1, e & 1, (m >> 2) & 1, (m >> 1) & 1, m & 1]);
    if (Number.isFinite(value) && value > 0 && value <= 8) values.push(value);
  }
  const sorted = [...new Set(values)].sort((a, b) => a - b);
  const out = [];
  const snap = (lo, hi, gap, note) => out.push({ values: sorted, lo, hi, gap, note });
  snap(0, 8, null, 'every dot is a value this float can represent exactly. Notice they bunch up near 0 and thin out toward 8 — the grid is not evenly spaced');
  for (const [lo, hi] of [[0.5, 1], [1, 2], [2, 4], [4, 8]]) {
    const inOct = sorted.filter((v) => v >= lo && v < hi);
    const gap = inOct.length > 1 ? +(inOct[1] - inOct[0]).toFixed(6) : null;
    snap(lo, hi, gap, 'between ' + lo + ' and ' + hi + ' the step is ' + gap + ' — each octave the gap doubles, because the exponent scales the whole number');
  }
  snap(0, 8, null, 'so most real numbers fall between the dots and get rounded to the nearest one — the further from zero, the coarser the rounding');
  return out;
}

// Why 0.1 + 0.2 ≠ 0.3. Tenths don't divide a power of two, so 0.1 and 0.2 each
// round to the nearest double (a hair too big); their sum rounds again, landing
// on a double just past 0.3 — which is itself a *different* double. Values are
// taken live from JS doubles so the trace is exactly what the hardware does.
export function buildFloatSum() {
  const p = (x) => Number(x).toPrecision(17);
  const out = [];
  const snap = (note, o = {}) => out.push({ note, ...o });
  snap('we type 0.1, but base-2 can’t write a tenth exactly — like 1/3 in decimal, it repeats forever, so it must be rounded to fit');
  snap('the nearest double to 0.1 is actually a touch too big', { label: '0.1', stored: p(0.1) });
  snap('the nearest double to 0.2 is too big as well', { label: '0.2', stored: p(0.2) });
  snap('add them and the result rounds again, landing just past three-tenths', { label: '0.1 + 0.2', stored: p(0.1 + 0.2), highlight: true });
  snap('but writing 0.3 directly rounds to a *different* double, just under', { label: '0.3', stored: p(0.3), highlight: true });
  snap('so 0.1 + 0.2 === 0.3 is ' + (0.1 + 0.2 === 0.3) + ' — not a bug, just two roundings that don’t meet', { equal: 0.1 + 0.2 === 0.3 });
  return out;
}
