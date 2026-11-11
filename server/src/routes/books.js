import { Router } from 'express';
import multer from 'multer';
import { pool } from '../config/db.js';
import { extractPdf } from '../services/pdfService.js';
import { chunkPages } from '../utils/chunkText.js';
import { embedText } from '../services/embeddingService.js';

const router = Router();
const maxMb = Number(process.env.MAX_UPLOAD_MB || 25);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxMb * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const valid = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
    callback(valid ? null : new Error('Only PDF files are supported in this version.'), valid);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT b.id, b.title, b.original_file_name, b.page_count, b.status, b.created_at,
              (SELECT COUNT(*)::int FROM chunks c WHERE c.book_id = b.id) AS chunk_count
         FROM books b WHERE b.user_id = $1 ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    res.json({ books: result.rows });
  } catch (error) { next(error); }
});

router.post('/upload', upload.single('file'), async (req, res, next) => {
  let bookId;
  try {
    if (!req.file) return res.status(400).json({ message: 'Choose a PDF file first.' });
    const title = String(req.body.title || req.file.originalname.replace(/\.pdf$/i, '')).trim().slice(0, 180);
    const inserted = await pool.query(
      `INSERT INTO books(user_id, title, original_file_name, status)
       VALUES($1, $2, $3, 'processing') RETURNING id`,
      [req.user.id, title || 'Untitled book', req.file.originalname]
    );
    bookId = inserted.rows[0].id;

    const extracted = await extractPdf(req.file.buffer);
    const chunks = chunkPages(extracted.pages);
    if (!chunks.length) throw new Error('No selectable text was found. This may be a scanned PDF; OCR is not included yet.');

    await pool.query('UPDATE books SET page_count = $1 WHERE id = $2', [extracted.pageCount, bookId]);

    for (const chunk of chunks) {
      const embedding = await embedText(chunk.content);
      await pool.query(
        `INSERT INTO chunks(book_id, chunk_index, page_start, page_end, content, embedding)
         VALUES($1, $2, $3, $4, $5, $6::vector)`,
        [bookId, chunk.index, chunk.pageStart, chunk.pageEnd, chunk.content, `[${embedding.join(',')}]`]
      );
    }

    await pool.query("UPDATE books SET status = 'ready' WHERE id = $1", [bookId]);
    res.status(201).json({ message: 'Your book is ready to explore.', book: { id: bookId, title, pageCount: extracted.pageCount, chunkCount: chunks.length, status: 'ready' } });
  } catch (error) {
    if (bookId) {
      await pool.query("UPDATE books SET status = 'failed', processing_error = $2 WHERE id = $1", [bookId, String(error.message).slice(0, 500)]).catch(() => {});
    }
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM books WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.user.id]);
    if (!result.rowCount) return res.status(404).json({ message: 'Book not found.' });
    res.json({ message: 'Book deleted.' });
  } catch (error) { next(error); }
});

export default router;
