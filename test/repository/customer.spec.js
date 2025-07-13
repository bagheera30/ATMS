// __tests__/customer.repository.test.js

// Mock BEFORE any requires
jest.mock("../../src/db/db");

const db = require("../../src/db/db");

// Set up the initial mock before requiring the repository
const mockSession = {
  run: jest.fn(),
  close: jest.fn(),
};

const mockNeo = {
  session: jest.fn(() => mockSession),
};

// Set the mock return value before requiring the module
db.getInstance.mockReturnValue(mockNeo);

// NOW require the repository after the mock is set up
const customerRepository = require("../../src/customer/customer.repository");

// __tests__/customer.repository.test.js

describe("Customer Repository", () => {
  let mockSession;
  let customerRepository;

  beforeAll(() => {
    // Setup mocks before requiring any modules
    mockSession = {
      run: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
    };

    const mockNeo = {
      session: jest.fn(() => mockSession),
    };

    // Mock the db module
    jest.mock("../../src/db/db", () => ({
      getInstance: jest.fn(() => mockNeo)
    }), { virtual: true });

    // Clear the module cache to ensure fresh imports
    jest.resetModules();

    // Now require the repository
    customerRepository = require("../../src/customer/customer.repository");
  });

  beforeEach(() => {
    // Clear mock calls
    jest.clearAllMocks();
    
    // Reset console.error mock
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe("cretaecustomer", () => {
    it("should create customer successfully", async () => {
      const mockData = {
        name: "Test Customer",
        address: "123 Street",
        city: "Test City",
        country: "Test Country",
        category: "A",
      };
      const username = "testuser";
      const mockResult = {
        code: 0,
        status: true,
        message: "create user success",
      };

      mockSession.run.mockResolvedValueOnce({
        records: [
          {
            get: jest.fn().mockReturnValue(mockResult),
          },
        ],
      });

      const result = await customerRepository.cretaecustomer(
        mockData,
        username
      );

      expect(result).toEqual(mockResult);
      expect(mockSession.run).toHaveBeenCalledWith(
        expect.stringContaining("CREATE (c:Customer"),
        {
          name: mockData.name,
          city: mockData.city,
          country: mockData.country,
          username,
          category: mockData.category,
          address: mockData.address,
        }
      );
      expect(mockSession.close).toHaveBeenCalled();
    });

    it("should handle database errors", async () => {
      const mockError = new Error("Neo4j connection failed");
      mockSession.run.mockRejectedValueOnce(mockError);

      await expect(
        customerRepository.cretaecustomer({}, "user")
      ).rejects.toThrow("Database query failed: Neo4j connection failed");

      expect(console.error).toHaveBeenCalledWith(
        "Error executing query:",
        mockError
      );
      expect(mockSession.close).toHaveBeenCalled();
    });
  });

  describe("getAll", () => {
    it("should return all customers", async () => {
      const search = "test";
      const mockCustomers = [
        { id: "1", name: "Customer 1" },
        { id: "2", name: "Customer 2" },
      ];

      mockSession.run.mockResolvedValueOnce({
        records: mockCustomers.map((customer) => ({
          get: jest.fn().mockReturnValue(customer),
        })),
      });

      const result = await customerRepository.getAll(search);

      expect(result).toEqual(mockCustomers);
      expect(mockSession.run).toHaveBeenCalledWith(
        expect.stringContaining("MATCH (c:Customer)"),
        { search }
      );
      expect(mockSession.close).toHaveBeenCalled();
    });

    it("should return null when no records found", async () => {
      mockSession.run.mockResolvedValueOnce({ records: [] });

      const result = await customerRepository.getAll("test");

      expect(result).toBeNull();
      expect(mockSession.close).toHaveBeenCalled();
    });
  });

  describe("getByid", () => {
    it("should return customer by id", async () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000";
      const mockCustomer = {
        uuid,
        name: "Test Customer",
        address: "Test Address",
        city: "Test City",
        country: "Test Country",
        category: "A",
        status: "active",
      };

      mockSession.run.mockResolvedValueOnce({
        records: [
          {
            get: jest.fn().mockReturnValue(mockCustomer),
          },
        ],
      });

      const result = await customerRepository.getByid(uuid);

      expect(result).toEqual(mockCustomer);
      expect(mockSession.run).toHaveBeenCalledWith(
        expect.stringContaining("MATCH (c:Customer)where c.uuid=$uuid"),
        { uuid }
      );
      expect(mockSession.close).toHaveBeenCalled();
    });

    it("should return null when customer not found", async () => {
      mockSession.run.mockResolvedValueOnce({ records: [] });

      const result = await customerRepository.getByid("invalid-id");

      expect(result).toBeNull();
      expect(mockSession.close).toHaveBeenCalled();
    });
  });

  describe("updateCustomer", () => {
    it("should update customer successfully", async () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000";
      const data = { name: "Updated Name" };
      const username = "testuser";
      const mockResult = {
        code: 0,
        status: true,
        message: "Object Successful Updated",
      };

      mockSession.run.mockResolvedValueOnce({
        records: [
          {
            get: jest.fn().mockReturnValue(mockResult),
          },
        ],
      });

      const result = await customerRepository.updateCustomer(
        uuid,
        data,
        username
      );

      expect(result).toEqual(mockResult);
      expect(mockSession.run).toHaveBeenCalledWith(
        expect.stringContaining("MATCH (c:Customer)where c.uuid=$uuid"),
        { uuid, data, username }
      );
      expect(mockSession.close).toHaveBeenCalled();
    });
  });

  describe("deleteCustomer", () => {
    it("should delete customer successfully", async () => {
      const search = "123e4567-e89b-12d3-a456-426614174000";
      const mockResult = "Success";

      mockSession.run.mockResolvedValueOnce({
        records: [
          {
            get: jest.fn().mockReturnValue(mockResult),
          },
        ],
      });

      const result = await customerRepository.deleteCustomer(search);

      expect(result).toEqual(mockResult);
      expect(mockSession.run).toHaveBeenCalledWith(
        expect.stringContaining("MATCH (n:Customer)where n.uuid = $search"),
        { search }
      );
      expect(mockSession.close).toHaveBeenCalled();
    });

    it("should return null when no records to delete", async () => {
      mockSession.run.mockResolvedValueOnce({ records: [] });

      const result = await customerRepository.deleteCustomer("invalid-id");

      expect(result).toBeNull();
      expect(mockSession.close).toHaveBeenCalled();
    });
  });
});