// multerConfig.js
const multer = require("multer");
const path = require("path");

const storage = multer.memoryStorage(); // simpan di buffer memory

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext !== ".bpmn") {
    return cb(new Error("Only .bpmn files are allowed"), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // batas ukuran file 10MB
});

module.exports = upload;
