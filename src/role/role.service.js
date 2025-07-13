const {
  upsertWorkgroup,
  getAll,
  searchWorkgroup,
  deleteWorkgroup,
  removemember,
  addmember,
} = require("./role.repository");

class WorkgroupService {
  async upsertWorkgroup(uuid, username, name, status) {
    try {
      let user;
      if (!username) {
        throw new Error("username is required");
      }
      if (!uuid) {
        const get = await searchWorkgroup(name);
        if (get) {
          return {
            status: false,
            message: "role already exists",
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
  async getAllWorkgroup() {
    try {
      const user = await getAll();
      const role = user.map((item) => ({
        ...item,
        member: item.member.toNumber(),
      }));
      return {
        code: 0,
        status: true,
        message: "sucess",
        role,
      };
    } catch (error) {
      throw error;
    }
  }
  async getByid(id) {
    try {
      const user = await searchWorkgroup(id);
      if (!user) {
        return {
          code: 1,
          status: false,
          message: "user not found",
        };
      }
      return {
        code: 0,
        status: true,
        message: "sucess",
        user,
      };
    } catch (error) {
      throw error;
    }
  }
  async deleteWorkgroup(id) {
    try {
      const user = await deleteWorkgroup(id);
      if (user == "Failed: role has users") {
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
    console.log(id);
    try {
      const lw = id.toLowerCase();
      const user = await addmember(idUser, lw);
      return user;
    } catch (error) {
      throw error;
    }
  }
  async deleteuserWorkgroup(idUser, id, role) {
    try {
      if (role === "manager" && id === "admin") {
        throw new Error("Manager tidak dapat menghapus admin");
      }
      const user = await removemember(idUser, id);
      return user;
    } catch (error) {
      throw error;
    }
  }
}
module.exports = new WorkgroupService();
