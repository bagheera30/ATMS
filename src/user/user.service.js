const { default: axios } = require("axios");
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
      message: "success",
      user,
    };
  }

  async getTaskOverdue(username) {
    const user = await findUserOverdue(username);
    if (!user) {
      return {
        code: 1,
        status: false,
        message: "user not found",
      };
    }
    return { user };
  }

  async getbyidUsername(id, username) {
    return await findUserById(id, username);
  }

  async finduserbyWG(username, id) {
    const lower = username.toLowerCase();
    console.log(id);
    const idintance = await axios.get(
      `${process.env.URL_CAMUNDA}/process-instance/${id}`
    );
    console.log(idintance.data);
    const data = await finuserbyWG(idintance.data.businessKey);
    console.log(data);

    if (Array.isArray(data) && data.length > 0) {
      const inactiveItems = data.filter((item) => item.status === "inactive");

      if (inactiveItems.length > 0) {
        inactiveItems
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

    return data.map((group) => ({
      ...group,
      username_workgroup: group.username_workgroup.filter(
        (user) => user.username?.toLowerCase() !== lower
      ),
    }));
  }

  async getall() {
    const users = await findUserAll();
    const filteredUsers = users.filter((user) => user.username !== "rizki_Dev");

    return {
      code: 0,
      status: true,
      message: "success",
      user: filteredUsers,
    };
  }

  async updateUser(uuid, data, role, fromedit) {
    try {
      if (!data.user) data.user = {};
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
          const editedUser = await findUserAllByUsername(
            fromedit.toLowerCase()
          );
          if (!editedUser || currentUser.username !== editedUser.username) {
            return {
              code: 2,
              status: false,
              message: "Manager can only change their own password",
            };
          }
          data.user.password = await bcrypt.hash(data.user.password, 10);
        }
      } else if (data.user.password) {
        const user = await findUserById(uuid);
        const isPasswordValid = await bcrypt.compare(
          data.user.password,
          user.password
        );
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
    } catch (error) {
      console.error("Error in updateUser:", error);
      return {
        code: 2,
        status: false,
        message: error.message,
      };
    }
  }

  async deleteUser(uuid, role) {
    const user = await findUserById(uuid);
    if (!user) {
      return {
        code: 1,
        status: false,
        message: "User not found",
      };
    }

    // Check if user is active
    if (user.isActive) {
      return {
        code: 2,
        status: false,
        message: "Cannot delete active user",
      };
    }

    // Role-based permission check
    if (role === "admin") {
      if (user.role !== "manager") {
        return {
          code: 3,
          status: false,
          message: "Admin cannot delete other admins",
        };
      }
    } else if (role === "manager") {
      if (user.role !== "staff") {
        return {
          code: 4,
          status: false,
          message: "Manager can only delete staff members",
        };
      }
    } else {
      // Staff cannot delete anyone
      return {
        code: 5,
        status: false,
        message: "You don't have permission to delete users",
      };
    }

    // If all checks pass, proceed with deletion
    try {
      await deleteUser(uuid);
      return {
        code: 0,
        status: true,
        message: "User deleted successfully",
      };
    } catch (error) {
      return {
        code: 6,
        status: false,
        message: "Error deleting user",
        error: error.message,
      };
    }
  }
}

module.exports = new UserService();
