// ~1000 characters (~250 tokens) per chunk, 200 characters of overlap.
// Small enough to be specific, big enough to hold a full idea.
// Overlap stops a sentence cut at a boundary from losing its meaning.
// We chunk page by page so every chunk keeps an exact page number.
const CHUNK_SIZE = 1000;
const OVERLAP = 200;

function chunkPages(pages) {
  const chunks = [];
  for (const { pageNumber, text } of pages) {
    let start = 0;
    while (start < text.length) {
      let end = Math.min(start + CHUNK_SIZE, text.length);
      if (end < text.length) {
        const space = text.lastIndexOf(" ", end); // avoid cutting mid-word
        if (space > start + OVERLAP) end = space;
      }
      chunks.push({ pageNumber, chunkIndex: chunks.length, text: text.slice(start, end).trim() });
      if (end >= text.length) break;
      start = end - OVERLAP;
    }
  }
  return chunks;
}

module.exports = { chunkPages };
