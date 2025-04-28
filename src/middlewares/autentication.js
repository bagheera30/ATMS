const jwt = require("jsonwebtoken");

// Middleware untuk autentikasi berdasarkan role dan pengecekan expired token
const authMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    // Ambil token dari header Authorization
    const authHeader = req.headers.authorization;

    // Periksa apakah header Authorization ada dan mengandung token
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Access denied. No token provided." });
    }

    // Ekstrak token dari header
    const token = authHeader.split(" ")[1];

    try {
      // Verifikasi token menggunakan secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const currentTimeInSeconds = Math.floor(Date.now() / 1000);
      if (decoded.iat > currentTimeInSeconds) {
        return res.status(401).json({
          message: "Token issued in the future. Please log in again.",
        });
      }
      console.log(decoded.role);
      // Periksa apakah role pengguna sesuai dengan role yang diizinkan
      if (!allowedRoles.includes(decoded.role)) {
        return res
          .status(403)
          .json({ message: "Forbidden. Insufficient permissions." });
      }

      // Tambahkan data pengguna ke objek request untuk digunakan di route selanjutnya
      req.user = decoded;

      // Lanjutkan ke middleware/route berikutnya
      next();
    } catch (error) {
      // Tangani kesalahan verifikasi token
      if (error.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ message: "Token expired. Please log in again." });
      }
      if (error.name === "JsonWebTokenError") {
        return res
          .status(401)
          .json({ message: "Invalid token. Please log in again." });
      }
      return res.status(500).json({
        message: "An unexpected error occurred.",
        error: error.message,
      });
    }
  };
};

module.exports = authMiddleware;
