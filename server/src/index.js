import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { pool } from './config/db.js';
import authRoutes from './routes/auth.js';
import bookRoutes from './routes/books.js';
import chatRoutes from './routes/chat.js';
import { requireAuth } from './middleware/auth.js';

const app = express();
const port = Number(process.env.PORT || 5001);

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use('/api', rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: 'draft-7', legacyHeaders: false }));

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', service: 'Litrova API' });
  } catch {
    res.status(503).json({ status: 'degraded', database: 'unavailable', service: 'Litrova API' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/books', requireAuth, bookRoutes);
app.use('/api/chat', requireAuth, chatRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);
  const status = error.status || (error.code === 'LIMIT_FILE_SIZE' ? 413 : 500);
  res.status(status).json({
    message: status === 500 ? 'Something went wrong on the server. Check the server terminal.' : error.message
  });
});

app.listen(port, () => console.log(`Litrova API running at http://localhost:${port}`));
