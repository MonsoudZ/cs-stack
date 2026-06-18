// "Check your understanding" questions per deep dive, keyed by stack slug.
// Each stack maps to a LIST of questions tiered easy → medium → hard (a legacy
// single-question object is also accepted and treated as one tier). Exactly one
// option per question has `correct: true`, and every option carries a `why` so
// each choice gives feedback. The slug doubles as the /learn progress key, so a
// correct answer on any tier marks that lesson done.
export const quizzes = {
  silicon: [
    {
      level: 'easy',
      question: 'Pure silicon barely conducts. What does doping it with phosphorus (n-type) add?',
      options: [
        { label: 'Free electrons that can carry current', correct: true, why: 'Phosphorus has 5 outer electrons; 4 fill the bonds and the 5th is left free to move — negative carriers.' },
        { label: 'Holes — missing electrons that act positive', why: 'That’s p-type doping (e.g. boron, with 3 outer electrons). Phosphorus adds electrons, not holes.' },
        { label: 'Extra protons in the nucleus', why: 'Doping changes outer (valence) electrons available to conduct, not the nucleus.' },
        { label: 'An insulating layer', why: 'Doping makes silicon conduct better, not worse — it seeds mobile charge carriers.' },
      ],
    },
    { level: 'medium', question: 'In a CMOS gate, why does dynamic switching power scale as roughly C·V²·f?', options: [
      { label: 'Each transition charges/discharges the load capacitance C through the supply, so energy per switch is ∝CV² and power is that times the switching frequency f', correct: true, why: 'Charging a capacitor to V stores ½CV² and an equal amount is dissipated, so every 0→1→0 cycle costs ≈CV²; multiply by how often it switches (f) for power — which is why halving V cut power far more than it cut speed.' },
      { label: 'Resistive heating dominates because current flows steadily through the channel while idle', why: 'That describes static leakage, not dynamic power; an idle CMOS gate ideally passes almost no steady current — the V² term comes from charging capacitance on each switch.' },
      { label: 'Power rises linearly with voltage because of Ohm’s law across the gate', why: 'The dependence on supply voltage is quadratic, not linear: energy stored in the load capacitance goes as V², which is exactly why lowering V was such a powerful efficiency lever.' },
      { label: 'It scales with V² only because higher voltage melts more transistors', why: 'The V² is the capacitor charging energy ½CV², a normal circuit effect, not thermal damage; the formula holds well below any failure point.' },
    ] },
    { level: 'hard', question: 'As transistors shrank, supply voltage V dropped — and to keep them fast, threshold voltage V_th had to drop too. Why did this make static leakage a first-class problem?', options: [
      { label: 'Sub-threshold leakage rises exponentially as V_th falls, so lowering V_th to preserve speed at low V caused idle leakage current to balloon', correct: true, why: 'A MOSFET isn’t a perfect switch — below V_th it conducts a small sub-threshold current that grows exponentially as V_th drops, so the V_th reductions that kept gates fast turned once-negligible leakage into a dominant share of chip power (the end of Dennard scaling).' },
      { label: 'Lower V_th increased dynamic switching power, which is what leakage measures', why: 'Leakage is static current that flows even when nothing switches; dynamic power (CV²f) is a separate term, and lowering V actually reduced it.' },
      { label: 'Smaller transistors switch faster, and faster switching is by definition more leakage', why: 'Switching speed relates to dynamic power, not leakage; leakage is the current drawn while idle, driven by sub-threshold conduction and gate tunnelling.' },
      { label: 'Leakage only appears once clock frequency exceeds a few GHz', why: 'Leakage is largely independent of clock rate — it flows even in idle, unclocked gates; its rise was driven by shrinking V_th and thinning gate oxides, not frequency.' },
    ] },
  ],
  logic: [
    {
      level: 'easy',
      question: 'Why is NAND called a “universal” gate?',
      options: [
        { label: 'Every other gate can be built from NAND alone', correct: true, why: 'NOT, AND, OR — and therefore any circuit — can be composed from NAND gates, so one repeated gate suffices.' },
        { label: 'It’s the fastest gate to switch', why: 'Universality is about functional completeness, not speed.' },
        { label: 'It uses exactly one transistor', why: 'A CMOS NAND takes four transistors; “universal” refers to what it can express.' },
        { label: 'CPUs are only allowed to use NAND', why: 'Chips use many gate types; NAND is just provably sufficient on its own.' },
      ],
    },
    { level: 'medium', question: 'NAND is universal — but it isn’t the only such gate. Which other single gate can build every boolean function on its own?', options: [
      { label: 'NOR', correct: true, why: 'NOR is the other functionally complete two-input gate: NOT, AND, and OR can all be built from NOR alone, just as with NAND — and by De Morgan duality the two are mirror images.' },
      { label: 'XOR', why: 'XOR can’t build NOT from a fixed input or produce a needed constant on its own, so it isn’t functionally complete by itself.' },
      { label: 'AND', why: 'AND can never produce a 1 from all-0 inputs and can’t invert, so it can’t build NOT — without NOT it isn’t universal.' },
      { label: 'OR', why: 'OR alone can’t invert (it can’t build NOT), so like AND it falls short of functional completeness on its own.' },
    ] },
    { level: 'hard', question: 'A 2:1 mux built as (a AND NOT s) OR (b AND s) flickers to a wrong value for a moment when s changes, even though a and b are steady. What is going on?', options: [
      { label: 'A static hazard: the two paths through the gates have different propagation delays, so for an instant after s flips both AND terms can momentarily read 0 before the circuit settles', correct: true, why: 'When a = b = 1 and s switches, NOT s and the two paths don’t update simultaneously; the unequal delays let the output dip through 0 before settling — a glitch that’s correct in steady state but transiently wrong.' },
      { label: 'The boolean expression is simply wrong and doesn’t implement a mux', why: 'The expression is the correct sum-of-products for a 2:1 mux; the transient is a timing artifact of real gate delays, not a logic error.' },
      { label: 'The select line s is being read as a third data input', why: 'No — s correctly gates the two terms; the flicker is a propagation-delay hazard, present even when the wiring is exactly right.' },
      { label: 'Floating-point rounding in the select logic', why: 'There’s no arithmetic or floating point here — just gates; the cause is differing path delays producing a momentary glitch.' },
    ] },
  ],
  numbers: [
    {
      level: 'easy',
      question: 'Why isn’t 0.1 + 0.2 exactly 0.3 in floating point?',
      options: [
        { label: '0.1 and 0.2 have no exact binary form, so each is rounded — and the sum rounds again', correct: true, why: 'Like ⅓ in decimal, tenths repeat forever in base 2; the stored values are a hair off, and the rounded sum lands on a different double than stored 0.3.' },
        { label: 'Floating-point hardware has bugs', why: 'It’s behaving exactly to spec (IEEE-754); the “error” is unavoidable rounding, not a defect.' },
        { label: 'Because 0.3 is a prime number', why: '0.3 isn’t an integer, let alone prime; the issue is binary representability.' },
        { label: 'Integer overflow wraps the result', why: 'No overflow is involved — these are fractional values, rounded to the nearest representable double.' },
      ],
    },
    {
      level: 'medium',
      question: 'A double has 52 stored mantissa bits. Above which value can it no longer represent every integer exactly?',
      options: [
        { label: '2⁵³ — past it, the gap between consecutive doubles exceeds 1, so some integers round to a neighbour', correct: true, why: 'The implicit leading 1 gives 53 significant bits, so every integer up to 2⁵³ is exact; beyond it the spacing (the ulp) is ≥ 2, and odd integers can’t be stored.' },
        { label: '2³², the limit of a 32-bit integer', why: 'That’s the range of a 32-bit int — unrelated to a 64-bit double’s mantissa, which stays integer-exact far past 2³².' },
        { label: 'There is no limit — doubles represent every integer', why: 'Only finitely many bit patterns exist; once the gap between representable values exceeds 1, integers must round.' },
        { label: '2⁵², the number of stored mantissa bits', why: 'Off by one: the hidden leading 1 bit makes 53 significant bits, so the exact-integer limit is 2⁵³, not 2⁵².' },
      ],
    },
    {
      level: 'hard',
      question: 'For a large double x, why can `x + 1.0 == x` evaluate to true?',
      options: [
        { label: 'Near x the spacing between representable doubles is larger than 1, so adding 1.0 rounds straight back to x', correct: true, why: 'This is absorption: when the ulp at x exceeds the value being added, the small operand falls below the rounding threshold and is lost entirely.' },
        { label: 'The literal 1.0 underflows to zero before the addition', why: 'Underflow is about values too small to represent near zero; 1.0 is fine. The loss happens in the rounding of the sum, not the operand.' },
        { label: 'Comparing floats with == is simply undefined behaviour', why: '== on floats is well-defined; here it’s correctly reporting that the rounded sum equals x.' },
        { label: 'The compiler optimizes away any “+ 1.0”', why: 'It can’t — the result genuinely depends on x; for small x, x + 1.0 ≠ x. The effect is numeric (absorption), not a compiler trick.' },
      ],
    },
  ],
  cpu: [
    {
      level: 'easy',
      question: 'What does pipelining improve?',
      options: [
        { label: 'Throughput — it retires roughly one instruction per cycle by overlapping stages', correct: true, why: 'A single instruction still takes all its stages; pipelining keeps every stage busy so many instructions are in flight at once.' },
        { label: 'The latency of a single instruction', why: 'One instruction isn’t faster end-to-end — the win is overlap across many instructions.' },
        { label: 'It lowers the clock speed', why: 'Pipelining is about doing more per clock, not changing the clock.' },
        { label: 'It removes the need for an ALU', why: 'The ALU still does the arithmetic; the pipeline just schedules the stages around it.' },
      ],
    },
    { level: 'medium', question: 'A pipeline overlaps instructions, but `add` needs a value `sub` hasn’t written back yet. What does forwarding do that stalling doesn’t?', options: [
      { label: 'Routes the result straight from one pipeline stage to the next before it’s written back, so no bubble is needed', correct: true, why: 'Forwarding (bypassing) wires the freshly-computed value directly to the dependent stage, avoiding the wasted cycles a stall would insert.' },
      { label: 'Reorders the program so the dependent instruction runs first', why: 'That’s out-of-order scheduling, a different mechanism; forwarding leaves order alone and just moves the value early.' },
      { label: 'Predicts the value the instruction will need', why: 'That’s value prediction, which is exotic and speculative; forwarding uses the real, already-computed result.' },
      { label: 'Lowers the clock so the value has time to settle', why: 'Forwarding doesn’t touch the clock; it shortens the data path the value travels, not the cycle time.' },
    ] },
    { level: 'hard', question: 'Computing `0x7F + 0x01` in an 8-bit ALU, which flags are set?', options: [
      { label: 'V set, C clear — signed overflow (127+1 → −128) but no unsigned carry out of bit 7', correct: true, why: 'Two positive signed inputs gave a negative result, so V is set; the unsigned sum 128 fits in 8 bits with no carry out, so C is clear.' },
      { label: 'C set, V clear', why: 'That’s the `0xFF + 0x01` case (unsigned 255+1 wraps, but signed −1+1=0 is correct). Here it’s the reverse.' },
      { label: 'Both C and V set', why: 'C would require a carry out of bit 7, which 127+1 doesn’t produce; only the signed interpretation overflows.' },
      { label: 'Neither set', why: 'The signed result is wrong (−128, not +128), so V must be set; the flags aren’t both clear.' },
    ] },
  ],
  compiler: [
    {
      level: 'easy',
      question: 'Type checking catches a class of bugs that parsing can’t. Which?',
      options: [
        { label: 'Programs that parse fine but are meaningless, like multiplying a string by a number', correct: true, why: 'Parsing only checks grammar/structure; type checking (semantic analysis) checks that operations make sense for their operand types.' },
        { label: 'Missing semicolons and typos', why: 'Those are lexing/parsing concerns, caught earlier.' },
        { label: 'Code that runs too slowly', why: 'That’s the optimizer’s domain, not type checking.' },
        { label: 'Unreachable dead code', why: 'Dead-code removal is an optimization; type checking is about meaning, not reachability.' },
      ],
    },
    { level: 'medium', question: 'Why do most optimizing compilers convert the IR to SSA (static single-assignment) form before running passes?', options: [
      { label: 'Each variable is assigned exactly once, so a value has one definition — making constant propagation and dead-code elimination almost trivial', correct: true, why: 'With a single definition per name, “what is this value?” has one answer to fold or delete; φ (phi) nodes reconcile values where control flow merges.' },
      { label: 'SSA lets the program use unlimited registers, so register allocation can be skipped entirely', why: 'SSA uses unlimited value names, but those still must be mapped onto real registers afterwards — it simplifies computing live ranges, it doesn’t remove allocation.' },
      { label: 'It guarantees the optimized program runs in O(1) time', why: 'No transform changes a program’s asymptotic complexity for free; SSA is about making analyses easier, not magically speeding the program up.' },
      { label: 'SSA encrypts the IR so the optimizer’s output can’t be reverse-engineered', why: 'SSA is a plain analysis-friendly form, not a security or obfuscation mechanism — it has nothing to do with encryption.' },
    ] },
    { level: 'hard', question: 'A JIT compiles a hot function assuming a variable is always an integer, then later sees a string. What happens?', options: [
      { label: 'A guard fails and the JIT deoptimizes — discarding the specialized code and resuming in the interpreter, rebuilding its stack frame', correct: true, why: 'Speculative JITs plant guards that check their assumptions; on failure they fall back (“bail out”) to the interpreter mid-execution so the program stays correct.' },
      { label: 'The program crashes, because the compiled machine code can only handle integers', why: 'The whole point of guards is to avoid that — a failed guard triggers deoptimization, not a crash.' },
      { label: 'The result is silently wrong, since the optimized code reinterprets the string’s bytes as an integer', why: 'Speculation is guarded precisely so it’s never silently wrong; the guard detects the type change before the bad code runs.' },
      { label: 'The JIT recompiles instantly with no cost, so hot code is always optimal', why: 'Deopt and recompilation have real cost (warm-up, thrashing if types keep changing); it’s a correctness fallback, not a free re-specialization.' },
    ] },
  ],
  languages: [
    {
      level: 'easy',
      question: 'Rust gives you memory safety without a garbage collector. How does it free heap memory?',
      options: [
        { label: 'The compiler tracks a single owner per value and frees it when the owner leaves scope', correct: true, why: 'Ownership + the borrow checker let the compiler prove at build time exactly when each value is dropped — no GC, no manual free, and use-after-free or double-free won’t compile.' },
        { label: 'It runs a garbage collector, just a faster one', why: 'Rust has no garbage collector at all; reclamation is decided at compile time, not by a runtime collector.' },
        { label: 'You call free() yourself, exactly like C', why: 'That’s manual management (C). In Rust the drop is inserted automatically by the compiler when the owner goes out of scope.' },
        { label: 'It never frees — the OS reclaims everything when the program exits', why: 'That would leak for any long-running program; Rust frees each value deterministically as its owner is dropped.' },
      ],
    },
    { level: 'medium', question: 'What does Python’s Global Interpreter Lock (GIL) actually guarantee?', options: [
      { label: 'Only one thread executes Python bytecode at a time, so CPU-bound threads can’t use multiple cores', correct: true, why: 'The GIL serializes bytecode execution (simplifying the interpreter’s reference counting); it’s released during blocking I/O, which is why I/O-bound threads still help.' },
      { label: 'Python programs can never run more than one thread', why: 'Python can spawn many real OS threads; the GIL limits which one runs bytecode at any instant, it doesn’t prevent creating them.' },
      { label: 'Memory is fully thread-safe, so locks are never needed', why: 'The GIL protects interpreter internals, not your data structures; multi-step operations still need explicit locks to be atomic.' },
      { label: 'Garbage collection is paused while any thread runs', why: 'GC isn’t globally tied to thread execution this way; the GIL is about bytecode execution, and the no-GIL effort aims to remove exactly that constraint.' },
    ] },
    { level: 'hard', question: 'What is the core tradeoff between implementing generics by monomorphization (C++/Rust) versus type erasure (Java)?', options: [
      { label: 'Monomorphization emits a specialized copy per concrete type — fast, inlinable code but code bloat and slower builds; erasure compiles one shared version and drops type parameters at runtime — small binaries but boxing and lost runtime type info', correct: true, why: 'This is the canonical distinction: specialization trades binary size and compile time for speed, erasure trades runtime type information and boxing overhead for compactness.' },
      { label: 'Monomorphization checks types at runtime while erasure checks them at compile time', why: 'Both approaches type-check at compile time; they differ in what survives into the generated code, not when checking happens.' },
      { label: 'Erasure produces faster code because there’s only one optimized version to run', why: 'Erasure usually adds boxing and prevents per-type inlining, so monomorphized code is typically the faster one.' },
      { label: 'Only monomorphization can express generic code; erasure requires casting everything to Object by hand', why: 'Both express generics in the source; erasure inserts casts automatically and retains compile-time safety — the programmer doesn’t write them.' },
    ] },
  ],
  memory: [
    {
      level: 'easy',
      question: 'A cache miss loads a whole line of neighbouring addresses, not just the one byte you asked for. Why?',
      options: [
        { label: 'Spatial locality — programs usually touch nearby addresses next', correct: true, why: 'Fetching the neighbours bets that the next accesses are close by, turning one slow miss into several fast hits.' },
        { label: 'To fill up unused RAM', why: 'It’s about speed, not filling memory; the cache is tiny and evicts.' },
        { label: 'Because a byte is actually 64 bits', why: 'A byte is 8 bits; line size is a locality choice, unrelated to byte width.' },
        { label: 'To save power', why: 'The motivation is latency via locality, not power.' },
      ],
    },
    { level: 'medium', question: 'A loop strides through memory and suddenly slows down at one specific power-of-two stride, even though the cache is mostly empty. What’s happening?', options: [
      { label: 'Conflict misses — those addresses all map to the same set, so they evict each other while other sets sit idle', correct: true, why: 'A set-associative cache indexes by middle address bits; a bad power-of-two stride lands repeatedly on one set and exhausts its few ways.' },
      { label: 'Capacity misses — the working set is too big for the cache', why: 'Capacity misses don’t hinge on a specific stride; the tell here is that an unlucky alignment hurts while the cache stays mostly empty.' },
      { label: 'Compulsory misses on first touch', why: 'Cold misses happen once per line regardless of stride; they don’t explain a slowdown that appears only at one alignment.' },
      { label: 'The TLB is thrashing', why: 'TLB thrashing is about touching many pages, not about a stride colliding within one cache set.' },
    ] },
    { level: 'hard', question: 'Two threads on different cores each increment their own separate counter, yet the code runs far slower than expected. The counters share one 64-byte cache line. Why does that matter?', options: [
      { label: 'False sharing — each write must take exclusive ownership of the line, invalidating the other core’s copy, so the line ping-pongs between caches', correct: true, why: 'Coherence (MESI) works at line granularity; even though the variables are independent, every write invalidates the whole shared line on the other core.' },
      { label: 'There’s a data race that needs a lock', why: 'The variables are distinct, so there’s no logical race; the cost is coherence traffic, not a correctness bug, and a lock would only add overhead.' },
      { label: 'The cache is too small to hold both counters', why: 'Two integers trivially fit; the problem is that they fall on the same line, not capacity.' },
      { label: 'Incrementing forces a write-through to RAM each time', why: 'Write-back caches don’t hit RAM per write; the slowdown is inter-core line ownership transfer, not memory bandwidth.' },
    ] },
  ],
  structures: [
    {
      level: 'easy',
      question: 'When is a linked list a better fit than an array?',
      options: [
        { label: 'Frequent insert/remove at a known spot — it’s O(1) with no shifting', correct: true, why: 'Splicing a node is two pointer writes; an array would have to shift every later element.' },
        { label: 'Random access by index', why: 'That’s the array’s strength — O(1) by index; a list must walk the chain (O(n)).' },
        { label: 'Cache-friendly sequential iteration', why: 'Arrays win here — contiguous memory; list nodes are scattered.' },
        { label: 'Binary search', why: 'Binary search needs O(1) indexing into sorted data — an array, not a list.' },
      ],
    },
    { level: 'medium', question: 'Appending to a dynamic array is “amortized O(1)” even though resizing copies everything. What does that actually claim?', options: [
      { label: 'Averaged over a sequence of appends the per-append cost is constant — n appends cost under 2n copies total — but a single append can still stall for O(n)', correct: true, why: 'Geometric growth makes total copies sum to under 2n, so the average is constant; amortized is not worst-case, which is why latency-sensitive code reserves capacity up front.' },
      { label: 'Every individual append, including the one that triggers a resize, runs in constant time', why: 'That’s the common misreading — the resizing append genuinely does O(n) work; the O(1) is only the average across many appends.' },
      { label: 'The array never actually has to copy, because doubling reuses the same memory block in place', why: 'Doubling allocates a new, larger block and copies the elements over; the old block can’t simply grow in place.' },
      { label: 'It means appends are O(1) only if you know the final size in advance', why: 'Knowing the size lets you skip resizes, but the amortized O(1) bound holds even without it — that’s the whole result.' },
    ] },
    { level: 'hard', question: 'A web service stores untrusted request keys in a hash map and suddenly grinds to a halt under a crafted payload. Most likely cause and fix?', options: [
      { label: 'A hash-flooding DoS — the attacker chose keys that all collide into one bucket, forcing O(n) lookups; fix with randomized keyed hashing like SipHash', correct: true, why: 'With a predictable hash, colliding keys collapse the map to a linear scan; a per-process seeded hash (SipHash) makes collisions unpredictable, which is why Python and Rust default to it.' },
      { label: 'The load factor got too high, so the fix is to simply never rehash', why: 'Backwards — rehashing is what keeps chains short as the map grows; disabling it would make things worse, and it doesn’t address adversarial collisions.' },
      { label: 'Hash maps are O(1) average but the service hit the rare O(log n) tree case', why: 'A hash map’s bad case is O(n), not O(log n); the slowdown is collisions degrading to a scan, and an attacker can force it deliberately.' },
      { label: 'The keys were too long to hash, overflowing the bucket array', why: 'Key length doesn’t overflow the bucket array (indices are taken mod capacity); the issue is many distinct keys mapping to the same bucket.' },
    ] },
  ],
  os: [
    {
      level: 'easy',
      question: 'What makes a system call slower than an ordinary function call?',
      options: [
        { label: 'It traps across the user/kernel boundary — a mode switch plus argument validation', correct: true, why: 'read() is really a trap into kernel mode; the CPU saves state, the kernel validates, then returns — far more than a plain call.' },
        { label: 'It’s always written in assembly', why: 'Language has nothing to do with it; the cost is the privileged-mode crossing.' },
        { label: 'It always reads from disk', why: 'Many syscalls never touch disk; the boundary crossing is the constant cost.' },
        { label: 'It allocates memory every time', why: 'Allocation isn’t inherent to a syscall; the mode switch and validation are.' },
      ],
    },
    { level: 'medium', question: 'Why is switching between two threads of the same process usually cheaper than switching between two separate processes?', options: [
      { label: 'Threads share one address space, so the page tables stay put and the TLB needn’t be flushed', correct: true, why: 'Only registers and the stack pointer swap; a process switch reloads the page-table base, which on plain x86 flushes the TLB and forces a burst of cold misses.' },
      { label: 'Threads don’t have their own registers, so there’s nothing to save', why: 'Each thread does have its own registers and stack — those are still saved and restored; the address space is what’s shared.' },
      { label: 'Thread switches happen entirely in user space, never entering the kernel', why: 'The kernel scheduler still runs the switch; the saving is the skipped address-space swap, not skipping the kernel.' },
      { label: 'Threads always run on the same core, so caches never go cold', why: 'Threads can migrate across cores; the reliable saving is avoiding the page-table reload and TLB flush, not core affinity.' },
    ] },
    { level: 'hard', question: 'On a crash, an ext-style filesystem in “ordered” journaling mode guarantees what about a file that was just being extended?', options: [
      { label: 'A recovered file never points at blocks it wasn’t given — data is forced to disk before the metadata commit', correct: true, why: 'Ordered mode journals only metadata but orders the data writes ahead of the commit, so a committed inode can’t reference stale or someone else’s blocks.' },
      { label: 'Both the file’s data and metadata are guaranteed fully written or fully absent', why: 'That’s full “journal” mode, which logs data too at the cost of writing everything twice; ordered mode doesn’t journal the data itself.' },
      { label: 'Nothing — ordered mode journals neither data nor metadata', why: 'It does journal metadata; what it adds over writeback is ordering the data writes before the metadata commit.' },
      { label: 'The file’s newly added bytes are guaranteed to survive the crash', why: 'The new data may be lost; the guarantee is consistency — the metadata won’t expose garbage — not durability of the latest bytes.' },
    ] },
  ],
  concurrency: [
    {
      level: 'easy',
      question: 'Two threads each run counter += 1 (starting at 0) with no lock. What can the final value be?',
      options: [
        { label: '1 — because += is read-modify-write, and the two updates can interleave', correct: true, why: 'Both can read 0, both compute 1, both write 1 — one increment is lost. That’s the race.' },
        { label: 'Always exactly 2', why: 'Only if the updates don’t interleave; without a lock that isn’t guaranteed.' },
        { label: 'Always 0', why: 'At least one write lands, so it can’t stay 0.' },
        { label: 'It always crashes', why: 'It doesn’t crash — it silently produces a wrong count, which is what makes races nasty.' },
      ],
    },
    { level: 'medium', question: 'A lock-free stack uses compare-and-swap on its head pointer. Why can plain CAS be unsafe here, and what catches what it misses?', options: [
      { label: 'The ABA problem — head goes A→B→A, so CAS sees A and succeeds though the stack changed; LL/SC fails because the location was written at all', correct: true, why: 'CAS only compares the value, so an A→B→A round trip looks unchanged; LL/SC (or a version tag) detects that the location was modified regardless of its final value.' },
      { label: 'CAS isn’t atomic, so two threads can swap at once', why: 'CAS is atomic by construction; the flaw is that value-equality can’t tell a reused pointer from an untouched one.' },
      { label: 'CAS always deadlocks under contention', why: 'CAS never deadlocks — losers retry; the subtle bug is ABA, where a CAS wrongly succeeds.' },
      { label: 'CAS can’t enforce memory ordering, so other threads never see the update', why: 'CAS carries ordering semantics; the specific defect here is ABA, an identity problem LL/SC or a version counter solves.' },
    ] },
    { level: 'hard', question: 'On a multi-core CPU, one thread sets a `ready` flag then writes data; another spins on `ready` then reads the data — and sometimes reads garbage. Why, despite the flag?', options: [
      { label: 'Without acquire/release ordering, the compiler or CPU can reorder the writes (or delay their visibility), so another core sees `ready` before the data', correct: true, why: 'Plain accesses only need to look correct to one thread; cross-core ordering and visibility require memory barriers — which is what acquire/release atomics insert.' },
      { label: 'The flag write isn’t atomic, so it’s torn in half', why: 'A word-sized flag write is atomic on real hardware; the bug is ordering/visibility of the surrounding writes, not tearing.' },
      { label: 'The reader simply needs to spin a little longer', why: 'No amount of spinning fixes a missing barrier — the writes can stay reordered or invisible indefinitely without proper ordering.' },
      { label: 'Two cores can’t share memory at all without a lock', why: 'They share memory fine; what’s missing is the ordering guarantee, which atomics/barriers (not necessarily a full lock) provide.' },
    ] },
  ],
  crypto: [
    {
      level: 'easy',
      question: 'In Diffie–Hellman key exchange, what actually travels over the public wire?',
      options: [
        { label: 'g^a mod p and g^b mod p — never the secret or the private exponents', correct: true, why: 'Each side sends its public value; the shared secret is computed locally and never transmitted.' },
        { label: 'The shared secret itself', why: 'The whole point is the secret is never sent — it’s derived independently on both sides.' },
        { label: 'Each side’s private exponent (a and b)', why: 'Those are kept secret; revealing them would break it entirely.' },
        { label: 'Nothing — it works by magic', why: 'The public values p, g, g^a, g^b are all sent; security rests on the discrete-log problem.' },
      ],
    },
    { level: 'medium', question: 'A hash is advertised as having a 256-bit output. Roughly how much work does finding any two inputs that collide take?', options: [
      { label: 'About 2¹²⁸ operations — the birthday bound is the square root of the output space', correct: true, why: 'With n-bit outputs a collision needs only ~2^(n/2) tries, because any pair among the candidates can match — that’s why 256-bit hashes target 128-bit collision security.' },
      { label: 'About 2²⁵⁶ — you must try the whole output space', why: 'That’s the cost of a preimage (hitting one specific digest); collisions are far cheaper thanks to the birthday paradox.' },
      { label: 'About 2²⁵⁵ — half the output space on average', why: 'Halving the space describes a linear search for a target, not the square-root speedup of the birthday bound for collisions.' },
      { label: 'It’s infeasible at any cost regardless of output size', why: 'Collision work scales as 2^(n/2); shrink the output and collisions become practical — which is exactly how MD5 and SHA-1 fell.' },
    ] },
    { level: 'hard', question: 'Why is encrypting with “textbook” RSA (just m^e mod n, no padding) considered broken?', options: [
      { label: 'It’s deterministic and malleable, so equal messages look equal and ciphertexts can be mathematically manipulated', correct: true, why: 'Without randomized padding like OAEP, identical plaintexts give identical ciphertexts and RSA’s multiplicative structure lets an attacker transform ciphertexts — both defeated by proper padding.' },
      { label: 'The RSA math itself is insecure, so factoring n is easy', why: 'Factoring large n stays hard; the weakness is the missing padding around the operation, not the trapdoor function.' },
      { label: 'RSA can only sign, never encrypt', why: 'RSA can do both, but each needs its own padding scheme (OAEP to encrypt, PSS to sign) — and signing is not encryption run backwards.' },
      { label: 'The public exponent must be kept secret', why: 'The public key, exponent included, is meant to be public; secrecy of e is not the issue — padding is.' },
    ] },
  ],
  network: [
    {
      level: 'easy',
      question: 'What is the TTL field in an IP packet for?',
      options: [
        { label: 'A hop budget, so a misrouted packet can’t circle forever', correct: true, why: 'Each router decrements TTL; at zero the packet is dropped — a safeguard against routing loops.' },
        { label: 'Encrypting the payload', why: 'TTL is plaintext routing metadata; encryption (if any) lives higher up, e.g. TLS.' },
        { label: 'Measuring round-trip latency', why: 'That’s what tools like ping infer; TTL’s job is bounding hops.' },
        { label: 'Declaring the payload size', why: 'Length fields handle size; TTL counts hops remaining.' },
      ],
    },
    { level: 'medium', question: 'A TCP sender gets three duplicate ACKs for the same byte. How does it react?', options: [
      { label: 'Fast retransmit the missing segment and roughly halve cwnd, staying in congestion avoidance', correct: true, why: 'Duplicate ACKs mean later packets are still arriving, so the loss is isolated — TCP resends immediately and backs off only modestly rather than resetting.' },
      { label: 'Drop cwnd to 1 and restart in slow start', why: 'That’s the response to an RTO timeout (no ACKs at all), which signals a far worse outage than a single isolated drop.' },
      { label: 'Double cwnd, treating the duplicates as proof the path is healthy', why: 'Duplicate ACKs signal a loss, not spare capacity; TCP shrinks the window, it doesn’t grow it.' },
      { label: 'Tear down the connection and re-handshake', why: 'A single lost segment is routine; TCP recovers it in place via fast retransmit, never by reconnecting.' },
    ] },
    { level: 'hard', question: 'HTTP/2 multiplexes many streams over one TCP connection, yet a single lost packet can still stall every stream. Why — and what fixes it?', options: [
      { label: 'TCP delivers one in-order byte stream, so a gap blocks all streams beneath it; QUIC (HTTP/3) runs over UDP with per-stream reliability', correct: true, why: 'HTTP/2 removed application-level head-of-line blocking but still rides one ordered TCP stream, so a lost packet holds back everything — QUIC gives each stream independent loss recovery.' },
      { label: 'HTTP/2’s binary framing corrupts on loss; HTTP/3 switches back to text', why: 'Framing isn’t the issue and HTTP/3 is also binary; the stall is TCP’s in-order delivery, which QUIC sidesteps over UDP.' },
      { label: 'The TLS layer re-encrypts everything on loss; disabling TLS fixes it', why: 'TLS isn’t the cause, and dropping encryption is never the remedy; head-of-line blocking is a transport-ordering problem.' },
      { label: 'Browsers cap streams too low; raising the limit removes the stall', why: 'Stream count doesn’t matter — even one lost packet stalls all streams because they share a single ordered TCP connection.' },
    ] },
  ],
  cloud: [
    {
      level: 'easy',
      question: 'CAP says that during a network partition you must give up one of two things. Which two?',
      options: [
        { label: 'Consistency or availability', correct: true, why: 'When the network splits, a node either refuses to answer (stays consistent) or answers with possibly-stale data (stays available).' },
        { label: 'Performance or durability', why: 'CAP is about the consistency/availability tradeoff under a partition, not speed or persistence.' },
        { label: 'Reads or writes', why: 'Both can continue; the question is whether they stay consistent or available during the split.' },
        { label: 'The cache or the database', why: 'CAP is a property of the distributed system as a whole, not a choice between components.' },
      ],
    },
    { level: 'medium', question: 'A web API charges a credit card, but the response times out and the client retries the request. What design prevents a double charge?', options: [
      { label: 'An idempotency key the client sends so the server records the first result and returns it for any retry', correct: true, why: 'The server stores the outcome keyed by the token; a retry with the same key replays that stored result instead of charging again.' },
      { label: 'Making the charge a GET request, since GET is idempotent', why: 'GET is idempotent because it shouldn’t change state at all — charging a card does, so it can’t be a GET.' },
      { label: 'Adding more app servers behind the load balancer', why: 'Statelessness lets retries land anywhere, but more servers don’t make a non-idempotent operation safe to repeat.' },
      { label: 'Lowering the client’s request timeout so it gives up sooner', why: 'A shorter timeout makes spurious retries more likely, not less, and still doesn’t deduplicate the charge.' },
    ] },
    { level: 'hard', question: 'A leaderless store has N = 5 replicas. You want a read to be guaranteed to observe the most recent successful write. Which R and W settings achieve that with the least work?', options: [
      { label: 'W = 3, R = 3 — because R + W > N forces every read quorum to overlap every write quorum', correct: true, why: 'With R + W = 6 > 5, any read set of 3 and write set of 3 share at least one replica, so the read sees the latest write — without contacting all 5.' },
      { label: 'W = 1, R = 1 — fastest, and the read just trusts whichever replica answers first', why: 'R + W = 2 ≤ 5, so the read and write quorums may not overlap; the read can hit a stale replica and miss the latest write.' },
      { label: 'W = 5, R = 1 — write to everyone so any single read is current', why: 'This does satisfy R + W > N and works, but W = 5 makes writes fail if any replica is down — more work and more fragile than a balanced quorum.' },
      { label: 'W = 2, R = 2 — a small majority on both sides', why: 'R + W = 4 ≤ 5, so the two quorums can be disjoint; this is exactly the case where a read returns stale data.' },
    ] },
  ],
  database: [
    {
      level: 'easy',
      question: 'The READ COMMITTED isolation level stops dirty reads but still allows what?',
      options: [
        { label: 'Non-repeatable reads — a value can change between two reads in one transaction', correct: true, why: 'It only blocks reading uncommitted data; another transaction can commit a change mid-way, so re-reading sees a different value.' },
        { label: 'Dirty reads', why: 'Those are exactly what READ COMMITTED prevents.' },
        { label: 'Deadlocks', why: 'Deadlock is a locking hazard, orthogonal to which isolation level you pick.' },
        { label: 'Committed data being lost', why: 'Isolation governs visibility between transactions, not durability of commits.' },
      ],
    },
    { level: 'medium', question: 'You have a composite index on (last_name, first_name). Which query can it directly help with a seek?', options: [
      { label: 'WHERE last_name = ’Lee’ — the leftmost-prefix rule lets the index seek on the first column', correct: true, why: 'The index is sorted by last_name first, so a predicate on last_name (or last_name plus first_name) hits a contiguous, seekable range.' },
      { label: 'WHERE first_name = ’Sam’', why: 'first_name is the second key; without a last_name predicate the matching rows are scattered throughout the index, so it can’t seek.' },
      { label: 'Any query touching either column, in any order', why: 'A composite index only serves a leftmost prefix of its columns, not an arbitrary subset.' },
      { label: 'WHERE first_name = ’Sam’ ORDER BY last_name', why: 'The filter is still on the non-leading column, so the index can’t seek to the matching rows even though it’s sorted by last_name.' },
    ] },
    { level: 'hard', question: 'Under REPEATABLE READ a transaction runs the same SELECT … WHERE price < 10 twice and the second run returns an extra row another transaction just inserted. What is this, and what stops it?', options: [
      { label: 'A phantom read; SERIALIZABLE stops it, typically with predicate or next-key locks over the matched range', correct: true, why: 'The new row didn’t exist to row-lock, so only locking the gap/range (or full serializability) prevents rows from appearing in a re-run query.' },
      { label: 'A dirty read; READ COMMITTED stops it', why: 'A dirty read is seeing uncommitted data; here the inserting transaction committed, and READ COMMITTED is weaker than REPEATABLE READ anyway.' },
      { label: 'A non-repeatable read; REPEATABLE READ already stops it', why: 'Non-repeatable read is an existing row’s value changing; REPEATABLE READ blocks that but not newly inserted rows — that gap is the phantom.' },
      { label: 'A lost update; row-level write locks stop it', why: 'A lost update is two writers overwriting each other; this is purely a read seeing new rows, which row locks on existing rows can’t prevent.' },
    ] },
  ],
  ai: [
    {
      level: 'easy',
      question: 'Underneath all the apparent intelligence, what does a large language model fundamentally do?',
      options: [
        { label: 'Predict the next token from the text so far, then repeat', correct: true, why: 'It outputs a probability over the next token, samples one, appends it, and runs again — everything else emerges from doing that at scale.' },
        { label: 'Look the answer up in a database of stored responses', why: 'There’s no answer database; it generates token by token from learned weights, which is also why it can be confidently wrong.' },
        { label: 'Run if/else rules engineers wrote for each case', why: 'No one writes per-case rules; the behavior comes from weights tuned by gradient descent, not hand-written logic.' },
        { label: 'Search the web and summarize what it finds', why: 'A base model isn’t searching anything (tool use is bolted on separately) — it’s sampling from what its weights encode.' },
      ],
    },
    { level: 'medium', question: 'In attention, a token casts a query, a key, and a value. Which vectors set the weights, and which get blended into the result?', options: [
      { label: 'A query dotted with keys sets the weights (via softmax); the values are what get blended', correct: true, why: 'Query·key alignment scores attention, softmax normalizes it, and those weights mix the value vectors — not the vectors that did the scoring.' },
      { label: 'Keys set the weights and keys are blended; queries and values are unused', why: 'All three roles matter: queries score against keys, and values (not keys) are the content that gets mixed.' },
      { label: 'Values set the weights; queries are blended into the output', why: 'It’s reversed — query·key produces the weights, and values are blended.' },
      { label: 'The same vector is used for scoring and blending, so Q, K, V are identical', why: 'They’re three separate learned projections precisely so scoring and content can differ.' },
    ] },
    { level: 'hard', question: 'During generation, an LLM stores every past token’s keys and values in a KV cache. What problem does this primarily solve?', options: [
      { label: 'It makes each step cost one token’s work instead of re-encoding the whole prefix every time', correct: true, why: 'Each new token attends to all previous ones; caching their keys/values avoids recomputing them, making generation incremental.' },
      { label: 'It removes attention’s quadratic cost so context length becomes free', why: 'The cache speeds repeated work but still grows linearly and attention stays quadratic — it’s a reason context windows are bounded, not unbounded.' },
      { label: 'It lets the model see future tokens it hasn’t generated yet', why: 'Causal masking forbids that; the cache only holds keys/values for tokens already produced.' },
      { label: 'It stores past sampling decisions so temperature can be re-tuned later', why: 'The cache holds keys and values, not sampling settings or probabilities.' },
    ] },
  ],
  render: [
    {
      level: 'easy',
      question: 'Animating CSS `transform` is cheap. Why?',
      options: [
        { label: 'It skips layout and paint — the compositor just moves an existing layer', correct: true, why: 'Transform/opacity only re-composite (often on the GPU); geometry changes like width force layout and paint to re-run.' },
        { label: 'It runs on a separate worker thread', why: 'It’s cheap because of which pipeline stages it skips, not threading.' },
        { label: 'It avoids the DOM entirely', why: 'It still acts on a DOM element’s layer; the saving is skipping layout/paint.' },
        { label: 'It’s the only GPU-accelerated CSS property', why: 'Opacity and others composite too; the point is the stages it avoids.' },
      ],
    },
    { level: 'medium', question: 'In a loop you set an element’s width, then read its offsetWidth, then set width again, then read again. Why is this slow?', options: [
      { label: 'Each read forces a synchronous reflow to flush the width you just wrote — turning one batched layout into many', correct: true, why: 'Reading a geometric property mid-mutation makes the browser recompute layout immediately; alternating writes and reads is layout thrashing.' },
      { label: 'Reading offsetWidth triggers a full repaint of the page', why: 'offsetWidth forces layout, not paint — and the cost is the repeated forced reflow, not painting.' },
      { label: 'Writing width twice queues two separate network requests', why: 'Style mutations are local to the render pipeline; no network is involved.' },
      { label: 'offsetWidth runs on the GPU, which is slower than the CPU for reads', why: 'Layout runs on the main thread, not the GPU; the GPU handles compositing, not geometry queries.' },
    ] },
    { level: 'hard', question: 'Inside a single event-loop task you schedule a setTimeout(fn, 0) and resolve a Promise. In what order do things happen relative to rendering?', options: [
      { label: 'The Promise callback (a microtask) runs and the queue drains fully before any render; the setTimeout callback is a macrotask that runs in a later turn', correct: true, why: 'Microtasks drain completely after the current task and before rendering; setTimeout queues a macrotask that yields a turn to layout and paint.' },
      { label: 'The setTimeout callback runs first because 0 ms means immediately, then the Promise', why: 'setTimeout(0) still queues a macrotask for a later turn; microtasks always drain first.' },
      { label: 'Both run inside requestAnimationFrame just before paint', why: 'Neither is a rAF callback; rAF is its own queue that fires right before paint, separate from microtasks and timers.' },
      { label: 'Rendering happens between the Promise callback and the next microtask', why: 'The microtask queue must empty entirely before rendering — a render can’t interleave between microtasks.' },
    ] },
  ],
  raft: [
    {
      level: 'easy',
      question: 'In Raft, when is a log entry safe to apply to the state machine (committed)?',
      options: [
        { label: 'Once a majority of servers have stored it', correct: true, why: 'The leader commits only after a majority replicate the entry; any two majorities overlap, so a committed entry survives every future election and can never be lost.' },
        { label: 'As soon as the leader writes it to its own log', why: 'The leader appends first, but the entry is uncommitted until a majority store it — the leader could crash before replicating it to anyone.' },
        { label: 'Only after every single server has acknowledged it', why: 'Requiring all servers would stall on any one slow or crashed node; Raft needs only a majority, which is what keeps it available under a minority failure.' },
        { label: 'When the client retries the request', why: 'Clients don’t take part in commitment; it’s decided inside the cluster by majority replication, not by the caller.' },
      ],
    },
    { level: 'medium', question: 'What does the Raft log-matching property guarantee when two logs hold an entry with the same index and term?', options: [
      { label: 'The two logs are identical in every entry up to and including that index', correct: true, why: 'A given (index, term) is unique to one leader’s entry, and AppendEntries’ consistency check refuses to append unless the previous entry matches — so agreement on one entry implies agreement on the whole prefix.' },
      { label: 'Only that single entry matches; earlier entries may differ', why: 'The consistency check makes agreement transitive backward: matching at an index means the entire prefix matches, not just that slot.' },
      { label: 'The two servers must currently be in the same term', why: 'They can be in different current terms; the property is about logged entries’ index/term, not the servers’ present term.' },
      { label: 'Both servers are guaranteed to be the leader', why: 'There’s at most one leader per term; the property is about log consistency across any servers, not leadership.' },
    ] },
    { level: 'hard', question: 'Why does Raft forbid a leader from committing an entry left over from a previous term purely by counting that it’s now on a majority of servers?', options: [
      { label: 'The “Figure 8” case shows such an entry can still be overwritten by a later leader, so a leader only directly commits entries from its own current term — older ones commit indirectly once a current-term entry above them commits', correct: true, why: 'Counting replicas is only safe for the current term; prior-term entries are pinned down indirectly via the log-matching property, often using a fresh no-op entry.' },
      { label: 'Entries from older terms have stale checksums and must be re-replicated before they can count', why: 'Raft has no per-term checksum mechanism; the issue is commitment safety across leader changes, not data integrity of the bytes.' },
      { label: 'Followers reject AppendEntries for any entry whose term is lower than the current term', why: 'Followers happily store older-term entries the leader replicates; the rejection rule is about the consistency-check index/term, not term age.' },
      { label: 'A majority of an old term is not a majority of the new term', why: 'Quorum size doesn’t change with the term in a fixed-membership cluster; the hazard is overwrite by a later leader, which majority-counting alone doesn’t prevent.' },
    ] },
  ],
  devops: [
    {
      level: 'easy',
      question: 'What does continuous integration (CI) actually do on every commit?',
      options: [
        { label: 'Automatically builds the code and runs the test suite, so breakage is caught in minutes', correct: true, why: 'CI runs the same gates on every push, so a regression surfaces while the change is small and fresh — not days later in production.' },
        { label: 'Deploys the commit straight to production', why: 'That’s (continuous) delivery/deployment; CI’s job is to build and verify first — a red build should never reach production.' },
        { label: 'Merges everyone’s branches once a week', why: 'CI encourages the opposite — integrate every commit continuously, so branches never drift far enough to cause merge hell.' },
        { label: 'Writes the tests for you', why: 'CI runs the tests you wrote; it doesn’t author them (though AI assistants increasingly help draft them — separately).' },
      ],
    },
    {
      level: 'medium',
      question: 'A canary deploy sends 5% of traffic to the new version before ramping up. What is the main thing this buys you?',
      options: [
        { label: 'A small blast radius — a bad release hurts a few percent of users briefly, and you can roll back before it spreads', correct: true, why: 'Watching real traffic on a slice lets you catch failures production-only conditions cause, while almost no one is exposed, then auto-roll-back.' },
        { label: 'Faster response times for everyone', why: 'Canarying is about safety, not latency; if anything the new version is the unknown until it’s proven on the canary slice.' },
        { label: 'Eliminating the need for tests, since prod traffic finds the bugs', why: 'Canary is a last line of defense, not a replacement for CI — you still test first; canary catches what tests can’t reproduce.' },
        { label: 'Running one version at a time, so there’s nothing to reconcile', why: 'It’s the opposite — canary runs old and new together, which is why backward-compatible changes and migrations matter.' },
      ],
    },
    {
      level: 'hard',
      question: 'Shipping an LLM feature, why don’t ordinary unit tests suffice as the CI gate — and what replaces them?',
      options: [
        { label: 'The model is non-deterministic and its quality is fuzzy, so you gate on evals — graded suites (often LLM-as-judge) where a regression is a quality drop, not a stack trace', correct: true, why: 'There’s rarely one correct string, so you score outputs against rubrics/datasets and fail the build on a quality regression; you also version code + weights + data for reproducibility.' },
        { label: 'Nothing replaces them — you just run the same unit tests against the model', why: 'Exact-match assertions break on a system with many acceptable outputs; you need graded evaluation, not pass/fail string equality.' },
        { label: 'You skip testing entirely because models can’t be tested', why: 'Models very much can be evaluated — that’s the whole point of evals and offline benchmarks before (and monitoring after) release.' },
        { label: 'You only need to watch latency and error rate in production', why: 'Those matter, but they miss quality regressions, drift, and hallucinations — which is why offline evals gate releases and output monitoring watches them live.' },
      ],
    },
  ],
  'url-shortener': [
    {
      level: 'easy',
      question: 'A URL shortener gets ~100× more reads than writes. What’s the single most important consequence for the design?',
      options: [
        { label: 'Cache the hot keys so most redirects never touch the database', correct: true, why: 'Reads dominate and follow a skewed (Zipf) pattern, so a cache of the hottest links absorbs the firehose and lets a modest database serve only misses.' },
        { label: 'Make writes as fast as possible — they’re the bottleneck', why: 'Writes are the rare path (~1% of traffic); optimizing them barely moves the needle. The read path is what must be cheap.' },
        { label: 'Use the strongest consistency level everywhere', why: 'Strong global consistency fights availability and latency on the redirect — the opposite of what a read-heavy, availability-sensitive system wants.' },
        { label: 'Store everything in one big SQL table with complex joins', why: 'Lookups are by a single key (no joins); the access pattern is a point lookup, which a key-value store or simple index serves far better at this read rate.' },
      ],
    },
    {
      level: 'medium',
      question: 'Why generate the short key from a unique counter encoded in base-62 rather than hashing the long URL?',
      options: [
        { label: 'A counter is collision-free and yields a predictable short length; hashing risks two URLs colliding, forcing a check-and-retry', correct: true, why: 'Unique counters can’t collide by construction, so there’s no read-before-write; truncated hashes can collide, which means handling and retrying collisions and possibly collapsing distinct URLs.' },
        { label: 'Hashing is cryptographically insecure and would leak the URL', why: 'A hash doesn’t leak the input; the real problems with hashing here are collisions and non-deterministic length, not secrecy.' },
        { label: 'A counter makes keys impossible to guess', why: 'It’s the opposite — sequential counters are guessable/enumerable; if that matters you interleave or encrypt the counter before encoding.' },
        { label: 'Base-62 keys are shorter than any hash could ever be', why: 'You can truncate a hash to any length; the decisive advantage of the counter is uniqueness (no collisions), not raw length.' },
      ],
    },
    {
      level: 'hard',
      question: 'Returning a 301 (permanent) redirect instead of a 302 (temporary) trades away what — and gains what?',
      options: [
        { label: 'A 301 is cached by browsers/CDNs so it offloads your servers, but you lose per-click analytics and can’t change the target later', correct: true, why: 'Permanent redirects get cached downstream, so repeat clicks may never reach you (great for load) — but that’s exactly why you can’t count them or repoint the link afterward.' },
        { label: 'A 301 is faster to parse than a 302, but uses more bandwidth', why: 'The status code isn’t a parsing/bandwidth difference; the real tradeoff is downstream caching (load) vs. analytics and editability.' },
        { label: 'A 301 encrypts the destination; a 302 sends it in plaintext', why: 'Neither status code encrypts anything — TLS handles that. The difference is caching semantics, not secrecy.' },
        { label: 'A 301 keeps every click hitting your servers, enabling analytics', why: 'Reversed — that’s the 302 behavior. A 301 is cached, so repeat clicks bypass you and analytics are lost.' },
      ],
    },
  ],
};
