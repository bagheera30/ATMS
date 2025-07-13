// __tests__/atribut.controller.test.js
const request = require("supertest");
const express = require("express");
const router = require("../../src/atribut/atribut.controller");
const { getDownload } = require("../../src/atribut/atribut.service");

// Mock the service
jest.mock("../../src/atribut/atribut.service");

// Create Express app for testing
const app = express();
app.use("/atribut", router);

describe("Atribut Controller", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /:id/download", () => {
    it("should redirect to presigned URL on success", async () => {
      const mockId = "123e4567-e89b-12d3-a456-426614174000";
      const mockUrl = "https://minio.example.com/presigned-url";

      getDownload.mockResolvedValue({ url: mockUrl });

      const response = await request(app)
        .get(`/atribut/${mockId}/download`)
        .expect(302);

      expect(response.headers.location).toBe(mockUrl);
      expect(getDownload).toHaveBeenCalledWith(mockId);
      expect(getDownload).toHaveBeenCalledTimes(1);
    });

    it("should return 400 error when service throws error", async () => {
      const mockId = "123e4567-e89b-12d3-a456-426614174000";
      const mockError = new Error("Atribut tidak ditemukan");

      getDownload.mockRejectedValue(mockError);

      const response = await request(app)
        .get(`/atribut/${mockId}/download`)
        .expect(400);

      expect(response.body).toEqual({
        code: 2,
        status: false,
        message: "Atribut tidak ditemukan",
      });
      expect(getDownload).toHaveBeenCalledWith(mockId);
    });
  });
});
