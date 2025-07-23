const request = require("supertest");
const express = require("express");

// Mock the service functions
jest.mock("../src/role/role.service", () => ({
  upsertWorkgroup: jest.fn(),
  getAllWorkgroup: jest.fn(),
  getByid: jest.fn(),
  deleteWorkgroup: jest.fn(),
  adduserToWorkgroup: jest.fn(),
  deleteuserWorkgroup: jest.fn(),
}));

// Mock the auth middleware
jest.mock("../src/middlewares/autentication", () => {
  return jest.fn().mockImplementation((allowedRoles) => {
    return (req, res, next) => {
      // For testing different roles
      if (req.headers["x-role"] === "manager") {
        req.user = {
          username: "manager-user",
          roles: ["manager"],
        };
      } else {
        req.user = {
          username: "admin-user",
          roles: ["admin"],
        };
      }
      next();
    };
  });
});

// Import the router (assuming the path)
const workgroupRouter = require("../src/role/role.controller"); // Adjust path as needed

// Import the mocked service functions
const {
  upsertWorkgroup,
  getAllWorkgroup,
  getByid,
  deleteWorkgroup,
  adduserToWorkgroup,
  deleteuserWorkgroup,
} = require("../src/role/role.service");

// Create Express app for testing
const app = express();
app.use(express.json());
app.use("/workgroups", workgroupRouter);

