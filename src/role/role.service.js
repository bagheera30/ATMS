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
      console.log(username, name, status);
      let user;
      if (!username) {
        throw new Error("username is required");
      } else if (!name) {
        throw new Error("please complete the form");
      }
      console.log("test id", uuid);
      if (!uuid) {
        console.log("masuk");
        const get = await searchWorkgroup(name);
        console.log(get);
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

      console.log(user);
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
        member: item.member.toNumber(), // Ambil nilai integer dari objek
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
      console.log("test1:", user);
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
    try {
      const lw = idUser.toLowerCase();
      const user = await addmember(lw, id);
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
