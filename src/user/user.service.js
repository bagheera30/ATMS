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

      // untuk change password
      if (role.includes("manager")) {
        if (data.user.password) {
          // Cek apakah manager mengedit dirinya sendiri
          const currentUser = await findUserById(uuid); // Data user yang sedang login
          const editedUser = await findUserAllByUsername(fromedit); // Data user yang sedang di-edit

          // Jika user yang di-edit bukan diri sendiri
          if (!editedUser || currentUser.username !== editedUser.username) {
            return {
              code: 2,
              status: false,
              message: "Manager can only change their own password",
            };
          }

          // Jika sampai sini berarti manager mengedit dirinya sendiri
          data.user.password = await bcrypt.hash(data.user.password, 10);
        }

        // Lanjutkan update data
        const user = await userstatus(uuid, fromedit, data);
        console.log("user", user);
        return {
          code: 0,
          status: true,
          message: "success", // Diperbaiki typo dari "sucess"
        };
      } else {
        // Logic untuk non-manager
        if (!data.user.password) {
          return {
            code: 2,
            status: false,
            message: "Please complete the form",
          };
        } else {
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

          const user = await updateUser(uuid, data, fromedit);
          return {
            code: 0,
            status: true,
            message: "success", // Diperbaiki typo dari "sucess"
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
