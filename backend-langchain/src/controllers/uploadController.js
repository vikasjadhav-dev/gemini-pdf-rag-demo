const crypto = require("crypto");
const { loadPdf } = require("../services/pdfService");
const { splitPages } = require("../services/chunkService");
const { storeChunks } = require("../services/vectorSearchService");

const MAX_CHUNKS = 300;

async function uploadPdf(req, res) {
  const file = req.file;
  if (!file) return res.status(400).json({ error: "Please upload a PDF file." });
  if (file.buffer.subarray(0, 4).toString() !== "%PDF")
    return res.status(400).json({ error: "File is not a valid PDF." });

  const pages = await loadPdf(file.buffer); // 1. load
  const totalText = pages.reduce((n, p) => n + p.pageContent.trim().length, 0);
  if (totalText < 50)
    return res.status(422).json({ error: "No readable text found. This looks like a scanned/image-only PDF (OCR is not supported)." });

  const chunks = await splitPages(pages); // 2. split
  if (chunks.length > MAX_CHUNKS)
    return res.status(413).json({ error: `PDF is too large for this demo (max ${MAX_CHUNKS} chunks).` });

  const documentId = crypto.randomUUID();
  await storeChunks(documentId, file.originalname, chunks); // 3 + 4. embed + store

  res.json({ documentId, fileName: file.originalname, pages: pages.length, chunks: chunks.length, status: "ready" });
}

module.exports = { uploadPdf };
