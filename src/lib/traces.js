// Pure, framework-agnostic step-builders for the capstone tracer.
// Ported verbatim from the validated single-file build.
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const LNAME = { 3:'numbers',4:'arithmetic',5:'meaning',6:'cpu',7:'memory',9:'network',10:'cloud' };
export const LCLASS = { 3:'t-num',4:'t-num',5:'t-mean',6:'t-sys',7:'t-sys',9:'t-sys',10:'t-sys' };

// ---- structure renderers (return HTML strings; safe, no user input) ----
function renderHash(st){
  const op=st.op;
  const fn=op?(op.type==='insert'?'insert: ':op.type==='hit'?'lookup: ':'probe: ')+
    'hash('+op.key+') = '+op.key+' % 8 = bucket '+op.bucket+(op.type==='hit'?'  → walk chain → ✓ match':'')+(op.collision?'  ⚠ collision → chain it':'')
    :'the hash function turns a key into a bucket index — pure arithmetic on a number';
  const cells=st.buckets.map((chain,i)=>{
    const active=op&&op.bucket===i, hit=active&&op.type==='hit';
    const cls='bkt'+(chain.length?' filled':'')+(active?(hit?' hit':' active'):'');
    const ents=chain.length?chain.map((e,ci)=>`<span class="bent${hit&&op.chainIndex===ci?' m':''}">${e.k}→${e.v}</span>`).join(''):'<span class="bent dotc">·</span>';
    return `<div class="${cls}"><div class="bn">bkt ${i}</div><div class="bents">${ents}</div></div>`;
  }).join('');
  return `<div class="hashfn">${esc(fn)}</div><div class="buckets">${cells}</div>`;
}
function renderWindow(st){
  const cells=st.arr.map((v,i)=>{
    const inwin=i>=st.lo&&i<=st.hi, ismid=i===st.mid; const marks=[];
    if(i===st.lo)marks.push('lo'); if(i===st.hi)marks.push('hi'); if(ismid)marks.push('mid');
    return `<div class="wcell${inwin?'':' out'}${ismid?' mid':''}"><div class="wn">[${i}]</div><div class="wv">${v}</div><div class="wm">${marks.join(' ')}</div></div>`;
  }).join('');
  const fn=st.mid>=0?'window ['+st.lo+'..'+st.hi+']  ·  mid = ('+st.lo+'+'+st.hi+')/2 = '+st.mid+(st.compared?'  ·  compare arr['+st.mid+']='+st.arr[st.mid]+' vs target '+st.target:'')
    :'window ['+st.lo+'..'+st.hi+']  ('+(st.hi-st.lo+1)+' of '+st.arr.length+' still in play)';
  return `<div class="hashfn">${esc(fn)}</div><div class="buckets">${cells}</div>`;
}
const GPOS={A:[55,40],B:[150,28],C:[150,112],D:[252,40],E:[252,120]};
const GEDGES=[['A','B'],['A','C'],['B','D'],['C','D'],['C','E']];
function renderGraph(st){
  const COL={cur:'#5b9dff',vis:'#2ee6c0',q:'#ffb454'};
  const FR=st.frontier||st.queue||[];const FK=st.frontierKind||'queue';
  const stt=n=>n===st.current?'cur':st.visited.includes(n)?'vis':FR.includes(n)?'q':'';
  const edges=GEDGES.map(([a,b])=>{const p=GPOS[a],q=GPOS[b];return `<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" stroke="rgba(120,200,255,.22)" stroke-width="2"/>`;}).join('');
  const nodes=Object.entries(GPOS).map(([n,xy])=>{const s=stt(n),c=COL[s]||'#39465a';
    return `<circle cx="${xy[0]}" cy="${xy[1]}" r="15" fill="${s?c+'33':'#0d1623'}" stroke="${c}" stroke-width="2"/><text x="${xy[0]}" y="${xy[1]+4}" text-anchor="middle" font-family="monospace" font-size="13" fill="${s?c:'#9aa8ba'}">${n}</text>`;}).join('');
  const q=FR.length?FR.map(n=>`<span class="pchip"><span class="dot" style="background:#ffb454"></span>${n}</span>`).join(''):'<span class="csmini">empty</span>';
  const vis=st.visited.length?st.visited.map(n=>`<span class="pchip"><span class="dot" style="background:#2ee6c0"></span>${n}</span>`).join(''):'<span class="csmini">none</span>';
  return `<svg viewBox="0 0 310 150" style="width:100%;max-width:340px;height:auto">${edges}${nodes}</svg>`+
    `<div class="qrow" style="margin-top:10px"><div class="qlab">${FK==='stack'?'Stack · LIFO (top→)':'Queue · FIFO front→back'}</div><div class="qchips">${q}</div></div>`+
    `<div class="qrow"><div class="qlab">Visited</div><div class="qchips">${vis}</div></div>`;
}
function renderStack(st){
  if(!st.frames.length)return '<div class="csmini" style="padding:10px 2px">call stack empty</div>';
  return '<div class="csstack">'+st.frames.map((f,i)=>{
    const active=i===st.frames.length-1, cls='csframe'+(f.ret?' ret':(active?' act':''));
    const right=f.ret?`<span class="rv">returns ${f.val}</span>`:(f.n===0?'<span class="wait">base case → 0</span>':`<span class="wait">needs sum_to(${f.n-1})…</span>`);
    return `<div class="${cls}"><span class="fl">sum_to(${f.n}) &nbsp;<span style="color:var(--faint);font-size:11px">n=${f.n}</span></span>${right}</div>`;
  }).join('')+'</div>';
}
function renderArray(st){
  const cells=st.arr.map((v,i)=>{const c=(st.cells&&st.cells[i])||{};return `<div class="wcell ${c.role||''}"><div class="wn">[${i}]</div><div class="wv">${v}</div><div class="wm">${c.mark||''}</div></div>`;}).join('');
  return `<div class="hashfn">${esc(st.info||'')}</div><div class="buckets">${cells}</div>`;
}
export function renderStruct(s){const k=s.struct.kind;
  return k==='hash'?renderHash(s.struct):k==='window'?renderWindow(s.struct):k==='array'?renderArray(s.struct):k==='graph'?renderGraph(s.struct):k==='stack'?renderStack(s.struct):'';}

