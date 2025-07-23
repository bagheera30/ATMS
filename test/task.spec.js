const request = require("supertest");
const express = require("express");

// Mock the task service
jest.mock("../src/task/task.service", () => ({
  getalltask: jest.fn(),
  getasbyinbox: jest.fn(),
  assignee: jest.fn(),
  Unassignee: jest.fn(),
  delegation: jest.fn(),
  overdue: jest.fn(),
  gettask: jest.fn(),
}));

// Mock the auth middleware
// Mock the auth middleware
jest.mock("../src/middlewares/autentication", () => {
  return jest.fn().mockImplementation((allowedRoles) => {
    return (req, res, next) => {
      let userRole;

      // Set user data based on x-role header
      if (req.headers["x-role"] === "manager") {
        userRole = "manager";
        req.user = {
          username: "manager-user",
          roles: ["manager"],
        };
      } else {
        userRole = "staff";
        req.user = {
          username: "staff-user",
          roles: ["staff"],
        };
      }

      // Check if the user's role is in the list of allowed roles
      if (allowedRoles.includes(userRole)) {
        next(); // Role is allowed, proceed to route handler
      } else {
        // Role is not allowed, return 403 Forbidden
        return res.status(403).json({
          code: 3,
          status: false,
          message: "Forbidden: Insufficient permissions",
        });
      }
    };
  });
});

// Import the router
const taskRouter = require("../src/task/task.contoller");

// Import the mocked service
const taskService = require("../src/task/task.service");

// Create Express app for testing
const app = express();
app.use(express.json());
app.use("/tasks", taskRouter);

