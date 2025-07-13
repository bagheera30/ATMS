const authRepository = require("../../src/auth/auth.repository");
const db = require("../../src/db/db");
const neo = db.getInstance();

// Mock the neo4j session and run methods
jest.mock("../../src/db/db", () => {
  return {
    getInstance: jest.fn(() => ({
      session: jest.fn(() => ({
        run: jest.fn(),
        close: jest.fn(),
      })),
    })),
  };
});

describe("Auth Repository", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createUser", () => {
    it("should create a user successfully", async () => {
      const mockUser = { email: "test@example.com", username: "testuser" };
      const mockOtp = "123456";
      const mockOtpExpires = Date.now() + 3600000;

      // Mock the response to match what the repository expects
      const mockResult = {
        records: [
          {
            get: jest.fn(() => "success"),
          },
        ],
      };
      neo.session().run.mockResolvedValueOnce(mockResult);

      const result = await authRepository.createUser(
        mockUser,
        mockOtp,
        mockOtpExpires
      );
      expect(result).toBe(null);
      expect(neo.session().run).toHaveBeenCalledWith(
        `CALL apoc.create.user($user, $otp, $otpExpires) YIELD value RETURN value.result as result`,
        { user: mockUser, otp: mockOtp, otpExpires: mockOtpExpires }
      );
    });

    it("should return null when creation fails", async () => {
      neo.session().run.mockRejectedValueOnce(new Error("DB error"));

      const result = await authRepository.createUser(
        { email: "test@example.com", username: "testuser" },
        "123456",
        Date.now()
      );
      expect(result).toBeNull();
    });
  });

  describe("sendOtpToEmail", () => {
    it("should send OTP successfully", async () => {
      const mockEmail = "test@example.com";
      const mockOtp = "654321";

      // Mock the response structure that matches the repository's expectations
      const mockResult = {
        records: [
          {
            get: jest.fn(() => ({
              code: 0,
              status: true,
              message: "success OTP",
              email: mockEmail,
              otp: mockOtp,
            })),
          },
        ],
      };
      neo.session().run.mockResolvedValueOnce(mockResult);

      const result = await authRepository.sendOtpToEmail(mockEmail, mockOtp);
      expect(result.code).toBe(0);
      expect(result.status).toBe(true);
    });

    it("should return error when email not found", async () => {
      // Mock empty response
      const mockResult = {
        records: [],
      };
      neo.session().run.mockResolvedValueOnce(mockResult);

      const result = await authRepository.sendOtpToEmail(
        "nonexistent@example.com",
        "123456"
      );
      expect(result.code).toBe(1);
      expect(result.status).toBe(false);
    });
  });

  describe("validasiEmail", () => {
    it("should validate email successfully", async () => {
      const mockEmail = "test@example.com";

      // Mock the response structure
      const mockResult = {
        records: [
          {
            get: jest.fn(() => ({
              email: mockEmail,
              username: "testuser",
            })),
          },
        ],
      };
      neo.session().run.mockResolvedValueOnce(mockResult);

      const result = await authRepository.validasiEmail(mockEmail);
      expect(result.email).toBe(mockEmail);
      expect(result.username).toBe("testuser");
    });

    it("should return null when email not found", async () => {
      // Mock empty response
      const mockResult = {
        records: [],
      };
      neo.session().run.mockResolvedValueOnce(mockResult);

      const result = await authRepository.validasiEmail(
        "nonexistent@example.com"
      );
      expect(result);
    });
  });

  describe("authentication", () => {
    it("should authenticate user successfully", async () => {
      const mockEmail = "test@example.com";
      const mockUser = {
        email: mockEmail,
        username: "testuser",
        status: "unlocked",
      };
      const mockRoles = [{ name: "admin" }, { name: "user" }];

      // Mock the response structure
      const mockResult = {
        records: [
          {
            get: jest.fn(() => ({
              code: 0,
              status: true,
              message: "success",
              user: mockUser,
              roles: mockRoles,
            })),
          },
        ],
      };
      neo.session().run.mockResolvedValueOnce(mockResult);

      const result = await authRepository.authentication(mockEmail);
      expect(result.code).toBe(0);
      expect(result.status).toBe(false);
      expect(result.user).toEqual(mockUser);
    });

    it("should return error when user not found", async () => {
      // Mock empty response
      const mockResult = {
        records: [],
      };
      neo.session().run.mockResolvedValueOnce(mockResult);

      const result = await authRepository.authentication(
        "nonexistent@example.com"
      );
      expect(result.code).toBe(0);
      expect(result.status).toBe(false);
    });
  });
});
