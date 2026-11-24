import axios from "axios";

const errorMessage = (e) => e.response?.data?.error || "Cannot reach the server.";

export async function uploadPdf(file, onProgress) {
  const form = new FormData();
  form.append("file", file);
  try {
    const { data } = await axios.post("/api/pdf/upload", form, {
      onUploadProgress: (e) => e.total && onProgress(Math.round((e.loaded / e.total) * 100)),
    });
    return data;
  } catch (e) {
    throw new Error(errorMessage(e));
  }
}

export async function askQuestion(documentId, question) {
  try {
    const { data } = await axios.post("/api/pdf/ask", { documentId, question });
    return data;
  } catch (e) {
    throw new Error(errorMessage(e));
  }
}
