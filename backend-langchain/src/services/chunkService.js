const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");

// STEP 2: Text Splitter. Same size and overlap as the plain version, but this splitter
// prefers to cut at paragraphs, then sentences, then words, instead of cutting blindly.
const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });

async function splitPages(pages) {
  return splitter.splitDocuments(pages); // metadata (page number) is copied to every chunk
}

module.exports = { splitPages };
