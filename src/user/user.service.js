const {
  findUserAll,
  updateUser,
  userUpdateRole,
  userstatus,
  findUserById,
  deleteUser,
  findUserAllByUsername,
} = require("./user.repository");

class UserService {
  async getUserallByUsername(username) {
    try {
      const user = await findUserAllByUsername(username);
      // if (Array.isArray(user.Role)) {
      //   user.Role = user.Role.join(", "); // contoh hasil: "admin, editor"
      // }
      if (!user) {
        return {
          code: 1,
          status: false,
          message: "user not found",
        };
      }
      // console.log(user);
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
  async getbyidUsername(id, username) {
    try {
      const user = await findUserById(id, username);
      return user;
    } catch (error) {
      throw error;
    }
  }
  async getall() {
    try {
      const user = await findUserAll();
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
  async updateUser(uuid, data, role, fromedit) {
    try {
      if (role === "user") {
        const datas = await findUserById(uuid, data.username);
        const pw = data.password;
        const isPasswordValid = await bcrypt.compare(pw, datas.password);
        if (isPasswordValid) {
          return {
            code: 1,
            status: false,
            message: "new password must not be the same as previous password",
          };
        }
        const user = await updateUser(uuid, data);
        return {
          code: 0,
          status: true,
          message: "success",
          data: user,
        };
      } else if (role === "manager") {
        return (user = await userstatus(uuid, fromedit, data));
      } else {
        const datas = data.username;
        return (user = await userUpdateRole(datas, fromedit, role));
      }
    } catch (error) {
      throw error;
    }
  }
  async deleteUser(uuid) {
    try {
      const user = await deleteUser(uuid);
      return user;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new UserService();
