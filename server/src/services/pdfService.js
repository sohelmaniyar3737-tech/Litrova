import pdf from 'pdf-parse';

export async function extractPdf(buffer) {
  const pageTexts = [];
  const result = await pdf(buffer, {
    pagerender: async (pageData) => {
      const textContent = await pageData.getTextContent();
      const text = textContent.items.map((item) => item.str).join(' ');
      pageTexts.push({ page: pageData.pageIndex + 1, text });
      return text;
    }
  });

  // pdf-parse's pagerender callback order is page order for ordinary PDFs.
  if (!pageTexts.length && result.text) {
    pageTexts.push({ page: 1, text: result.text });
  }

  return { pages: pageTexts, pageCount: result.numpages || pageTexts.length };
}
