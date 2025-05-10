const {
  upsertWorkgroup,
  getAll,
  searchWorkgroup,
  deleteWorkgroup,
  removemember,
  addmember,
} = require("./workgroup.repository");

class WorkgroupService {
  async upsertWorkgroup(uuid, username, name, status) {
    try {
      if (!username) {
        throw new Error("username is required");
      } else if (!name || !status) {
        throw new Error("please complete the form");
      }
      const user = await upsertWorkgroup(uuid, username, name, status);
      return user;
    } catch (error) {
      throw error;
    }
  }
  async getAllWorkgroup(search) {
    try {
      const lower = search.toLowerCase();
      const user = await getAll(lower);
      return user;
    } catch (error) {
      throw error;
    }
  }
  async getByid(id) {
    try {
      const user = await searchWorkgroup(id);
      return user;
    } catch (error) {
      throw error;
    }
  }
  async deleteWorkgroup(id) {
    try {
      const user = await deleteWorkgroup(id);
      console.log(user);
      return user;
    } catch (error) {
      throw error;
    }
  }
  async adduserToWorkgroup(idUser, id) {
    try {
      const user = await addmember(idUser, id);
      return user;
    } catch (error) {
      throw error;
    }
  }
  async deleteuserWorkgroup(idUser, id) {
    try {
      const user = await removemember(idUser, id);
      return user;
    } catch (error) {
      throw error;
    }
  }
}
module.exports = new WorkgroupService();
