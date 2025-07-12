const {
  upsertWorkgroup,
  searchWorkgroup,
  deleteWorkgroup,
  getAllWorkgroups,
  getAllWorkgroupsWithMembers,
  getManager,
  removeMember,
  getWorkgroup,
  addMember,
} = require("./workgroup.repository");

const { findUserById } = require("../user/user.repository");
const { getAllProjek } = require("../projek/projek.repository");

class WorkgroupService {
  async upsertWorkgroup(uuid, username, data) {
    try {
      if (!username) {
        throw new Error("username is required");
      }
      if (!data?.name) {
        throw new Error("please complete the form");
      }

      if (uuid === "") {
        // Creating a new workgroup
        const getManager = await findUserById(data.uuid);
        const projek = await getAllProjek(data.businessKey);

        // Fixed typo: createBy -> createdBy
        if (getManager.username !== projek[0].createdBy) {
          return {
            status: false,
            message: "Only manager can create workgroup",
          };
        }

        const existingWorkgroups = await getAllWorkgroups(data.name);
        if (existingWorkgroups.length > 0) {
          return {
            status: false,
            message: "Workgroup already exists",
          };
        }
      }
      const result = await upsertWorkgroup(uuid, username, data);
      return result;
    } catch (error) {
      console.error("Error in upsertWorkgroup:", error);
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
      const getwg = await getWorkgroup(id);
      const beyonceId = getwg.user.find((user) => user.id === idUser)?.id;
      if (beyonceId) {
        throw new Error("User already in workgroup");
      }
      const user = await addMember(idUser, id);
      return user;
    } catch (error) {
      throw error;
    }
  }
  async deleteuserWorkgroup(idUser, id, role) {
    try {
      const getwg = await getWorkgroup(id);
      const beyonceId = getwg.user.find((user) => user.id === idUser)?.role;
      if (beyonceId === "manager" && role !== "admin") {
        throw new Error("Manager tidak dapat di remove");
      }

      if(beyonceId !== "manager" && role === "admin") {
        throw new Error(`Admin tidak dapat remove ${beyonceId}`);
      }

      console.log(beyonceId);
      // const data = await removeMember(idUser, id);

      return data;
    } catch (error) {
      throw error;
    }
  }
}
module.exports = new WorkgroupService();
