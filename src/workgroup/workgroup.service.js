const {
  upsertWorkgroup,
  searchWorkgroup,
  deleteWorkgroup,
  removemember,
  getAllWorkgroups,
  getAllWorkgroupsWithMembers,
  getManager,
  removeMember,
  getWorkgroup,
  addMember,
} = require("./workgroup.repository");

class WorkgroupService {
  async upsertWorkgroup(uuid, username, data) {
    try {
      let user;
      console.log(data);
      if (!username) {
        throw new Error("username is required");
      } else if (!data.name) {
        throw new Error("please complete the form");
      }

      if (uuid == "") {
        const get = await getAllWorkgroups(data.name);
        console.log(get);
        if (get.length > 0) {
          return {
            status: false,
            message: "Workgroup already exists",
          };
        } else {
          user = await upsertWorkgroup(uuid, username, data);
        }
      } else {
        user = await upsertWorkgroup(uuid, username, data);
      }

      return user;
    } catch (error) {
      throw error;
    }
  }
  async getallwg() {
    try {
      const user = await getAllWorkgroupsWithMembers();
      return user;
    } catch (error) {
      throw error;
    }
  }
  async getAllWorkgroup(search) {
    try {
      const lower = search.toLowerCase();
      console.log("test1: ", lower);
      const user = await getAllWorkgroups(lower);
      return user;
    } catch (error) {
      throw error;
    }
  }
  async getManeger(search) {
    try {
      const workgroup = await getManager(search);
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
      const user = await getWorkgroup(id);
      return user;
    } catch (error) {
      throw error;
    }
  }
  async deleteWorkgroup(id) {
    try {
      const user = await deleteWorkgroup(id);
      console.log("test1:", user);
      if (user == "Failed: Workgroup has users") {
        return {
          code: 1,
          status: false,
          message: "Workgroup has users",
        };
      }
      return user;
    } catch (error) {
      throw error;
    }
  }
  async adduserToWorkgroup(idUser, id) {
    try {
      const user = await addMember(idUser, id);
      return user;
    } catch (error) {
      throw error;
    }
  }
  async deleteuserWorkgroup(idUser, id) {
    try {
      const user = await removeMember(idUser, id);
      console.log("test1: ", user);
      return user;
    } catch (error) {
      throw error;
    }
  }
}
module.exports = new WorkgroupService();
