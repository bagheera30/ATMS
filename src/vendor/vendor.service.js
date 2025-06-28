const {
  getallVendor,
  deleteVendor,
  updsert,
  getByIdvendor,
  getbyname,
} = require("./vendor.repository");

class VendorService {
  async getall() {
    try {
      const user = await getallVendor();
      return user;
    } catch (error) {
      throw error;
    }
  }
  async getVendorById(id) {
    try {
      const user = await getByIdvendor(id);
      return user;
    } catch (error) {
      throw error;
    }
  }
  async deleteVendor(id) {
    try {
      const user = await deleteVendor(id);
      return user;
    } catch (error) {
      throw error;
    }
  }
  async updsertVendor(uuid, data, username) {
    try {
      let user;
      if (!username) {
        throw new Error("username is required");
      } else if (!uuid) {
        if (
          !data.name ||
          !data.address ||
          !data.city ||
          !data.country ||
          !data.category
        ) {
          throw new Error("please complete the form");
        }
        const get = await getbyname(data.name);
        if (get.length > 0) {
          return {
            status: false,
            message: "vendor already exists",
          };
        } else {
          user = await updsert(uuid, data, username);
        }
      } else {
        user = await updsert(uuid, data, username);
      }

      return user;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new VendorService();
