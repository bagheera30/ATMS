const express = require("express");
const authMiddleware = require("../middlewares/autentication");
const userService = require("./user.service");
const router = express.Router();

router.get(
  "/",
  authMiddleware(["manager", "staff", "admin", "system"]),
  async (req, res) => {
    try {
      const search = req.query.username;
      let user;
      if (req.user.roles === "staff") {
        user = await userService.getUserallByUsername(req.user.username);
      } else if (req.user.roles === "system") {
        user = await userService.getTaskOverdue(search);
      } else {
        if (search) {
          user = await userService.getUserallByUsername(search);
        } else {
          user = await userService.getall();
        }
      }

      res.status(200).json({
        code: user.code,
        status: user.status,
        message: user.message,
        user: user.user,
      });
    } catch (error) {
      res.status(400).json({
        code: 2,
        status: false,
        message: error.message,
      });
    }
  }
);

router.get(
  "/workgroup",
  authMiddleware(["manager", "staff", "admin"]),
  async (req, res) => {
    const intance = req.query.intanceid;
    const username = req.user.username;

    try {
      const data = await userService.finduserbyWG(username, intance);
      if (data.status === false) {
        return res.status(400).json({
          code: 2,
          status: false,
          message: data.message,
        });
      }
      res.status(200).json({
        data,
      });
    } catch (error) {
      res.status(400).json({
        code: 2,
        status: false,
        message: error.message,
      });
    }
  }
);

router.post(
  "/:id",
  authMiddleware(["manager", "staff", "admin"]),
  async (req, res) => {
    const data = req.body;
    const id = req.params.id;
    const username = req.user.username;
    try {
      const user = await userService.updateUser(
        id,
        data,
        req.user.roles,
        username
      );
      if (user.code == 2) {
        res.status(404).json({
          code: user.code,
          status: user.status,
          message: user.message,
        });
      }
      res.status(201).json({
        user,
      });
    } catch (error) {
      res.status(400).json({
        code: 2,
        status: false,
        message: error.message,
      });
    }
  }
);
router.delete(
  "/:id",
  authMiddleware(["manager", "admin"]),
  async (req, res) => {
    const id = req.params.id;
    try {
      const user = await userService.deleteUser(id, req.user.roles);
      res.status(200).json({
        user,
      });
    } catch (error) {
      res.status(400).json({
        code: 2,
        status: false,
        message: error.message,
      });
    }
  }
);

module.exports = router;
