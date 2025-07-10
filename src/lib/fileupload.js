const multer = require("multer");

const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, 
  },

  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ["application/pdf"];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Tipe file tidak diizinkan"), false);
    }
  },
});

module.exports = upload;
