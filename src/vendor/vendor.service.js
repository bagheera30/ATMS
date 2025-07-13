const {
  getallVendor,
  deleteVendor,
  updsert,
  getByIdvendor,
  getbyname,
} = require("./vendor.repository");

class VendorService {
  async getall() {
    return await getallVendor();
  }

  async getVendorById(id) {
    return await getByIdvendor(id);
  }

  async deleteVendor(id) {
    return await deleteVendor(id);
  }

  async updsertVendor(uuid, data, username) {
    if (!username) {
      throw new Error("username is required");
    }

    if (!uuid) {
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
      }
    }

    return await updsert(uuid, data, username);
  }
}

module.exports = new VendorService();
