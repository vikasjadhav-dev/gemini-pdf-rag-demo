const { ai, GENERATION_MODEL } = require("../config/gemini");
const { embedQuestion } = require("./embeddingService");
const { searchChunks } = require("./vectorSearchService");

const NOT_FOUND = "I could not find this in the PDF.";

const SYSTEM_INSTRUCTION = `You answer questions about a PDF using ONLY the context provided.
- Never use outside knowledge and never invent information.
- If the answer is not in the context, say: "${NOT_FOUND}"
- Mention the relevant page numbers, like (page 3).`;

async function answerQuestion(documentId, question) {
  const queryVector = await embedQuestion(question); // 5. question -> embedding
  const chunks = await searchChunks(documentId, queryVector); // 6. similarity search

  console.log('chunks in answer question', chunks)

  const context = chunks.map((c) => `[Page ${c.pageNumber}]\n${c.text}`).join("\n\n---\n\n"); // 7. build context

  const response = await ai.models.generateContent({ // 8. ask Gemini
    model: GENERATION_MODEL,
    contents: `Context:\n${context}\n\nQuestion: ${question}`,
    config: { systemInstruction: SYSTEM_INSTRUCTION, temperature: 0.2 },
  });

  const answer = response.text.trim();

  const found = !answer.includes(NOT_FOUND)
  const pages = found ? [...new Set(chunks.map((c) => c.pageNumber))].sort((a, b) => a - b) : []
  return { answer, pages }; // 9. return result
}

module.exports = { answerQuestion };
