const authService = require("../../src/auth/auth.service");
const authRepository = require("../../src/auth/auth.repository");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendEmail = require("../../src/lib/sendemail");
const { updateUser } = require("../../src/user/user.repository");

// Mock dependencies
jest.mock("../../src/auth/auth.repository");
jest.mock("bcrypt");
jest.mock("jsonwebtoken");
jest.mock("../../src/lib/sendemail");
jest.mock("../../src/user/user.repository");

describe("Auth Service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createUser", () => {
    it("should throw error when required fields are missing", async () => {
      const incompleteData = {
        email: "test@example.com",
        // missing other required fields
      };

      await expect(authService.createUser(incompleteData)).rejects.toThrow(
        "please complete the form1"
      );
    });

    it("should create user successfully", async () => {
      const userData = {
        namaLengkap: "Test User",
        email: "test@example.com",
        password: "password123",
        dateOfBirth: "1990-01-01",
        jabatan: "Staff",
        username: "testuser",
      };

      bcrypt.hash.mockResolvedValue("hashedPassword");
      authRepository.createUser.mockResolvedValue({
        code: 0,
        status: true,
        message: "create user success",
      });
      sendEmail.mockResolvedValue(true);

      const result = await authService.createUser(userData);

      expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
      expect(authRepository.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            ...userData,
            password: "hashedPassword",
          }),
        }),
        expect.any(Number), // OTP
        expect.any(Number) // OTP expires
      );
      expect(sendEmail).toHaveBeenCalledWith(
        "test@example.com",
        "Kode OTP Verifikasi",
        expect.stringContaining("OTP")
      );
      expect(result).toEqual({
        code: 0,
        status: true,
        message: "create user success",
      });
    });

    it("should return error when email already exists", async () => {
      const userData = {
        namaLengkap: "Test User",
        email: "existing@example.com",
        password: "password123",
        dateOfBirth: "1990-01-01",
        jabatan: "Staff",
        username: "testuser",
      };

      bcrypt.hash.mockResolvedValue("hashedPassword");
      authRepository.createUser.mockResolvedValue({
        code: 1,
        status: false,
        message: "Email already exists",
      });
      sendEmail.mockResolvedValue(true);

      const result = await authService.createUser(userData);

      expect(result).toEqual({
        code: 1,
        status: false,
        message: "email or username already exist",
      });
    });

    it("should return error when email sending fails", async () => {
      const userData = {
        namaLengkap: "Test User",
        email: "test@example.com",
        password: "password123",
        dateOfBirth: "1990-01-01",
        jabatan: "Staff",
        username: "testuser",
      };

      bcrypt.hash.mockResolvedValue("hashedPassword");
      authRepository.createUser.mockResolvedValue({
        code: 0,
        status: true,
        message: "create user success",
      });
      sendEmail.mockResolvedValue(false);

      const result = await authService.createUser(userData);

      expect(result).toEqual({
        code: 1,
        status: false,
        message: "valid sendemail",
      });
    });
  });

  describe("login", () => {
    it("should throw error when email or password is missing", async () => {
      await expect(authService.login("", "password")).rejects.toThrow(
        "Please complete the form"
      );

      await expect(authService.login("email@example.com", "")).rejects.toThrow(
        "Please complete the form"
      );
    });

    it("should return locked user message when user is locked", async () => {
      authRepository.authentication.mockResolvedValue({
        code: 1,
        status: false,
        message: "User is locked or status is not unlocked",
      });

      const result = await authService.login("test@example.com", "password123");

      expect(result).toBe("User is locked or status is not unlocked");
    });

    it("should return error when password is incorrect", async () => {
      authRepository.authentication.mockResolvedValue({
        code: 0,
        status: true,
        user: {
          properties: {
            uuid: "123",
            username: "testuser",
            password: "hashedPassword",
          },
        },
        roles: [{ properties: { RoleName: "staff" } }],
      });

      bcrypt.compare.mockResolvedValue(false);

      const result = await authService.login(
        "test@example.com",
        "wrongpassword"
      );

      expect(result).toEqual({
        code: 1,
        status: false,
        message: "Incorrect password",
      });
    });

    it("should return token on successful login", async () => {
      authRepository.authentication.mockResolvedValue({
        code: 0,
        status: true,
        user: {
          properties: {
            uuid: "123",
            username: "testuser",
            password: "hashedPassword",
          },
        },
        roles: [{ properties: { RoleName: "staff" } }],
      });

      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue("jwt.token.here");

      const result = await authService.login("test@example.com", "password123");

      expect(bcrypt.compare).toHaveBeenCalledWith(
        "password123",
        "hashedPassword"
      );
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          userId: "123",
          username: "testuser",
          roles: "staff",
        },
        expect.any(String),
        { expiresIn: "1d" }
      );
      expect(result).toEqual({
        code: 0,
        status: true,
        message: "Authentication successful",
        token: "jwt.token.here",
      });
    });
  });

  describe("VerifOtp", () => {
    it("should throw error when OTP is not provided", async () => {
      await expect(authService.VerifOtp()).rejects.toThrow(
        "Harap masukkan OTP"
      );
    });

    it("should throw error when OTP is not a number", async () => {
      await expect(authService.VerifOtp("abc")).rejects.toThrow(
        "OTP harus berupa angka"
      );
    });

    it("should return error when OTP is invalid or expired", async () => {
      authRepository.findToken.mockResolvedValue({
        status: false,
        message: "OTP sudah kadaluwarsa atau tidak valid",
      });

      const result = await authService.VerifOtp("12345");

      expect(result).toEqual({
        status: false,
        message: "OTP sudah kadaluwarsa atau tidak valid",
      });
    });

    it("should return success when OTP is valid", async () => {
      authRepository.findToken.mockResolvedValue({
        status: true,
      });

      const result = await authService.VerifOtp("12345");

      expect(authRepository.findToken).toHaveBeenCalledWith(
        12345,
        expect.any(Number)
      );
      expect(result).toEqual({
        success: true,
        message: true,
      });
    });
  });

  describe("forgotPassword", () => {
    it("should return error when email not found", async () => {
      authRepository.validasiEmail.mockResolvedValue(null);

      const result = await authService.forgotPassword({
        email: "notfound@example.com",
      });

      expect(result).toEqual({
        code: 1,
        status: false,
        message: "email not found",
      });
    });

    it("should reset password and send email successfully", async () => {
      authRepository.validasiEmail.mockResolvedValue({
        id: "123",
        email: "test@example.com",
      });
      bcrypt.hash.mockResolvedValue("hashedNewPassword");
      updateUser.mockResolvedValue(true);
      sendEmail.mockResolvedValue(true);

      const result = await authService.forgotPassword({
        email: "test@example.com",
      });

      expect(bcrypt.hash).toHaveBeenCalledWith("P@ssword", 10);
      expect(updateUser).toHaveBeenCalledWith(
        "123",
        { password: "hashedNewPassword" },
        ""
      );
      expect(sendEmail).toHaveBeenCalledWith(
        "test@example.com",
        "Reset Password",
        expect.stringContaining("P@ssword")
      );
      expect(result).toEqual({
        code: 0,
        status: true,
        message: "sucess",
      });
    });

    it("should return error when update user fails", async () => {
      authRepository.validasiEmail.mockResolvedValue({
        id: "123",
        email: "test@example.com",
      });
      bcrypt.hash.mockResolvedValue("hashedNewPassword");
      updateUser.mockResolvedValue(false);

      const result = await authService.forgotPassword({
        email: "test@example.com",
      });

      expect(result).toEqual({
        code: 2,
        status: false,
        message: "forgot password user",
      });
    });

    it("should return error when email sending fails", async () => {
      authRepository.validasiEmail.mockResolvedValue({
        id: "123",
        email: "test@example.com",
      });
      bcrypt.hash.mockResolvedValue("hashedNewPassword");
      updateUser.mockResolvedValue(true);
      sendEmail.mockResolvedValue(false);

      const result = await authService.forgotPassword({
        email: "test@example.com",
      });

      expect(result).toEqual({
        code: 1,
        status: false,
        message: "valid sendemail",
      });
    });
  });

  describe("resendOtp", () => {
    it("should resend OTP successfully", async () => {
      authRepository.resendotp.mockResolvedValue({
        code: 0,
        status: true,
        message: "success OTP",
      });

      const result = await authService.resendOtp("test@example.com");

      expect(authRepository.resendotp).toHaveBeenCalledWith(
        "test@example.com",
        expect.any(Number), // OTP
        expect.any(Number) // OTP expires
      );
      expect(result).toEqual({
        code: 0,
        status: true,
        message: "success OTP",
      });
    });

    it("should throw error when resend fails", async () => {
      authRepository.resendotp.mockRejectedValue(new Error("Database error"));

      await expect(authService.resendOtp("test@example.com")).rejects.toThrow(
        "Verifikasi OTP gagal: Database error"
      );
    });
  });
});
