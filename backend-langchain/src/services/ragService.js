const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const { chatModel } = require("../config/langchain");
const { searchChunks } = require("./vectorSearchService");

const NOT_FOUND = "I could not find this in the PDF.";

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You answer questions about a PDF using ONLY the context provided.
- Never use outside knowledge and never invent information.
- If the answer is not in the context, reply with exactly: ${NOT_FOUND}
- Mention the relevant page numbers, like (page 3).`,
  ],
  ["human", "Context:\n{context}\n\nQuestion: {question}"],
]);

// A "chain": prompt -> Gemini -> plain string. Each piece has .invoke(), and .pipe() joins them.
const chain = prompt.pipe(chatModel).pipe(new StringOutputParser());

async function answerQuestion(documentId, question) {
  const chunks = await searchChunks(documentId, question); // 5-6. embed question + vector search
  const context = chunks.map((c) => `[Page ${c.pageNumber}]\n${c.text}`).join("\n\n---\n\n"); // 7. context

  const answer = (await chain.invoke({ context, question })).trim(); // 8. prompt + Gemini

  const found = !answer.includes(NOT_FOUND); // 9. only return pages if an answer was found
  const pages = found ? [...new Set(chunks.map((c) => c.pageNumber))].sort((a, b) => a - b) : [];
  return { answer, pages };
}

module.exports = { answerQuestion };
