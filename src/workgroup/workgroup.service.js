const {
  upsertWorkgroup,
  getAll,
  searchWorkgroup,
  deleteWorkgroup,
  removemember,
  addmember,
  getmanager,
} = require("./workgroup.repository");

class WorkgroupService {
  async upsertWorkgroup(uuid, username, name, status) {
    try {
      if (!username) {
        throw new Error("username is required");
      } else if (!name) {
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
      console.log("test1: ", lower);
      const user = await getAll(lower);
      return user;
    } catch (error) {
      throw error;
    }
  }
  async getManeger(search) {
    try {
      const workgroup = await getmanager(search);
      if (!workgroup) {
        return {
          code: 1,
          status: false,
          message: "manager not found",
        };
      }
      return workgroup;
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