export const METHODS = {
  twosum:{ name:'Two Sum', header:'two_sum([2, 10, 7, 8], 18) → expect [1, 3]',
    intro:'This run is rigged so keys 2 and 10 collide in bucket 2 — watch the chain form, then get walked on lookup.',
    structLabel:'③ the hash · buckets in memory — collisions chain (layer 07)',
    src:['def two_sum(nums, target)','  seen = {}','  nums.each_with_index do |n, i|','    complement = target - n','    return [seen[complement], i] if seen.key?(complement)','    seen[n] = i','  end','end'],
    build(){ const nums=[2,10,7,8],target=18,buckets=Array.from({length:8},()=>[]),steps=[];
      const snap=()=>buckets.map(ch=>ch.map(e=>({...e})));
      const push=o=>steps.push({line:o.line,vars:{...o.vars},vm:o.vm||[],cpu:o.cpu||null,note:o.note,touches:o.touches||[],result:o.result!=null?o.result:null,finale:!!o.finale,struct:{kind:'hash',buckets:snap(),op:o.op||null}});
      let vars={nums:'['+nums.join(', ')+']',target,i:'–',n:'–',complement:'–'};
      push({line:0,vm:['method entry','push a stack frame'],vars,touches:[7],note:'call two_sum(['+nums.join(', ')+'], '+target+') — a frame is pushed'});
      push({line:1,vm:['newhash','setlocal seen'],vars,touches:[7],note:'allocate an empty hash — an 8-slot bucket array in memory'});
      for(let i=0;i<nums.length;i++){ const n=nums[i]; vars={...vars,i,n,complement:'–'};
        push({line:2,vm:['getarray nums['+i+']','setlocal n, i'],vars,touches:[3,7],cpu:{label:'array index → address',expr:'&nums['+i+'] = base + '+i+'×8'},note:'load nums['+i+'] → n='+n+', i='+i});
        const comp=target-n; vars={...vars,complement:comp};
        push({line:3,vm:['getlocal target','getlocal n','opt_minus'],vars,touches:[3,4,6],cpu:{label:'ALU subtract',expr:target+' − '+n+' = '+comp},note:'complement = '+target+' − '+n+' = '+comp+'  (the CPU adder runs)'});
        const b=((comp%8)+8)%8,chain=buckets[b]; let ci=-1; for(let k=0;k<chain.length;k++)if(chain[k].k===comp){ci=k;break;}
        const hit=ci>=0;
        push({line:4,vm:['opt_send :key?','branchif'],vars,touches:[3,4,7],cpu:{label:'hash → bucket (modulo)',expr:'hash('+comp+') = '+comp+' % 8 = bucket '+b},op:{type:hit?'hit':'probe',key:comp,bucket:b,chainIndex:ci},
          note:hit?'probe bucket '+b+' → walk its chain → key '+comp+' found ✓ (match!)':'probe bucket '+b+(chain.length?' → walk chain → '+comp+' not present':' → empty')+' → keep going'});
        if(hit){const j=chain[ci].v;
          push({line:4,vm:['opt_aref seen['+comp+'] → '+j,'newarray ['+j+', '+i+']','leave'],vars,touches:[7],result:[j,i],op:{type:'hit',key:comp,bucket:b,chainIndex:ci},note:'return [seen['+comp+'], '+i+'] = ['+j+', '+i+']'});
          push({line:4,vm:['pop frame','hand value up'],vars,touches:[10,9,5,3],result:[j,i],finale:true,note:'['+j+', '+i+'] climbs back up the layers — becomes bytes, a response, pixels'});
          return steps;}
        const bi=((n%8)+8)%8,collision=buckets[bi].length>0; buckets[bi].push({k:n,v:i});
        push({line:5,vm:['opt_aset seen[n]=i'],vars,touches:[3,4,7],cpu:{label:'hash → bucket (modulo)',expr:'hash('+n+') = '+n+' % 8 = bucket '+bi},op:{type:'insert',key:n,bucket:bi,chainIndex:buckets[bi].length-1,collision},
          note:collision?'bucket '+bi+' already holds a key → CHAIN '+n+' alongside it (a real collision!)':'insert seen['+n+'] = '+i+' into bucket '+bi});
      }
      push({line:7,vm:['return nil'],vars,touches:[],note:'no pair found → nil'}); return steps; } },
  bsearch:{ name:'Binary search', header:'bsearch([1, 3, 5, 7, 9, 11, 13], 9) → expect index 4',
    intro:'Each step throws away half of what is left — that is why a million sorted items take only ~20 probes.',
    structLabel:'③ the array · the search window halves each step (layer 07)',
    src:['def bsearch(arr, target)','  lo, hi = 0, arr.length - 1','  while lo <= hi','    mid = (lo + hi) / 2','    return mid if arr[mid] == target','    if arr[mid] < target','      lo = mid + 1','    else','      hi = mid - 1','    end','  end','  -1','end'],
    build(){ const arr=[1,3,5,7,9,11,13],target=9,steps=[]; let lo=0,hi=arr.length-1,mid=-1;
      const push=o=>steps.push({line:o.line,vars:{...o.vars},vm:o.vm||[],cpu:o.cpu||null,note:o.note,touches:o.touches||[],result:o.result!==undefined?o.result:null,finale:!!o.finale,struct:{kind:'window',arr:arr.slice(),lo,hi,mid:o.mid!==undefined?o.mid:mid,target,compared:!!o.compared}});
      let vars={arr:'['+arr.join(', ')+']',target,lo:'–',hi:'–',mid:'–'};
      push({line:0,vm:['method entry'],vars,touches:[7],note:'binary search needs a SORTED array — that is the whole premise'});
      vars={...vars,lo,hi}; push({line:1,vm:['setlocal lo=0','setlocal hi='+hi],vars,note:'whole array in play: lo=0, hi='+hi});
      while(lo<=hi){ mid=Math.floor((lo+hi)/2); vars={...vars,lo,hi,mid};
        push({line:3,vm:['opt_plus lo+hi','opt_div /2','setlocal mid'],vars,touches:[4],mid,cpu:{label:'ALU · midpoint',expr:'('+lo+' + '+hi+') / 2 = '+mid},note:'look at the middle of the window: mid='+mid});
        const eq=arr[mid]===target;
        push({line:4,vm:['opt_aref arr[mid]','opt_eq','branchif'],vars,touches:[3,4,7],mid,compared:true,cpu:{label:'ALU · compare',expr:'arr['+mid+'] = '+arr[mid]+(eq?' == ':(arr[mid]<target?' < ':' > '))+target},note:eq?'arr['+mid+'] = '+arr[mid]+' equals target ✓ — found at index '+mid:'arr['+mid+'] = '+arr[mid]+(arr[mid]<target?' is too small':' is too big')});
        if(eq){push({line:4,vm:['leave (return mid)'],vars,result:mid,mid,compared:true,note:'return '+mid});
          push({line:12,vm:['pop frame','hand value up'],vars,touches:[10,9,5,3],result:mid,finale:true,mid,note:'index '+mid+' climbs back up — becomes a row, JSON, pixels'});return steps;}
        if(arr[mid]<target){lo=mid+1; vars={...vars,lo}; push({line:6,vm:['opt_plus mid+1','setlocal lo'],vars,touches:[4],mid,cpu:{label:'discard left half',expr:'lo = '+mid+' + 1 = '+lo},note:'target is bigger → drop everything ≤ mid. half the array, gone.'});}
        else{hi=mid-1; vars={...vars,hi}; push({line:8,vm:['opt_minus mid-1','setlocal hi'],vars,touches:[4],mid,cpu:{label:'discard right half',expr:'hi = '+mid+' − 1 = '+hi},note:'target is smaller → drop everything ≥ mid. half the array, gone.'});}
      }
      push({line:11,vm:['return -1'],vars,touches:[],result:-1,finale:true,note:'window empty → not found → -1'}); return steps; } },
  bfs:{ name:'BFS', header:"bfs(graph, 'A') → visits A, B, C, D, E",
    intro:'The queue is the whole trick: FIFO order is exactly what makes this breadth-first instead of depth-first.',
    structLabel:'③ the graph + queue · the breadth-first frontier (layer 07)',
    src:['def bfs(graph, start)','  visited = [start]','  queue = [start]','  until queue.empty?','    node = queue.shift','    graph[node].each do |nbr|','      next if visited.include?(nbr)','      visited << nbr','      queue.push(nbr)','    end','  end','  visited','end'],
    build(){ const G={A:['B','C'],B:['A','D'],C:['A','D','E'],D:['B','C'],E:['C']},start='A',visited=[start],queue=[start],steps=[];
      const vstr=()=>'['+visited.join(', ')+']',qstr=()=>'['+queue.join(', ')+']';
      const push=o=>steps.push({line:o.line,vars:{...o.vars},vm:o.vm||[],cpu:null,note:o.note,touches:o.touches||[7],result:o.result||null,finale:!!o.finale,struct:{kind:'graph',visited:visited.slice(),queue:queue.slice(),current:o.current||null}});
      push({line:1,vm:['visited = [A]'],vars:{start,visited:vstr(),queue:qstr(),node:'–'},note:'seed visited with the start node A'});
      push({line:2,vm:['queue = [A]'],vars:{start,visited:vstr(),queue:qstr(),node:'–'},note:'seed the queue with A — the frontier to explore'});
      while(queue.length){ const cur=queue.shift();
        push({line:4,vm:['queue.shift → '+cur],vars:{start,visited:vstr(),queue:qstr(),node:cur},current:cur,touches:[7],note:'dequeue '+cur+' from the front — explore its neighbors'});
        for(const nbr of G[cur]){
          if(visited.includes(nbr)){push({line:6,vm:['visited.include?('+nbr+') → true','next'],vars:{start,visited:vstr(),queue:qstr(),node:cur},current:cur,touches:[7],note:nbr+' already visited → skip'});}
          else{visited.push(nbr);queue.push(nbr);push({line:8,vm:['visited << '+nbr,'queue.push('+nbr+')'],vars:{start,visited:vstr(),queue:qstr(),node:cur},current:cur,touches:[7,5],note:'discover '+nbr+' → mark visited, enqueue to explore later'});}
        }
      }
      push({line:11,vm:['queue empty → return visited'],vars:{start,visited:vstr(),queue:'[]',node:'–'},touches:[10,9,5,3],result:visited.slice(),finale:true,note:'queue empty → done. order visited: '+visited.join(' → ')}); return steps; } },
  recursion:{ name:'Recursion', header:'sum_to(4) → 4 + 3 + 2 + 1 + 0 = 10',
    intro:'Recursion is the call stack made visible — it descends to the base case, then every frame returns on the way back up.',
    structLabel:'③ the call stack · frames push, then pop on the way up (layer 07)',
    src:['def sum_to(n)','  return 0 if n == 0','  n + sum_to(n - 1)','end'],
    build(){ const frames=[],steps=[]; const snap=()=>frames.map(f=>({...f}));
      const push=o=>steps.push({line:o.line,vars:{...o.vars},vm:o.vm||[],cpu:o.cpu||null,note:o.note,touches:o.touches||[],result:o.result!==undefined?o.result:null,finale:!!o.finale,struct:{kind:'stack',frames:snap()}});
      (function rec(n){ frames.push({n,val:null,ret:false});
        push({line:0,vm:['push frame','remember n='+n],vars:{n},touches:[7],note:'call sum_to('+n+') → push a frame holding n='+n});
        push({line:1,vm:['getlocal n','opt_eq 0?','branchif'],vars:{n},touches:[4],cpu:{label:'compare',expr:'n == 0 ?  → '+(n===0)},note:n===0?'base case: n is 0 → return 0':'n is '+n+', not 0 → must recurse deeper first'});
        let r;
        if(n===0){frames[frames.length-1].val=0;frames[frames.length-1].ret=true;push({line:1,vm:['leave (return 0)'],vars:{n},touches:[7],note:'sum_to(0) returns 0 — the bottom of the recursion'});r=0;}
        else{const sub=rec(n-1);const v=n+sub;frames[frames.length-1].val=v;frames[frames.length-1].ret=true;push({line:2,vm:['opt_plus n + sum_to(n-1)','leave'],vars:{n},touches:[3,4,7],cpu:{label:'ALU add',expr:n+' + '+sub+' = '+v},note:'now sum_to('+n+') finishes: '+n+' + '+sub+' = '+v+' → return up'});r=v;}
        frames.pop(); return r;
      })(4);
      push({line:3,vm:['all frames popped'],vars:{n:'–'},touches:[10,9,5,3],result:10,finale:true,note:'every frame has returned — sum_to(4) = 10 climbs back up the layers'}); return steps; } }
};
export const METHOD_ORDER = ['twosum','bsearch','bfs','recursion'];


