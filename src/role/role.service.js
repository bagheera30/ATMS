const { findUserById } = require("../user/user.repository");
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
      }
    }

    return await upsertWorkgroup(uuid, username, name, status);
  }

  async getAllWorkgroup() {
    const user = await getAll();
    const role = user.map((item) => ({
      ...item,
      member: item.member.toNumber(),
    }));
    return {
      code: 0,
      status: true,
      message: "success",
      role,
    };
  }

  async getByid(id) {
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
      message: "success",
      user,
    };
  }

  async deleteWorkgroup(id) {
    const user = await deleteWorkgroup(id);
    if (user == "Failed: role has users") {
      return {
        code: 1,
        status: false,
        message: "Workgroup has users",
      };
    }
    return user;
  }

  async adduserToWorkgroup(idUser, id, role) {
    console.log(id);
    const lw = id.toLowerCase();
    console.log(lw);
    if (lw === "admin" && role === "manager") {
      throw new Error("Manager tidak dapat ubah admin");
    } else if (lw === "staff" && role === "admin") {
      throw new Error("Admin tidak dapat ubah staff");
    }
    return await addmember(idUser, lw);
  }

  async deleteuserWorkgroup(idUser, id, role) {
    if (role === "manager" && id === "admin") {
      throw new Error("Manager tidak dapat menghapus admin");
    }
    return await removemember(idUser, id);
  }
}

module.exports = new WorkgroupService();
