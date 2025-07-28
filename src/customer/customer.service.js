const {
  getAll,
  deleteCustomer,
  getByid,
  updateCustomer,
  createCustomer,
} = require("./customer.repository");

class CustomerService {
  async create(data, username) {
    const name = data.name;
    const address = data.address;
    const city = data.city;
    const country = data.country;
    if (!username) {
      throw new Error("username is required");
    } else if (!name || !address || !city || !country) {
      throw new Error("please complete the form");
    }

    const user = await createCustomer(data, username);
    return user;
  }

  async getAll() {
    const user = await getAll();
    return user;
  }

  async getprocessintance() {
    const user = await getAll();

    const data = user.filter((item) => item.status === "active");
    if (data.length ===0) {
      throw new Error("no data found");
    }
    return data;
  }

  async getByid(uiid) {
    const user = await getByid(uiid);
    return user;
  }

  async updateCustomer(uuid, data, username) {
    if (!data || !uuid) {
      throw new Error("please complete the form");
    }
    const user = await updateCustomer(uuid, data, username);
    return user;
  }

  async deleteCustomer(search) {
    if (!search) {
      throw new Error("please complete the query");
    }
    const user = await deleteCustomer(search);
    return user;
  }
}

module.exports = new CustomerService();
