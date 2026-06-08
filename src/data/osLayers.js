// Layers for the /os deep-dive — same shape as the main stack so the shared
// engine (Base nav, LayerSection, scroll-spy) powers it unchanged.
export const osLayers = [
  { id: 'O0', num: '00', navLabel: 'Processes', zone: 'system', title: 'Processes: a program that is actually running', sub: 'os · code + state + its own memory' },
  { id: 'O1', num: '01', navLabel: 'The scheduler', zone: 'system', title: 'The scheduler: one CPU, many turns', sub: 'os · time-slicing · the ready queue' },
  { id: 'O2', num: '02', navLabel: 'Context switch', zone: 'system', title: 'Context switch: saving a process mid-thought', sub: 'os · registers · program counter · cost' },
  { id: 'O3', num: '03', navLabel: 'System calls', zone: 'system', title: 'System calls: asking the kernel nicely', sub: 'os · the user/kernel boundary · traps' },
  { id: 'O4', num: '04', navLabel: 'Interrupts', zone: 'system', title: 'Interrupts: the hardware interrupts you', sub: 'os · the timer · preemption' },
  { id: 'O5', num: '05', navLabel: 'The filesystem', zone: 'system', title: 'The filesystem: names over raw blocks', sub: 'os · inodes · directories · path lookup' },
  { id: 'O6', num: '06', navLabel: 'Journaling', zone: 'system', title: 'Journaling: surviving a crash mid-write', sub: 'os · write-ahead · consistency' },
  { id: 'O7', num: '07', navLabel: 'One tick', zone: 'all', title: 'One tick: how the referee stays in charge', sub: 'the whole loop · interrupt → switch → schedule' },
];
