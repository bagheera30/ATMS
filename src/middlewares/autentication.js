const jwt = require("jsonwebtoken");
const { searchWorkgroup } = require("../role/role.repository");
const { findUserAllByUsername } = require("../user/user.repository");

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
        req.user = { roles: ["system"] };
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
        return res.status(401).json({
          message: "Token issued in the future. Please log in again.",
        });
      }

      const lw = decoded.username.toLowerCase();
      const user = await findUserAllByUsername(lw);

      if (!user) {
        return res.status(403).json({ message: "Forbidden: User not found." });
      }
      if (user.status !== "unlocked") {
        return res
          .status(403)
          .json({ message: "Forbidden: User account is not unlocked." });
      }

      // Perbaikan di sini - pastikan userRoles selalu berupa array
      const userRoles =
        typeof user.role === "string"
          ? [user.role]
          : Array.isArray(user.role)
          ? user.role
          : [];

      const allUserPermissions = userRoles.map((role) => role.toLowerCase());

      if (allowedRoles.length > 0) {
        const hasPermission = allUserPermissions.some((permission) =>
          allowedRoles.includes(permission)
        );

        if (!hasPermission) {
          return res
            .status(403)
            .json({ message: "Forbidden: Insufficient permissions." });
        }
      }

      for (const role of allUserPermissions) {
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

      req.user = {
        ...decoded,
        roles: user.role,
      };

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
      console.error("Authentication error:", error);
      return res
        .status(500)
        .json({ message: "Internal server error.", error: error.message });
    }
  };
};

module.exports = authMiddleware;
