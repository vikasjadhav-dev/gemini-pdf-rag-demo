const { answerQuestion } = require("../services/ragService");
const { documentExists } = require("../services/vectorSearchService");

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function askQuestion(req, res) {
  const { documentId, question } = req.body || {};
  if (typeof documentId !== "string" || !UUID.test(documentId))
    return res.status(400).json({ error: "Invalid documentId." });
  if (typeof question !== "string" || !question.trim() || question.length > 1000)
    return res.status(400).json({ error: "Question must be 1-1000 characters." });
  if (!(await documentExists(documentId)))
    return res.status(404).json({ error: "Document not found. Upload the PDF again." });

  res.json(await answerQuestion(documentId, question.trim()));
}

module.exports = { askQuestion };
