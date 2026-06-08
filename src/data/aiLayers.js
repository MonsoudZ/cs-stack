// Layers for the /ai deep-dive — same shape as the main stack so the shared
// engine (Base nav, LayerSection, scroll-spy) powers it unchanged. AI is the
// application that runs on top of the whole stack, so its layers are its own.
export const aiLayers = [
  { id: 'AI0', num: '00', navLabel: 'The neuron', zone: 'meaning', title: 'The neuron: a weighted sum that fires', sub: 'ai · inputs · weights · bias · activation' },
  { id: 'AI1', num: '01', navLabel: 'Learning', zone: 'meaning', title: 'Learning: nudging weights downhill', sub: 'ai · loss · gradient descent' },
  { id: 'AI2', num: '02', navLabel: 'Embeddings', zone: 'meaning', title: 'Embeddings: meaning becomes geometry', sub: 'ai · vectors · similarity' },
  { id: 'AI3', num: '03', navLabel: 'Attention', zone: 'meaning', title: 'Attention: tokens look at each other', sub: 'ai · the transformer’s core' },
  { id: 'AI4', num: '04', navLabel: 'The language model', zone: 'system', title: 'The LLM: a giant next-token predictor', sub: 'ai · logits · softmax · temperature' },
  { id: 'AI5', num: '05', navLabel: 'The whole thing', zone: 'all', title: 'From a weighted sum to a chatbot', sub: 'the whole climb · neurons → an LLM' },
];
