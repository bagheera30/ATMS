// __tests__/customer.service.test.js
const customerService = require("../../src/customer/customer.service");
const customerRepository = require("../../src/customer/customer.repository");

// Mock the repository
jest.mock("../../src/customer/customer.repository");

describe("Customer Service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create customer with all required fields", async () => {
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

      customerRepository.cretaecustomer.mockResolvedValue(mockResult);

      const result = await customerService.create(mockData, username);

      expect(result).toEqual(mockResult);
      expect(customerRepository.cretaecustomer).toHaveBeenCalledWith(
        mockData,
        username
      );
    });

    it("should throw error when username is missing", async () => {
      const mockData = {
        name: "Test",
        address: "Address",
        city: "City",
        country: "Country",
      };

      await expect(customerService.create(mockData, null)).rejects.toThrow(
        "username is required"
      );

      expect(customerRepository.cretaecustomer).not.toHaveBeenCalled();
    });

    it("should throw error when required fields are missing", async () => {
      const mockData = {
        name: "Test",
        // missing address, city, country
      };
      const username = "testuser";

      await expect(customerService.create(mockData, username)).rejects.toThrow(
        "please complete the form"
      );

      expect(customerRepository.cretaecustomer).not.toHaveBeenCalled();
    });
  });

  describe("getAll", () => {
    it("should return all customers with lowercase search", async () => {
      const search = "TEST";
      const mockCustomers = [{ id: "1", name: "Test Customer" }];

      customerRepository.getAll.mockResolvedValue(mockCustomers);

      const result = await customerService.getAll(search);

      expect(result).toEqual(mockCustomers);
      expect(customerRepository.getAll).toHaveBeenCalledWith("test");
    });

    it("should handle empty search string", async () => {
      const search = "";
      const mockCustomers = [];

      customerRepository.getAll.mockResolvedValue(mockCustomers);

      const result = await customerService.getAll(search);

      expect(result).toEqual(mockCustomers);
      expect(customerRepository.getAll).toHaveBeenCalledWith("");
    });
  });

  describe("getByid", () => {
    it("should return customer by id", async () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000";
      const mockCustomer = { uuid, name: "Test Customer" };

      customerRepository.getByid.mockResolvedValue(mockCustomer);

      const result = await customerService.getByid(uuid);

      expect(result).toEqual(mockCustomer);
      expect(customerRepository.getByid).toHaveBeenCalledWith(uuid);
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

      customerRepository.updateCustomer.mockResolvedValue(mockResult);

      const result = await customerService.updateCustomer(uuid, data, username);

      expect(result).toEqual(mockResult);
      expect(customerRepository.updateCustomer).toHaveBeenCalledWith(
        uuid,
        data,
        username
      );
    });

    it("should throw error when data is missing", async () => {
      const uuid = "123";
      const username = "testuser";

      await expect(
        customerService.updateCustomer(uuid, null, username)
      ).rejects.toThrow("please complete the form");

      expect(customerRepository.updateCustomer).not.toHaveBeenCalled();
    });

    it("should throw error when uuid is missing", async () => {
      const data = { name: "Test" };
      const username = "testuser";

      await expect(
        customerService.updateCustomer(null, data, username)
      ).rejects.toThrow("please complete the form");

      expect(customerRepository.updateCustomer).not.toHaveBeenCalled();
    });
  });

  describe("deleteCustomer", () => {
    it("should delete customer successfully", async () => {
      const search = "123";
      const mockResult = "Success";

      customerRepository.deleteCustomer.mockResolvedValue(mockResult);

      const result = await customerService.deleteCustomer(search);

      expect(result).toEqual(mockResult);
      expect(customerRepository.deleteCustomer).toHaveBeenCalledWith(search);
    });

    it("should throw error when search is missing", async () => {
      await expect(customerService.deleteCustomer(null)).rejects.toThrow(
        "please complete the query"
      );

      expect(customerRepository.deleteCustomer).not.toHaveBeenCalled();
    });
  });
});
