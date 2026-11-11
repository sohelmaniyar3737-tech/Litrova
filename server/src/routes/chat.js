import { Router } from 'express';
import { pool } from '../config/db.js';
import { answerFromBook } from '../services/ragService.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const bookId = String(req.body.bookId || '');
    const question = String(req.body.question || '').trim();
    let conversationId = req.body.conversationId || null;
    const history = Array.isArray(req.body.history) ? req.body.history : [];

    if (!bookId || !question || question.length > 4000) {
      return res.status(400).json({ message: 'A book and a question (up to 4,000 characters) are required.' });
    }

    if (conversationId) {
      const check = await pool.query(
        'SELECT id FROM conversations WHERE id = $1 AND user_id = $2 AND book_id = $3',
        [conversationId, req.user.id, bookId]
      );
      if (!check.rowCount) return res.status(404).json({ message: 'Conversation not found.' });
    } else {
      const created = await pool.query(
        'INSERT INTO conversations(user_id, book_id, title) VALUES($1, $2, $3) RETURNING id',
        [req.user.id, bookId, question.slice(0, 60)]
      );
      conversationId = created.rows[0].id;
    }

    await pool.query(
      'INSERT INTO messages(conversation_id, role, content) VALUES($1, $2, $3)',
      [conversationId, 'user', question]
    );

    const result = await answerFromBook({ userId: req.user.id, bookId, question, history });
    await pool.query(
      'INSERT INTO messages(conversation_id, role, content, sources) VALUES($1, $2, $3, $4::jsonb)',
      [conversationId, 'assistant', result.answer, JSON.stringify(result.sources)]
    );

    res.json({ conversationId, answer: result.answer, sources: result.sources });
  } catch (error) { next(error); }
});

router.get('/conversations/:id', async (req, res, next) => {
  try {
    const owned = await pool.query('SELECT id FROM conversations WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (!owned.rowCount) return res.status(404).json({ message: 'Conversation not found.' });
    const messages = await pool.query(
      'SELECT id, role, content, sources, created_at FROM messages WHERE conversation_id = $1 ORDER BY created_at',
      [req.params.id]
    );
    res.json({ messages: messages.rows });
  } catch (error) { next(error); }
});

export default router;
