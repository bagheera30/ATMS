const db = require("../db/db");
const neo = db.getInstance();

const createUser = async (data, otp, otpExpires) => {
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
      $password AS password,
      $otp AS otp,
      $otpExpires AS otpExpires

WITH username, email, namaLengkap, dateOfBirth, phoneNumber, jabatan, password, otp, otpExpires,
    EXISTS { (:User {username: username}) } AS username_exists,
    EXISTS { (:User {email: email}) } AS email_exists,
    EXISTS { (:Role {RoleName: "staff"}) } AS role_exists

WITH username, email, namaLengkap, dateOfBirth, phoneNumber, jabatan, password, otp, otpExpires, 
     username_exists, email_exists, role_exists,
    CASE 
        WHEN username_exists AND email_exists THEN 'Username dan email sudah terdaftar'
        WHEN username_exists THEN 'Username sudah terdaftar'
        WHEN email_exists THEN 'Email sudah terdaftar'
        ELSE NULL
    END AS conflict_message,
    NOT (username_exists OR email_exists) AS can_register

FOREACH (_ IN CASE WHEN can_register THEN [1] ELSE [] END |
    MERGE (r:Role {RoleName: "staff"})
    ON CREATE SET 
        r.uuid = randomUUID(),
        r.createdBy = username,
        r.createAt = timestamp()
    
    // Only create status for role if role is newly created
    FOREACH (_ IN CASE WHEN NOT role_exists THEN [1] ELSE [] END |
        CREATE (sr:Status {
            uuid: randomUUID(),
            status: "inactive",
            createdBy: username,
            createAt: timestamp()
        })
        CREATE (r)-[:HAS_STATUS]->(sr)
    )
    
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
        otp: otp,
        otpExpiresAt: otpExpires
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
        otpExpires,
      }
    );
    console.log("masuk");
    // Return only the records
    return result.records.length > 0 ? result.records[0].get("result") : null;
  } catch (error) {
    console.error("Error creating user:", error);
    return null; // Return null or handle the error as needed
  } finally {
    await session.close();
  }
};

const sendOtpToEmail = async (email, otp) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `OPTIONAL MATCH (u:User)
WHERE lower(u.email) CONTAINS $email
FOREACH (ignore IN CASE WHEN u IS NOT NULL THEN [1] ELSE [] END |
  SET u.otp = $otp
)
RETURN
  CASE 
    WHEN u IS NOT NULL THEN 
      { code: 0, status: true, message: 'success OTP',email:u.email,otp:u.otp }
    ELSE 
      { code: 1, status: false, message: 'email tidak ditemukan' }
  END AS result`,
      {
        email,
        otp,
      }
    );
    return result.records.length > 0 ? result.records[0].get("result") : null;
  } catch (error) {
    console.error("Error executing query:", error);
    throw new Error(`Database query failed: ${error.message}`);
  } finally {
    await session.close();
  }
};
const validasiEmail = async (username) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `MATCH (u:User {email: $username})
        RETURN {
        id: u.uuid,
        email: u.email
        }as result`,
      {
        username: username,
      }
    );
    return result.records.length > 0 ? result.records[0].get("result") : null;
  } catch (error) {
    console.error("Error validating email:", error);
    return false; // Jika terjadi kesalahan, anggap username valid
  } finally {
    await session.close();
  }
};
const resendotp = async (email, otp, otpExpires) => {
  const session = neo.session();
  try {
    console.log(email);
    const result = await session.run(
      `MATCH (u:User {email: $email})
       SET u.otp=$otp,u.otpExpiresAt=$otpExpires, u.modifiedAt=timestamp()
       RETURN { code: 0, status: true, message: 'success OTP' } AS result`,
      {
        email: email,
        otp: otp,
        otpExpires: otpExpires,
      }
    );
    console.log(result.records[0].get("result"));
    return result.records.length > 0 ? result.records[0].get("result") : null;
  } catch (error) {
    console.error("Error executing query:", error);
    throw new Error(`Database query failed: ${error.message}`);
  } finally {
    await session.close();
  }
};
const findToken = async (token, time) => {
  const session = neo.session();
  try {
    console.log("Received token:", token);
    console.log("Received time:", time);
    const result = await session.run(
      `// First, find and lock the user with matching OTP
MATCH (u:User {otp: $token})
WHERE u.otpExpiresAt > $time
WITH u
LIMIT 1

// If user exists, update and return success
FOREACH (_ IN CASE WHEN u IS NOT NULL THEN [1] ELSE [] END |
    SET u.otp = null,
        u.otpExpiresAt = null,
        u.isVerified = true,
        u.modifiedAt = timestamp()
)

RETURN {status: true, id: u.uuid}AS result`,
      {
        token: token,
        time: time,
      }
    );

    console.log("test", result.records);
    // Check if records are returned
    if (result.records.length === 0) {
      return {
        status: false,
        message: "OTP sudah kadaluwarsa atau tidak valid",
      }; // or handle it as needed
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
module.exports = {
  createUser,
  authentication,
  findToken,
  validasiEmail,
  resendotp,
  sendOtpToEmail,
};
