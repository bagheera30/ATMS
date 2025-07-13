const {
  findUserAll,
  userstatus,
  findUserById,
  deleteUser,
  findUserAllByUsername,
  findUserOverdue,
  finuserbyWG,
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
  async finduserbyWG(username) {
    try {
      const lower = username.toLowerCase();
      const data = await finuserbyWG(lower);
      console.log(data);
      if (Array.isArray(data) && data.length > 0) {
        // Check if any item in the array has status "inactive"
        const inactiveItems = data.filter((item) => item.status === "inactive");

        if (inactiveItems.length > 0) {
          // Get the usernames of inactive members for the error message
          const inactiveUsers = inactiveItems
            .flatMap(
              (item) =>
                item.username_workgroup?.map((user) => user.username) || []
            )
            .join(", ");

          return {
            code: 1,
            status: false,
            message: "Workgroup not active",
          };
        }
      }
      const filteredData = data.map((group) => {
        return {
          ...group,
          username_workgroup: group.username_workgroup.filter(
            (user) => user.username?.toLowerCase() !== lower
          ),
        };
      });

      return filteredData;
    } catch (error) {
      throw error;
    }
  }
  async getall() {
    try {
      const users = await findUserAll();

      const filteredUsers = users.filter(
        (user) => user.username !== "rizki_Dev"
      );

      return {
        code: 0,
        status: true,
        message: "success",
        user: filteredUsers,
      };
    } catch (error) {
      throw error;
    }
  }
  async updateUser(uuid, data, role, fromedit) {
    try {
      if (!data.user) {
        data.user = {};
      }
      if (!data.status) {
        return {
          code: 2,
          status: false,
          message: "status is required",
        };
      }

      if (role.includes("manager") || role.includes("admin")) {
        if (data.user.password) {
          const currentUser = await findUserById(uuid);
          const lower = fromedit.toLowerCase();
          const editedUser = await findUserAllByUsername(lower);
          if (!editedUser || currentUser.username !== editedUser.username) {
            return {
              code: 2,
              status: false,
              message: "Manager can only change their own password",
            };
          }

          data.user.password = await bcrypt.hash(data.user.password, 10);
        }

        await userstatus(uuid, fromedit, data);
        return {
          code: 0,
          status: true,
          message: "success",
        };
      } else {
        if (data.user.password) {
          const fn = await findUserById(uuid);
          const pw = fn.password;
          const isPasswordValid = await bcrypt.compare(data.user.password, pw);
          if (isPasswordValid) {
            return {
              code: 2,
              status: false,
              message: "Incorrect password",
            };
          }

          data.user.password = await bcrypt.hash(data.user.password, 10);
        }

        await userstatus(uuid, fromedit, data);
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
