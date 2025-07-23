const request = require("supertest");
const express = require("express");

// Mock the workgroup service functions
jest.mock("../src/workgroup/workgroup.service", () => ({
  upsertWorkgroup: jest.fn(),
  getAllWorkgroup: jest.fn(),
  getByid: jest.fn(),
  deleteWorkgroup: jest.fn(),
  adduserToWorkgroup: jest.fn(),
  deleteuserWorkgroup: jest.fn(),
  getManeger: jest.fn(),
  getallwg: jest.fn(),
}));

// Mock the auth middleware
jest.mock("../src/middlewares/autentication", () => {
  return jest.fn().mockImplementation((allowedRoles) => {
    return (req, res, next) => {
      // Get role from headers for testing
      const userRole = req.headers["x-role"] || "staff";

      // Set user data based on role
      if (userRole === "admin") {
        req.user = {
          username: "admin-user",
          roles: "admin",
        };
      } else if (userRole === "manager") {
        req.user = {
          username: "manager-user",
          roles: "manager",
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

const workgroupRouter = require("../src/workgroup/workgroup.controlle");

const workgroupService = require("../src/workgroup/workgroup.service");

const app = express();
app.use(express.json());
app.use("/workgroups", workgroupRouter);

describe("Workgroup Router", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Tests for POST /:uuid (Update workgroup)
  describe("POST /:uuid", () => {
    it("should update a workgroup successfully", async () => {
      const mockData = {
        name: "Updated Workgroup",
        description: "Updated description",
      };

      const mockResponse = {
        id: "wg123",
        ...mockData,
        updatedBy: "admin-user",
      };

      workgroupService.upsertWorkgroup.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/workgroups/wg123")
        .set("x-role", "admin")
        .send(mockData);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        code: 1,
        status: true,
        message: "Workgroup created successfully",
        user: mockResponse,
      });
      expect(workgroupService.upsertWorkgroup).toHaveBeenCalledWith(
        "wg123",
        "admin-user",
        mockData
      );
    });

    it("should return 400 when service throws an error", async () => {
      workgroupService.upsertWorkgroup.mockRejectedValue(
        new Error("Workgroup not found")
      );

      const response = await request(app)
        .post("/workgroups/nonexistent")
        .set("x-role", "admin")
        .send({ name: "Test" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        code: 2,
        status: false,
        message: "Workgroup not found",
      });
    });

    it("should return 403 when non-admin tries to update a workgroup", async () => {
      const response = await request(app)
        .post("/workgroups/wg123")
        .set("x-role", "manager")
        .send({ name: "Test" });

      expect(response.status).toBe(403);
      expect(workgroupService.upsertWorkgroup).not.toHaveBeenCalled();
    });
  });

  // Tests for POST / (Create workgroup)
  describe("POST /", () => {
    it("should create a workgroup successfully", async () => {
      const mockData = {
        name: "New Workgroup",
        description: "New description",
      };

      const mockResponse = {
        id: "new-wg",
        ...mockData,
        createdBy: "admin-user",
      };

      workgroupService.upsertWorkgroup.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/workgroups")
        .set("x-role", "admin")
        .send(mockData);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        user: mockResponse,
      });
      expect(workgroupService.upsertWorkgroup).toHaveBeenCalledWith(
        "",
        "admin-user",
        mockData
      );
    });

    it("should return 400 when workgroup creation fails with status false", async () => {
      const mockErrorResponse = {
        status: false,
        message: "Workgroup name already exists",
      };

      workgroupService.upsertWorkgroup.mockResolvedValue(mockErrorResponse);

      const response = await request(app)
        .post("/workgroups")
        .set("x-role", "admin")
        .send({ name: "Existing Workgroup" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        code: 2,
        status: false,
        message: "Workgroup name already exists",
      });
    });

    it("should return 400 when service throws an error", async () => {
      workgroupService.upsertWorkgroup.mockRejectedValue(
        new Error("Validation error")
      );

      const response = await request(app)
        .post("/workgroups")
        .set("x-role", "admin")
        .send({ name: "Test" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        code: 2,
        status: false,
        message: "Validation error",
      });
    });
  });

  // Tests for GET /
  describe("GET /", () => {
    it("should get all workgroups for admin/staff/manager with no search param", async () => {
      const mockWorkgroups = [
        { id: "wg1", name: "Workgroup 1" },
        { id: "wg2", name: "Workgroup 2" },
      ];

      workgroupService.getallwg.mockResolvedValue(mockWorkgroups);

      const response = await request(app)
        .get("/workgroups")
        .set("x-role", "admin");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        workgroup: mockWorkgroups,
      });
      expect(workgroupService.getallwg).toHaveBeenCalled();
    });

    it("should return 404 when no workgroups found", async () => {
      workgroupService.getallwg.mockResolvedValue([]);

      const response = await request(app)
        .get("/workgroups")
        .set("x-role", "staff");

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        code: 1,
        status: false,
        message: "No workgroup found",
      });
    });

    it("should get workgroups with search param", async () => {
      const mockWorkgroups = [{ id: "wg1", name: "Matching Workgroup" }];

      workgroupService.getAllWorkgroup.mockResolvedValue(mockWorkgroups);

      const response = await request(app)
        .get("/workgroups?search=Matching")
        .set("x-role", "manager");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        workgroup: mockWorkgroups,
      });
      expect(workgroupService.getAllWorkgroup).toHaveBeenCalledWith("Matching");
    });

    it("should get managers for system role", async () => {
      const mockManagers = [{ id: "user1", username: "manager1" }];

      workgroupService.getManeger.mockResolvedValue(mockManagers);

      const response = await request(app)
        .get("/workgroups?search=dev")
        .set("x-role", "system");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        workgroup: mockManagers,
      });
      expect(workgroupService.getManeger).toHaveBeenCalledWith("dev");
    });

    it("should return 400 when service throws an error", async () => {
      workgroupService.getallwg.mockRejectedValue(new Error("Database error"));

      const response = await request(app)
        .get("/workgroups")
        .set("x-role", "admin");

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        code: 2,
        status: false,
        message: "Database error",
      });
    });
  });

  // Tests for GET /:uuid
  describe("GET /:uuid", () => {
    it("should get a specific workgroup by id", async () => {
      const mockWorkgroup = { id: "wg123", name: "Specific Workgroup" };

      workgroupService.getByid.mockResolvedValue(mockWorkgroup);

      const response = await request(app)
        .get("/workgroups/wg123")
        .set("x-role", "admin");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        workgroup: mockWorkgroup,
      });
      expect(workgroupService.getByid).toHaveBeenCalledWith("wg123");
    });

    it("should return 400 when service throws an error", async () => {
      workgroupService.getByid.mockRejectedValue(
        new Error("Workgroup not found")
      );

      const response = await request(app)
        .get("/workgroups/nonexistent")
        .set("x-role", "staff");

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        code: 2,
        status: false,
        message: "Workgroup not found",
      });
    });
  });

  // Tests for DELETE /:uuid
  describe("DELETE /:uuid", () => {
    it("should delete a workgroup successfully", async () => {
      const mockResponse = {
        status: true,
        message: "Workgroup deleted successfully",
      };

      workgroupService.deleteWorkgroup.mockResolvedValue(mockResponse);

      const response = await request(app)
        .delete("/workgroups/wg123")
        .set("x-role", "admin");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        code: 1,
        status: true,
        user: mockResponse,
      });
      expect(workgroupService.deleteWorkgroup).toHaveBeenCalledWith("wg123");
    });

    it("should return 400 when deletion fails with status false", async () => {
      const mockErrorResponse = {
        status: false,
        message: "Cannot delete: workgroup has users",
      };

      workgroupService.deleteWorkgroup.mockResolvedValue(mockErrorResponse);

      const response = await request(app)
        .delete("/workgroups/wg123")
        .set("x-role", "admin");

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        code: 2,
        status: false,
        message: "Cannot delete: workgroup has users",
      });
    });

    it("should return 400 when service throws an error", async () => {
      workgroupService.deleteWorkgroup.mockRejectedValue(
        new Error("Database error")
      );

      const response = await request(app)
        .delete("/workgroups/wg123")
        .set("x-role", "admin");

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        code: 2,
        status: false,
        message: "Database error",
      });
    });

    it("should return 403 when non-admin tries to delete a workgroup", async () => {
      const response = await request(app)
        .delete("/workgroups/wg123")
        .set("x-role", "manager");

      expect(response.status).toBe(403);
      expect(workgroupService.deleteWorkgroup).not.toHaveBeenCalled();
    });
  });

  // Tests for POST /addUser/:id
  describe("POST /addUser/:id", () => {
    it("should add a user to a workgroup successfully", async () => {
      const mockResponse = {
        status: true,
        message: "User added to workgroup",
      };

      workgroupService.adduserToWorkgroup.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/workgroups/addUser/wg123")
        .set("x-role", "manager")
        .send({ uuid: "user123" });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        user: mockResponse,
      });
      expect(workgroupService.adduserToWorkgroup).toHaveBeenCalledWith(
        "user123",
        "wg123"
      );
    });

    it("should return 400 when adding user fails with status false", async () => {
      const mockErrorResponse = {
        status: false,
        message: "User already in workgroup",
      };

      workgroupService.adduserToWorkgroup.mockResolvedValue(mockErrorResponse);

      const response = await request(app)
        .post("/workgroups/addUser/wg123")
        .set("x-role", "manager")
        .send({ uuid: "user123" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        code: 2,
        status: false,
        message: "User already in workgroup",
      });
    });

    it("should return 400 when service throws an error", async () => {
      workgroupService.adduserToWorkgroup.mockRejectedValue(
        new Error("User not found")
      );

      const response = await request(app)
        .post("/workgroups/addUser/wg123")
        .set("x-role", "manager")
        .send({ uuid: "nonexistent" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        code: 2,
        status: false,
        message: "User not found",
      });
    });

    it("should return 403 when non-manager tries to add a user", async () => {
      const response = await request(app)
        .post("/workgroups/addUser/wg123")
        .set("x-role", "staff")
        .send({ uuid: "user123" });

      expect(response.status).toBe(403);
      expect(workgroupService.adduserToWorkgroup).not.toHaveBeenCalled();
    });
  });

  // Tests for DELETE /removeUser/:id
  describe("DELETE /removeUser/:id", () => {
    it("should remove a user from a workgroup as manager", async () => {
      const mockResponse = {
        status: true,
        message: "User removed from workgroup",
      };

      workgroupService.deleteuserWorkgroup.mockResolvedValue(mockResponse);

      const response = await request(app)
        .delete("/workgroups/removeUser/wg123")
        .set("x-role", "manager")
        .send({ uuid: "user123" });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        user: mockResponse,
      });
      expect(workgroupService.deleteuserWorkgroup).toHaveBeenCalledWith(
        "user123",
        "wg123",
        "manager"
      );
    });

    it("should remove a user from a workgroup as admin", async () => {
      const mockResponse = {
        status: true,
        message: "User removed from workgroup",
      };

      workgroupService.deleteuserWorkgroup.mockResolvedValue(mockResponse);

      const response = await request(app)
        .delete("/workgroups/removeUser/wg123")
        .set("x-role", "admin")
        .send({ uuid: "user123" });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        user: mockResponse,
      });
      expect(workgroupService.deleteuserWorkgroup).toHaveBeenCalledWith(
        "user123",
        "wg123",
        "admin"
      );
    });

    it("should return 400 when service throws an error", async () => {
      workgroupService.deleteuserWorkgroup.mockRejectedValue(
        new Error("User not in workgroup")
      );

      const response = await request(app)
        .delete("/workgroups/removeUser/wg123")
        .set("x-role", "manager")
        .send({ uuid: "user123" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        code: 2,
        status: false,
        message: "User not in workgroup",
      });
    });

    it("should return 403 when staff tries to remove a user", async () => {
      const response = await request(app)
        .delete("/workgroups/removeUser/wg123")
        .set("x-role", "staff")
        .send({ uuid: "user123" });

      expect(response.status).toBe(403);
      expect(workgroupService.deleteuserWorkgroup).not.toHaveBeenCalled();
    });
  });

  // Edge case tests
  describe("Edge cases", () => {
    it("should handle missing uuid in request body for add/remove user", async () => {
      workgroupService.adduserToWorkgroup.mockRejectedValue(
        new Error("User ID is required")
      );

      const response = await request(app)
        .post("/workgroups/addUser/wg123")
        .set("x-role", "manager")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("User ID is required");
    });

    it("should handle console.log statements without affecting tests", async () => {
      const originalConsoleLog = console.log;
      console.log = jest.fn();

      workgroupService.getallwg.mockResolvedValue([]);

      await request(app).get("/workgroups").set("x-role", "admin");

      expect(console.log).toHaveBeenCalled();

      console.log = originalConsoleLog;
    });
  });
});
