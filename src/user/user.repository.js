const db = require("../db/db");
const neo = db.getInstance();

const findUserAllByUsername = async (username) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `
      MATCH (u:User {username: $username})-[:HAS_ROLE]->(r:Role)
WITH u, collect(r.RoleName) AS roles
RETURN {
  id: u.uuid,
  username: u.username,
  email: u.email,
  TanggalLahir: u.dateOfBirth,
  \`No.Hp\`: u.phoneNumber,
  Role: roles
} AS result


      `,
      {
        username: username,
      }
    );
    console.log(result.records[0].get("result"));
    return result.records.length > 0 ? result.records[0].get("result") : null;
  } catch (error) {
    console.error("Error executing query:", error);
    throw new Error(`Database query failed: ${error.message}`);
  } finally {
    await session.close(); // Pastikan sesi ditutup
  }
};

const findUserAll = async (username) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `
      MATCH (u:User)
RETURN {
  id: u.uuid,
  username: u.username,
  email: u.email,
  TanggalLahir: u.dateOfBirth,
  \`No.Hp\`: u.phoneNumber,
  Role: [(c)-[:HAS_ROLE]->(s:Role)|s.RoleName][0]
} AS result


      `,
      {
        username: username,
      }
    );
    console.log(result.records[0].get("result"));
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
const userUpdateRole = async (username, fromedit, data) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `
      MATCH(u:User {username: $username})-[r:HAS_ROLE]->(r:Role)
      SET r.RoleName = $data, r.modifiedAt=timestamp(),r.modifiedBy=$fromedit
      RETURN{
      username:u.username,
      role:r.RoleName
      }as result
      `,
      {
        username,
        data,
        fromedit,
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
const userstatus = async (uuid, fromedit, data) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `
      MATCH(u:User {uuid: $uuid})-[r:HAS_STATUS]->(s:Status)
      SET s.status = $data, s.modifiedAt=timestamp(),s.modifiedBy=$fromedit
      RETURN{
      username:u.username,
      status:s.status
      }as result
      `,
      {
        uuid,
        data,
        fromedit,
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
const updateUser = async (uuid, data, dataform) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `MATCH (u:User {uuid: $uuid})
        SET u+=data,u.modifiedAt=timestamp(),u.modifiedBy=$dataform
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
        dataform,
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
const deleteUser = async (uuid) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `MATCH (u:User)-[r]-(s) where u.uuid = $uuid DETACH DELETE u,r,s 
      RETURN CASE WHEN u IS NOT NULL THEN {code: 0, status: true, message: 'Object Successful Deleted'}  
      ELSE {code: -1, status: false, message: 'Nothing object found'} END AS result `,
      {
        uuid,
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
module.exports = {
  findUserAllByUsername,
  userUpdateRole,
  findUserAll,
  findUserById,
  updateUser,
  deleteUser,
  userstatus,
};