describe("Task Router", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Tests for GET /
  describe("GET /", () => {
    it("should get all tasks successfully", async () => {
      const mockTasks = [
        { id: "task1", name: "Task 1" },
        { id: "task2", name: "Task 2" },
      ];

      taskService.getalltask.mockResolvedValue(mockTasks);

      const response = await request(app).get("/tasks").set("x-role", "staff");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        code: 0,
        status: true,
        message: "success",
        data: mockTasks,
      });
      expect(taskService.getalltask).toHaveBeenCalled();
    });

    it("should get tasks filtered by businessKey", async () => {
      const mockTasks = [{ id: "task1", name: "Task 1" }];

      taskService.getalltask.mockResolvedValue(mockTasks);

      const response = await request(app)
        .get("/tasks?businessKey=process123")
        .set("x-role", "manager");

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockTasks);
      expect(taskService.getalltask).toHaveBeenCalledWith("process123");
    });

    it("should return 400 when getting tasks fails", async () => {
      taskService.getalltask.mockRejectedValue(new Error("Database error"));

      const response = await request(app).get("/tasks").set("x-role", "staff");

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        code: 2,
        status: false,
        message: "Database error",
      });
    });
  });

  // Tests for GET /inbox
  describe("GET /inbox", () => {
    it("should get inbox tasks successfully", async () => {
      const mockInboxTasks = [
        { id: "task1", name: "Inbox Task 1" },
        { id: "task2", name: "Inbox Task 2" },
      ];

      taskService.getasbyinbox.mockResolvedValue(mockInboxTasks);

      const response = await request(app)
        .get("/tasks/inbox")
        .set("x-role", "staff");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        code: 0,
        status: true,
        message: "success",
        data: mockInboxTasks,
      });
      expect(taskService.getasbyinbox).toHaveBeenCalledWith("staff-user");
    });

    it("should return 400 when getting inbox tasks fails", async () => {
      taskService.getasbyinbox.mockRejectedValue(new Error("Inbox not found"));

      const response = await request(app)
        .get("/tasks/inbox")
        .set("x-role", "staff");

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        code: 2,
        status: false,
        message: "Inbox not found",
      });
    });
  });

  // Tests for GET /:id/claim
  describe("GET /:id/claim", () => {
    it("should claim a task successfully", async () => {
      taskService.assignee.mockResolvedValue({ success: true });

      const response = await request(app)
        .get("/tasks/task123/claim")
        .set("x-role", "manager");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        code: 0,
        status: true,
        message: "success",
      });
      expect(taskService.assignee).toHaveBeenCalledWith(
        "manager-user",
        "task123"
      );
    });

    it("should return 400 when claiming task fails", async () => {
      taskService.assignee.mockRejectedValue(new Error("Task already claimed"));

      const response = await request(app)
        .get("/tasks/task123/claim")
        .set("x-role", "manager");

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        code: 2,
        status: false,
        message: "Task already claimed",
      });
    });
  });

  // Tests for GET /:id/unclaim
  describe("GET /:id/unclaim", () => {
    it("should unclaim a task successfully", async () => {
      taskService.Unassignee.mockResolvedValue({ success: true });

      const response = await request(app)
        .get("/tasks/task123/unclaim")
        .set("x-role", "manager");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        code: 0,
        status: true,
        message: "success",
      });
      expect(taskService.Unassignee).toHaveBeenCalledWith("task123");
    });

    it("should return 400 when unclaiming task fails", async () => {
      taskService.Unassignee.mockRejectedValue(new Error("Task not claimed"));

      const response = await request(app)
        .get("/tasks/task123/unclaim")
        .set("x-role", "manager");

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        code: 2,
        status: false,
        message: "Task not claimed",
      });
    });
  });

  // Tests for POST /:id/delegate
  describe("POST /:id/delegate", () => {
    it("should delegate a task successfully", async () => {
      const delegateData = { userId: "user456" };
      taskService.delegation.mockResolvedValue({ success: true });

      const response = await request(app)
        .post("/tasks/task123/delegate")
        .set("x-role", "manager")
        .send(delegateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("task");
      expect(taskService.delegation).toHaveBeenCalledWith(
        "manager-user",
        delegateData,
        "task123"
      );
    });

    it("should return 400 when delegation fails", async () => {
      taskService.delegation.mockRejectedValue(new Error("User not found"));

      const response = await request(app)
        .post("/tasks/task123/delegate")
        .set("x-role", "manager")
        .send({ userId: "invalid-user" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        code: 2,
        status: false,
        message: "User not found",
      });
    });
  });

  // Tests for GET /overdue
  describe("GET /overdue", () => {
    it("should get overdue tasks successfully", async () => {
      const mockOverdueTasks = [
        { id: "task1", name: "Overdue Task 1" },
        { id: "task2", name: "Overdue Task 2" },
      ];

      taskService.overdue.mockResolvedValue(mockOverdueTasks);

      const response = await request(app)
        .get("/tasks/overdue")
        .set("x-role", "manager");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        code: 0,
        status: true,
        message: "success",
        overdue: mockOverdueTasks,
      });
      expect(taskService.overdue).toHaveBeenCalled();
    });

    it("should return 400 when getting overdue tasks fails", async () => {
      taskService.overdue.mockRejectedValue(new Error("Service unavailable"));

      const response = await request(app)
        .get("/tasks/overdue")
        .set("x-role", "staff");

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        code: 2,
        status: false,
        message: "Service unavailable",
      });
    });
  });

  // Tests for GET /:id
  describe("GET /:id", () => {
    it("should get a specific task successfully", async () => {
      const mockTask = { id: "task123", name: "Specific Task" };

      taskService.gettask.mockResolvedValue(mockTask);

      const response = await request(app)
        .get("/tasks/task123")
        .set("x-role", "staff");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        code: 0,
        status: true,
        message: "success",
        data: mockTask,
      });
      expect(taskService.gettask).toHaveBeenCalledWith("task123");
    });

    it("should return 400 when getting a specific task fails", async () => {
      taskService.gettask.mockRejectedValue(new Error("Task not found"));

      const response = await request(app)
        .get("/tasks/nonexistent")
        .set("x-role", "manager");

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        code: 2,
        status: false,
        message: "Task not found",
      });
    });
  });

  // Test for role-based access
  describe("Role-based access", () => {
    it("should allow staff to access routes they have permission for", async () => {
      taskService.getalltask.mockResolvedValue([]);

      const response = await request(app).get("/tasks").set("x-role", "staff");

      expect(response.status).toBe(200);
    });

    it("should not allow staff to claim tasks", async () => {
      // This test assumes your auth middleware will block the request
      // You may need to modify this based on your actual implementation
      const response = await request(app)
        .get("/tasks/task123/claim")
        .set("x-role", "staff");

      expect(response.status).toBe(403);
    });
  });
});
