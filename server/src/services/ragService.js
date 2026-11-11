import { pool } from '../config/db.js';
import { getGemini } from '../config/gemini.js';
import { embedText } from './embeddingService.js';

export async function answerFromBook({ userId, bookId, question, history = [] }) {
  const owned = await pool.query(
    'SELECT id, title FROM books WHERE id = $1 AND user_id = $2 AND status = $3',
    [bookId, userId, 'ready']
  );
  if (!owned.rowCount) {
    const error = new Error('Book not found or still processing.');
    error.status = 404;
    throw error;
  }

  const vector = await embedText(question);
  const vectorLiteral = `[${vector.join(',')}]`;
  const found = await pool.query(
    `SELECT content, page_start, page_end,
            1 - (embedding <=> $1::vector) AS similarity
       FROM chunks
      WHERE book_id = $2 AND embedding IS NOT NULL
      ORDER BY embedding <=> $1::vector
      LIMIT 6`,
    [vectorLiteral, bookId]
  );

  if (!found.rowCount) {
    return { answer: 'I could not find indexed text for this book yet. Try uploading it again.', sources: [] };
  }

  const sources = found.rows.map((row, index) => ({
    id: index + 1,
    pageStart: row.page_start,
    pageEnd: row.page_end,
    excerpt: row.content.slice(0, 260)
  }));

  const context = found.rows.map((row, index) =>
    `[Source ${index + 1}, pages ${row.page_start ?? '?'}-${row.page_end ?? '?'}]\n${row.content}`
  ).join('\n\n');

  const recentHistory = history.slice(-6).map((item) =>
    `${item.role === 'assistant' ? 'Assistant' : 'User'}: ${String(item.content).slice(0, 1200)}`
  ).join('\n');

  const ai = getGemini();
  const model = process.env.GEMINI_CHAT_MODEL || 'gemini-2.5-flash';
  const prompt = `You are Litrova, a careful book companion. Answer using only the provided book context. If the context does not contain the answer, say so clearly. Do not invent quotations, page numbers, events, or facts. Explain naturally and cite sources inline as [Source 1], [Source 2].\n\nBOOK: ${owned.rows[0].title}\n\nRECENT CONVERSATION:\n${recentHistory || '(none)'}\n\nBOOK CONTEXT:\n${context}\n\nUSER QUESTION:\n${question}`;

  const response = await ai.models.generateContent({ model, contents: prompt });
  return { answer: response.text || 'I could not generate an answer. Please try again.', sources };
}
