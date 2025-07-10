const db = require("../db/db");
const neo = db.getInstance();

const findUserAllByUsername = async (username) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `
      MATCH (u:User)
      WHERE LOWER(u.username) CONTAINS $username
      RETURN {
        id: u.uuid,
        username: u.username,
        fullName: u.namaLengkap,
        email: u.email,
        posisi: u.jabatan,
        role: [(u)-[:HAS_ROLE]->(r:Role)|r.RoleName],
        status: [(u)-[:HAS_STATUS]->(s:Status)|s.status][0],
        TanggalLahir: u.dateOfBirth,
        phoneNumber: u.phoneNumber
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
    await session.close();
  }
};

const finuserbyWG = async (username) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `
      MATCH (u:User)
      WHERE LOWER(u.username) CONTAINS $username
      optional match (w:Workgroup)-[:HAS_WORKGROUP]->(u)
      RETURN {
        name_worgroup: w.name,
        username_workgroup: [(w)-[:HAS_WORKGROUP]->(u2:User)|{id: u2.uuid, username: u2.username}]
      } AS result
      `,
      {
        username: username,
      }
    );
    return result.records.length > 0
      ? result.records.map((record) => record.get("result"))
      : null;
  } catch (error) {
    console.error("Error executing query:", error);
    throw new Error(`Database query failed: ${error.message}`);
  } finally {
    await session.close(); // Pastikan sesi ditutup
  }
};
const findUserOverdue = async (username) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `
      MATCH (wg:Workgroup)-[:HAS_WORKGROUP]->(u:User)where LOWER(u.username)CONTAINS $username
OPTIONAL MATCH (wg)-[:HAS_WORKGROUP]->(u2:User)
WHERE EXISTS((u2)-[:HAS_ROLE]->(:Role {RoleName: 'manager'}))
RETURN DISTINCT{
  userEmail:u.email,
  managerEmail: CASE WHEN u2 IS NOT NULL THEN u2.email ELSE null END
} AS result
      `,
      {
        username,
      }
    );
    return result.records[0].get("result");
  } catch (error) {
    console.error("Error executing query:", error);
    throw new Error(`Database query failed: ${error.message}`);
  } finally {
    await session.close(); // Pastikan sesi ditutup
  }
};
const findUserAll = async () => {
  const session = neo.session();
  try {
    const result = await session.run(
      `
      MATCH (u:User)
OPTIONAL MATCH (u)-[:HAS_STATUS]->(s:Status)
OPTIONAL MATCH (u)-[:HAS_ROLE]->(r:Role)
WITH u, s.status AS status, COLLECT(r.RoleName) AS roles
RETURN {
  id: u.uuid,
  username: u.username,
  namaLengkap: u.namaLengkap,
  email: u.email,
  TanggalLahir: u.dateOfBirth,
  \`No.Hp\`: u.phoneNumber,
  posisi: u.jabatan,
  status: status,
  Role: roles
} AS result


      `
    );
    return result.records.map((record) => record.get("result"));
  } catch (error) {
    console.error("Error executing query:", error);
    throw new Error(`Database query failed: ${error.message}`);
  } finally {
    await session.close(); // Pastikan sesi ditutup
  }
};
const findUserById = async (id) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `
        MATCH (u:User)
        WHERE u.uuid = $uuid
        RETURN {
            username:u.username,
            email:u.email,
            TanggalLahir:u.dateOfBirth,
            \`No.Hp\`:u.phoneNumber,
            posisi:u.jabatan,
            Role:[(u)-[:HAS_ROLE]->(n:Role)|n.RoleName],
            password:u.password
            }as result`,
      {
        uuid: id || "",
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
    await session.close();
  }
};
const userstatus = async (uuid, fromedit, data) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `
     MATCH (u:User {uuid: $uuid})-[r:HAS_STATUS]->(s:Status)
SET s.status = $data.status,
    s.modifiedAt = timestamp(),
    s.modifiedBy = $fromedit
WITH u, s, $data AS data
WHERE data.user IS NOT NULL
SET u += data.user
RETURN {
    username: u.username,
    status: s.status,
    updatedUser: properties(u)
} AS result
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
    await session.close();
  }
};
const updateUser = async (uuid, data, dataform) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `MATCH (u:User {uuid: $uuid})
        SET u+=$data,u.modifiedAt=timestamp(),u.modifiedBy=$dataform
        RETURN {
            username:u.username,
            email:u.email,
            TanggalLahir:u.dateOfBirth,
            \`No.Hp\`:u.phoneNumber,
            Role:[(u)-[:HAS_ROLE]->(n:Role)|n.RoleName]
            }as result`,
      {
        uuid,
        data,
        dataform: dataform || "",
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
const deleteUser = async (uuid) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `MATCH (u:User)-[r]-(s:Status) where u.uuid = $uuid DETACH DELETE u,r,s 
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
    await session.close();
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
  findUserOverdue,
  finuserbyWG,
};
