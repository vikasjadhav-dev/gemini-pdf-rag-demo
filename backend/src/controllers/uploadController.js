const crypto = require("crypto");
const { extractPages } = require("../services/pdfService");
const { chunkPages } = require("../services/chunkService");
const { embedDocuments } = require("../services/embeddingService");
const { storeChunks } = require("../services/vectorSearchService");

const MAX_CHUNKS = 300; // keeps free-tier Gemini rate limits happy

async function uploadPdf(req, res) {
  const file = req.file;
  if (!file) return res.status(400).json({ error: "Please upload a PDF file." });
  if (file.buffer.subarray(0, 4).toString() !== "%PDF")
    return res.status(400).json({ error: "File is not a valid PDF." });

  const pages = await extractPages(file.buffer); // 1. extract
  const totalText = pages.reduce((n, p) => n + p.text.length, 0);
  if (totalText < 50)
    return res.status(422).json({ error: "No readable text found. This looks like a scanned/image-only PDF (OCR is not supported)." });

  const chunks = chunkPages(pages); // 2. chunk
  if (chunks.length > MAX_CHUNKS)
    return res.status(413).json({ error: `PDF is too large for this demo (max ${MAX_CHUNKS} chunks).` });

  const embeddings = await embedDocuments(chunks.map((c) => c.text)); // 3. embed

  const documentId = crypto.randomUUID();
  await storeChunks(documentId, file.originalname, chunks, embeddings); // 4. store

  res.json({ documentId, fileName: file.originalname, pages: pages.length, chunks: chunks.length, status: "ready" });
  
}

module.exports = { uploadPdf };
