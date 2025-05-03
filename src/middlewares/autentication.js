const jwt = require("jsonwebtoken");

const authMiddleware = (allowedRoles = []) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No token provided." });
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const currentTime = Math.floor(Date.now() / 1000);

      // Cek token expired (otomatis dilakukan oleh jwt.verify, tapi tambahkan pengecekan manual)
      if (decoded.exp && decoded.exp < currentTime) {
        return res
          .status(401)
          .json({ message: "Token expired. Please log in again." });
      }

      if (decoded.iat > currentTime) {
        return res.status(401).json({
          message: "Token issued in the future. Please log in again.",
        });
      }

      // Normalisasi roles menjadi array
      let userRoles = [];
      if (typeof decoded.roles === "string") {
        userRoles = decoded.roles.split(",").map((r) => r.trim());
      } else if (Array.isArray(decoded.roles)) {
        userRoles = decoded.roles.map((r) => r.toString().trim());
      } else {
        return res
          .status(403)
          .json({ message: "Forbidden: Invalid role format." });
      }
      // Cek izin
      if (
        allowedRoles.length > 0 &&
        !userRoles.some((role) => allowedRoles.includes(role))
      ) {
        return res
          .status(403)
          .json({ message: "Forbidden: Insufficient permissions." });
      }

      req.user = decoded;
      next();
    } catch (error) {
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
      return res
        .status(500)
        .json({ message: "Internal server error.", error: error.message });
    }
  };
};

module.exports = authMiddleware;
