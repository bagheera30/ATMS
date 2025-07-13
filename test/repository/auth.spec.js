// auth.repository.test.js

// Mock the db module BEFORE importing the repository
jest.mock("../../src/db/db", () => ({
  getInstance: jest.fn(),
}));

const db = require("../../src/db/db");
const authRepository = require("../../src/auth/auth.repository");

// auth.repository.test.js

describe('Auth Repository', () => {
  let mockSession;
  let mockRun;
  let mockDriver;
  let authRepository;

  beforeEach(() => {
    // Clear all module caches
    jest.resetModules();
    
    // Create mocks
    mockRun = jest.fn();
    mockSession = {
      run: mockRun,
      close: jest.fn().mockResolvedValue(undefined)
    };
    
    mockDriver = {
      session: jest.fn(() => mockSession)
    };

    // Mock the db module
    jest.doMock('../../src/db/db', () => ({
      getInstance: jest.fn(() => mockDriver)
    }));

    // Now require the repository (it will use the mocked db)
    authRepository = require('../../src/auth/auth.repository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const userData = {
        user: {
          username: 'testuser',
          namaLengkap: 'Test User',
          email: 'test@example.com',
          password: 'hashedPassword',
          dateOfBirth: '1990-01-01',
          phoneNumber: '1234567890',
          jabatan: 'Staff'
        }
      };

      mockRun.mockResolvedValue({
        records: [{
          get: jest.fn().mockReturnValue({
            code: 0,
            status: true,
            message: 'create user success'
          })
        }]
      });

      const result = await authRepository.createUser(userData, 12345, 1234567890);

      expect(mockDriver.session).toHaveBeenCalled();
      expect(mockRun).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          username: 'testuser',
          namaLengkap: 'Test User',
          email: 'test@example.com',
          password: 'hashedPassword',
          dateOfBirth: '1990-01-01',
          phoneNumber: '1234567890',
          jabatan: 'Staff',
          otp: 12345,
          otpExpires: 1234567890
        })
      );
      expect(mockSession.close).toHaveBeenCalled();
      expect(result).toEqual({
        code: 0,
        status: true,
        message: 'create user success'
      });
    });

    it('should return error when username already exists', async () => {
      const userData = {
        user: {
          username: 'existinguser',
          email: 'test@example.com',
          password: 'hashedPassword',
          namaLengkap: 'Test User',
          dateOfBirth: '1990-01-01',
          jabatan: 'Staff'
        }
      };

      mockRun.mockResolvedValue({
        records: [{
          get: jest.fn().mockReturnValue({
            code: 1,
            status: false,
            message: 'Username sudah terdaftar'
          })
        }]
      });

      const result = await authRepository.createUser(userData, 12345, 1234567890);

      expect(result).toEqual({
        code: 1,
        status: false,
        message: 'Username sudah terdaftar'
      });
    });

    it('should handle database errors', async () => {
      const userData = {
        user: {
          username: 'testuser',
          email: 'test@example.com',
          password: 'hashedPassword',
          namaLengkap: 'Test User',
          dateOfBirth: '1990-01-01',
          jabatan: 'Staff'
        }
      };

      mockRun.mockRejectedValue(new Error('Database connection failed'));

      const result = await authRepository.createUser(userData, 12345, 1234567890);

      expect(mockSession.close).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('authentication', () => {
    it('should authenticate user successfully', async () => {
      mockRun.mockResolvedValue({
        records: [{
          get: jest.fn().mockReturnValue({
            code: 0,
            status: true,
            message: 'success',
            user: { properties: { uuid: '123', username: 'testuser' } },
            roles: [{ properties: { RoleName: 'staff' } }]
          })
        }]
      });

      const result = await authRepository.authentication('test@example.com');

      expect(mockRun).toHaveBeenCalledWith(
        expect.any(String),
        { username: 'test@example.com' }
      );
      expect(result).toEqual({
        code: 0,
        status: true,
        message: 'success',
        user: { properties: { uuid: '123', username: 'testuser' } },
        roles: [{ properties: { RoleName: 'staff' } }]
      });
    });

    it('should return error when user is locked', async () => {
      mockRun.mockResolvedValue({
        records: [{
          get: jest.fn().mockReturnValue({
            code: 1,
            status: false,
            message: 'User is locked or status is not unlocked'
          })
        }]
      });

      const result = await authRepository.authentication('test@example.com');

      expect(result).toEqual({
        code: 1,
        status: false,
        message: 'User is locked or status is not unlocked'
      });
    });

    it('should return user not found when no records exist', async () => {
      mockRun.mockResolvedValue({
        records: []
      });

      const result = await authRepository.authentication('nonexistent@example.com');

      expect(result).toEqual({
        code: 1,
        status: false,
        message: 'User  not found or incorrect credentials'
      });
    });
  });

  describe('findToken', () => {
    it('should verify OTP successfully', async () => {
      mockRun.mockResolvedValue({
        records: [{
          get: jest.fn().mockReturnValue({
            status: true,
            id: '123'
          })
        }]
      });

      const result = await authRepository.findToken(12345, 1234567890);

      expect(mockRun).toHaveBeenCalledWith(
        expect.any(String),
        { token: 12345, time: 1234567890 }
      );
      expect(result).toEqual({
        status: true,
        id: '123'
      });
    });

    it('should return error when OTP is expired or invalid', async () => {
      mockRun.mockResolvedValue({
        records: []
      });

      const result = await authRepository.findToken(12345, 1234567890);

      expect(result).toEqual({
        status: false,
        message: 'OTP sudah kadaluwarsa atau tidak valid'
      });
    });
  });

  describe('validasiEmail', () => {
    it('should find user by email successfully', async () => {
      mockRun.mockResolvedValue({
        records: [{
          get: jest.fn().mockReturnValue({
            id: '123',
            email: 'test@example.com'
          })
        }]
      });

      const result = await authRepository.validasiEmail('test@example.com');

      expect(mockRun).toHaveBeenCalledWith(
        expect.any(String),
        { username: 'test@example.com' }
      );
      expect(result).toEqual({
        id: '123',
        email: 'test@example.com'
      });
    });

    it('should return null when email not found', async () => {
      mockRun.mockResolvedValue({
        records: []
      });

      const result = await authRepository.validasiEmail('notfound@example.com');

      expect(result).toBeNull();
    });

    it('should return false on error', async () => {
      mockRun.mockRejectedValue(new Error('Database error'));

      const result = await authRepository.validasiEmail('test@example.com');

      expect(result).toBe(false);
      expect(mockSession.close).toHaveBeenCalled();
    });
  });

  describe('resendotp', () => {
    it('should update OTP successfully', async () => {
      mockRun.mockResolvedValue({
        records: [{
          get: jest.fn().mockReturnValue({
            code: 0,
            status: true,
            message: 'success OTP'
          })
        }]
      });

      const result = await authRepository.resendotp('test@example.com', 12345, 1234567890);

      expect(mockRun).toHaveBeenCalledWith(
        expect.any(String),
        {
          email: 'test@example.com',
          otp: 12345,
          otpExpires: 1234567890
        }
      );
      expect(result).toEqual({
        code: 0,
        status: true,
        message: 'success OTP'
      });
    });

    it('should return null when no records found', async () => {
      mockRun.mockResolvedValue({
        records: []
      });

      const result = await authRepository.resendotp('test@example.com', 12345, 1234567890);

      expect(result).toBeNull();
    });

    it('should throw error on database failure', async () => {
      mockRun.mockRejectedValue(new Error('Database error'));

      await expect(authRepository.resendotp('test@example.com', 12345, 1234567890))
        .rejects.toThrow('Database query failed: Database error');

      expect(mockSession.close).toHaveBeenCalled();
    });
  });

  describe('sendOtpToEmail', () => {
    it('should send OTP to email successfully', async () => {
      mockRun.mockResolvedValue({
        records: [{
          get: jest.fn().mockReturnValue({
            code: 0,
            status: true,
            message: 'success OTP',
            email: 'test@example.com',
            otp: 12345
          })
        }]
      });

      const result = await authRepository.sendOtpToEmail('test@example.com', 12345);

      expect(mockRun).toHaveBeenCalledWith(
        expect.any(String),
        {
          email: 'test@example.com',
          otp: 12345
        }
      );
      expect(result).toEqual({
        code: 0,
        status: true,
        message: 'success OTP',
        email: 'test@example.com',
        otp: 12345
      });
    });

    it('should return error when email not found', async () => {
      mockRun.mockResolvedValue({
        records: [{
          get: jest.fn().mockReturnValue({
            code: 1,
            status: false,
            message: 'email tidak ditemukan'
          })
        }]
      });

      const result = await authRepository.sendOtpToEmail('notfound@example.com', 12345);

      expect(result).toEqual({
        code: 1,
        status: false,
        message: 'email tidak ditemukan'
      });
    });

    it('should return null when no records found', async () => {
      mockRun.mockResolvedValue({
        records: []
      });

      const result = await authRepository.sendOtpToEmail('test@example.com', 12345);

      expect(result).toBeNull();
    });

    it('should throw error on database failure', async () => {
      mockRun.mockRejectedValue(new Error('Database error'));

      await expect(authRepository.sendOtpToEmail('test@example.com', 12345))
        .rejects.toThrow('Database query failed: Database error');

      expect(mockSession.close).toHaveBeenCalled();
    });
  });
});