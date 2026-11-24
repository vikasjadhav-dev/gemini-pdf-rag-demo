const { MongoDBAtlasVectorSearch } = require("@langchain/mongodb");
const { chunksCollection } = require("../config/db");
const { documentEmbeddings, queryEmbeddings } = require("../config/langchain");

const INDEX_NAME = "vector_index";

// The vector store wraps: embed the text -> save to MongoDB -> run $vectorSearch.
// Same collection, index and field names as the plain version.
const vectorStore = () =>
  new MongoDBAtlasVectorSearch(documentEmbeddings, {
    collection: chunksCollection(),
    indexName: INDEX_NAME,
    textKey: "text",
    embeddingKey: "embedding",
  });

// STEPS 3 + 4: embed chunks and store them (one call does both)
async function storeChunks(documentId, fileName, chunks) {
  const docs = chunks.map((c, i) => ({
    pageContent: c.pageContent,
    // LangChain saves metadata fields at the TOP level of the Mongo document.
    metadata: { documentId, fileName, pageNumber: c.metadata.loc.pageNumber, chunkIndex: i },
  }));
  await vectorStore().addDocuments(docs);
}

async function documentExists(documentId) {
  return (await chunksCollection().countDocuments({ documentId }, { limit: 1 })) > 0;
}

// STEPS 5 + 6: embed the question, then $vectorSearch for the top 5 chunks of this document only
async function searchChunks(documentId, question, k = 5) {
  const queryVector = await queryEmbeddings.embedQuery(question);
  const results = await vectorStore().similaritySearchVectorWithScore(queryVector, k, {
    preFilter: { documentId },
  });

  if (results.length === 0) {
    const err = new Error(
      "Vector search returned nothing. Make sure the index 'pdf_vector_index' status is READY, then retry in a few seconds."
    );
    err.status = 503;
    throw err;
  }
  return results.map(([doc, score]) => ({ text: doc.pageContent, pageNumber: doc.metadata.pageNumber, score }));
}

module.exports = { storeChunks, documentExists, searchChunks };
