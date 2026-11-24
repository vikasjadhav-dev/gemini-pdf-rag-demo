const express = require("express");
const multer = require("multer");
const { uploadPdf } = require("../controllers/uploadController");
const { askQuestion } = require("../controllers/askController");

const upload = multer({
  storage: multer.memoryStorage(), // keep the file in RAM, we never save it to disk
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) =>
    file.mimetype === "application/pdf" ? cb(null, true) : cb(Object.assign(new Error("Only PDF files are allowed."), { status: 400 })),
});

const router = express.Router();
router.post("/upload", upload.single("file"), uploadPdf);
router.post("/ask", askQuestion);

module.exports = router;
