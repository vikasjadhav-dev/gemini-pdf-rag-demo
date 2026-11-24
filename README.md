# PDF Q&A with RAG (React + Node + Gemini + MongoDB Atlas)

A small, learning-focused RAG app. Upload one PDF, ask many questions about it.
No LangChain: every RAG step is a separate, readable function.

## 1. What is RAG? (the 30-second version)

An LLM doesn't know your PDF. RAG = **find** the few PDF passages relevant to the question, then **give only those** to the LLM and ask it to answer from them.

```
UPLOAD (done once per PDF)
React --PDF--> Express --> 1 extract text (per page)
                       --> 2 chunk (1000 chars, 200 overlap)
                       --> 3 Gemini embeddings (768 numbers per chunk)
                       --> 4 store chunk + embedding + page in MongoDB Atlas

ASK (done for every question)
React --question--> Express --> 5 Gemini embedding of the question
                            --> 6 Atlas $vectorSearch (top 5 chunks, this documentId only)
                            --> 7 build context: "[Page 3] text..."
                            --> 8 Gemini: "answer ONLY from this context"
React <--answer + pages-- 9 return
```

**Embedding** = a list of 768 numbers describing the *meaning* of a text. Texts with similar meaning get similar numbers, so "How do I log in?" lands near a chunk about "authentication" even without shared words. **Cosine similarity** measures how close two such lists are.

**Why chunks?** Embedding a whole PDF would blur everything into one vector. Small chunks give precise matches. **Why overlap?** So a sentence cut at a chunk border still appears whole in the next chunk. **Why 1000/200?** About 250 tokens: big enough for one complete idea, small enough to stay specific, and 5 of them fit easily in the prompt.

## 2. Project structure

```
rag-pdf-app/
├── README.md
├── backend/
│   ├── .env.example
│   └── src/
│       ├── server.js                      Express app + error handler
│       ├── config/db.js                   MongoDB connection
│       ├── config/gemini.js               Gemini client + model names
│       ├── routes/pdfRoutes.js            POST /upload, POST /ask (+ multer limits)
│       ├── controllers/uploadController.js   steps 1-4 in order
│       ├── controllers/askController.js      validation, then step 5-9
│       └── services/
│           ├── pdfService.js              step 1: extract text per page
│           ├── chunkService.js            step 2: chunk with overlap
│           ├── embeddingService.js        steps 3 & 5: Gemini embeddings
│           ├── vectorSearchService.js     steps 4 & 6: store + $vectorSearch
│           └── ragService.js              steps 5-9: the question-answering pipeline
└── frontend/
    ├── vite.config.js                     proxies /api to the backend
    └── src/ App.jsx, api.js, styles.css, components/{UploadPdf,AskQuestion}.jsx
```

## 3. Setup

Requires Node.js 20+ (22+ recommended).

```bash
cd backend && npm install
cp .env.example .env        # then edit .env
cd ../frontend && npm install
```

`.env` values:
- `MONGODB_URI`: Atlas, Connect, Drivers, copy the string and put in your password.
  Also check Atlas, Network Access allows your IP.
- `GEMINI_API_KEY`: create one in Google AI Studio.
- `GEMINI_MODEL`: defaults to `gemini-flash-latest`. Google retires model names over time; if you get a 404 from Gemini, check the model list in Google's docs and put a current model ID here.

The embedding model is fixed to `gemini-embedding-001` at 768 dimensions (in `config/gemini.js`).

## 4. Create the Atlas Vector Search index (required, one time)

1. In Atlas open your cluster, Browse Collections, **Create Database**: database `rag_practice`, collection `pdf_chunks`. (A separate DB, so your other project is untouched.)
2. Open the **Atlas Search** tab, **Create Search Index**, choose **Vector Search**, then **JSON Editor**.
3. Pick database `rag_practice` / collection `pdf_chunks`, set the index name to `pdf_vector_index`, and paste:

```json
{
  "fields": [
    { "type": "vector", "path": "embedding", "numDimensions": 768, "similarity": "cosine" },
    { "type": "filter", "path": "documentId" }
  ]
}
```

The `filter` entry is what allows `$vectorSearch` to restrict results to one `documentId`. Without it, filtering fails.

