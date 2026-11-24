# backend-langchain

The same RAG backend as `../backend`, rebuilt with LangChain. Same API (`POST /api/pdf/upload`, `POST /api/pdf/ask`), same Atlas database, collection and index, so the React frontend works with either backend unchanged. Keep both folders and compare them.

> Learning demo, not production-ready (no auth, rate limiting, retries or tests).

## Run

```bash
cd backend-langchain
npm install --legacy-peer-deps
cp .env.example .env     # fill in MONGODB_URI and GEMINI_API_KEY
npm run dev              # stop the plain backend first: both use port 5000
```

`--legacy-peer-deps` avoids peer-dependency conflicts between LangChain packages. `pdf-parse` is pinned to v1 on purpose, because LangChain's `PDFLoader` expects that version (the plain backend uses v2).

No new Atlas setup is needed. Documents are saved with the same top-level fields (`documentId`, `fileName`, `pageNumber`, `chunkIndex`, `text`, `embedding`), so the existing `pdf_vector_index` works. Plain-backend and LangChain documents can sit in the same collection; the `documentId` filter keeps them apart.

## The same 9 steps, side by side

| Step | `backend` (plain) | `backend-langchain` |
|---|---|---|
| 1 Extract | `pdf-parse` in `pdfService.js` | `PDFLoader` |
| 2 Chunk | hand-written sliding window | `RecursiveCharacterTextSplitter` |
| 3 Embed chunks | `embeddingService.js` (`@google/genai`) | `GoogleGenerativeAIEmbeddings` |
| 4 Store | `insertMany` | `MongoDBAtlasVectorSearch.addDocuments` |
| 5 Embed question | `embedQuestion` | `queryEmbeddings.embedQuery` |
| 6 Vector search | hand-written `$vectorSearch` | `similaritySearchVectorWithScore` with `preFilter` |
| 7 Context | string join | string join (unchanged) |
| 8 Ask Gemini | `generateContent` + `systemInstruction` | `ChatPromptTemplate` -> `ChatGoogleGenerativeAI` -> `StringOutputParser` |
| 9 Return | `{ answer, pages }` | `{ answer, pages }` |

Files: `config/langchain.js`, `services/pdfService.js`, `chunkService.js`, `vectorSearchService.js`, `ragService.js`, plus `controllers/uploadController.js`. `server.js`, `db.js`, `askController.js` and the routes are identical to the plain backend.

## Things worth noticing

- **Two embedding objects.** One LangChain embeddings instance has a single task type, so we create one for chunks (`RETRIEVAL_DOCUMENT`) and one for questions (`RETRIEVAL_QUERY`). The vector store's built-in retriever would embed questions with the document type, so we embed the question ourselves and call the vector search with the vector.
- **Metadata is stored at the top level** of each Mongo document, next to `text` and `embedding`. That is why the Atlas filter field is still `documentId`.
- **Page numbers** come from `metadata.loc.pageNumber` set by the loader. We copy that into a plain `pageNumber` field when storing.
- **The chain** (`prompt.pipe(chatModel).pipe(parser)`) is the main LangChain idea: every piece has `.invoke()`, and `.pipe()` joins them.
