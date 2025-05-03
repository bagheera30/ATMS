const db = require("../db/db");
const neo = db.getInstance();

const cretaecustomer = async (data, username) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `MATCH (u:User { username: $username })
      CREATE (c:Customer {
    uuid: apoc.create.uuid(),
    name: $name,
    address: $address,
    city: $city,
    country: $country,
    createdBy: u.username,
    createAt: timestamp(),
    modifiedBy: "",
    modifiedAt: ""
})

CREATE (s:Status {
    uuid: apoc.create.uuid(),
    status: "locked",
    createdBy: u.username,
    createAt: timestamp(),
    modifiedBy: "",
    modifiedAt: ""
})

CREATE (c)-[:HAS_STATUS]->(s)

RETURN { code: 0, status: true, message: 'create user success' } AS result`,
      {
        name: data.name,
        city: data.city,
        country: data.country,
        username,
        address: data.address,
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
const getAll = async () => {
  const session = neo.session();
  try {
    const result = await session.run(`MATCH (c:Customer) RETURN {
        uuid:c.uuid,
        name:c.name,
        address:c.address,
        city:c.city,
        country:c.country,
        status:[(c)-[:HAS_STATUS]->(s:Status)|s.status][0]
      }as result`);

    return result.records.length > 0
      ? result.records.map((record) => record.get("result"))
      : null;
  } catch (error) {
    console.error("Error executing query:", error);
    throw new Error(`Database query failed: ${error.message}`);
  } finally {
    await session.close(); // Ensure the session is closed
  }
};
const getByid = async (uiid) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `MATCH (c:Customer {uuid: $uuid}) -[HAS_STATUS]->(s:Status) RETURN {
        uuid:c.uuid,
        name:c.name,
        address:c.address,
        city:c.city,
        country:c.country,
        status:[(c)-[HAS_STATUS]->(s:Status)|s.status][0]
      }as result`,
      {
        uuid: uiid,
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
const updateCustomer = async (uuid, data, username) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `MATCH (u:User {username: $username})
      MATCH (c:Customer {uuid: $uuid}) 
      SET c+=$data,
      c.modifiedAt=timestamp(),
      c.modifiedBy=u.username 
      RETURN case when c is not null then {code: 0, status: true, message: 'Object Successful Updated'}  \
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
const deleteCustomer = async (uuid) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `MATCH (c:Customer {uuid: $uuid})-[r]->(s) DETACH DELETE c, r, s 
      RETURN CASE WHEN c IS NOT NULL THEN {code: 0, status: true, message: 'Object Successful Deleted'}  
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
  cretaecustomer,
  getAll,
  getByid,
  updateCustomer,
  deleteCustomer,
};
