const express = require("express");
const authMiddleware = require("../middlewares/autentication");
const userService = require("./user.service");
const router = express.Router();

router.get("/", authMiddleware(["manager"]), async (req, res) => {
  try {
    const search = req.query.username;
    let user;
    console.log(search);

    if (search) {
      user = await userService.getUserallByUsername(search);
      console.log(user);
    } else {
      user = await userService.getall();
      console.log(user);
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

router.patch("/:id", authMiddleware(["manager"]), async (req, res) => {
  const data = req.body;
  const id = req.params.id;
  const username = req.user.username;
  try {
    const user = await userService.updateUser(id, data);
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
