// auth.controller.test.js

// First, mock the validation middleware
jest.mock("../../src/middlewares/validasi", () => ({
  validateCreateUser: [
    (req, res, next) => next(), // Simple middleware that just calls next()
  ],
}));

// Mock express-validator
jest.mock("express-validator", () => ({
  body: jest.fn(() => ({
    isString: jest.fn().mockReturnThis(),
    isEmail: jest.fn().mockReturnThis(),
    isLength: jest.fn().mockReturnThis(),
    withMessage: jest.fn().mockReturnThis(),
  })),
  validationResult: jest.fn(),
}));

// Mock the auth service
jest.mock("../../src/auth/auth.service");

// Now we can safely import modules
const request = require("supertest");
const express = require("express");
const authController = require("../../src/auth/auth.controller");
const authService = require("../../src/auth/auth.service");
const { validationResult } = require("express-validator");

// Create express app for testing
const app = express();
app.use(express.json());
app.use("/auth", authController);

describe("Auth Controller", () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe("POST /auth/register", () => {
    it("should return 400 when validation fails", async () => {
      // Mock validation errors
      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [
          { msg: "Email is invalid" },
          { msg: "Password is required" },
        ],
      });

      const response = await request(app).post("/auth/register").send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        code: 1,
        status: false,
        message: "Email is invalid, Password is required",
      });
    });

    it("should return 404 when user creation fails", async () => {
      // Mock successful validation
      validationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => [],
      });

      // Mock service response
      authService.createUser.mockResolvedValue({
        status: false,
        message: "Email already exists",
      });

      const response = await request(app).post("/auth/register").send({
        email: "test@example.com",
        password: "password123",
        namaLengkap: "Test User",
        username: "testuser",
        dateOfBirth: "1990-01-01",
        jabatan: "Staff",
      });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        code: 2,
        status: false,
        message: "Email already exists",
      });
    });

    it("should return 201 when user is created successfully", async () => {
      // Mock successful validation
      validationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => [],
      });

      const mockUser = {
        status: true,
        message: "User created successfully",
        user: { id: "123", email: "test@example.com" },
      };

      authService.createUser.mockResolvedValue(mockUser);

      const response = await request(app).post("/auth/register").send({
        email: "test@example.com",
        password: "password123",
        namaLengkap: "Test User",
        username: "testuser",
        dateOfBirth: "1990-01-01",
        jabatan: "Staff",
      });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ user: mockUser });
    });

    it("should handle service errors", async () => {
      // Mock successful validation
      validationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => [],
      });

      authService.createUser.mockRejectedValue(new Error("Database error"));

      const response = await request(app).post("/auth/register").send({
        email: "test@example.com",
        password: "password123",
        namaLengkap: "Test User",
        username: "testuser",
        dateOfBirth: "1990-01-01",
        jabatan: "Staff",
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        code: 2,
        status: false,
        message: "Database error",
      });
    });
  });

  describe("POST /auth/login", () => {
    it("should return 401 when user is locked", async () => {
      authService.login.mockResolvedValue(
        "User is locked or status is not unlocked"
      );

      const response = await request(app).post("/auth/login").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        code: 1,
        status: false,
        message: "User  not unlock please contact manager or admin",
      });
    });

    it("should return 401 when password is incorrect", async () => {
      authService.login.mockResolvedValue({
        message: "Incorrect password",
      });

      const response = await request(app).post("/auth/login").send({
        email: "test@example.com",
        password: "wrongpassword",
      });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        code: 1,
        status: false,
        message: "Incorrect password",
      });
    });

    it("should return 401 when user not found", async () => {
      authService.login.mockResolvedValue(
        "User  not found or incorrect credentials"
      );

      const response = await request(app).post("/auth/login").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        code: 1,
        status: false,
        message: "User  not found or incorrect credentials",
      });
    });

    it("should return 200 with token on successful login", async () => {
      authService.login.mockResolvedValue({
        code: 0,
        status: true,
        message: "Authentication successful",
        token: "jwt.token.here",
      });

      const response = await request(app).post("/auth/login").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        code: 0,
        status: true,
        message: "Authentication successful",
        token: "jwt.token.here",
      });
    });

    it("should handle service errors", async () => {
      authService.login.mockRejectedValue(new Error("Service error"));

      const response = await request(app).post("/auth/login").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        code: 2,
        status: false,
        message: "Service error",
      });
    });
  });

  describe("GET /auth/verifOtp/:otp", () => {
    it("should return 404 when OTP verification fails", async () => {
      authService.VerifOtp.mockResolvedValue({
        status: false,
        message: "Invalid OTP",
      });

      const response = await request(app).get("/auth/verifOtp/12345");

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        code: 2,
        status: false,
        message: "Invalid OTP",
      });
    });

    it("should return 200 when OTP verification succeeds", async () => {
      const mockUser = {
        success: true,
        message: true,
      };

      authService.VerifOtp.mockResolvedValue(mockUser);

      const response = await request(app).get("/auth/verifOtp/12345");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ user: mockUser });
      expect(authService.VerifOtp).toHaveBeenCalledWith("12345");
    });

    it("should handle service errors", async () => {
      authService.VerifOtp.mockRejectedValue(new Error("OTP service error"));

      const response = await request(app).get("/auth/verifOtp/12345");

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        code: 2,
        status: false,
        message: "OTP service error",
      });
    });
  });

  describe("POST /auth/forgotPassword", () => {
    it("should return 400 when email is missing", async () => {
      const response = await request(app).post("/auth/forgotPassword").send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        code: 1,
        status: false,
        message: "email diperlukan",
      });
    });

    it("should return 404 when email not found", async () => {
      authService.forgotPassword.mockResolvedValue({
        code: 1,
        status: false,
        message: "email not found",
      });

      const response = await request(app)
        .post("/auth/forgotPassword")
        .send({ email: "notfound@example.com" });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        code: 1,
        status: false,
        message: "email not found",
      });
    });

    it("should return 200 when password reset is successful", async () => {
      authService.forgotPassword.mockResolvedValue({
        code: 0,
        status: true,
        message: "sucess",
      });

      const response = await request(app)
        .post("/auth/forgotPassword")
        .send({ email: "test@example.com" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        code: 0,
        status: true,
        message: "sucess",
      });
    });

    it("should handle service errors", async () => {
      authService.forgotPassword.mockRejectedValue(
        new Error("Password reset service error")
      );

      const response = await request(app)
        .post("/auth/forgotPassword")
        .send({ email: "test@example.com" });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        code: 2,
        status: false,
        message: "Password reset service error",
      });
    });
  });

  describe("POST /auth/resendotp", () => {
    it("should return 200 when OTP is resent successfully", async () => {
      const mockResult = {
        code: 0,
        status: true,
        message: "success OTP",
      };

      authService.resendOtp.mockResolvedValue(mockResult);

      const response = await request(app)
        .post("/auth/resendotp")
        .send({ email: "test@example.com" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ user: mockResult });
      expect(authService.resendOtp).toHaveBeenCalledWith("test@example.com");
    });

    it("should handle service errors", async () => {
      authService.resendOtp.mockRejectedValue(new Error("Email service error"));

      const response = await request(app)
        .post("/auth/resendotp")
        .send({ email: "test@example.com" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        code: 2,
        status: false,
        message: "Email service error",
      });
    });
  });
});
