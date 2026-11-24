// MongoDB connection: connect once at startup, reuse everywhere.
const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.MONGODB_URI);

async function connectDB() {
  await client.connect();
  console.log("MongoDB connected");
}

// Separate database + collection so we don't touch your other project's data.
function chunksCollection() {
  return client.db("rag_practice").collection("pdf_chunks");
}

module.exports = { connectDB, chunksCollection };
