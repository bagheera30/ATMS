const request = require("supertest");
const express = require("express");

// Mock the user service
jest.mock("../src/user/user.service", () => ({
  getUserallByUsername: jest.fn(),
  getTaskOverdue: jest.fn(),
  getall: jest.fn(),
  finduserbyWG: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
}));

// Mock the auth middleware
jest.mock("../src/middlewares/autentication", () => {
  return jest.fn().mockImplementation((allowedRoles) => {
    return (req, res, next) => {
      // Get role from header for testing
      const userRole = req.headers["x-role"] || "staff";

      // Set user data based on role
      if (userRole === "manager") {
        req.user = {
          username: "manager-user",
          roles: "manager",
        };
      } else if (userRole === "admin") {
        req.user = {
          username: "admin-user",
          roles: "admin",
        };
      } else if (userRole === "system") {
        req.user = {
          username: "system-user",
          roles: "system",
        };
      } else {
        req.user = {
          username: "staff-user",
          roles: "staff",
        };
      }

      // Check if user role is allowed
      if (allowedRoles.includes(userRole)) {
        next();
      } else {
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
const userRouter = require("../src/user/user.controller");

// Import the mocked service
const userService = require("../src/user/user.service");

// Create Express app for testing
const app = express();
app.use(express.json());
app.use("/users", userRouter);

describe("User Router", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Tests for GET /
  describe("GET /", () => {
    it("should return users filtered by username for manager role", async () => {
      const mockUser = {
        code: 0,
        status: true,
        message: "Success",
        user: { id: "user1", username: "test-user" },
      };

      userService.getUserallByUsername.mockResolvedValue(mockUser);

      const response = await request(app)
        .get("/users?username=test-user")
        .set("x-role", "manager");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUser);
      expect(userService.getUserallByUsername).toHaveBeenCalledWith(
        "test-user"
      );
    });

    it("should return all users for admin role when no username is provided", async () => {
      const mockUsers = {
        code: 0,
        status: true,
        message: "Success",
        user: [
          { id: "user1", username: "user1" },
          { id: "user2", username: "user2" },
        ],
      };

      userService.getall.mockResolvedValue(mockUsers);

      const response = await request(app).get("/users").set("x-role", "admin");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUsers);
      expect(userService.getall).toHaveBeenCalled();
    });

    it("should return only the staff's own user data for staff role", async () => {
      const mockUser = {
        code: 0,
        status: true,
        message: "Success",
        user: { id: "staff1", username: "staff-user" },
      };

      userService.getUserallByUsername.mockResolvedValue(mockUser);

      const response = await request(app).get("/users").set("x-role", "staff");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUser);
      expect(userService.getUserallByUsername).toHaveBeenCalledWith(
        "staff-user"
      );
    });

    it("should return overdue tasks for system role", async () => {
      const mockOverdueTasks = {
        code: 0,
        status: true,
        message: "Success",
        user: [
          { id: "task1", name: "Overdue Task 1" },
          { id: "task2", name: "Overdue Task 2" },
        ],
      };

      userService.getTaskOverdue.mockResolvedValue(mockOverdueTasks);

      const response = await request(app)
        .get("/users?username=test-user")
        .set("x-role", "system");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockOverdueTasks);
      expect(userService.getTaskOverdue).toHaveBeenCalledWith("test-user");
    });

    it("should return 400 when service throws an error", async () => {
      userService.getall.mockRejectedValue(new Error("Database error"));

      const response = await request(app).get("/users").set("x-role", "admin");

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        code: 2,
        status: false,
        message: "Database error",
      });
    });
  });

  // Tests for GET /workgroup
  describe("GET /workgroup", () => {
    it("should return users by workgroup successfully", async () => {
      const mockWgUsers = {
        status: true,
        data: [
          { id: "user1", username: "user1", workgroup: "dev" },
          { id: "user2", username: "user2", workgroup: "dev" },
        ],
      };

      userService.finduserbyWG.mockResolvedValue(mockWgUsers);

      const response = await request(app)
        .get("/users/workgroup")
        .set("x-role", "manager");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ data: mockWgUsers });
      expect(userService.finduserbyWG).toHaveBeenCalledWith("manager-user");
    });

    it("should return 400 when workgroup query fails with status false", async () => {
      const mockErrorResponse = {
        status: false,
        message: "Workgroup not found",
      };

      userService.finduserbyWG.mockResolvedValue(mockErrorResponse);

      const response = await request(app)
        .get("/users/workgroup")
        .set("x-role", "staff");

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        code: 2,
        status: false,
        message: "Workgroup not found",
      });
    });

    it("should return 400 when service throws an error", async () => {
      userService.finduserbyWG.mockRejectedValue(new Error("Database error"));

      const response = await request(app)
        .get("/users/workgroup")
        .set("x-role", "admin");

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        code: 2,
        status: false,
        message: "Database error",
      });
    });
  });

  // Tests for POST /:id (Update user)
  describe("POST /:id", () => {
    it("should update a user successfully", async () => {
      const mockUpdateData = {
        name: "Updated Name",
        email: "updated@example.com",
      };

      const mockResponse = {
        code: 0,
        status: true,
        message: "User updated successfully",
        data: { id: "user123", ...mockUpdateData },
      };

      userService.updateUser.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/users/user123")
        .set("x-role", "admin")
        .send(mockUpdateData);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ user: mockResponse });
      expect(userService.updateUser).toHaveBeenCalledWith(
        "user123",
        mockUpdateData,
        "admin",
        "admin-user"
      );
    });

    it("should return 404 when user update fails with code 2", async () => {
      const mockErrorResponse = {
        code: 2,
        status: false,
        message: "User not found",
      };

      userService.updateUser.mockResolvedValue(mockErrorResponse);

      const response = await request(app)
        .post("/users/nonexistent")
        .set("x-role", "manager")
        .send({ name: "New Name" });

      expect(response.status).toBe(404);
      expect(response.body).toEqual(mockErrorResponse);
    });

    it("should return 400 when service throws an error", async () => {
      userService.updateUser.mockRejectedValue(new Error("Validation error"));

      const response = await request(app)
        .post("/users/user123")
        .set("x-role", "staff")
        .send({ name: "New Name" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        code: 2,
        status: false,
        message: "Validation error",
      });
    });
  });

  // Tests for DELETE /:id
  describe("DELETE /:id", () => {
    it("should delete a user successfully", async () => {
      const mockResponse = {
        code: 0,
        status: true,
        message: "User deleted successfully",
      };

      userService.deleteUser.mockResolvedValue(mockResponse);

      const response = await request(app)
        .delete("/users/user123")
        .set("x-role", "manager");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ user: mockResponse });
      expect(userService.deleteUser).toHaveBeenCalledWith("user123");
    });

    it("should return 400 when service throws an error", async () => {
      userService.deleteUser.mockRejectedValue(
        new Error("Cannot delete active user")
      );

      const response = await request(app)
        .delete("/users/user123")
        .set("x-role", "manager");

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        code: 2,
        status: false,
        message: "Cannot delete active user",
      });
    });

    it("should return 403 when non-manager tries to delete a user", async () => {
      const response = await request(app)
        .delete("/users/user123")
        .set("x-role", "staff");

      expect(response.status).toBe(403);
      expect(userService.deleteUser).not.toHaveBeenCalled();
    });
  });

  // Test for role-based access
  describe("Role-based access", () => {
    it("should allow access to endpoints with appropriate roles", async () => {
      userService.getall.mockResolvedValue({
        code: 0,
        status: true,
        message: "Success",
        user: [],
      });

      const response = await request(app).get("/users").set("x-role", "admin");

      expect(response.status).toBe(200);
    });

    it("should deny access to endpoints with inappropriate roles", async () => {
      // Testing with a role not in the allowedRoles array
      const response = await request(app).get("/users").set("x-role", "guest");

      expect(response.status).toBe(403);
    });
  });

  // Edge case tests
  describe("Edge cases", () => {
    it("should handle empty response from user service", async () => {
      const emptyResponse = {
        code: 0,
        status: true,
        message: "No users found",
        user: [],
      };

      userService.getall.mockResolvedValue(emptyResponse);

      const response = await request(app).get("/users").set("x-role", "admin");

      expect(response.status).toBe(200);
      expect(response.body.user).toEqual([]);
    });

    it("should handle null/undefined values in request", async () => {
      const mockResponse = {
        code: 0,
        status: true,
        message: "Success",
        user: { id: "user1" },
      };

      userService.updateUser.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/users/user1")
        .set("x-role", "admin")
        .send({ name: null, email: undefined });

      expect(response.status).toBe(201);
      // Verify the service was called with the null/undefined values
      expect(userService.updateUser).toHaveBeenCalledWith(
        "user1",
        { name: null, email: undefined },
        "admin",
        "admin-user"
      );
    });
  });
});
