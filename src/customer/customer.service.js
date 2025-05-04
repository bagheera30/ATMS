const {
  cretaecustomer,
  getAll,
  deleteCustomer,
  getByid,
  updateCustomer,
} = require("./customer.repository");

class CustomerService {
  async create(data, username) {
    console.log(data);
    const name = data.name;
    const address = data.address;
    const city = data.city;
    const country = data.country;
    if (!username) {
      throw new Error("username is required");
    } else if (!name || !address || !city || !country) {
      throw new Error("please complete the form");
    }

    try {
      const user = await cretaecustomer(data, username);
      return user;
    } catch (error) {
      throw error;
    }
  }

  async getAll(search) {
    try {
      const user = await getAll(search);
      return user;
    } catch (error) {
      throw error;
    }
  }

  async getByid(uiid) {
    try {
      const user = await getByid(uiid);
      return user;
    } catch (error) {
      throw error;
    }
  }

  async updateCustomer(uuid, data, username) {
    if (!data || !uuid) {
      throw new Error("please complete the form");
    }
    try {
      const user = await updateCustomer(uuid, data, username);
      return user;
    } catch (error) {
      throw error;
    }
  }

  async deleteCustomer(search) {
    if (!search) {
      throw new Error("please complete the query");
    }
    try {
      const user = await deleteCustomer(search);
      return user;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new CustomerService();
