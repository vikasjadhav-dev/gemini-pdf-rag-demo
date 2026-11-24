const { ai, EMBEDDING_MODEL, EMBEDDING_DIMENSIONS } = require("../config/gemini");

// An embedding = a list of 768 numbers that captures the MEANING of a text.
// Similar meanings -> similar numbers. Same model + dimensions for docs and questions.
async function embed(texts, taskType) {
  const vectors = [];
  for (let i = 0; i < texts.length; i += 100) { // API accepts up to 100 texts per call
    const res = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: texts.slice(i, i + 100),
      config: { taskType, outputDimensionality: EMBEDDING_DIMENSIONS },
    });
    vectors.push(...res.embeddings.map((e) => e.values));
  }
  return vectors;
}

const embedDocuments = (texts) => embed(texts, "RETRIEVAL_DOCUMENT");
const embedQuestion = async (q) => (await embed([q], "RETRIEVAL_QUERY"))[0];

module.exports = { embedDocuments, embedQuestion };
