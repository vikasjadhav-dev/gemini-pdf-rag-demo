require("dotenv").config();
const express = require("express");
const { connectDB } = require("./config/db");
const pdfRoutes = require("./routes/pdfRoutes");

for (const key of ["MONGODB_URI", "GEMINI_API_KEY"]) {
  if (!process.env[key]) {
    console.error(`Missing ${key} in .env`);
    process.exit(1);
  }
}

const app = express();
app.use(express.json());
app.use("/api/pdf", pdfRoutes);

// One place to turn any error into a clean JSON response (never leaks secrets or stack traces).
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  if (err.code === "LIMIT_FILE_SIZE") return res.status(413).json({ error: "File too large (max 10 MB)." });
  const status = err.status || 500;
  const message = status < 500 || err.status === 503 ? err.message : "Something went wrong (Gemini or MongoDB request failed). Check the server logs.";
  res.status(status).json({ error: message });
});

connectDB()
  .then(() => app.listen(process.env.PORT || 5000, () => console.log("Server running")))
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
