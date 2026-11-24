const { chunksCollection } = require("../config/db");

const INDEX_NAME = "vector_index";

// STEP 4: store chunks + embeddings
async function storeChunks(documentId, fileName, chunks, embeddings) {
  const docs = chunks.map((c, i) => ({ documentId, fileName, ...c, embedding: embeddings[i] }));
  await chunksCollection().insertMany(docs);
}

async function documentExists(documentId) {
  return (await chunksCollection().countDocuments({ documentId }, { limit: 1 })) > 0;
}

// STEP 6: find the 5 chunks closest in meaning to the question, ONLY in this document
async function searchChunks(documentId, queryVector, limit = 5) {
  const results = await chunksCollection()
    .aggregate([
      {
        $vectorSearch: {
          index: INDEX_NAME,
          path: "embedding",
          queryVector,
          numCandidates: 100, // how many neighbours Atlas considers before picking the top `limit`
          limit,
          filter: { documentId }, // never leak chunks from other PDFs
        },
      },
      { $project: { _id: 0, text: 1, pageNumber: 1, score: { $meta: "vectorSearchScore" } } },
    ])
    .toArray();

  if (results.length === 0) {
    const err = new Error(
      "Vector search returned nothing. Make sure the index 'pdf_vector_index' status is READY, then retry in a few seconds."
    );
    err.status = 503;
    throw err;
  }
  return results;
}

module.exports = { storeChunks, documentExists, searchChunks };
