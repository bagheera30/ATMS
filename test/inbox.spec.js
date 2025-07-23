
const request = require("supertest");
const express = require("express");

// Mock MinIO client BEFORE importing the router or any other modules
jest.mock("minio", () => {
  return {
    Client: jest.fn().mockImplementation(() => {
      return {
        presignedGetObject: jest
          .fn()
          .mockImplementation((bucket, fileName, expiryTime, cb) => {
            cb(null, `https://mock-minio-server.com/${bucket}/${fileName}`);
          }),
        putObject: jest
          .fn()
          .mockImplementation(
            (bucket, fileName, buffer, size, metadata, cb) => {
              cb(null, { etag: "mock-etag" });
            }
          ),
        // Add other MinIO methods as needed
      };
    }),
  };
});

// Also mock any direct imports of MinIO client
jest.mock("../src/lib/minioClient", () => {
  return {
    presignedGetObject: jest
      .fn()
      .mockImplementation((bucket, fileName, expiryTime, cb) => {
        cb(null, `https://mock-minio-server.com/${bucket}/${fileName}`);
      }),
    putObject: jest
      .fn()
      .mockImplementation((bucket, fileName, buffer, size, metadata, cb) => {
        cb(null, { etag: "mock-etag" });
      }),
    // Add other MinIO methods as needed
  };
});

// Now it's safe to import the router and services
const router = require("../src/inbox/inbox.controller");
const inboxService = require("../src/inbox/inbox.service");
const authMiddleware = require("../src/middlewares/autentication");

// Mock the inbox service
jest.mock("../src/inbox/inbox.service");

