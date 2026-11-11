ALTER TABLE books ADD COLUMN IF NOT EXISTS processing_stage TEXT NOT NULL DEFAULT 'queued';
ALTER TABLE books ADD COLUMN IF NOT EXISTS processing_percent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE books ADD COLUMN IF NOT EXISTS processed_chunks INTEGER NOT NULL DEFAULT 0;
ALTER TABLE books ADD COLUMN IF NOT EXISTS total_chunks INTEGER NOT NULL DEFAULT 0;
ALTER TABLE books ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE books SET processing_stage = CASE
  WHEN status = 'ready' THEN 'ready'
  WHEN status = 'failed' THEN 'failed'
  ELSE 'queued'
END,
processing_percent = CASE WHEN status = 'ready' THEN 100 ELSE processing_percent END;
