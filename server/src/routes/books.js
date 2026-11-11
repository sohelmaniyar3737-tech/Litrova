import { Router } from 'express';
import multer from 'multer';
import { pool } from '../config/db.js';
import { extractPdf } from '../services/pdfService.js';
import { chunkPages } from '../utils/chunkText.js';
import { embedText } from '../services/embeddingService.js';

const router = Router();
const maxMb = Number(process.env.MAX_UPLOAD_MB || 25);
const embeddingConcurrency = Math.max(1, Math.min(4, Number(process.env.EMBEDDING_CONCURRENCY || 2)));
const insertBatchSize = 20;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxMb * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const valid = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
    callback(valid ? null : new Error('Only PDF files are supported in this version.'), valid);
  }
});

async function mapWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;
  async function run() {
    while (true) {
      const index = nextIndex++;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run));
  return results;
}

async function updateProgress(bookId, values) {
  await pool.query(
    `UPDATE books SET processing_stage = $2, processing_percent = $3,
      processed_chunks = $4, total_chunks = $5, updated_at = NOW() WHERE id = $1`,
    [bookId, values.stage, values.percent, values.processed ?? 0, values.total ?? 0]
  );
}

async function processBook({ bookId, buffer }) {
  try {
    await updateProgress(bookId, { stage: 'extracting', percent: 5 });
    const extracted = await extractPdf(buffer);
    const chunks = chunkPages(extracted.pages);
    if (!chunks.length) throw new Error('No selectable text was found. This may be a scanned PDF; OCR is not included yet.');

    await pool.query('UPDATE books SET page_count = $1, total_chunks = $2, updated_at = NOW() WHERE id = $3', [extracted.pageCount, chunks.length, bookId]);
    await updateProgress(bookId, { stage: 'embedding', percent: 10, total: chunks.length });

    const embeddings = await mapWithConcurrency(chunks, embeddingConcurrency, async (chunk, index) => {
      const vector = await embedText(chunk.content);
      const done = index + 1;
      const percent = 10 + Math.floor((done / chunks.length) * 75);
      await updateProgress(bookId, { stage: 'embedding', percent, processed: done, total: chunks.length });
      return vector;
    });

    await updateProgress(bookId, { stage: 'saving', percent: 88, processed: chunks.length, total: chunks.length });
    for (let offset = 0; offset < chunks.length; offset += insertBatchSize) {
      const batch = chunks.slice(offset, offset + insertBatchSize);
      const params = [];
      const values = batch.map((chunk, batchIndex) => {
        const vector = embeddings[offset + batchIndex];
        const base = batchIndex * 6;
        params.push(bookId, chunk.index, chunk.pageStart, chunk.pageEnd, chunk.content, `[${vector.join(',')}]`);
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}::vector)`;
      });
      await pool.query(
        `INSERT INTO chunks(book_id, chunk_index, page_start, page_end, content, embedding)
         VALUES ${values.join(', ')} ON CONFLICT (book_id, chunk_index) DO UPDATE SET
         page_start = EXCLUDED.page_start, page_end = EXCLUDED.page_end,
         content = EXCLUDED.content, embedding = EXCLUDED.embedding`,
        params
      );
      const saved = Math.min(offset + batch.length, chunks.length);
      await updateProgress(bookId, { stage: 'saving', percent: 88 + Math.floor((saved / chunks.length) * 11), processed: saved, total: chunks.length });
    }

    await pool.query(
      `UPDATE books SET status = 'ready', processing_stage = 'ready', processing_percent = 100,
       processed_chunks = total_chunks, processing_error = NULL, updated_at = NOW() WHERE id = $1`,
      [bookId]
    );
  } catch (error) {
    console.error(`Book processing failed (${bookId}):`, error);
    await pool.query(
      `UPDATE books SET status = 'failed', processing_stage = 'failed',
       processing_error = $2, updated_at = NOW() WHERE id = $1`,
      [bookId, String(error.message || 'Processing failed').slice(0, 500)]
    ).catch((dbError) => console.error('Could not save book failure state:', dbError.message));
  }
}

router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT b.id, b.title, b.original_file_name, b.page_count, b.status, b.created_at,
              b.processing_stage, b.processing_percent, b.processed_chunks, b.total_chunks, b.processing_error,
              (SELECT COUNT(*)::int FROM chunks c WHERE c.book_id = b.id) AS chunk_count
         FROM books b WHERE b.user_id = $1 ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    res.json({ books: result.rows });
  } catch (error) { next(error); }
});

router.get('/:id/status', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, title, status, processing_stage, processing_percent,
              processed_chunks, total_chunks, processing_error, page_count
         FROM books WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!result.rowCount) return res.status(404).json({ message: 'Book not found.' });
    res.json({ book: result.rows[0] });
  } catch (error) { next(error); }
});

router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Choose a PDF file first.' });
    const title = String(req.body.title || req.file.originalname.replace(/\.pdf$/i, '')).trim().slice(0, 180) || 'Untitled book';
    const inserted = await pool.query(
      `INSERT INTO books(user_id, title, original_file_name, status, processing_stage, processing_percent)
       VALUES($1, $2, $3, 'processing', 'queued', 0) RETURNING id, title`,
      [req.user.id, title, req.file.originalname]
    );
    const book = inserted.rows[0];
    // Processing starts after the response; progress is persisted in PostgreSQL for refresh recovery.
    res.status(202).json({ message: 'PDF uploaded. Preparing your book in the background.', book: { ...book, status: 'processing', processing_stage: 'queued', processing_percent: 0 } });
    setImmediate(() => { processBook({ bookId: book.id, buffer: req.file.buffer }).catch((error) => console.error('Unexpected background processing error:', error)); });
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM books WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.user.id]);
    if (!result.rowCount) return res.status(404).json({ message: 'Book not found.' });
    res.json({ message: 'Book deleted.' });
  } catch (error) { next(error); }
});

export default router;
