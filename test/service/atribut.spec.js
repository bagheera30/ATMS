// __tests__/atribut.service.test.js
const { getDownload } = require("../../src/atribut/atribut.service");
const { getAtribut } = require("../../src/atribut/atribut.repository");
const { getPresignedUrl } = require("../../src/lib/minio");

// Mock dependencies
jest.mock("../../src/atribut/atribut.repository");
jest.mock("../../src/lib/minio");

// Mock environment variables
process.env.MINIO_BUCKET_NAME = "test-bucket";

describe("Atribut Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console.error mock
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe("getDownload", () => {
    it("should return presigned URL and fileName on success", async () => {
      const mockUuid = "123e4567-e89b-12d3-a456-426614174000";
      const mockFileName = "test-file.pdf";
      const mockPresignedUrl = "https://minio.example.com/presigned-url";

      getAtribut.mockResolvedValue({ value: mockFileName });
      getPresignedUrl.mockResolvedValue(mockPresignedUrl);

      const result = await getDownload(mockUuid);

      expect(result).toEqual({
        url: mockPresignedUrl,
        fileName: mockFileName,
      });
      expect(getAtribut).toHaveBeenCalledWith(mockUuid);
      expect(getPresignedUrl).toHaveBeenCalledWith(
        "test-bucket",
        mockFileName,
        300
      );
    });

    it("should throw error when atribut not found", async () => {
      const mockUuid = "123e4567-e89b-12d3-a456-426614174000";

      getAtribut.mockResolvedValue(null);

      await expect(getDownload(mockUuid)).rejects.toThrow(
        "Failed to generate download URL: Atribut tidak ditemukan"
      );
      expect(console.error).toHaveBeenCalled();
    });

    it("should throw error when atribut has no value", async () => {
      const mockUuid = "123e4567-e89b-12d3-a456-426614174000";

      getAtribut.mockResolvedValue({ value: null });

      await expect(getDownload(mockUuid)).rejects.toThrow(
        "Failed to generate download URL: Atribut tidak ditemukan"
      );
    });

    it("should handle repository errors", async () => {
      const mockUuid = "123e4567-e89b-12d3-a456-426614174000";
      const mockError = new Error("Database connection failed");

      getAtribut.mockRejectedValue(mockError);

      await expect(getDownload(mockUuid)).rejects.toThrow(
        "Failed to generate download URL: Database connection failed"
      );
      expect(console.error).toHaveBeenCalled();
    });

    it("should handle presigned URL generation errors", async () => {
      const mockUuid = "123e4567-e89b-12d3-a456-426614174000";
      const mockFileName = "test-file.pdf";
      const mockError = new Error("MinIO connection failed");

      getAtribut.mockResolvedValue({ value: mockFileName });
      getPresignedUrl.mockRejectedValue(mockError);

      await expect(getDownload(mockUuid)).rejects.toThrow(
        "Failed to generate download URL: MinIO connection failed"
      );
    });
  });
});
