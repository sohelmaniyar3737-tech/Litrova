import { Router } from 'express';
import { pool } from '../config/db.js';
import { answerFromBook } from '../services/ragService.js';

const router = Router();

// List a user's conversations for one of their books.
router.get('/conversations', async (req, res, next) => {
  try {
    const bookId = String(req.query.bookId || '');
    if (!bookId) return res.status(400).json({ message: 'bookId is required.' });

    const book = await pool.query(
      'SELECT id FROM books WHERE id = $1 AND user_id = $2',
      [bookId, req.user.id]
    );
    if (!book.rowCount) return res.status(404).json({ message: 'Book not found.' });

    const result = await pool.query(
      `SELECT c.id, c.title, c.created_at,
              (SELECT COUNT(*)::int FROM messages m WHERE m.conversation_id = c.id) AS message_count,
              (SELECT m.content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC, m.id DESC LIMIT 1) AS last_message
         FROM conversations c
        WHERE c.user_id = $1 AND c.book_id = $2
        ORDER BY c.created_at DESC, c.id DESC`,
      [req.user.id, bookId]
    );
    res.json({ conversations: result.rows });
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  let conversationId = req.body.conversationId || null;
  let userMessageSaved = false;
  try {
    const bookId = String(req.body.bookId || '');
    const question = String(req.body.question || '').trim();

    if (!bookId || !question || question.length > 4000) {
      return res.status(400).json({ message: 'A book and a question (up to 4,000 characters) are required.' });
    }

    const ownedBook = await pool.query(
      'SELECT id FROM books WHERE id = $1 AND user_id = $2 AND status = $3',
      [bookId, req.user.id, 'ready']
    );
    if (!ownedBook.rowCount) return res.status(404).json({ message: 'Book not found or not ready.' });

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
    userMessageSaved = true;

    // Build conversation history from persisted messages rather than trusting client state.
    const historyResult = await pool.query(
      `SELECT role, content FROM messages
        WHERE conversation_id = $1
        ORDER BY created_at DESC, id DESC
        OFFSET 1 LIMIT 12`,
      [conversationId]
    );
    const history = historyResult.rows.reverse();

    const result = await answerFromBook({ userId: req.user.id, bookId, question, history });
    await pool.query(
      'INSERT INTO messages(conversation_id, role, content, sources) VALUES($1, $2, $3, $4::jsonb)',
      [conversationId, 'assistant', result.answer, JSON.stringify(result.sources)]
    );

    res.json({ conversationId, answer: result.answer, sources: result.sources });
  } catch (error) {
    // The user's question remains saved if Gemini fails; the UI can retry in the same thread.
    if (conversationId && userMessageSaved) error.conversationId = conversationId;
    next(error);
  }
});

router.get('/conversations/:id', async (req, res, next) => {
  try {
    const owned = await pool.query(
      'SELECT id, title, book_id, created_at FROM conversations WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!owned.rowCount) return res.status(404).json({ message: 'Conversation not found.' });
    const messages = await pool.query(
      `SELECT id, role, content, sources, created_at
         FROM messages WHERE conversation_id = $1
        ORDER BY created_at, id`,
      [req.params.id]
    );
    res.json({ conversation: owned.rows[0], messages: messages.rows });
  } catch (error) { next(error); }
});

router.delete('/conversations/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      'DELETE FROM conversations WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!result.rowCount) return res.status(404).json({ message: 'Conversation not found.' });
    res.json({ message: 'Conversation deleted.' });
  } catch (error) { next(error); }
});

export default router;
