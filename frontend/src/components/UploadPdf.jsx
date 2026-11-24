import { useState } from "react";
import { uploadPdf } from "../api.js";

export default function UploadPdf({ onUploaded }) {
  const [progress, setProgress] = useState(null); // null = idle
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  async function handleChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setError("");
    setFileName("");
    onUploaded(null);
    setProgress(0);
    try {
      const data = await uploadPdf(file, setProgress);
      setFileName(`${data.fileName} (${data.pages} pages, ${data.chunks} chunks)`);
      onUploaded({ documentId: data.documentId, fileName: data.fileName });
    } catch (err) {
      setError(err.message);
    } finally {
      setProgress(null);
    }
  }

  return (
    <section>
      <input type="file" accept="application/pdf" onChange={handleChange} disabled={progress !== null} />
      {progress !== null && (
        <p>{progress < 100 ? `Uploading... ${progress}%` : "Reading, embedding and storing the PDF (this can take a bit)..."}</p>
      )}
      {fileName && <p className="ok">Ready: {fileName}</p>}
      {error && <p className="error">{error}</p>}
    </section>
  );
}
