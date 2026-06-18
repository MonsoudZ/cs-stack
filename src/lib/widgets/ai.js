// Part of the widgets builder set, split by area. The barrel at
// src/lib/widgets.js re-exports every module so existing imports keep working.

// --- AI STACK (/ai): the application that runs on top of the whole stack ---

// A neuron (perceptron): weigh each input, sum, add a bias, then fire through an
// activation. With a step activation it's a threshold gate — e.g. weights [1,1]
// and bias −1.5 fire only when BOTH inputs are 1, an AND gate.
export function computeNeuron(inputs, weights, bias) {
  const sum = inputs.reduce((s, x, i) => s + x * weights[i], 0) + bias;
  return { sum: +sum.toFixed(2), output: sum >= 0 ? 1 : 0 };
}

// Learning by gradient descent. A model predicts ŷ = w·x; we want it to match a
// data point (x, y). The loss (ŷ − y)² is a parabola in w; its gradient points
// uphill, so stepping w against the gradient walks downhill to the best weight
// (here w → y/x = 3). Returns the trace; loss falls every step.
export function buildGradientDescent({ x = 2, y = 6, w = 0, lr = 0.05, steps = 10 } = {}) {
  const out = [];
  const pred = (w) => w * x;
  const loss = (w) => (pred(w) - y) ** 2;
  const snap = (note, o = {}) => out.push({ w: +w.toFixed(3), pred: +pred(w).toFixed(2), loss: +loss(w).toFixed(2), grad: o.grad ?? null, note });
  snap('a model with one weight w predicts ŷ = w·' + x + '; we want ŷ = ' + y + '. Right now w = ' + w + ', so it is badly wrong');
  for (let i = 0; i < steps; i++) {
    const grad = 2 * (pred(w) - y) * x; // dLoss/dw
    w = w - lr * grad;
    snap('step ' + (i + 1) + ': nudge w against the gradient → w = ' + (+w.toFixed(3)) + ', ŷ = ' + (+pred(w).toFixed(2)) + ', loss = ' + (+loss(w).toFixed(2)), { grad: +grad.toFixed(2) });
  }
  snap('after ' + steps + ' steps w ≈ ' + (+w.toFixed(2)) + ' and the loss is nearly zero — that downhill walk IS learning, scaled to billions of weights');
  return out;
}

// Embeddings: meaning becomes geometry. Each word is a vector; similar words sit
// at similar angles, so cosine similarity measures relatedness. Real models use
// hundreds of learned dimensions — this is a hand-placed 2-D toy to see the idea.
export const EMBEDDINGS = {
  king: [0.80, 0.62], queen: [0.74, 0.68],
  man: [0.55, 0.50], woman: [0.48, 0.57],
  cat: [-0.80, 0.50], dog: [-0.70, 0.60], kitten: [-0.85, 0.44], puppy: [-0.74, 0.66],
  car: [0.60, -0.72], truck: [0.66, -0.66],
};
export function cosineSim(a, b) {
  const dot = a[0] * b[0] + a[1] * b[1];
  const mag = Math.hypot(...a) * Math.hypot(...b);
  return mag === 0 ? 0 : dot / mag;
}
export function nearestWords(word, k = 3) {
  const v = EMBEDDINGS[word];
  return Object.keys(EMBEDDINGS)
    .filter((w) => w !== word)
    .map((w) => ({ word: w, sim: +cosineSim(v, EMBEDDINGS[w]).toFixed(3) }))
    .sort((a, b) => b.sim - a.sim)
    .slice(0, k);
}

