const db = require("../lib/db");
const neo = db.getInstance();

const createUser = async (data) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `CREATE (u:User_Telu {
          uuid: apoc.create.uuid(),
          username: $username,
          email: $email,
          dateOfBirth: $dateOfBirth,
          phoneNumber: $phoneNumber,
          status:"locked",
          password: $password,
          createdBy: $username,
          createAt: timestamp(),
          modifiedBy: "", 
          modifiedAt: timestamp(),
          otp:$otp,
      })
      RETURN { code: 0, status: true, message: 'create user success' } AS result`,
      {
        username: data.username,
        email: data.email,
        password: data.password,
        dateOfBirth: data.dateOfBirth,
        phoneNumber: data.phoneNumber,
        otp: data.otp,
      }
    );
    return result;
  } catch (error) {
  } finally {
    await session.close();
  }
};
const authtetication = async (username, password) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `MATCH (u:User {username: $username, password: $password})
        RETURN {
            code: 0,
            status: true,
            message: 'success',
        }`,
      {
        username: username,
        password: password,
      }
    );
    return result;
  } catch (error) {
    return {
      code: 0,
      status: false,
      message: "email or password is incorrect",
    };
  } finally {
    await session.close();
  }
};
module.exports = { createUser, authtetication };