describe("Workgroup Router", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Tests for DELETE /removeUser
  describe("DELETE /removeUser", () => {
    it("should remove a user from a workgroup successfully", async () => {
      deleteuserWorkgroup.mockResolvedValue({ success: true });

      const response = await request(app)
        .delete("/workgroups/removeUser?RoleName=developer")
        .set("x-role", "manager")
        .send({ uuid: "user123" });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("user");
      expect(deleteuserWorkgroup).toHaveBeenCalledWith("user123", "developer", [
        "manager",
      ]);
    });

    it("should return 400 when removing user fails", async () => {
      deleteuserWorkgroup.mockRejectedValue(new Error("User not found"));

      const response = await request(app)
        .delete("/workgroups/removeUser?RoleName=developer")
        .set("x-role", "manager")
        .send({ uuid: "user123" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        code: 2,
        status: false,
        message: "User not found",
      });
    });
  });

  // Tests for POST /addUser
  describe("POST /addUser", () => {
    it("should add a user to a workgroup successfully", async () => {
      adduserToWorkgroup.mockResolvedValue({ success: true });

      const response = await request(app)
        .post("/workgroups/addUser?RoleName=developer")
        .set("x-role", "manager")
        .send({ uuid: "user123" });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("user");
      expect(adduserToWorkgroup).toHaveBeenCalledWith("user123", "developer");
    });

    it("should return 400 when adding user fails", async () => {
      adduserToWorkgroup.mockRejectedValue(new Error("User already exists"));

      const response = await request(app)
        .post("/workgroups/addUser?RoleName=developer")
        .set("x-role", "manager")
        .send({ uuid: "user123" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        code: 2,
        status: false,
        message: "User already exists",
      });
    });
  });

  // Tests for POST /:RoleName (Update workgroup)
  describe("POST /:RoleName", () => {
    it("should update a workgroup successfully", async () => {
      upsertWorkgroup.mockResolvedValue({
        id: "wg123",
        name: "Senior Developer",
        status: "active",
      });

      const response = await request(app).post("/workgroups/developer").send({
        RoleName: "Senior Developer",
        status: "active",
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("user");
      expect(upsertWorkgroup).toHaveBeenCalledWith(
        "developer",
        "admin-user",
        "Senior Developer",
        "active"
      );
    });

    it("should return 400 when updating workgroup fails", async () => {
      upsertWorkgroup.mockRejectedValue(new Error("Workgroup not found"));

      const response = await request(app).post("/workgroups/developer").send({
        RoleName: "Senior Developer",
        status: "active",
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        code: 2,
        status: false,
        message: "Workgroup not found",
      });
    });
  });

  // Tests for POST / (Create new workgroup)
  describe("POST /", () => {
    it("should create a new workgroup successfully", async () => {
      upsertWorkgroup.mockResolvedValue({
        id: "wg123",
        name: "New Workgroup",
        status: "inactive",
      });

      const response = await request(app)
        .post("/workgroups")
        .send({ RoleName: "New Workgroup" });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("user");
      expect(upsertWorkgroup).toHaveBeenCalledWith(
        null,
        "admin-user",
        "New Workgroup",
        "inactive"
      );
    });

    it("should return 400 when workgroup creation has validation error", async () => {
      upsertWorkgroup.mockResolvedValue({
        status: false,
        message: "Workgroup name already exists",
      });

      const response = await request(app)
        .post("/workgroups")
        .send({ RoleName: "Existing Workgroup" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        code: 2,
        status: false,
        message: "Workgroup name already exists",
      });
    });

    it("should return 400 when workgroup creation fails", async () => {
      upsertWorkgroup.mockRejectedValue(new Error("Database error"));

      const response = await request(app)
        .post("/workgroups")
        .send({ RoleName: "New Workgroup" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        code: 2,
        status: false,
        message: "Database error",
      });
    });
  });

  // Tests for GET /
  describe("GET /", () => {
    it("should get all workgroups successfully", async () => {
      const mockWorkgroups = [
        { id: "wg1", name: "Developers" },
        { id: "wg2", name: "Managers" },
      ];
      getAllWorkgroup.mockResolvedValue(mockWorkgroups);

      const response = await request(app)
        .get("/workgroups")
        .set("x-role", "manager");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("workgroup", mockWorkgroups);
      expect(getAllWorkgroup).toHaveBeenCalled();
    });

    it("should get a specific workgroup by RoleName", async () => {
      const mockWorkgroup = { id: "wg1", name: "Developers" };
      getByid.mockResolvedValue(mockWorkgroup);

      const response = await request(app)
        .get("/workgroups?RoleName=Developers")
        .set("x-role", "manager");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("workgroup", mockWorkgroup);
      expect(getByid).toHaveBeenCalledWith("Developers");
    });

    it("should return 400 when getting workgroups fails", async () => {
      getAllWorkgroup.mockRejectedValue(new Error("Database error"));

      const response = await request(app)
        .get("/workgroups")
        .set("x-role", "manager");

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        code: 2,
        status: false,
        message: "Database error",
      });
    });
  });

  // Tests for DELETE /:uuid
  describe("DELETE /:uuid", () => {
    it("should delete a workgroup successfully", async () => {
      deleteWorkgroup.mockResolvedValue({
        status: true,
        message: "Workgroup deleted successfully",
      });

      const response = await request(app).delete("/workgroups/wg123");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        code: 1,
        status: true,
        user: {
          status: true,
          message: "Workgroup deleted successfully",
        },
      });
      expect(deleteWorkgroup).toHaveBeenCalledWith("wg123");
    });

    it("should return 400 when deletion has validation error", async () => {
      deleteWorkgroup.mockResolvedValue({
        status: false,
        message: "Cannot delete: workgroup has users",
      });

      const response = await request(app).delete("/workgroups/wg123");

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        code: 2,
        status: false,
        message: "Cannot delete: workgroup has users",
      });
    });

    it("should return 400 when workgroup deletion fails", async () => {
      deleteWorkgroup.mockRejectedValue(new Error("Database error"));

      const response = await request(app).delete("/workgroups/wg123");

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        code: 2,
        status: false,
        message: "Database error",
      });
    });
  });

  // Edge case tests
  describe("Edge Cases", () => {
    it("should handle empty request body for create workgroup", async () => {
      const response = await request(app).post("/workgroups").send({});

      expect(response.status).toBe(400);
    });

    it("should handle missing uuid when adding user to workgroup", async () => {
      const response = await request(app)
        .post("/workgroups/addUser?RoleName=developer")
        .set("x-role", "manager")
        .send({});

      expect(response.status).toBe(400);
    });
  });
});
