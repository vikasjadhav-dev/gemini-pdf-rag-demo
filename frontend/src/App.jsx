import { useState } from "react";
import UploadPdf from "./components/UploadPdf.jsx";
import AskQuestion from "./components/AskQuestion.jsx";

export default function App() {
  const [doc, setDoc] = useState(null); // { documentId, fileName }

  return (
    <main>
      <h1>PDF Q&amp;A (RAG)</h1>
      <UploadPdf onUploaded={setDoc} />
      {doc && <AskQuestion documentId={doc.documentId} />}
    </main>
  );
}
