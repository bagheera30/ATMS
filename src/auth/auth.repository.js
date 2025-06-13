const db = require("../db/db");
const neo = db.getInstance();

const createUser = async (data, otp) => {
  const session = neo.session();

  try {
    const result = await session.run(
      `WITH 
      $username AS username, 
      $email AS email,
      $namaLengkap AS namaLengkap,
      $dateOfBirth AS dateOfBirth,
      $phoneNumber AS phoneNumber,
      $jabatan AS jabatan,
      $password AS password

      WITH username, email, namaLengkap, dateOfBirth, phoneNumber, jabatan, password,
        EXISTS { (:User {username: username}) } AS username_exists,
        EXISTS { (:User {email: email}) } AS email_exists

      WITH username, email, namaLengkap, dateOfBirth, phoneNumber, jabatan, password, username_exists, email_exists,
        CASE 
          WHEN username_exists AND email_exists THEN 'Username dan email sudah terdaftar'
          WHEN username_exists THEN 'Username sudah terdaftar'
          WHEN email_exists THEN 'Email sudah terdaftar'
          ELSE NULL
        END AS conflict_message,
        NOT (username_exists OR email_exists) AS can_register

    FOREACH (_ IN CASE WHEN can_register THEN [1] ELSE [] END |
      CREATE (r:Role {
        uuid: randomUUID(),
        RoleName: "user",
        createdBy: username,
        createAt: timestamp()
      })-[:HAS_STATUS]->(sr:Status {
        uuid: randomUUID(),
        status: "inactive",
        createdBy: username,
        createAt: timestamp()
      })
      CREATE (su:Status {
        uuid: randomUUID(),
        status: "locked",
        createdBy: username,
        createAt: timestamp()
      })
      CREATE (u:User {
        uuid: randomUUID(),
        username: username,
        namaLengkap: namaLengkap,
        email: email,
        dateOfBirth: dateOfBirth,
        phoneNumber: phoneNumber,
        jabatan: jabatan,
        password: password,
        createdBy: username,
        createAt: timestamp(),
        modifiedBy: "",
        modifiedAt: timestamp(),
        otp: $otp
      })-[:HAS_ROLE]->(r)
      CREATE (u)-[:HAS_STATUS]->(su)
  )
  RETURN 
    CASE 
      WHEN conflict_message IS NOT NULL THEN 
        { code: 1, status: false, message: conflict_message }
      ELSE 
        { code: 0, status: true, message: 'create user success' }
    END AS result
  `,
      {
        username: data.user.username,
        namaLengkap: data.user.namaLengkap,
        email: data.user.email,
        password: data.user.password,
        dateOfBirth: data.user.dateOfBirth,
        phoneNumber: data.user.phoneNumber || "",
        jabatan: data.user.jabatan,
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
      `MATCH (u:User  {otp: $token})-[:HAS_STATUS]->(s:Status)
       SET u.otp=null,s.status="unlocked",s.modifiedAt=timestamp()
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
      `MATCH (u:User {email: $username})-[:HAS_ROLE]->(r:Role)
      OPTIONAL MATCH (u)-[:HAS_STATUS]->(s:Status)
WITH u, collect(r) AS roles,s
RETURN CASE 
    WHEN s.status = 'unlocked' THEN {
        code: 0,
        status: true,
        message: 'success',
        user: u,
        roles: roles
    }
    ELSE {
        code: 1,
        status: false,
        message: 'User is locked or status is not unlocked'
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
