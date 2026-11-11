import { getGemini } from '../config/gemini.js';

export async function embedText(text) {
  const ai = getGemini();
  const model = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001';
  const dimensions = Number(process.env.EMBEDDING_DIMENSIONS || 768);

  const response = await ai.models.embedContent({
    model,
    contents: text,
    config: { outputDimensionality: dimensions }
  });

  const values = response.embeddings?.[0]?.values;
  if (!values?.length) throw new Error('The embedding model returned no vector.');
  if (values.length !== dimensions) {
    throw new Error(`Embedding dimension mismatch: expected ${dimensions}, received ${values.length}. Check EMBEDDING_DIMENSIONS and database VECTOR size.`);
  }
  return values;
}
