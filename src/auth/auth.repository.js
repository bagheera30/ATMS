const db = require("../db/db");
const neo = db.getInstance();

const createUser = async (data, otp) => {
  const session = neo.session();
  console.log(data);

  try {
    const result = await session.run(
      `CREATE (r:Role{
          uuid: apoc.create.uuid(),
          RoleName: "user",
          status: "inactive",
          createdBy: $username,
          createAt: timestamp(),
          modifiedBy: "", 
          modifiedAt: timestamp()
      })
      CREATE (u:User  {
          uuid: apoc.create.uuid(),
          username: $username,
          email: $email,
          dateOfBirth: $dateOfBirth,
          phoneNumber: $phoneNumber,
          status: "locked",
          password: $password,
          createdBy: $username,
          createAt: timestamp(),
          modifiedBy: "", 
          modifiedAt: timestamp(),
          otp: $otp
      })-[:HAS_ROLE]->(r)
RETURN { code: 0, status: true, message: 'create user success' } AS result`,
      {
        username: data.user.username,
        email: data.user.email,
        password: data.user.password,
        dateOfBirth: data.user.dateOfBirth,
        phoneNumber: data.user.phoneNumber || "",
        otp,
      }
    );
    // Return only the records
    return result.records.length > 0 ? result.records[0].get("result") : null;
  } catch (error) {
    console.error("Error creating user:", error);
    return null; // Return null or handle the error as needed
  } finally {
    await session.close();
  }
};

const validasiEmail = async (username) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `MATCH (u:User {email: $username})
        RETURN u`,
      {
        username: username,
      }
    );
    return result.records.length > 0 ? result.records[0].get("u") : null;
  } catch (error) {
    console.error("Error validating email:", error);
    return false; // Jika terjadi kesalahan, anggap username valid
  } finally {
    await session.close();
  }
};
const findToken = async (token) => {
  // Log the received token
  const session = neo.session();
  try {
    const result = await session.run(
      `MATCH (u:User  {otp: $token}) 
       SET u.status = "unlocked",u.otp=null
       RETURN { code: 0, status: true, message: 'success OTP' } AS result`,
      {
        token: token,
      }
    );

    // Check if records are returned
    if (result.records.length === 0) {
      console.log("No user found with the provided OTP.");
      return null; // or handle it as needed
    }

    console.log(result.records[0].get("result"));
    return result.records[0].get("result");
  } catch (error) {
    console.error("Error executing query:", error);
    throw new Error(`Database query failed: ${error.message}`);
  } finally {
    await session.close(); // Ensure the session is closed
  }
};
const authentication = async (username) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `MATCH (u:User  {email: $username})-[:HAS_ROLE]->(r:Role)
      RETURN CASE 
          WHEN u.status = 'unlocked' THEN {
              code: 0,
              status: true,
              message: 'success',
              user: u,
              role: r
          }
          ELSE {
              code: 1,
              status: false,
              message: 'User  is locked or status is not unlock'
          }
      END AS result`,
      {
        username: username,
      }
    );

    // Mengambil hasil dari kueri
    const response =
      result.records.length > 0
        ? result.records[0].get("result")
        : {
            code: 1,
            status: false,
            message: "User  not found or incorrect credentials",
          };

    return response;
  } catch (error) {
    console.error("Error during authentication:", error);
    return {
      code: 0,
      status: false,
      message: "An error occurred during authentication",
    };
  } finally {
    await session.close();
  }
};
module.exports = { createUser, authentication, findToken, validasiEmail };
