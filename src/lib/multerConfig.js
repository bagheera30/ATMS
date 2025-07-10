const multer = require("multer");
const path = require("path");

const storage = multer.memoryStorage(); 

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
  limits: { fileSize: 10 * 1024 * 1024 }, 
});

module.exports = upload;
