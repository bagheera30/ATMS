const { findUserAll } = require("./user.repository");

class UserService {
  async getUserall(username) {
    try {
      const user = await findUserAll(username);
      return user;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new UserService();