4. Click **Create**. In the Atlas Search tab, wait until the index **Status** is **READY** (usually under a minute). Searches before that return nothing, and this app then reports "check the index is READY".

Free (M0) clusters allow only a few search indexes; if you hit the limit, delete an unused one.

## 5. Run

```bash
# terminal 1
cd backend && npm run dev      # "MongoDB connected", "Server running" (port 5000)
# terminal 2
cd frontend && npm run dev     # open http://localhost:5173
```

## 6. Test the whole flow

1. Use any text-based PDF (not a scan) of a few pages, for example an article or a manual. Upload it. You'll see "Ready: file.pdf (N pages, M chunks)".
2. Ask something the PDF clearly answers. You should get an answer that cites pages, plus "Source pages".
3. Ask something unrelated ("What is the capital of Mars?"). The answer should say it could not find it in the PDF.
4. Try a scanned/image-only PDF: you get a clear "no readable text" error.
5. Try a non-PDF or a file over 10 MB: rejected.

## 7. Verify embeddings and vector search really work

**Embeddings stored:** in Atlas, Browse Collections, `rag_practice.pdf_chunks`. Each document has `documentId`, `fileName`, `pageNumber`, `chunkIndex`, `text`, and `embedding` (768 numbers). In mongosh:

```js
use rag_practice
db.pdf_chunks.countDocuments()
db.pdf_chunks.aggregate([{ $project: { dims: { $size: "$embedding" } } }, { $limit: 3 }])   // dims should be 768
```

**Vector search works:** search using an existing chunk's own embedding. It should come back first with a score near 1.

```js
const d = db.pdf_chunks.findOne()
db.pdf_chunks.aggregate([
  { $vectorSearch: { index: "pdf_vector_index", path: "embedding", queryVector: d.embedding,
                     numCandidates: 50, limit: 3, filter: { documentId: d.documentId } } },
  { $project: { pageNumber: 1, text: { $substr: ["$text", 0, 60] }, score: { $meta: "vectorSearchScore" } } }
])
```

**Isolation:** upload two different PDFs and ask each one's questions using its own session. Answers never mix because every search filters by `documentId`.

## 8. Security and error handling (already built in)

- Secrets only in `backend/.env` (git-ignored). React never sees them; it only calls `/api/*`.
- Upload: PDF mime type + `%PDF` header check, 10 MB limit, kept in memory (never written to disk).
- `documentId` must be a valid UUID and must exist before searching; question limited to 1000 chars.
- Handled: empty/scanned PDFs, too-large PDFs, Gemini or Mongo failures (generic message to the user, details only in server logs, never keys), index not ready, MongoDB connection failure at startup.

## 9. Things to try to learn more

- Change `CHUNK_SIZE`/`OVERLAP` in `chunkService.js`, re-upload, and see how answers change.
- Change `limit` (top-k) in `vectorSearchService.js`.
- Print the retrieved chunks in `ragService.js` to see exactly what Gemini is given.
- Remove the system instruction and watch Gemini start to guess.

Known limits: each upload creates a new document (old ones stay in the collection; delete with `db.pdf_chunks.deleteMany({ documentId: "..." })`). No OCR. Free-tier Gemini rate limits may slow big PDFs.


> **Note: this is a learning demo, not a production system.**
> It exists to show how RAG works step by step (extract, chunk, embed, store, vector search, answer).
> The code is deliberately small and readable, so several production features are left out on purpose:
>
> - **No authentication or user accounts.** Anyone who can reach the API and knows a `documentId` can query that PDF.
> - **No rate limiting, request tracing or monitoring.** Gemini and MongoDB calls are not retried on failure.
> - **No data cleanup.** Every upload creates a new document, and old chunks stay in the `pdf_chunks` collection until you delete them.
> - **No OCR.** Scanned or image-only PDFs are rejected.
> - **Simple chunking.** Chunks are split by character count, not by sentence or paragraph, and uploads are capped at 10 MB and 300 chunks.
> - **No automated tests, background job queue or hardened HTTP setup** (no helmet, CORS rules or HTTPS).

> Security basics that *are* included: secrets stay in the backend `.env`, uploads are type- and size-checked, and `documentId` is validated and used to filter every vector search.
