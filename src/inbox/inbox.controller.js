const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/autentication");
const { Variables } = require("camunda-external-task-client-js");

router.post("/:id", authMiddleware(["manager", "user"]), async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;
    const variables = req.body.variables;

    const response = await inboxService.createinbox(
      id,
      data,
      req.user.username,
      variables
    );
    res.status(201).json(response);
  } catch (error) {
    console.error(
      "Error completing task:",
      error.response?.data || error.message
    );
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
});
