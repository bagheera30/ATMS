const db = require("../db/db");
const { search } = require("./workgroup.controlle");
const neo = db.getInstance();

const upsertWorkgroup = async (uuid, username, name, status) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `MERGE (wg:Workgroup {uuid: $uuid})
       ON CREATE SET 
           wg.uuid = randomUUID(),
           wg.name = $name,
           wg.createdAt = timestamp(),
           wg.createdBy = $username
       ON MATCH SET 
           wg.name = $name,
           wg.modifiedAt = timestamp(),
           wg.modifiedBy = $username
       
       MERGE (wg)-[r:HAS_STATUS]->(st:Status)
       ON CREATE SET
           st.status = $status,
           st.createdAt = timestamp()
       ON MATCH SET
           st.status=$status,
           st.modifiedAt = timestamp()
       RETURN {
           name: wg.name,
           status: st.status
       } as result`,
      {
        uuid: uuid || "",
        name,
        username,
        status: status || "inactive",
      }
    );
    return result.records.map((record) => record.get("result"));
  } finally {
    await session.close();
  }
};

const getWorkgroup = async (uuid) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `MATCH (n:Workgroup {name: $uuid}) RETURN {
        uuid: n.uuid,
        name: n.name,
        status: [(n)-[:HAS_STATUS]->(s:Status)|s.status][0]
        } as result`,
      { uuid }
    );
    return result.records.map((record) => record.get("result"));
  } catch (error) {
    console.error("Error executing query:", error);
    throw new Error(`Database query failed: ${error.message}`);
  } finally {
    await session.close();
  }
};

const getmanager = async (search) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `
      MATCH (wg:Workgroup)-[:HAS_WORKGROUP]->(u:User)where LOWER(wg.name)CONTAINS $search
      MATCH (u)-[:HAS_ROLE]->(r:Role) where r.RoleName='manager'
      RETURN{
      group_name:wg.name,
      email: u.email
      }as result
      `,
      { search }
    );
    return result.records[0].get("result");
  } catch (error) {
    console.error("Error executing query:", error);
    throw new Error(`Database query failed: ${error.message}`);
  } finally {
    await session.close();
  }
};
const getAll = async (search) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `MATCH (n:Workgroup)where LOWER(n.name) CONTAINS $search
      RETURN {
        uuid: n.uuid,
        name: n.name,
        status: [(n)-[:HAS_STATUS]->(s:Status)|s.status][0]
        } as result`,
      {
        search,
      }
    );
    console.log(result.records.map((record) => record.get("result")));
    return result.records.map((record) => record.get("result"));
  } catch (error) {
    console.error("Error executing query:", error);
    throw new Error(`Database query failed: ${error.message}`);
  } finally {
    await session.close();
  }
};

const getallwg = async () => {
  const session = neo.session();
  try {
    console.log("getallwg");
    const result = await session.run(
      `MATCH (n:Workgroup)
      OPTIONAL MATCH (n)-[r:HAS_WORKGROUP]->(u:User)
      OPTIONAL MATCH (n)-[:HAS_STATUS]->(s:Status)
      WITH n, count(DISTINCT r) as memberCount, collect(s.status)[0] as status
      RETURN {
        uuid: n.uuid,
        name: n.name,
        member: memberCount,
        status: status
      } as result`
    );

    return result.records.map((record) => {
      const result = record.get("result");

      // Konversi manual dari Neo4j Integer ke Number
      if (result.member && typeof result.member.toNumber === "function") {
        result.member = result.member.toNumber();
      }

      return result;
    });
  } catch (error) {
    console.error("Error executing query:", error);
    throw new Error(`Database query failed: ${error.message}`);
  } finally {
    await session.close();
  }
};

const searchWorkgroup = async (search) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `MATCH (n:Workgroup)where n.uuid= $search
      RETURN {
        user: [(n)-[:HAS_WORKGROUP]->(u:User)|u.username],
        name: n.name,
        status: [(n)-[:HAS_STATUS]->(s:Status)|s.status][0]
        } as result`,
      { search }
    );
    return result.records.length > 0 ? result.records[0].get("result") : null;
  } catch (error) {
    console.error("Error executing query:", error);
    throw new Error(`Database query failed: ${error.message}`);
  } finally {
    await session.close();
  }
};
const deleteWorkgroup = async (uuid) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `MATCH (n:Workgroup {uuid: $uuid})
OPTIONAL MATCH (n)-[userRel:HAS_WORKGROUP]->(u:User)
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
// Delete any nodes that were connected (except Users which we checked earlier)
FOREACH (node IN CASE WHEN action = "Delete" THEN [x IN allNodes WHERE NOT x:User] ELSE [] END |
    DELETE node
)
FOREACH (ignore IN CASE WHEN action = "Delete" THEN [1] ELSE [] END |
    DELETE n
)
RETURN 
    CASE 
        WHEN action = "Delete" THEN "Success" 
        ELSE "Failed: Workgroup has users" 
    END AS response`,
      { uuid }
    );
    console.log(result.records[0].get("response"));
    return result.records.length > 0
      ? result.records[0].get("response")
      : { code: -1, status: false, message: "Unexpected error" };
  } finally {
    await session.close();
  }
};

const addmember = async (username, uuid) => {
  const session = neo.session();
  const result = await session.run(
    `MATCH (n:Workgroup) where n.uuid= $uuid
    MATCH (u:User)where u.uuid= $username
    MERGE (n)-[:HAS_WORKGROUP]->(u)
    RETURN {
      name_group: n.name,
      user: u.namaLengkap
      } as result`,
    { uuid, username }
  );
  return result.records.length > 0 ? result.records[0].get("result") : null;
};
const removemember = async (username, uuid) => {
  const session = neo.session();
  const result = await session.run(
    `MATCH (n:Workgroup) where n.uuid= $uuid
    MATCH (u:User)where u.uuid= $username
      MATCH (n)-[r:HAS_WORKGROUP]->(u)
    DELETE r
    RETURN {
      name_group: n.name,
      user: u.namaLengkap
      } as result`,
    { uuid, username }
  );
  return result.records.length > 0 ? result.records[0].get("result") : null;
};
module.exports = {
  upsertWorkgroup,
  getAll,
  searchWorkgroup,
  deleteWorkgroup,
  addmember,
  getmanager,
  getallwg,
  removemember,
};