export function softmax(xs) {
  const m = Math.max(...xs);
  const exps = xs.map((x) => Math.exp(x - m));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

// Attention: a token gathers context from other tokens. Its attention weights
// are softmax over the dot product of its vector with each token's — so it
// "looks at" the tokens most aligned with it. Here the pronoun "it" attends to
// "cat", which is how a transformer figures out what "it" refers to.
export const ATTN_TOKENS = ['the', 'cat', 'drank', 'milk', 'because', 'it', 'was', 'thirsty'];
// 'cat' is aligned with (and longer than) the query 'it', so 'it' attends
// clearly to 'cat' rather than mostly to itself — a toy arrangement that makes
// the pronoun-resolution point land unambiguously. The mechanism is the real
// one: a softmax over scaled dot products (ATTN_SCALE plays the sharpening role
// that 1/√d_k tempers in a real model — turned up here so the winner is clear).
const ATTN_VECS = {
  the: [0.1, 0.1], cat: [1.4, 0.1], drank: [0.2, 0.6], milk: [0.55, 0.25],
  because: [0.0, 0.2], it: [1.0, 0.05], was: [0.05, 0.15], thirsty: [0.5, 0.4],
};
const ATTN_SCALE = 2.5;
export function buildAttention({ query = 'it' } = {}) {
  const q = ATTN_VECS[query];
  const scores = ATTN_TOKENS.map((t) => ATTN_SCALE * (q[0] * ATTN_VECS[t][0] + q[1] * ATTN_VECS[t][1]));
  const w = softmax(scores);
  return {
    query,
    weights: ATTN_TOKENS.map((t, i) => ({ token: t, weight: +w[i].toFixed(3) })),
  };
}

// A language model is, underneath, a next-token predictor: given the text so
// far, it outputs a score (logit) for every possible next token. Softmax turns
// those into probabilities; temperature divides the logits first — low T sharpens
// toward the top choice, high T flattens toward randomness.
export const NEXT_TOKENS = [
  { token: 'mat', logit: 3.0 }, { token: 'floor', logit: 1.5 }, { token: 'rug', logit: 1.2 },
  { token: 'sofa', logit: 0.8 }, { token: 'roof', logit: 0.2 }, { token: 'moon', logit: -1.0 },
];
export function softmaxTemp(logits, T) {
  return softmax(logits.map((l) => l / T));
}
export function nextTokenDist(T = 1) {
  const probs = softmaxTemp(NEXT_TOKENS.map((t) => t.logit), T);
  return NEXT_TOKENS.map((t, i) => ({ token: t.token, prob: +probs[i].toFixed(4) }));
}

// --- AI STACK (/ai), part 2: tokenization, training, grounding ---

// Tokenization: models don't see words, they see tokens — subword chunks from a
// fixed vocabulary. Common words are one token; rarer ones split into pieces.
// A toy greedy longest-match over a small vocab; real tokenizers (BPE) learn the
// merges, but the idea — and why a model can miscount the letters in a word it
// only sees as "straw"+"berry" — is the same.
export const TOK_VOCAB = ['The', 'the', 'cat', 'sat', 'on', 'mat', 'token', 'iz', 'ation', 'un', 'happiness', 'straw', 'berry', 'learn', 'ing', 'model', 's', 'is', 'a', 'word'];
function tokenizeWord(w) {
  const out = [];
  let i = 0;
  while (i < w.length) {
    let best = null;
    for (const piece of TOK_VOCAB) if (piece.length > (best ? best.length : 0) && w.startsWith(piece, i)) best = piece;
    if (best) { out.push(best); i += best.length; } else { out.push(w[i]); i += 1; }
  }
  return out;
}
export const TOK_EXAMPLES = ['The cat sat on the mat', 'tokenization', 'unhappiness', 'strawberry', 'learning models'];
export function tokenize(phrase) {
  const tokens = [];
  phrase.split(' ').forEach((w, wi) => {
    tokenizeWord(w).forEach((t, ti) => tokens.push({ text: t, id: TOK_VOCAB.indexOf(t), firstInWord: ti === 0, wi }));
  });
  return tokens;
}

// Pretraining vs fine-tuning: the same model, the same prompt, three training
// phases. Pretraining on the open internet teaches language but only autocompletes;
// supervised fine-tuning on curated instruction→response pairs teaches it to
// answer; preference tuning (RLHF) teaches it what people find helpful. Returns
// the phases with how the model behaves after each.
export function buildTraining() {
  const prompt = 'Explain photosynthesis simply.';
  const out = [];
  const snap = (phase, data, behavior, reply, note) => out.push({ prompt, phase, data, behavior, reply, note });
  snap('—', 'none yet', 'untrained', '(random gibberish)', 'the same prompt — "' + prompt + '" — run through a model at three stages of training');
  snap('Pretraining', 'trillions of words of internet text', 'autocompletes', 'Explain respiration simply. Explain osmosis simply. Explain…', 'next-token prediction on raw text: it soaks up grammar and facts, but it only continues the pattern — it doesn’t answer');
  snap('Supervised fine-tuning', 'curated instruction → response pairs', 'follows instructions', 'Plants turn sunlight, water, and air into food (sugar) and give off oxygen.', 'now shown examples of good answers, it learns to respond to the instruction instead of continuing it');
  snap('Preference tuning (RLHF)', 'humans ranking which answer is better', 'helpful & aligned', 'Great question! Plants are like tiny chefs ☀️ — they mix sunlight, water, and air to make their own food, and breathe out the oxygen we need.', 'rewarded for answers people prefer, it becomes clear, friendly, and safe — the “assistant” feel');
  snap('done', '—', 'an assistant', '', 'the base model already knew language; alignment is what made it useful');
  return out;
}

// RAG and tools: a model's knowledge is frozen at training time and it will
// confidently make things up. Retrieval-augmented generation embeds the query,
// finds the most similar real documents, and pastes them into the context so the
// answer is grounded. Reuses the same cosine similarity as embeddings.
export const RAG_DOCS = [
  { text: 'Refunds are accepted within 14 days of purchase.', vec: [0.9, 0.3] },
  { text: 'Our support line is open 9am–5pm on weekdays.', vec: [-0.6, 0.7] },
  { text: 'Standard shipping takes 3–5 business days.', vec: [0.1, -0.9] },
];
export function buildRag() {
  const query = 'How long do I have to return something?';
  const qvec = [0.85, 0.4]; // closest to the refund doc
  const ranked = RAG_DOCS.map((d) => ({ text: d.text, sim: +cosineSim(qvec, d.vec).toFixed(3) }))
    .sort((a, b) => b.sim - a.sim);
  const top = ranked[0];
  const out = [];
  const snap = (note, o = {}) => out.push({ query, ranked: o.ranked ?? null, retrieved: o.retrieved ?? null, answer: o.answer ?? null, grounded: !!o.grounded, note });
  snap('the model’s knowledge is frozen at training time, so for current or private facts it tends to guess');
  snap('without retrieval, asked "' + query + '" it makes up a plausible-sounding answer', { answer: '“Usually 30 days.” — plausible, but invented, and wrong', grounded: false });
  snap('RAG instead embeds the query and searches a document store for the most similar chunks', { ranked });
  snap('the top match is retrieved and pasted into the prompt as context', { ranked, retrieved: top.text });
  snap('now the model answers FROM that context, grounded in a real source', { retrieved: top.text, answer: '“14 days from purchase,” citing the refund policy', grounded: true });
  snap('that’s RAG: retrieve relevant text, put it in the context, answer from it. Tools go further — the model can call search, a calculator, or an API and use the result', { grounded: true });
  return out;
}
