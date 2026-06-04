<script>
  const CTRL = {0:'NUL',7:'BEL',8:'BS',9:'TAB',10:'LF',13:'CR',27:'ESC',32:'(space)',127:'DEL'};
  const OPS = ['NOP','LOAD','ADD','SUB','JMP','OUT','CMP','HALT'];
  let n = $state(65);
  let hex = $derived('0x' + (+n).toString(16).toUpperCase().padStart(2,'0') + ' · ' + (+n).toString(2).padStart(8,'0'));
  let isCtrl = $derived(+n < 32 || +n === 127);
  let ch = $derived(isCtrl ? (CTRL[+n] || '·') : String.fromCharCode(+n));
  let op = $derived(OPS[(+n) >> 5]);
  let r = $state(46), g = $state(230), b = $state(192);
  let hexcol = $derived('#' + [+r,+g,+b].map((x) => x.toString(16).toUpperCase().padStart(2,'0')).join(''));
</script>
<div class="widget">
  <div class="w-label">one byte (0–255), four interpretations</div>
  <input type="range" min="0" max="255" bind:value={n} class="slider" aria-label="Byte value" />
  <div class="meanings">
    <div class="mcard"><div class="mk">as a number</div><div class="mv">{n}</div><div class="mn">{hex}</div></div>
    <div class="mcard"><div class="mk">as text (ASCII)</div><div class="mv">{ch}</div><div class="mn">{isCtrl ? 'control code' : 'printable'}</div></div>
    <div class="mcard"><div class="mk">as a shade</div><div class="mv mv-small muted">grayscale {n}/255</div><div class="swatch" style:background={`rgb(${n},${n},${n})`}></div></div>
    <div class="mcard"><div class="mk">as an instruction</div><div class="mv mv-op">{op}</div><div class="mn">opcode {(+n) >> 5} · operand {(+n) & 31}</div></div>
  </div>
</div>
<div class="widget">
  <div class="w-label">three numbers → one color (this is every pixel on your screen)</div>
  <div class="w-row color-row">
    <div class="control-fill">
      <div class="rgb-row"><label for="rgbR">R</label><input id="rgbR" type="range" min="0" max="255" bind:value={r} class="slider r" /><span>{r}</span></div>
      <div class="rgb-row"><label for="rgbG">G</label><input id="rgbG" type="range" min="0" max="255" bind:value={g} class="slider g" /><span>{g}</span></div>
      <div class="rgb-row"><label for="rgbB">B</label><input id="rgbB" type="range" min="0" max="255" bind:value={b} class="slider b" /><span>{b}</span></div>
    </div>
    <div class="lead">
      <div class="swatch color-swatch" style:background={`rgb(${r},${g},${b})`}></div>
      <small class="mono-small">{hexcol}</small>
    </div>
  </div>
</div>
