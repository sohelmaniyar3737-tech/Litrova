CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  original_file_name TEXT NOT NULL,
  page_count INTEGER,
  status TEXT NOT NULL DEFAULT 'processing'
    CHECK (status IN ('processing', 'ready', 'failed')),
  processing_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chunks (
  id BIGSERIAL PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  page_start INTEGER,
  page_end INTEGER,
  content TEXT NOT NULL,
  embedding VECTOR(768),
  UNIQUE (book_id, chunk_index)
);

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New conversation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS books_user_created_idx ON books(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS chunks_book_idx ON chunks(book_id);
CREATE INDEX IF NOT EXISTS conversations_user_idx ON conversations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_conversation_idx ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS chunks_embedding_hnsw_idx
  ON chunks USING hnsw (embedding vector_cosine_ops);
