// __tests__/customer.controller.test.js
const request = require("supertest");
const express = require("express");
const router = require("../../src/customer/customer.controller");
const customerService = require("../../src/customer/customer.service");
const authMiddleware = require("../../src/middlewares/autentication");

// Mock the dependencies
jest.mock("../../src/customer/customer.service");
jest.mock("../../src/middlewares/autentication");

// Create Express app for testing
const app = express();
app.use(express.json());
app.use("/customer", router);

// Mock authMiddleware to always pass
authMiddleware.mockImplementation((roles) => (req, res, next) => {
  req.user = { username: "testuser" };
  next();
});

describe("Customer Controller", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /", () => {
    it("should return all customers on success", async () => {
      const mockCustomers = [
        { id: "1", name: "Customer 1" },
        { id: "2", name: "Customer 2" },
      ];

      customerService.getAll.mockResolvedValue(mockCustomers);

      const response = await request(app)
        .get("/customer?search=test")
        .expect(200);

      expect(response.body).toEqual({ user: mockCustomers });
      expect(customerService.getAll).toHaveBeenCalledWith("test");
    });

    it("should return 400 on service error", async () => {
      const mockError = new Error("Database error");
      customerService.getAll.mockRejectedValue(mockError);

      const response = await request(app)
        .get("/customer?search=test")
        .expect(400);

      expect(response.body).toEqual({
        code: 2,
        status: false,
        message: "Database error",
      });
    });
  });

  describe("GET /:id", () => {
    it("should return customer by id on success", async () => {
      const mockCustomer = { id: "123", name: "Test Customer" };
      const customerId = "123";

      customerService.getByid.mockResolvedValue(mockCustomer);

      const response = await request(app)
        .get(`/customer/${customerId}`)
        .expect(200);

      expect(response.body).toEqual({ user: mockCustomer });
      expect(customerService.getByid).toHaveBeenCalledWith(customerId);
    });

    it("should return 400 when customer not found", async () => {
      const mockError = new Error("Customer not found");
      customerService.getByid.mockRejectedValue(mockError);

      const response = await request(app).get("/customer/999").expect(400);

      expect(response.body).toEqual({
        code: 2,
        status: false,
        message: "Customer not found",
      });
    });
  });

  describe("POST /", () => {
    it("should create customer successfully", async () => {
      const mockData = {
        name: "New Customer",
        address: "123 Street",
        city: "City",
        country: "Country",
        category: "A",
      };
      const mockResult = {
        code: 0,
        status: true,
        message: "create user success",
      };

      customerService.create.mockResolvedValue(mockResult);

      const response = await request(app)
        .post("/customer")
        .send(mockData)
        .expect(200);

      expect(response.body).toEqual({ user: mockResult });
      expect(customerService.create).toHaveBeenCalledWith(mockData, "testuser");
    });

    it("should return 400 on validation error", async () => {
      const mockError = new Error("please complete the form");
      customerService.create.mockRejectedValue(mockError);

      const response = await request(app)
        .post("/customer")
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        code: 2,
        status: false,
        message: "please complete the form",
      });
    });
  });

  describe("POST /:id", () => {
    it("should update customer successfully", async () => {
      const customerId = "123";
      const mockData = { name: "Updated Customer" };
      const mockResult = {
        code: 0,
        status: true,
        message: "Object Successful Updated",
      };

      customerService.updateCustomer.mockResolvedValue(mockResult);

      const response = await request(app)
        .post(`/customer/${customerId}`)
        .send(mockData)
        .expect(201);

      expect(response.body).toEqual({ user: mockResult });
      expect(customerService.updateCustomer).toHaveBeenCalledWith(
        customerId,
        mockData,
        "testuser"
      );
    });

    it("should return 400 on update error", async () => {
      const mockError = new Error("Nothing object found");
      customerService.updateCustomer.mockRejectedValue(mockError);

      const response = await request(app)
        .post("/customer/999")
        .send({ name: "Test" })
        .expect(400);

      expect(response.body).toEqual({
        code: 2,
        status: false,
        message: "Nothing object found",
      });
    });
  });

  describe("DELETE /:id", () => {
    it("should delete customer successfully", async () => {
      const customerId = "123";
      const mockResult = "Success";

      customerService.deleteCustomer.mockResolvedValue(mockResult);

      const response = await request(app)
        .delete(`/customer/${customerId}`)
        .expect(200);

      expect(response.body).toEqual({
        code: 1,
        status: true,
        user: mockResult,
      });
      expect(customerService.deleteCustomer).toHaveBeenCalledWith(customerId);
    });

    it("should return 400 when delete fails", async () => {
      const mockError = new Error("Failed: Customer has users");
      customerService.deleteCustomer.mockRejectedValue(mockError);

      const response = await request(app).delete("/customer/123").expect(400);

      expect(response.body).toEqual({
        code: 2,
        status: false,
        message: "Failed: Customer has users",
      });
    });
  });
});
