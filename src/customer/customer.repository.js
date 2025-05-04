const db = require("../db/db");
const neo = db.getInstance();

const cretaecustomer = async (data, username) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `
      CREATE (c:Customer {
    uuid: randomUUID(),
    name: $name,
    address: $address,
    city: $city,
    country: $country,
    createdBy: $username,
    createAt: timestamp(),
    modifiedBy: "",
    modifiedAt: ""
})

CREATE (s:Status {
    uuid: randomUUID(),
    status: "locked",
    createdBy: $username,
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
const getAll = async (search) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `MATCH (c:Customer)where LOWER (c.name)+LOWER(c.address) CONTAINS $search  RETURN {
        uuid:c.uuid,
        name:c.name,
        address:c.address,
        city:c.city,
        country:c.country,
        status: [(c)-[:HAS_STATUS]->(s:Status)|s.status][0]
      }as result`,
      {
        search,
      }
    );

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
const deleteCustomer = async (search) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `MATCH (c:Customer)-[r]->(s)
      WHERE toLower(c.name) CONTAINS $search
      DELETE c, r, s
      RETURN {
      code: 0,
      status: true,
      message: 'Object Successful Deleted'
      } AS result
      UNION ALL
      RETURN {
      code: -1,
      status: false,
      message: 'Nothing object found'
      } AS result
      LIMIT 1 `,
      {
        search,
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
