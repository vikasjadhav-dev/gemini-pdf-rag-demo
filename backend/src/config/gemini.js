// Gemini setup. The API key lives only here on the backend.
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY,  httpOptions: { apiVersion: "v1beta" }, });

module.exports = {
  ai,
  EMBEDDING_MODEL: "gemini-embedding-001",
  EMBEDDING_DIMENSIONS: 768, // must match the Atlas index (numDimensions)
  GENERATION_MODEL: process.env.GEMINI_MODEL || "gemini-2.5-flash",
};
