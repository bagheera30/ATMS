const jwt = require("jsonwebtoken");
const { searchWorkgroup } = require("../role/role.repository");

const authMiddleware = (allowedRoles = []) => {
  return async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No token provided." });
    }

    const token = authHeader.split(" ")[1];
    const adminToken = process.env.TOKEN_ADMIN;

    try {
      if (token === adminToken) {
        req.user = { roles: "system" };
        return next();
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const currentTime = Math.floor(Date.now() / 1000);

      if (decoded.exp && decoded.exp < currentTime) {
        return res
          .status(401)
          .json({ message: "Token expired. Please log in again." });
      }

      if (decoded.iat > currentTime) {
        return res
          .status(401)
          .json({
            message: "Token issued in the future. Please log in again.",
          });
      }

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

      if (
        allowedRoles.length > 0 &&
        !userRoles.some((role) => allowedRoles.includes(role))
      ) {
        return res
          .status(403)
          .json({ message: "Forbidden: Insufficient permissions." });
      }

      for (const role of userRoles) {
        const roleData = await searchWorkgroup(role.toLowerCase());

        if (!roleData) {
          return res
            .status(403)
            .json({ message: `Forbidden: Role ${role} not found.` });
        }

        if (roleData.status !== "active") {
          return res
            .status(403)
            .json({ message: `Forbidden: Role ${role} is not active.` });
        }
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
