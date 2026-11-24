const { PDFLoader } = require("@langchain/community/document_loaders/fs/pdf");

// STEP 1: Document Loader.
// Returns one LangChain Document per page: { pageContent, metadata: { loc: { pageNumber } } }
async function loadPdf(buffer) {
  const loader = new PDFLoader(new Blob([buffer], { type: "application/pdf" }));
  const pages = await loader.load();
  return pages.filter((p) => p.pageContent.trim().length > 0);
}

module.exports = { loadPdf };
