const db = require("../db/db");
const neo = db.getInstance();

const createProjek = async (data, customer) => {
  const session = neo.session();

  try {
    const result = await session.run(
      `MATCH(c:Customer{uuid:$customer})
      CREATE (p:Projek{
          businessKey:$businessKey
          nama: $namaProjek,
          customer:c.uuid,
          createdBy: $createdBy,
          createAt: timestamp(),
          modifiedBy: "", 
          modifiedAt: timestamp(),
      }) (c)-[:HAS_CUSTOMER]->(p)
          RETURN { code: 0, status: true, message: 'create user success' } AS result`,
      {
        customer,
        businessKey: data.businessKey,
        namaProjek: data.namaProjek,
        customer: data.customer,
        createdBy: data.createdBy,
      }
    );
    return result.records.length > 0 ? result.records[0].get("p") : null;
  } catch (error) {
    console.error("Error executing query:", error);
    throw new Error(`Database query failed: ${error.message}`);
  } finally {
    await session.close(); // Ensure the session is closed
  }
};

const getAllBycustomerId = async (customer) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `MATCH (c:Customer{name:$customer})-[:HAS_CUSTOMER]->(p) RETURN {
        uuid:p.uuid,
        businessKey:p.businessKey,
        nama:p.nama,
        customer:c.name,
        status:s.status
      }as result`,
      {
        customer,
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

const getProjek = async (uuid) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `MATCH (p:Projek {uuid: $uuid}) RETURN {
        uuid:p.uuid,
        businessKey:p.businessKey,
        nama:p.nama,
        customer:c.name,
        status:s.status
      }as result`,
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

const UpdatedProjek = async (uuid, data, username) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `MATCH (u:User {username: $username})
      MATCH (p:Projek {uuid: $uuid}) SET p+=$data, p.modifiedAt=timestamp(),p.modifiedBy=u.username
      RETURN case when p is not null then {code: 0, status: true, message: 'Object Successful Updated'}  \
    else {code: -1, status: false, message: 'Nothing object found'} end as result`,
      {
        uuid,
        data,
        username,
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

const deleteProject = async (uuid) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `MATCH (p:Projek {uuid: $uuid}) DETACH DELETE p
      RETURN CASE WHEN p IS NOT NULL THEN {code: 0, status: true, message: 'Object Successful Deleted'}  
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
  createProjek,
  getAllBycustomerId,
  getProjek,
  UpdatedProjek,
  deleteProject,
};
