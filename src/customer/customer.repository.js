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
    category: $category,
    createdBy: $username,
    createAt: timestamp(),
    modifiedBy: "",
    modifiedAt: ""
})

CREATE (s:Status {
    uuid: randomUUID(),
    status: "inactive",
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
        category: data.category,
        address: data.address,
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
const getAll = async () => {
  const session = neo.session();
  try {
    const result = await session.run(
      `MATCH (c:Customer)RETURN {
        id:c.uuid,
        name:c.name,
        address:c.address,
        city:c.city,
        country:c.country,
        category:c.category,
        status: [(c)-[:HAS_STATUS]->(s:Status)|s.status][0]
      }as result`
    );

    return result.records.length > 0
      ? result.records.map((record) => record.get("result"))
      : null;
  } catch (error) {
    console.error("Error executing query:", error);
    throw new Error(`Database query failed: ${error.message}`);
  } finally {
    await session.close();
  }
};
const getByid = async (uiid) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `MATCH (c:Customer)where c.uuid=$uuid RETURN {
        uuid:c.uuid,
        name:c.name,
        address:c.address,
        city:c.city,
        country:c.country,
        category:c.category,
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
    await session.close();
  }
};
const updateCustomer = async (uuid, data, username) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `
     MATCH (c:Customer {uuid: $uuid})-[rel:HAS_STATUS]->(s:Status)
    FOREACH (ignoreMe IN CASE WHEN 'status' IN keys($data) THEN [1] ELSE [] END | 
      SET s.status = $data.status,
      s.modifiedAt = timestamp(),
      s.modifiedBy = $username
    )
    FOREACH (key IN [k IN keys($data) WHERE k <> 'status'] | 
      SET c[key] = $data[key]
    )
    SET c.modifiedAt = timestamp(),
        c.modifiedBy = $username
    RETURN CASE WHEN c IS NOT NULL 
      THEN {code: 0, status: true, message: 'Object Successfully Updated'}  
      ELSE {code: -1, status: false, message: 'No object found'} 
    END as result`,
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
    await session.close();
  }
};
const deleteCustomer = async (search) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `MATCH (n:Customer)where n.uuid = $search
OPTIONAL MATCH (n)-[userRel:HAS_Customer]->(u:Project)
WITH n, count(userRel) AS userCount
OPTIONAL MATCH (n)-[r]->(any)
WITH n, userCount, collect(r) AS allRels, collect(any) AS allNodes
CALL {
    WITH n, userCount
    RETURN 
        CASE 
            WHEN userCount = 0 THEN "Delete"
            ELSE "Keep"
        END AS action
}
WITH n, userCount, allRels, allNodes, action
WHERE (action = "Delete" AND userCount = 0) OR action = "Keep"
FOREACH (rel IN CASE WHEN action = "Delete" THEN allRels ELSE [] END |
    DELETE rel
)
FOREACH (node IN CASE WHEN action = "Delete" THEN [x IN allNodes WHERE NOT x:User] ELSE [] END |
    DELETE node
)
FOREACH (ignore IN CASE WHEN action = "Delete" THEN [1] ELSE [] END |
    DELETE n
)
RETURN 
    CASE 
        WHEN action = "Delete" THEN "Success" 
        ELSE "Failed: Customer has projects" 
    END AS response`,
      {
        search,
      }
    );
    return result.records.length > 0 ? result.records[0].get("response") : null;
  } catch (error) {
    console.error("Error executing query:", error);
    throw new Error(`Database query failed: ${error.message}`);
  } finally {
    await session.close();
  }
};

module.exports = {
  createCustomer: cretaecustomer,
  getAll,
  getByid,
  updateCustomer,
  deleteCustomer,
};
