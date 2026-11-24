const { PDFParse } = require("pdf-parse");

// Returns [{ pageNumber, text }, ...]
async function extractPages(buffer) {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return result.pages
      .map((p) => ({ pageNumber: p.num, text: p.text.replace(/\s+/g, " ").trim() }))
      .filter((p) => p.text.length > 0);
  } finally {
    await parser.destroy();
  }
}

module.exports = { extractPages };
