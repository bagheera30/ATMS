// __tests__/atribut.repository.test.js
const db = require("../../src/db/db");

// Mock the database module before requiring the repository
jest.mock("../../src/db/db");

// Set up the mock before requiring the module that uses it
const mockSession = {
  run: jest.fn(),
  close: jest.fn(),
};

const mockNeo = {
  session: jest.fn(() => mockSession),
};

// Configure the mock to return the mockNeo instance
db.getInstance.mockReturnValue(mockNeo);

// Now require the repository after mocks are set up
const { getAtribut } = require("../../src/atribut/atribut.repository");

// __tests__/atribut.repository.test.js
describe("Atribut Repository", () => {
  let mockSession;
  let mockNeo;
  let getAtribut;

  beforeEach(() => {
    // Reset modules to ensure fresh state
    jest.resetModules();
    
    // Mock the db module
    jest.doMock("../../src/db/db", () => ({
      getInstance: jest.fn(() => ({
        session: jest.fn(() => ({
          run: jest.fn(),
          close: jest.fn()
        }))
      }))
    }));

    // Now require the modules after mocking
    const db = require("../../src/db/db");
    
    // Setup mock session
    mockSession = {
      run: jest.fn(),
      close: jest.fn(),
    };

    // Setup mock neo
    mockNeo = {
      session: jest.fn(() => mockSession),
    };

    // Configure db.getInstance to return mockNeo
    db.getInstance.mockReturnValue(mockNeo);
    
    // Now require the repository module
    const repository = require("../../src/atribut/atribut.repository");
    getAtribut = repository.getAtribut;

    // Reset console.error mock
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
    jest.clearAllMocks();
  });

  describe("getAtribut", () => {
    it("should return atribut when found", async () => {
      const mockId = "123e4567-e89b-12d3-a456-426614174000";
      const mockResult = { value: "test-file.pdf" };

      mockSession.run.mockResolvedValue({
        records: [
          {
            get: jest.fn().mockReturnValue(mockResult),
          },
        ],
      });

      const result = await getAtribut(mockId);

      expect(result).toEqual(mockResult);
      expect(mockSession.run).toHaveBeenCalledWith(
        expect.stringContaining("MATCH (a:Atribut)where a.uuid= $id"),
        { id: mockId }
      );
      expect(mockSession.close).toHaveBeenCalled();
    });

    it("should return null when no records found", async () => {
      const mockId = "123e4567-e89b-12d3-a456-426614174000";

      mockSession.run.mockResolvedValue({
        records: [],
      });

      const result = await getAtribut(mockId);

      expect(result).toBeNull();
      expect(mockSession.close).toHaveBeenCalled();
    });

    it("should handle database errors and close session", async () => {
      const mockId = "123e4567-e89b-12d3-a456-426614174000";
      const mockError = new Error("Neo4j connection failed");

      mockSession.run.mockRejectedValue(mockError);

      await expect(getAtribut(mockId)).rejects.toThrow(
        "Database query failed: Neo4j connection failed"
      );
      expect(console.error).toHaveBeenCalledWith(
        "Error executing query:",
        mockError
      );
      expect(mockSession.close).toHaveBeenCalled();
    });
  });
});
