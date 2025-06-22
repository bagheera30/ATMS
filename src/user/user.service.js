const {
  findUserAll,
  updateUser,
  userUpdateRole,
  userstatus,
  findUserById,
  deleteUser,
  findUserAllByUsername,
  findUserOverdue,
} = require("./user.repository");
const bcrypt = require("bcrypt");

class UserService {
  async getUserallByUsername(search) {
    try {
      const lower = search.toLowerCase();
      const user = await findUserAllByUsername(lower);
      if (Array.isArray(user.Role)) {
        user.Role = user.Role.join(", "); // contoh hasil: "admin, editor"
      }
      console.log("test", user);
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
  async getTaskOverdue(username) {
    try {
      const user = await findUserOverdue(username);
      if (!user) {
        return {
          code: 1,
          status: false,
          message: "user not found",
        };
      }
      return {
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
      // untuk change password
      if (role.includes("manager")) {
        const user = await userstatus(uuid, fromedit, data);
        console.log(user);
        return {
          code: 0,
          status: true,
          message: "sucess",
        };
      } else {
        if (!data.password) {
          return {
            code: 2,
            status: false,
            message: "Please complete the form",
          };
        } else {
          const fn = await findUserById(uuid);
          const pw = fn.password;
          const isPasswordValid = await bcrypt.compare(data.password, pw);
          if (!isPasswordValid) {
            return {
              code: 2,
              status: false,
              message: "Incorrect password",
            };
          }
          data.password = await bcrypt.hash(data.password, 10);

          const user = await updateUser(uuid, data, role, fromedit);
          return {
            code: 0,
            status: true,
            message: "sucess",
            user,
          };
        }
      }
    } catch (error) {
      return {
        code: 2,
        status: false,
        message: error.message,
      };
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
