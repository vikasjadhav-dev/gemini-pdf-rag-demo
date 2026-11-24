// LangChain setup: the same Gemini models as the plain version, wrapped in LangChain classes.
const { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } = require("@langchain/google-genai");

const apiKey = process.env.GEMINI_API_KEY;
const embeddingOptions = { apiKey, model: "gemini-embedding-001", outputDimensionality: 768 };

// One instance has ONE task type, so we need two: one for chunks, one for questions.
const documentEmbeddings = new GoogleGenerativeAIEmbeddings({ ...embeddingOptions, taskType: "RETRIEVAL_DOCUMENT" });
const queryEmbeddings = new GoogleGenerativeAIEmbeddings({ ...embeddingOptions, taskType: "RETRIEVAL_QUERY" });

const chatModel = new ChatGoogleGenerativeAI({
  apiKey,
  model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  temperature: 0.2,
  apiVersion: "v1beta",
});

module.exports = { documentEmbeddings, queryEmbeddings, chatModel };
