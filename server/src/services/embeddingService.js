import { getGemini } from '../config/gemini.js';

const DIMENSIONS = Number(process.env.EMBEDDING_DIMENSIONS || 768);
const MODEL = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function embedText(text, { retries = 3 } = {}) {
  const ai = getGemini();
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await ai.models.embedContent({
        model: MODEL,
        contents: text,
        config: { outputDimensionality: DIMENSIONS }
      });
      const values = response.embeddings?.[0]?.values;
      if (!values?.length) throw new Error('The embedding model returned no vector.');
      if (values.length !== DIMENSIONS) {
        throw new Error(`Embedding dimension mismatch: expected ${DIMENSIONS}, received ${values.length}.`);
      }
      return values;
    } catch (error) {
      lastError = error;
      const status = Number(error.status || error.code);
      const retryable = status === 429 || status === 500 || status === 502 || status === 503 || status === 504 || /fetch failed|timeout|temporar/i.test(error.message || '');
      if (!retryable || attempt === retries) break;
      await sleep(Math.min(1000 * (2 ** attempt), 8000));
    }
  }
  throw lastError;
}
