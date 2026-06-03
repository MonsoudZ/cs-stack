// Pure simulations ported verbatim from the validated single-file build.
export function simulateScheduler(){
  const PROCS=[
    {name:'build',color:'#5b9dff',phases:[{type:'cpu',len:3},{type:'io',len:2},{type:'cpu',len:2}]},
    {name:'render',color:'#ffb454',phases:[{type:'cpu',len:5}]},
    {name:'fetch',color:'#a78bfa',phases:[{type:'cpu',len:1},{type:'io',len:3},{type:'cpu',len:1}]},
  ];
  const Q=2,MAXT=80;
  const P=PROCS.map(p=>({phases:p.phases.map(x=>({...x})),phase:0,inPhase:0,state:'ready'}));
  let ready=P.map((_,i)=>i),blocked=[],running=null,q=0;const timeline=[],out=[];
  const allDone=()=>P.every(p=>p.state==='done');
  function advanceIO(){const keep=[];for(const b of blocked){b.remaining--;if(b.remaining<=0){const p=P[b.i];p.phase++;p.inPhase=0;if(p.phase>=p.phases.length)p.state='done';else{p.state='ready';ready.push(b.i);}}else keep.push(b);}blocked=keep;}
  const snap=note=>out.push({timeline:timeline.slice(),running,ready:ready.slice(),blocked:blocked.map(b=>({...b})),states:P.map(p=>p.state),note});
  snap('processes loaded into the ready queue — scheduler about to dispatch');
  let t=0;
  while(!allDone()&&t<MAXT){
    if(running===null){if(ready.length){running=ready.shift();P[running].state='running';q=Q;}else{timeline.push({proc:null});advanceIO();t++;snap('CPU idle — everyone is blocked on I/O, the core has nothing to do');continue;}}
    const p=P[running],ph=p.phases[p.phase];timeline.push({proc:running});p.inPhase++;q--;advanceIO();t++;
    if(p.inPhase>=ph.len){p.phase++;p.inPhase=0;if(p.phase>=p.phases.length){p.state='done';const f=running;running=null;snap(PROCS[f].name+' finished all its work → leaves the CPU');continue;}if(p.phases[p.phase].type==='io'){p.state='blocked';blocked.push({i:running,remaining:p.phases[p.phase].len});const f=running;running=null;snap(PROCS[f].name+' makes an I/O syscall → BLOCKED, frees the core for someone else');continue;}}
    if(q<=0&&p.state==='running'){p.state='ready';ready.push(running);const f=running;running=null;snap('quantum used up → context switch · '+PROCS[f].name+' goes to the back of the queue');continue;}
    snap(PROCS[running].name+' is running on the core');
  }
  out.push({timeline:timeline.slice(),running:null,ready:[],blocked:[],states:P.map(()=>'done'),note:'all processes complete — the core never ran two at once'});
  return {PROCS,steps:out};
}

export function buildFact(N){
  const out=[],frames=[];const snap=note=>out.push({frames:frames.map(f=>({...f})),note});
  (function fact(k){
    frames.push({n:k,val:null,ret:false});
    snap(`call fact(${k}) → push a frame, remember n=${k}`);
    let r;
    if(k<=1){const t=frames[frames.length-1];t.val=1;t.ret=true;snap('base case: fact(1) returns 1');r=1;}
    else{const s=fact(k-1);const t=frames[frames.length-1];t.val=k*s;t.ret=true;snap(`fact(${k}) = ${k} × ${s} = ${k*s} → return up the stack`);r=k*s;}
    frames.pop();return r;
  })(N);
  out.push({frames:[],note:`finished — every frame popped. fact(${N}) = ${(function f(k){return k<=1?1:k*f(k-1);})(N)}`});
  return out;
}
