<script>
  import { createStepper } from '../lib/stepper.svelte.js';
  import Stepper from './Stepper.svelte';
  function buildCpu() {
    const PROG = [
      {op:'LOADA',arg:5,t:'LOAD A, 5'},
      {op:'LOADB',arg:3,t:'LOAD B, 3'},
      {op:'ADD',t:'ADD       ; A = A + B'},
      {op:'LOADB',arg:2,t:'LOAD B, 2'},
      {op:'SUB',t:'SUB       ; A = A - B'},
      {op:'OUT',t:'OUT       ; print A'},
      {op:'HALT',t:'HALT'},
    ];
    const txt = PROG.map((p) => p.t);
    let PC = 0, A = 0, B = 0, out = '';
    const steps = [];
    const snap = (note, cur) => steps.push({ PC, A, B, out, note, prog: txt, cur });
    snap('ready — PC = 0, registers cleared', -1);
    while (PC < PROG.length) {
      const here = PC, ins = PROG[here]; let note;
      if (ins.op === 'LOADA') { A = ins.arg; note = 'fetch→decode→execute · LOAD A, ' + ins.arg + ' → A = ' + A; }
      else if (ins.op === 'LOADB') { B = ins.arg; note = 'fetch→decode→execute · LOAD B, ' + ins.arg + ' → B = ' + B; }
      else if (ins.op === 'ADD') { A = A + B; note = 'ADD → A = A + B = ' + A; }
      else if (ins.op === 'SUB') { A = A - B; note = 'SUB → A = A − B = ' + A; }
      else if (ins.op === 'OUT') { out = String(A); note = 'OUT → output ' + out; }
      else { note = 'HALT — program done'; PC = PROG.length; snap(note, here); break; }
      PC++; snap(note, here);
    }
    return steps;
  }
  const stepper = createStepper(buildCpu, { speed: 650 });
  const { idx } = stepper;
  let s = $derived(stepper.all()[$idx]);
</script>
<div class="widget">
  <div class="w-label">a tiny program · press STEP</div>
  <div class="cpu">
    <div class="rom">{#each s.prog as line, i}<div class="ln {i === s.cur ? 'cur' : ''}"><span class="ad">{String(i).padStart(2,'0')}</span><span class="op">{line}</span></div>{/each}</div>
    <div class="regs">
      <div class="reg"><span class="rn">PC · program counter</span><span class="rv">{s.PC >= s.prog.length ? '—' : s.PC}</span></div>
      <div class="reg"><span class="rn">A · register</span><span class="rv">{s.A}</span></div>
      <div class="reg"><span class="rn">B · register</span><span class="rv">{s.B}</span></div>
      <div class="cpu-out">{s.out ? ('OUTPUT ▸ ' + s.out) : ''}</div>
    </div>
  </div>
  <div class="csnote" style="margin-top:14px">{s.note}</div>
  <Stepper {stepper} />
</div>
