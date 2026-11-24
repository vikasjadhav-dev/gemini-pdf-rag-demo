import { useState } from "react";
import { askQuestion } from "../api.js";

export default function AskQuestion({ documentId }) {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAsk() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      setResult(await askQuestion(documentId, question));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <input
        type="text"
        placeholder="Ask something about the PDF..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && question.trim() && !loading && handleAsk()}
      />
      <button onClick={handleAsk} disabled={loading || !question.trim()}>
        {loading ? "Thinking..." : "Ask"}
      </button>

      {error && <p className="error">{error}</p>}
      {result && (
        <div className="answer">
          <p>{result.answer}</p>
          <small>Source pages: {result.pages.join(", ")}</small>
        </div>
      )}
    </section>
  );
}
