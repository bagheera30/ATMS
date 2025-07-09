const db = require("../db/db");
const neo = db.getInstance();

const upsert = async (data, customer, username) => {
  const session = neo.session();

  try {
    const result = await session.run(
      `MATCH (c:Customer { uuid: $customer })
MERGE (p:Projek { businessKey: $businessKey })
ON CREATE SET 
    p.businessKey = $businessKey,
    p.nama = $namaProjek,
    p.customer = c.name,
    p.createdBy = $createdBy,
    p.createAt = timestamp(),
    p.modifiedBy = "",
    p.modifiedAt = timestamp()
ON MATCH SET
    p.businessKey = $businessKey,
    p.nama = $namaProjek,
    p.modifiedBy = $createdBy,
    p.modifiedAt = timestamp()
  MERGE (p)-[r:HAS_STATUS]->(s:Status)
  ON CREATE SET
      s.status = $status,
      s.createdAt = timestamp()
  ON MATCH SET
      s.status=$status,
      s.modifiedAt = timestamp()
MERGE (c)-[:HAS_CUSTOMER]->(p)
RETURN { code: 0, status: true, message: 'upsert projek success' } AS result`,
      {
        customer,
        businessKey: data.businesskey,
        namaProjek: data.name,
        customer: data.customer,
        createdBy: username,
        status: data.status || "active",
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

const getbycreatedBy = async (createdBy) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `MATCH (p:Projek {createdBy: $createdBy}) RETURN {
        businessKey:p.businessKey,
        nama:p.nama,
        customer:[(c:Customer)-[:HAS_CUSTOMER]->(p)|c.name][0],
        status:[(p)-[:HAS_STATUS]->(s:Status)|s.status][0]
      }as result`,
      {
        createdBy,
      }
    );
    return result.records.map((record) => record.get("result"));
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
    const result = await session.run(
      `MATCH (p:Projek) RETURN {
        businessKey:p.businessKey,
        nama:p.nama,
        customer:[(c:Customer)-[:HAS_CUSTOMER]->(p)|c.name][0],
        status:[(p)-[:HAS_STATUS]->(s:Status)|s.status][0]
      }as result`
    );
    return result.records.map((record) => record.get("result"));
  } catch (error) {
    console.error("Error executing query:", error);
    throw new Error(`Database query failed: ${error.message}`);
  } finally {
    await session.close(); // Ensure the session is closed
  }
};
const getAllProjek = async (search) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `MATCH (p:Projek) where (p.businessKey)+(p.nama) CONTAINS $search
      RETURN{
      name:p.nama,
      businessKey:p.businessKey,
      customer:[(c:Customer)-[:HAS_CUSTOMER]->(p)|c.name][0],
      status:[(p)-[:HAS_STATUS]->(s:Status)|s.status][0]
    }as result`,
      {
        search,
      }
    );
    return result.records.map((record) => record.get("result"));
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
      `MATCH (c:Customer{name:$customer})-[:HAS_CUSTOMER]->(p:Projek) RETURN {
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
      `MATCH (p:Projek {businessKey: $uuid})
OPTIONAL MATCH (c:Customer)-[:HAS_CUSTOMER]->(p)
OPTIONAL MATCH (p)-[:HAS_STATUS]->(s:Status)
WITH p, 
     collect(DISTINCT c.name) AS customerNames, 
     collect(DISTINCT s.status) AS statuses
RETURN {
    task:[(a:Atribut)-[:HAS_ATRIBUTE]->(p) | {id: a.uuid, taskname: a.taskname, value: a.value}],
    businessKey: p.businessKey,
    nama: p.nama,
    customer: customerNames[0],
    status: statuses[0]          
} AS result`,
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

const getfile = (uuid) => {
  const session = neo.session();
  try {
    const result = session.run(
      `match(a:Atribut)where a.uuid=$uuid return a as result`,
      {
        uuid,
      }
    );
    return result.records.length > 0 ? result.records[0].get("result") : null;
  } catch (error) {
    console.error("Error executing query:", error);
    throw new Error(`Database query failed: ${error.message}`);
  } finally {
    session.close(); // Ensure the session is closed
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
  upsert,
  getAllBycustomerId,
  getProjek,
  getAll,
  getAllProjek,
  deleteProject,
  getfile,
  getbycreatedBy,
};
