// One "check your understanding" question per deep dive, keyed by stack slug.
// Each option carries a `why` so every choice gives feedback, right or wrong.
// Exactly one option per question has `correct: true`. The slug doubles as the
// /learn progress key, so a correct answer marks that lesson done.
export const quizzes = {
  silicon: {
    question: 'Pure silicon barely conducts. What does doping it with phosphorus (n-type) add?',
    options: [
      { label: 'Free electrons that can carry current', correct: true, why: 'Phosphorus has 5 outer electrons; 4 fill the bonds and the 5th is left free to move — negative carriers.' },
      { label: 'Holes — missing electrons that act positive', why: 'That’s p-type doping (e.g. boron, with 3 outer electrons). Phosphorus adds electrons, not holes.' },
      { label: 'Extra protons in the nucleus', why: 'Doping changes outer (valence) electrons available to conduct, not the nucleus.' },
      { label: 'An insulating layer', why: 'Doping makes silicon conduct better, not worse — it seeds mobile charge carriers.' },
    ],
  },
  logic: {
    question: 'Why is NAND called a “universal” gate?',
    options: [
      { label: 'Every other gate can be built from NAND alone', correct: true, why: 'NOT, AND, OR — and therefore any circuit — can be composed from NAND gates, so one repeated gate suffices.' },
      { label: 'It’s the fastest gate to switch', why: 'Universality is about functional completeness, not speed.' },
      { label: 'It uses exactly one transistor', why: 'A CMOS NAND takes four transistors; “universal” refers to what it can express.' },
      { label: 'CPUs are only allowed to use NAND', why: 'Chips use many gate types; NAND is just provably sufficient on its own.' },
    ],
  },
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
  cpu: {
    question: 'What does pipelining improve?',
    options: [
      { label: 'Throughput — it retires roughly one instruction per cycle by overlapping stages', correct: true, why: 'A single instruction still takes all its stages; pipelining keeps every stage busy so many instructions are in flight at once.' },
      { label: 'The latency of a single instruction', why: 'One instruction isn’t faster end-to-end — the win is overlap across many instructions.' },
      { label: 'It lowers the clock speed', why: 'Pipelining is about doing more per clock, not changing the clock.' },
      { label: 'It removes the need for an ALU', why: 'The ALU still does the arithmetic; the pipeline just schedules the stages around it.' },
    ],
  },
  compiler: {
    question: 'Type checking catches a class of bugs that parsing can’t. Which?',
    options: [
      { label: 'Programs that parse fine but are meaningless, like multiplying a string by a number', correct: true, why: 'Parsing only checks grammar/structure; type checking (semantic analysis) checks that operations make sense for their operand types.' },
      { label: 'Missing semicolons and typos', why: 'Those are lexing/parsing concerns, caught earlier.' },
      { label: 'Code that runs too slowly', why: 'That’s the optimizer’s domain, not type checking.' },
      { label: 'Unreachable dead code', why: 'Dead-code removal is an optimization; type checking is about meaning, not reachability.' },
    ],
  },
  languages: {
    question: 'Rust gives you memory safety without a garbage collector. How does it free heap memory?',
    options: [
      { label: 'The compiler tracks a single owner per value and frees it when the owner leaves scope', correct: true, why: 'Ownership + the borrow checker let the compiler prove at build time exactly when each value is dropped — no GC, no manual free, and use-after-free or double-free won’t compile.' },
      { label: 'It runs a garbage collector, just a faster one', why: 'Rust has no garbage collector at all; reclamation is decided at compile time, not by a runtime collector.' },
      { label: 'You call free() yourself, exactly like C', why: 'That’s manual management (C). In Rust the drop is inserted automatically by the compiler when the owner goes out of scope.' },
      { label: 'It never frees — the OS reclaims everything when the program exits', why: 'That would leak for any long-running program; Rust frees each value deterministically as its owner is dropped.' },
    ],
  },
  memory: {
    question: 'A cache miss loads a whole line of neighbouring addresses, not just the one byte you asked for. Why?',
    options: [
      { label: 'Spatial locality — programs usually touch nearby addresses next', correct: true, why: 'Fetching the neighbours bets that the next accesses are close by, turning one slow miss into several fast hits.' },
      { label: 'To fill up unused RAM', why: 'It’s about speed, not filling memory; the cache is tiny and evicts.' },
      { label: 'Because a byte is actually 64 bits', why: 'A byte is 8 bits; line size is a locality choice, unrelated to byte width.' },
      { label: 'To save power', why: 'The motivation is latency via locality, not power.' },
    ],
  },
  structures: {
    question: 'When is a linked list a better fit than an array?',
    options: [
      { label: 'Frequent insert/remove at a known spot — it’s O(1) with no shifting', correct: true, why: 'Splicing a node is two pointer writes; an array would have to shift every later element.' },
      { label: 'Random access by index', why: 'That’s the array’s strength — O(1) by index; a list must walk the chain (O(n)).' },
      { label: 'Cache-friendly sequential iteration', why: 'Arrays win here — contiguous memory; list nodes are scattered.' },
      { label: 'Binary search', why: 'Binary search needs O(1) indexing into sorted data — an array, not a list.' },
    ],
  },
  os: {
    question: 'What makes a system call slower than an ordinary function call?',
    options: [
      { label: 'It traps across the user/kernel boundary — a mode switch plus argument validation', correct: true, why: 'read() is really a trap into kernel mode; the CPU saves state, the kernel validates, then returns — far more than a plain call.' },
      { label: 'It’s always written in assembly', why: 'Language has nothing to do with it; the cost is the privileged-mode crossing.' },
      { label: 'It always reads from disk', why: 'Many syscalls never touch disk; the boundary crossing is the constant cost.' },
      { label: 'It allocates memory every time', why: 'Allocation isn’t inherent to a syscall; the mode switch and validation are.' },
    ],
  },
  concurrency: {
    question: 'Two threads each run counter += 1 (starting at 0) with no lock. What can the final value be?',
    options: [
      { label: '1 — because += is read-modify-write, and the two updates can interleave', correct: true, why: 'Both can read 0, both compute 1, both write 1 — one increment is lost. That’s the race.' },
      { label: 'Always exactly 2', why: 'Only if the updates don’t interleave; without a lock that isn’t guaranteed.' },
      { label: 'Always 0', why: 'At least one write lands, so it can’t stay 0.' },
      { label: 'It always crashes', why: 'It doesn’t crash — it silently produces a wrong count, which is what makes races nasty.' },
    ],
  },
  crypto: {
    question: 'In Diffie–Hellman key exchange, what actually travels over the public wire?',
    options: [
      { label: 'g^a mod p and g^b mod p — never the secret or the private exponents', correct: true, why: 'Each side sends its public value; the shared secret is computed locally and never transmitted.' },
      { label: 'The shared secret itself', why: 'The whole point is the secret is never sent — it’s derived independently on both sides.' },
      { label: 'Each side’s private exponent (a and b)', why: 'Those are kept secret; revealing them would break it entirely.' },
      { label: 'Nothing — it works by magic', why: 'The public values p, g, g^a, g^b are all sent; security rests on the discrete-log problem.' },
    ],
  },
  network: {
    question: 'What is the TTL field in an IP packet for?',
    options: [
      { label: 'A hop budget, so a misrouted packet can’t circle forever', correct: true, why: 'Each router decrements TTL; at zero the packet is dropped — a safeguard against routing loops.' },
      { label: 'Encrypting the payload', why: 'TTL is plaintext routing metadata; encryption (if any) lives higher up, e.g. TLS.' },
      { label: 'Measuring round-trip latency', why: 'That’s what tools like ping infer; TTL’s job is bounding hops.' },
      { label: 'Declaring the payload size', why: 'Length fields handle size; TTL counts hops remaining.' },
    ],
  },
  cloud: {
    question: 'CAP says that during a network partition you must give up one of two things. Which two?',
    options: [
      { label: 'Consistency or availability', correct: true, why: 'When the network splits, a node either refuses to answer (stays consistent) or answers with possibly-stale data (stays available).' },
      { label: 'Performance or durability', why: 'CAP is about the consistency/availability tradeoff under a partition, not speed or persistence.' },
      { label: 'Reads or writes', why: 'Both can continue; the question is whether they stay consistent or available during the split.' },
      { label: 'The cache or the database', why: 'CAP is a property of the distributed system as a whole, not a choice between components.' },
    ],
  },
  raft: {
    question: 'In Raft, when is a log entry safe to apply to the state machine (committed)?',
    options: [
      { label: 'Once a majority of servers have stored it', correct: true, why: 'The leader commits only after a majority replicate the entry; any two majorities overlap, so a committed entry survives every future election and can never be lost.' },
      { label: 'As soon as the leader writes it to its own log', why: 'The leader appends first, but the entry is uncommitted until a majority store it — the leader could crash before replicating it to anyone.' },
      { label: 'Only after every single server has acknowledged it', why: 'Requiring all servers would stall on any one slow or crashed node; Raft needs only a majority, which is what keeps it available under a minority failure.' },
      { label: 'When the client retries the request', why: 'Clients don’t take part in commitment; it’s decided inside the cluster by majority replication, not by the caller.' },
    ],
  },
  database: {
    question: 'The READ COMMITTED isolation level stops dirty reads but still allows what?',
    options: [
      { label: 'Non-repeatable reads — a value can change between two reads in one transaction', correct: true, why: 'It only blocks reading uncommitted data; another transaction can commit a change mid-way, so re-reading sees a different value.' },
      { label: 'Dirty reads', why: 'Those are exactly what READ COMMITTED prevents.' },
      { label: 'Deadlocks', why: 'Deadlock is a locking hazard, orthogonal to which isolation level you pick.' },
      { label: 'Committed data being lost', why: 'Isolation governs visibility between transactions, not durability of commits.' },
    ],
  },
  ai: {
    question: 'Underneath all the apparent intelligence, what does a large language model fundamentally do?',
    options: [
      { label: 'Predict the next token from the text so far, then repeat', correct: true, why: 'It outputs a probability over the next token, samples one, appends it, and runs again — everything else emerges from doing that at scale.' },
      { label: 'Look the answer up in a database of stored responses', why: 'There’s no answer database; it generates token by token from learned weights, which is also why it can be confidently wrong.' },
      { label: 'Run if/else rules engineers wrote for each case', why: 'No one writes per-case rules; the behavior comes from weights tuned by gradient descent, not hand-written logic.' },
      { label: 'Search the web and summarize what it finds', why: 'A base model isn’t searching anything (tool use is bolted on separately) — it’s sampling from what its weights encode.' },
    ],
  },
  render: {
    question: 'Animating CSS `transform` is cheap. Why?',
    options: [
      { label: 'It skips layout and paint — the compositor just moves an existing layer', correct: true, why: 'Transform/opacity only re-composite (often on the GPU); geometry changes like width force layout and paint to re-run.' },
      { label: 'It runs on a separate worker thread', why: 'It’s cheap because of which pipeline stages it skips, not threading.' },
      { label: 'It avoids the DOM entirely', why: 'It still acts on a DOM element’s layer; the saving is skipping layout/paint.' },
      { label: 'It’s the only GPU-accelerated CSS property', why: 'Opacity and others composite too; the point is the stages it avoids.' },
    ],
  },
};
