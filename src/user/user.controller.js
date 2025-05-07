const express = require("express");
const authMiddleware = require("../middlewares/autentication");
const userService = require("./user.service");
const router = express.Router();

router.get("/", authMiddleware(["manager", "user"]), async (req, res) => {
  try {
    const search = req.query.username;
    let user;
    console.log("user req: ", req.user.roles);
    console.log(search);
    if (req.user.roles === "user") {
      user = await userService.getUserallByUsername(req.user.username);
      console.log("user: ", user);
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
});

router.patch("/:id", authMiddleware(["manager", "user"]), async (req, res) => {
  const data = req.body;
  const id = req.params.id;
  const r=req.user.roles.split(",");
  console.log(r);
  const username = req.user.username;
  try {
    const user = await userService.updateUser(
      id,
      data,
      req.user.roles,
      username
    );
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
});
router.delete("/:id", authMiddleware(["manager"]), async (req, res) => {
  const id = req.params.id;
  try {
    const user = await userService.deleteUser(id);
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
});

module.exports = router;
