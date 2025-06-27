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
      console.log(data);

      // Initialize user object if not exists
      if (!data.user) {
        data.user = {};
      }

      // untuk change password
      if (role.includes("manager") || role.includes("admin")) {
        // Jika manager mengubah password
        if (data.user.password) {
          console.log("Manager changing password");

          const currentUser = await findUserById(uuid);
          const editedUser = await findUserAllByUsername(fromedit);

          // Jika user yang di-edit bukan diri sendiri
          if (!editedUser || currentUser.username !== editedUser.username) {
            return {
              code: 2,
              status: false,
              message: "Manager can only change their own password",
            };
          }

          // Hash password baru jika manager mengedit password sendiri
          data.user.password = await bcrypt.hash(data.user.password, 10);
        }
        // Jika manager tidak mengubah password, lanjut tanpa error

        // Lanjutkan update data
        const user = await userstatus(uuid, fromedit, data);
        console.log("user", user);
        return {
          code: 0,
          status: true,
          message: "success",
        };
      } else {
        // Logic untuk non-manager (password wajib)
        if (!data.user.password) {
          return {
            code: 2,
            status: false,
            message: "Password is required for non-manager roles",
          };
        }

        const fn = await findUserById(uuid);
        const pw = fn.password;
        console.log(pw);
        const isPasswordValid = await bcrypt.compare(data.user.password, pw);

        if (!isPasswordValid) {
          return {
            code: 2,
            status: false,
            message: "Incorrect password",
          };
        }

        data.user.password = await bcrypt.hash(data.user.password, 10);
        const user = await userstatus(uuid, fromedit, data);

        return {
          code: 0,
          status: true,
          message: "success",
        };
      }
    } catch (error) {
      console.error("Error in updateUser:", error);
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
