const db = require("../db/db");
const neo = db.getInstance();

const updsert = async (uuid, data, username) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `MERGE (n:Vendor {uuid: $uuid})
       ON CREATE SET
           n.uuid = randomUUID(),
           n.name = $data.name,
           n.address = $data.address,
           n.city = $data.city,
           n.country = $data.country,
           n.createdAt = timestamp(),
           n.createdBy = $username
       ON MATCH SET
           n.name = $data.name,
           n.address = $data.address,
           n.city = $data.city,
           n.country = $data.country,
           n.updatedAt = timestamp(),
           n.updatedBy = $username
       MERGE (n)-[r:HAS_STATUS]->(st:Status)
       ON CREATE SET
           st.status = $status,
           st.createdAt = timestamp()
       ON MATCH SET
           st.status=$status,
           st.modifiedAt = timestamp()
       RETURN {
           name: n.name,
           status: st.status
       } as result`,
      {
        uuid,
        data,
        username,
        status: data.status || "inactive",
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
const getallVendor = async () => {
  const session = neo.session();
  try {
    const result = await session.run(`MATCH (n:Vendor)
    RETURN {
      uuid: n.uuid,
      name: n.name,
      address: n.address,
      city: n.city,
      country: n.country,
      status: [(n)-[:HAS_STATUS]->(s:Status)|s.status][0]
      } as result`);
    return result.records.map((record) => record.get("result"));
  } catch (error) {
    console.error("Error executing query:", error);
    throw new Error(`Database query failed: ${error.message}`);
  } finally {
    await session.close();
  }
};
const getByIdvendor = async (id) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `MATCH (n:Vendor {uuid: $id})
        RETURN {
            uuid: n.uuid,
            name: n.name,
            address: n.address,
            city: n.city,
            country: n.country,
            status: [(n)-[:HAS_STATUS]->(s:Status)|s.status][0]
            } as result`,
      { id }
    );
    return result.records.map((record) => record.get("result"));
  } catch (error) {
    console.error("Error executing query:", error);
    throw new Error(`Database query failed: ${error.message}`);
  } finally {
    await session.close();
  }
};
const deleteVendor = async (uuid) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `MATCH (n:Vendor {uuid: $uuid})
          DETACH DELETE n`,
      { uuid }
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
  updsert,
  getallVendor,
  getByIdvendor,
  deleteVendor,
};
