// Split page text into bounded, overlapping chunks while retaining source pages.
export function chunkPages(pages, maxChars = 1800, overlap = 250) {
  if (!Number.isInteger(maxChars) || maxChars < 200) throw new Error('maxChars must be at least 200.');
  if (!Number.isInteger(overlap) || overlap < 0 || overlap >= maxChars) throw new Error('overlap must be smaller than maxChars.');

  const chunks = [];
  let buffer = '';
  let startPage = null;
  let endPage = null;

  const push = () => {
    const content = buffer.trim();
    if (content) chunks.push({ content, pageStart: startPage, pageEnd: endPage });
  };

  for (const page of pages) {
    const text = String(page.text || '').replace(/\s+/g, ' ').trim();
    if (!text) continue;
    let offset = 0;

    while (offset < text.length) {
      if (buffer.length >= maxChars) {
        push();
        buffer = buffer.slice(-overlap);
        startPage = endPage;
      }

      const separator = buffer ? ' ' : '';
      const room = maxChars - buffer.length - separator.length;
      if (room <= 0) continue;
      const piece = text.slice(offset, offset + room);
      if (!buffer) startPage = page.page;
      buffer += separator + piece;
      endPage = page.page;
      offset += piece.length;

      if (offset < text.length) {
        push();
        buffer = buffer.slice(-overlap);
        startPage = page.page;
      }
    }
  }

  push();
  return chunks.map((chunk, index) => ({ ...chunk, index }));
}