// ---- additional traced methods (appended) ----
const MORE = {
  twopointer:{ name:'Two-pointer', header:'sorted two-sum([2, 5, 8, 11, 15], 16) → expect [1, 3]',
    intro:'Same problem as the hash Two Sum, but on a SORTED array — two pointers squeeze in from both ends with O(1) extra space.',
    structLabel:'③ the array · two pointers converge from the ends (layer 07)',
    src:['def two_sum_sorted(arr, target)','  lo, hi = 0, arr.length - 1','  while lo < hi','    s = arr[lo] + arr[hi]','    return [lo, hi] if s == target','    s < target ? lo += 1 : hi -= 1','  end','end'],
    build(){ const arr=[2,5,8,11,15],target=16,steps=[]; let lo=0,hi=arr.length-1;
      const cells=(cmp)=>arr.map((_,i)=>{let role='',mark=''; if(i<lo||i>hi)role='dimx'; if(i===lo)mark='L'; if(i===hi)mark=(mark?mark+' ':'')+'R'; if(cmp&&(i===lo||i===hi))role='cmp'; return {role,mark};});
      const push=o=>steps.push({line:o.line,vars:{...o.vars},vm:o.vm||[],cpu:o.cpu||null,note:o.note,touches:o.touches||[],result:o.result!==undefined?o.result:null,finale:!!o.finale,struct:{kind:'array',arr:arr.slice(),cells:o.cells,info:o.info}});
      let vars={arr:'['+arr.join(', ')+']',target,lo,hi,sum:'–'};
      push({line:0,vm:['method entry'],vars,touches:[7],note:'a SORTED array lets two pointers replace the hash — no extra memory',cells:cells(),info:'lo='+lo+'  hi='+hi});
      push({line:1,vm:['setlocal lo=0','setlocal hi='+hi],vars,note:'pointers start at both ends',cells:cells(),info:'lo='+lo+'  hi='+hi});
      while(lo<hi){ const sm=arr[lo]+arr[hi]; vars={...vars,lo,hi,sum:sm};
        push({line:3,vm:['arr[lo]','arr[hi]','opt_plus'],vars,touches:[3,4,7],cpu:{label:'ALU add',expr:arr[lo]+' + '+arr[hi]+' = '+sm},note:'sum the ends: '+arr[lo]+' + '+arr[hi]+' = '+sm,cells:cells(true),info:'arr[lo]+arr[hi] = '+sm+' vs target '+target});
        if(sm===target){
          push({line:4,vm:['opt_eq','leave'],vars,touches:[3,4],result:[lo,hi],cells:cells(true),info:'match! '+sm+' == '+target,note:'return ['+lo+', '+hi+']'});
          push({line:7,vm:['pop frame','hand value up'],vars,touches:[10,9,5,3],result:[lo,hi],finale:true,cells:cells(true),info:'done',note:'['+lo+', '+hi+'] climbs back up the layers'}); return steps; }
        if(sm<target){lo++; vars={...vars,lo}; push({line:5,vm:['lo += 1'],vars,touches:[4],note:'sum too small → move lo right to grow it',cells:cells(),info:'lo → '+lo});}
        else {hi--; vars={...vars,hi}; push({line:5,vm:['hi -= 1'],vars,touches:[4],note:'sum too big → move hi left to shrink it',cells:cells(),info:'hi → '+hi});}
      }
      push({line:7,vm:['return nil'],vars,touches:[],note:'pointers met → no pair',cells:cells(),info:'lo >= hi'}); return steps; } },

  sliding:{ name:'Sliding window', header:'max_window([2, 1, 5, 1, 3, 2], 3) → expect 9',
    intro:'Find the best window of k items without re-adding the whole window each move — add the entering item, drop the leaving one.',
    structLabel:'③ the array · a fixed-width window slides right (layer 07)',
    src:['def max_window(arr, k)','  sum = arr[0...k].sum','  best = sum','  (k...arr.length).each do |r|','    sum += arr[r] - arr[r - k]','    best = [best, sum].max','  end','  best','end'],
    build(){ const arr=[2,1,5,1,3,2],k=3,steps=[];
      const win=(L,R,cur)=>arr.map((_,i)=>{let role='',mark=''; if(i>=L&&i<=R)role='win'; if(cur!=null&&i===cur)role='cmp'; if(i===L)mark='L'; if(i===R)mark=(mark?mark+' ':'')+'R'; return {role,mark};});
      const push=o=>steps.push({line:o.line,vars:{...o.vars},vm:o.vm||[],cpu:o.cpu||null,note:o.note,touches:o.touches||[],result:o.result!==undefined?o.result:null,finale:!!o.finale,struct:{kind:'array',arr:arr.slice(),cells:o.cells,info:o.info}});
      let sum=arr.slice(0,k).reduce((a,b)=>a+b,0),best=sum;
      let vars={arr:'['+arr.join(', ')+']',k,sum,best};
      push({line:1,vm:['arr[0...k].sum'],vars,touches:[3,4,7],cpu:{label:'ALU sum',expr:arr.slice(0,k).join(' + ')+' = '+sum},note:'seed: sum the first '+k+' items = '+sum,cells:win(0,k-1),info:'window [0..'+(k-1)+'] sum = '+sum});
      push({line:2,vm:['best = sum'],vars,note:'best so far = '+best,cells:win(0,k-1),info:'best = '+best});
      for(let r=k;r<arr.length;r++){ const added=arr[r],removed=arr[r-k]; sum+=added-removed; const L=r-k+1; const nb=Math.max(best,sum); vars={...vars,sum,best:nb};
        push({line:4,vm:['sum += arr[r] - arr[r-k]'],vars,touches:[3,4,7],cpu:{label:'ALU slide',expr:'sum + '+added+' − '+removed+' = '+sum},note:'slide right: add '+added+', drop '+removed+' → sum '+sum+'  (O(1), no re-summing)',cells:win(L,r,r),info:'window ['+L+'..'+r+'] sum = '+sum});
        if(sum>best){best=sum; push({line:5,vm:['best = max(best, sum)'],vars:{...vars,best},touches:[4],note:'new best window sum: '+best,cells:win(L,r),info:'best = '+best});}
      }
      push({line:7,vm:['return best'],vars:{...vars,best},touches:[10,9,5,3],result:best,finale:true,note:'best window sum = '+best+' climbs back up',cells:arr.map(()=>({role:'',mark:''})),info:'answer = '+best}); return steps; } },

  dfs:{ name:'DFS', header:"dfs(graph, 'A') → A, B, D, C, E",
    intro:'Same graph as BFS, but a LIFO stack instead of a queue — so it plunges deep before going wide. Watch the order differ.',
    structLabel:'③ the graph + stack · depth-first dives deep (layer 07)',
    src:['def dfs(graph, start)','  visited = []','  stack = [start]','  until stack.empty?','    node = stack.pop','    next if visited.include?(node)','    visited << node','    graph[node].reverse_each { |n| stack.push(n) }','  end','  visited','end'],
    build(){ const G={A:['B','C'],B:['A','D'],C:['A','D','E'],D:['B','C'],E:['C']},start='A',visited=[],stack=[start],steps=[];
      const vstr=()=>'['+visited.join(', ')+']',sstr=()=>'['+stack.join(', ')+']';
      const push=o=>steps.push({line:o.line,vars:{...o.vars},vm:o.vm||[],cpu:null,note:o.note,touches:o.touches||[7],result:o.result||null,finale:!!o.finale,struct:{kind:'graph',visited:visited.slice(),frontier:stack.slice(),frontierKind:'stack',current:o.current||null}});
      push({line:2,vm:['stack = [A]'],vars:{start,visited:vstr(),stack:sstr(),node:'–'},note:'seed an explicit LIFO stack with A'});
      while(stack.length){ const node=stack.pop();
        if(visited.includes(node)){push({line:5,vm:['stack.pop → '+node,'already visited → next'],vars:{start,visited:vstr(),stack:sstr(),node},current:node,note:node+' already visited → skip'});continue;}
        visited.push(node);
        push({line:6,vm:['stack.pop → '+node,'visited << '+node],vars:{start,visited:vstr(),stack:sstr(),node},current:node,touches:[7,5],note:'pop '+node+' → visit it'});
        for(const n of G[node].slice().reverse()) stack.push(n);
        push({line:7,vm:['push neighbors of '+node+' → '+G[node].join(', ')],vars:{start,visited:vstr(),stack:sstr(),node},current:node,note:'push '+node+"'s neighbors; the LAST pushed pops NEXT — that is what makes it go deep"});
      }
      push({line:9,vm:['stack empty → return visited'],vars:{start,visited:vstr(),stack:'[]',node:'–'},touches:[10,9,5,3],result:visited.slice(),finale:true,note:'DFS order: '+visited.join(' → ')+'   (BFS was A → B → C → D → E)'}); return steps; } },

  dp:{ name:'DP (memo)', header:'fib(6) → 8 (built from cached subproblems)',
    intro:'Dynamic programming = remember answers so you never recompute. The memo array fills left to right, each cell the sum of two cached neighbors.',
    structLabel:'③ the memo · a cache of solved subproblems (layer 07)',
    src:['def fib(n)','  memo = [0, 1]','  (2..n).each do |i|','    memo[i] = memo[i - 1] + memo[i - 2]','  end','  memo[n]','end'],
    build(){ const n=6,memo=[0,1],steps=[];
      const view=()=>{const a=[];for(let i=0;i<=n;i++)a.push(memo[i]!==undefined?memo[i]:'·');return a;};
      const cells=(cur)=>{const a=[];for(let i=0;i<=n;i++){a.push({role:i===cur?'cmp':(memo[i]!==undefined?'sorted':''),mark:i<=1&&memo[i]!==undefined?'base':(i===cur?'i':'')});}return a;};
      const push=o=>steps.push({line:o.line,vars:{...o.vars},vm:o.vm||[],cpu:o.cpu||null,note:o.note,touches:o.touches||[],result:o.result!==undefined?o.result:null,finale:!!o.finale,struct:{kind:'array',arr:view(),cells:o.cells,info:o.info}});
      let vars={n,i:'–'};
      push({line:1,vm:['memo = [0, 1]'],vars,touches:[7],note:'cache the two base cases so we never recompute a subproblem',cells:cells(-1),info:'memo seeded: fib(0)=0, fib(1)=1'});
      for(let i=2;i<=n;i++){ memo[i]=memo[i-1]+memo[i-2]; vars={...vars,i};
        push({line:3,vm:['memo[i-1] + memo[i-2]','memo[i] = …'],vars,touches:[3,4,7],cpu:{label:'ALU add',expr:'memo['+(i-1)+'] + memo['+(i-2)+'] = '+memo[i-1]+' + '+memo[i-2]+' = '+memo[i]},note:'fib('+i+') = fib('+(i-1)+') + fib('+(i-2)+') = '+memo[i]+'   (both already cached → O(1))',cells:cells(i),info:'memo['+i+'] = '+memo[i]});
      }
      push({line:5,vm:['return memo[n]'],vars:{...vars,i:n},touches:[10,9,5,3],result:memo[n],finale:true,note:'fib('+n+') = '+memo[n]+' — assembled from cached subproblems, zero recomputation',cells:cells(-1),info:'answer = memo['+n+'] = '+memo[n]}); return steps; } },

  insort:{ name:'Insertion sort', header:'insertion_sort([5, 2, 4, 1, 3]) → [1, 2, 3, 4, 5]',
    intro:'Grow a sorted prefix one item at a time, sliding each new element left past everything larger than it.',
    structLabel:'③ the array · a sorted prefix grows in place (layer 07)',
    src:['def insertion_sort(arr)','  (1...arr.length).each do |i|','    key = arr[i]','    j = i - 1','    while j >= 0 && arr[j] > key','      arr[j + 1] = arr[j]','      j -= 1','    end','    arr[j + 1] = key','  end','  arr','end'],
    build(){ const arr=[5,2,4,1,3],steps=[];
      const cells=(sortedUpto,key,cmp)=>arr.map((_,i)=>{let role='',mark=''; if(i<=sortedUpto)role='sorted'; if(i===key){role='cmp';mark='key';} if(cmp!=null&&i===cmp)role='cmp'; return {role,mark};});
      const push=o=>steps.push({line:o.line,vars:{...o.vars},vm:o.vm||[],cpu:o.cpu||null,note:o.note,touches:o.touches||[],result:o.result!==undefined?o.result:null,finale:!!o.finale,struct:{kind:'array',arr:arr.slice(),cells:o.cells,info:o.info}});
      let vars={arr:'['+arr.join(', ')+']'};
      push({line:0,vm:['method entry'],vars,touches:[7],note:'arr[0] alone is trivially sorted — grow that prefix',cells:cells(0),info:'sorted prefix: [0..0]'});
      for(let i=1;i<arr.length;i++){ const key=arr[i]; vars={arr:'['+arr.join(', ')+']',i,key};
        push({line:2,vm:['key = arr['+i+'] = '+key],vars,touches:[7],note:'take arr['+i+']='+key+', slide it left into the sorted part',cells:cells(i-1,i),info:'key = '+key});
        let j=i-1;
        while(j>=0&&arr[j]>key){
          push({line:4,vm:['arr['+j+'] ('+arr[j]+') > key ('+key+') ?  yes'],vars:{...vars,j},touches:[4],cpu:{label:'ALU compare',expr:arr[j]+' > '+key+'  → shift right'},note:arr[j]+' > '+key+' → shift it one slot right',cells:cells(i-1,i,j),info:'compare arr['+j+']='+arr[j]+' vs key '+key});
          arr[j+1]=arr[j]; j--;
        }
        arr[j+1]=key;
        push({line:8,vm:['arr['+(j+1)+'] = key'],vars:{arr:'['+arr.join(', ')+']',i,key},touches:[7],note:'drop '+key+' into place → prefix [0..'+i+'] now sorted',cells:cells(i),info:'inserted '+key});
      }
      push({line:10,vm:['return arr'],vars:{arr:'['+arr.join(', ')+']'},touches:[10,9,5,3],result:'['+arr.join(', ')+']',finale:true,note:'fully sorted: ['+arr.join(', ')+']',cells:arr.map(()=>({role:'sorted',mark:''})),info:'done'}); return steps; } }
};
Object.assign(METHODS, MORE);
METHOD_ORDER.push('twopointer','sliding','dfs','dp','insort');