// Mock the auth middleware
jest.mock("../src/middlewares/autentication", () => {
  return jest.fn((roles) => {
    return (req, res, next) => {
      // Simulate different roles based on custom header
      if (req.headers["x-role"]) {
        req.user = {
          username: "testuser",
          roles: req.headers["x-role"],
        };
      } else {
        req.user = {
          username: "testuser",
          roles: "manager",
        };
      }

      // Check if user has required role
      if (roles.includes(req.user.roles)) {
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

// Updated mock for the upload middleware to handle form fields properly
jest.mock("../src/lib/fileupload", () => {
  return {
    any: jest.fn(() => (req, res, next) => {
      // Simulate the multer middleware for files
      if (req.headers["x-test-files"]) {
        const fileCount = parseInt(req.headers["x-test-files"]) || 0;
        req.files = [];

        for (let i = 0; i < fileCount; i++) {
          req.files.push({
            fieldname: `file${i}`,
            originalname: `test${i}.pdf`,
            mimetype: "application/pdf",
            buffer: Buffer.from("test file content"),
            size: 1024,
          });
        }
      } else {
        req.files = [];
      }

      // For testing purposes, create a body with form fields from headers
      req.body = {
        ...(req.body || {}),
        ...(req.headers["x-test-comment"]
          ? { comment: req.headers["x-test-comment"] }
          : {}),
        ...(req.headers["x-test-status"]
          ? { status: req.headers["x-test-status"] }
          : {}),
      };

      next();
    }),
  };
});

// Create Express app for testing
const app = express();
app.use(express.json());
app.use("/inbox", router);

describe("Inbox Controller", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe("GET /:id/complete", () => {
    it("should complete a task successfully as manager", async () => {
      const taskId = "task123";
      const mockResponse = {
        success: true,
        message: "Task completed successfully",
        data: { id: taskId, status: "completed" },
      };

      inboxService.complate.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get(`/inbox/${taskId}/complete`)
        .set("x-role", "manager")
        .expect(200);

      expect(response.body).toEqual(mockResponse);
      expect(inboxService.complate).toHaveBeenCalledWith(taskId, "testuser");
    });

    it("should return 403 when non-manager tries to complete a task", async () => {
      const response = await request(app)
        .get("/inbox/task123/complete")
        .set("x-role", "staff")
        .expect(403);

      expect(response.body).toEqual({
        code: 3,
        status: false,
        message: "Forbidden: Insufficient permissions",
      });
      expect(inboxService.complate).not.toHaveBeenCalled();
    });

    it("should handle errors from the service", async () => {
      const taskId = "task123";
      const mockError = new Error("Task not found");
      mockError.response = { status: 404, data: { message: "Task not found" } };

      inboxService.complate.mockRejectedValue(mockError);

      const response = await request(app)
        .get(`/inbox/${taskId}/complete`)
        .set("x-role", "manager")
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: "Task not found",
      });
    });

    it("should handle generic errors without response object", async () => {
      const taskId = "task123";
      inboxService.complate.mockRejectedValue(new Error("Unexpected error"));

      const response = await request(app)
        .get(`/inbox/${taskId}/complete`)
        .set("x-role", "manager")
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: "Unexpected error",
      });
    });
  });

  describe("POST /:id/complete", () => {
    it("should complete a task with files as manager", async () => {
      const taskId = "task123";
      const mockResponse = {
        success: true,
        message: "Task completed with files",
        data: { id: taskId, status: "completed" },
      };

      inboxService.createinbox.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post(`/inbox/${taskId}/complete`)
        .set("x-role", "manager")
        .set("x-test-files", "2") // Simulate 2 files
        .set("x-test-comment", "Task completed")
        .set("x-test-status", "approved")
        .expect(200);

      expect(response.body).toEqual(mockResponse);

      // Verify the service was called with the right parameters
      expect(inboxService.createinbox).toHaveBeenCalled();
      const callArgs = inboxService.createinbox.mock.calls[0];
      expect(callArgs[0]).toBe(taskId);
      expect(callArgs[1]).toBe("testuser");
      expect(callArgs[4]).toBe("manager");

      // Verify files
      expect(Object.keys(callArgs[2]).length).toBe(2);
      expect(callArgs[2].file0).toBeDefined();
      expect(callArgs[2].file1).toBeDefined();

      // Verify form data
      expect(callArgs[3].comment).toBe("Task completed");
      expect(callArgs[3].status).toBe("approved");
    });

    it("should complete a task without files as staff", async () => {
      const taskId = "task123";
      const mockResponse = {
        success: true,
        message: "Task completed without files",
        data: { id: taskId, status: "completed" },
      };

      inboxService.createinbox.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post(`/inbox/${taskId}/complete`)
        .set("x-role", "staff")
        .set("x-test-comment", "Task completed")
        .expect(200);

      expect(response.body).toEqual(mockResponse);

      // Verify the service was called with the right parameters
      expect(inboxService.createinbox).toHaveBeenCalled();
      const callArgs = inboxService.createinbox.mock.calls[0];
      expect(callArgs[0]).toBe(taskId);
      expect(callArgs[1]).toBe("testuser");
      expect(callArgs[4]).toBe("staff");

      // Verify no files
      expect(Object.keys(callArgs[2]).length).toBe(0);

      // Verify form data
      expect(callArgs[3].comment).toBe("Task completed");
    });

    it("should handle errors from the service", async () => {
      const taskId = "task123";
      const mockError = new Error("Invalid task data");
      mockError.response = {
        status: 400,
        data: { message: "Invalid task data" },
      };

      inboxService.createinbox.mockRejectedValue(mockError);

      const response = await request(app)
        .post(`/inbox/${taskId}/complete`)
        .set("x-role", "manager")
        .set("x-test-comment", "Task completed")
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: "Invalid task data",
      });
    });

    it("should return 403 when unauthorized role tries to complete", async () => {
      const response = await request(app)
        .post("/inbox/task123/complete")
        .set("x-role", "guest")
        .expect(403);

      expect(response.body).toEqual({
        code: 3,
        status: false,
        message: "Forbidden: Insufficient permissions",
      });
      expect(inboxService.createinbox).not.toHaveBeenCalled();
    });
  });

  describe("GET /", () => {
    it("should redirect to file download URL", async () => {
      const fileName = "document.pdf";
      const downloadUrl = "https://example.com/files/document.pdf";

      inboxService.downloadFile.mockResolvedValue(downloadUrl);

      const response = await request(app)
        .get(`/inbox?fileName=${fileName}`)
        .expect(302); // 302 is redirect status code

      expect(response.header.location).toBe(downloadUrl);
      expect(inboxService.downloadFile).toHaveBeenCalledWith(fileName);
    });

    it("should return 400 when fileName is missing", async () => {
      const response = await request(app).get("/inbox").expect(400);

      expect(response.body).toEqual({
        code: 2,
        status: false,
        message: "fileName query parameter is required",
      });
      expect(inboxService.downloadFile).not.toHaveBeenCalled();
    });

    it("should return 404 when file is not found", async () => {
      const fileName = "nonexistent.pdf";

      inboxService.downloadFile.mockResolvedValue(null);

      const response = await request(app)
        .get(`/inbox?fileName=${fileName}`)
        .expect(404);

      expect(response.body).toEqual({
        code: 2,
        status: false,
        message: "File not found",
      });
    });

    it("should handle errors with appropriate status codes", async () => {
      const fileName = "error.pdf";
      const mockError = new Error("File not found in storage");

      inboxService.downloadFile.mockRejectedValue(mockError);

      const response = await request(app)
        .get(`/inbox?fileName=${fileName}`)
        .expect(404);

      expect(response.body).toEqual({
        code: 2,
        status: false,
        message: "File not found in storage",
      });
    });

    it("should return 400 for general errors", async () => {
      const fileName = "error.pdf";
      const mockError = new Error("Storage access error");

      inboxService.downloadFile.mockRejectedValue(mockError);

      const response = await request(app)
        .get(`/inbox?fileName=${fileName}`)
        .expect(400);

      expect(response.body).toEqual({
        code: 2,
        status: false,
        message: "Storage access error",
      });
    });
  });
});
