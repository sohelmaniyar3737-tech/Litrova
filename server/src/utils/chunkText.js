// Splits extracted PDF text into overlapping chunks while retaining page numbers.
export function chunkPages(pages, maxChars = 1800, overlap = 250) {
  const chunks = [];
  let buffer = '';
  let startPage = null;
  let endPage = null;

  for (const page of pages) {
    const text = (page.text || '').replace(/\s+/g, ' ').trim();
    if (!text) continue;

    let remaining = text;
    while (remaining.length) {
      const room = maxChars - buffer.length;
      const take = Math.min(room, remaining.length);
      const piece = remaining.slice(0, take);
      if (!buffer) startPage = page.page;
      buffer += (buffer ? ' ' : '') + piece;
      endPage = page.page;
      remaining = remaining.slice(take);

      if (buffer.length >= maxChars || remaining.length) {
        chunks.push({ content: buffer.trim(), pageStart: startPage, pageEnd: endPage });
        buffer = buffer.slice(Math.max(0, buffer.length - overlap));
        startPage = page.page;
      }
    }
  }

  if (buffer.trim()) chunks.push({ content: buffer.trim(), pageStart: startPage, pageEnd: endPage });
  return chunks.map((chunk, index) => ({ ...chunk, index }));
}
