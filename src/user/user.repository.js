const db = require("../db/db");
const neo = db.getInstance();

const findUserAll = async (username) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `
      MATCH (u:User {username: $username})-[:HAS_ROLE]->(r:Role)
      RETURN {
        username: u.username,
        email: u.email,
        TanggalLahir: u.dateOfBirth,
        \`No.Hp\`: u.phoneNumber, // Perbaikan: Gunakan backtick untuk No.Hp
        Role: r.RoleName
      } AS result
      `,
      {
        username: username,
      }
    );
    return result.records.length > 0 ? result.records[0].get("result") : null;
  } catch (error) {
    console.error("Error executing query:", error);
    throw new Error(`Database query failed: ${error.message}`);
  } finally {
    await session.close(); // Pastikan sesi ditutup
  }
};
const findUserById = async (id, username) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `
        MATCH (u:User)
        WHERE u.uuid = $uuid OR u.username = $username
        RETURN {
            username:u.username,
            email:u.email,
            TanggalLahir:u.dateOfBirth,
            No.Hp:u.phoneNumber,
            Role:r.RoleName,
            }as result`,
      {
        id: id || "",
        username: username || "",
      }
    );
    return result.records.length > 0 ? result.records[0].get("result") : null;
  } catch (error) {
    console.error("Error executing query:", error);
    throw new Error(`Database query failed: ${error.message}`);
  } finally {
    await session.close(); // Ensure the session is closed
  }
};
const updateUser = async (uuid, data) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `MATCH (u:User {uuid: $uuid})
        SET u+=data,u.modifiedAt=timestamp(),u.modifiedBy=u.username
        RETURN {
            username:u.username,
            email:u.email,
            TanggalLahir:u.dateOfBirth,
            No.Hp:u.phoneNumber,
            Role:r.RoleName,
            }as result`,
      {
        uuid,
        data,
      }
    );
    return result.records.length > 0 ? result.records[0].get("result") : null;
  } catch (error) {
    console.error("Error executing query:", error);
    throw new Error(`Database query failed: ${error.message}`);
  } finally {
    await session.close(); // Ensure the session is closed
  }
};
module.exports = { findUserAll, findUserById, updateUser };
