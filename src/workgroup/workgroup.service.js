const {
  upsertWorkgroup,
  getAll,
  searchWorkgroup,
  deleteWorkgroup,
  removemember,
  addmember,
  getmanager,
  getallwg,
} = require("./workgroup.repository");

class WorkgroupService {
  async upsertWorkgroup(uuid, username, name, status) {
    try {
      let user;
      console.log(uuid);
      if (!username) {
        throw new Error("username is required");
      } else if (!name) {
        throw new Error("please complete the form");
      }

      if (uuid == "") {
        const get = await getAll(name);
        if (get.length > 0) {
          return {
            status: false,
            message: "Workgroup already exists",
          };
        } else {
          user = await upsertWorkgroup(uuid, username, name, status);
        }
      } else {
        user = await upsertWorkgroup(uuid, username, name, status);
      }

      return user;
    } catch (error) {
      throw error;
    }
  }
  async getallwg() {
    try {
      const user = await getallwg();
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
      console.log("test1:", user);
      if (user == "Failed: Workgroup has users"){
        return {
          code: 1,
          status: false,
          message: "Workgroup has users",
        };
      } return user;
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
      console.log("test1: ", user);
      return user;
    } catch (error) {
      throw error;
    }
  }
}
module.exports = new WorkgroupService();
