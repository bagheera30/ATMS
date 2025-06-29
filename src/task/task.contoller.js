const express = require("express");
const { gettasklist, getalltask } = require("./task.service");
const authMiddleware = require("../middlewares/autentication");
const taskService = require("./task.service");

const router = express.Router();

router.get("/", authMiddleware(["manager", "user"]), async (req, res) => {
  try {
    const data = await getalltask();
    res.status(200).json({
      code: 0,
      status: true,
      message: "success",
      data,
    });
  } catch (error) {
    res.status(400).json({
      code: 2,
      status: false,
      message: error.message,
    });
  }
});
router.get("/inbox", authMiddleware(["manager","user"]), async (req, res) => {
  try {
    const data = await taskService.getasbyinbox(req.user.username);
    res.status(200).json({
      code: 0,
      status: true,
      message: "success",
      data,
    });
  } catch (error) {
    res.status(400).json({
      code: 2,
      status: false,
      message: error.message,
    });
  }
});

router.get(
  "/:id/claim",
  authMiddleware(["manager", "user"]),
  async (req, res) => {
    const data = req.params.id;
    console.log(req.user.username);
    try {
      await taskService.assignee(req.user.username, data);
      res.status(200).json({
        code: 0,
        status: true,
        message: "success",
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
  "/:id/unclaim",
  authMiddleware(["manager", "user"]),
  async (req, res) => {
    const data = req.params.id;
    console.log(data.taskid);
    try {
      await taskService.Unassignee(data);
      res.status(200).json({
        code: 0,
        status: true,
        message: "success",
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
  "/:id/delegate",
  authMiddleware(["manager", "user"]),
  async (req, res) => {
    const data = req.body;

    try {
      const task = await taskService.delegation(
        req.user.username,
        data,
        req.params.id
      );
      res.status(200).json({
        task,
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
router.get("/overdue", authMiddleware(["manager"]), async (req, res) => {
  try {
    const overdue = await taskService.overdue();
    res.status(200).json({
      code: 0,
      status: true,
      message: "success",
      overdue,
    });
  } catch (error) {
    res.status(400).json({
      code: 2,
      status: false,
      message: error.message,
    });
  }
});
router.get("/:id", authMiddleware(["manager", "user"]), async (req, res) => {
  try {
    const data = await taskService.gettask(req.params.id);
    res.status(200).json({
      code: 0,
      status: true,
      message: "success",
      data,
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
