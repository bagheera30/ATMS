const db = require("../db/db");
const neo = db.getInstance();

const upsertWorkgroup = async (uuid, username, data) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `MERGE (wg:Workgroup {uuid: $uuid})
       ON CREATE SET 
           wg.uuid = randomUUID(),
           wg.name = $data.name,
           wg.createdAt = timestamp(),
           wg.createdBy = $username
       ON MATCH SET 
           wg.name = $data.name,
           wg.modifiedAt = timestamp(),
           wg.modifiedBy = $username

       MERGE (wg)-[r:HAS_STATUS]->(st:Status)
       ON CREATE SET
           st.status = "inactive",
           st.createdAt = timestamp()
       ON MATCH SET
           st.status = $data.status,
           st.modifiedAt = timestamp()

       FOREACH (ignore IN CASE WHEN $data.uuid IS NOT NULL THEN [1] ELSE [] END |
           MERGE (user:User {uuid: $data.uuid})
           MERGE (wg)-[:HAS_WORKGROUP]->(user)
       )

       FOREACH (ignore IN CASE WHEN $data.businessKey IS NOT NULL THEN [1] ELSE [] END |
           MERGE (project:Projek {businessKey: $data.businessKey})
           MERGE (wg)-[:HAS_PROJECT]->(project)
       )
       RETURN {
           name: wg.name,
           status: st.status
       } AS result`,
      {
        uuid: uuid || "",
        username,
        data,
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
      `MATCH (n:Workgroup {uuid: $uuid}) 
       RETURN {
           uuid: n.uuid,
           name: n.name,
           project: [(p:Projek)-[:HAS_WORKGROUP]->(n)|p.nama][0],
           customer:[(c:Customer)-[:HAS_CUSTOMER]->(p)|c.name][0],
           user: [(n)-[:HAS_WORKGROUP]->(us:User)|{username: us.username, id: us.uuid, role: [(us)-[:HAS_ROLE]->(r:Role)|r.RoleName][0]}],
           status: [(n)-[:HAS_STATUS]->(s:Status)|s.status][0]
       } AS result`,
      { uuid }
    );
    return result.records[0]?.get("result");
  } catch (error) {
    console.error("Error executing query:", error);
    throw new Error(`Database query failed: ${error.message}`);
  } finally {
    await session.close();
  }
};

const getManager = async (search) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `MATCH (wg:Workgroup)-[:HAS_WORKGROUP]->(u:User)
       WHERE LOWER(wg.name) CONTAINS $search
       MATCH (u)-[:HAS_ROLE]->(r:Role) 
       WHERE r.RoleName = 'manager'
       RETURN {
           group_name: wg.name,
           email: u.email
       } AS result`,
      { search: search.toLowerCase() }
    );
    return result.records[0]?.get("result") || null;
  } catch (error) {
    console.error("Error executing query:", error);
    throw new Error(`Database query failed: ${error.message}`);
  } finally {
    await session.close();
  }
};

const getAllWorkgroups = async (search) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `MATCH (n:Workgroup)
       WHERE LOWER(n.name) CONTAINS $search
       RETURN {
           uuid: n.uuid,
           name: n.name,
           user: [(n)-[:HAS_WORKGROUP]->(us:User)|us.username],
           status: [(n)-[:HAS_STATUS]->(s:Status)|s.status][0]
       } AS result`,
      { search: search.toLowerCase() }
    );
    return result.records.map((record) => record.get("result"));
  } catch (error) {
    console.error("Error executing query:", error);
    throw new Error(`Database query failed: ${error.message}`);
  } finally {
    await session.close();
  }
};
const getAllWorkgroupsWithMembersAdmin = async () => {
  const session = neo.session();
  try {
    const result = await session.run(
      `MATCH (n:Workgroup)
       OPTIONAL MATCH (n)-[r:HAS_WORKGROUP]->(u2:User)
       OPTIONAL MATCH (p:Projek)-[:HAS_WORKGROUP]->(n)
       OPTIONAL MATCH (n)-[:HAS_STATUS]->(s:Status)
       WITH n, count(DISTINCT r) AS memberCount, collect(s.status)[0] AS status
       RETURN {
           uuid: n.uuid,
           name: n.name,
           projek: [(p:Projek)-[:HAS_WORKGROUP]->(n)|{name: p.nama, businessKey: p.businessKey}][0],
           customer:[(c:Customer)-[:HAS_CUSTOMER]->(p)|c.name][0],
           member: memberCount,
           status: status
       } AS result`
    );

    return result.records.map((record) => {
      const result = record.get("result");
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
const getAllWorkgroupsWithMembers = async (username) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `MATCH (n:Workgroup)-[:HAS_WORKGROUP]->(u:User) where u.username = $username
       OPTIONAL MATCH (n)-[r:HAS_WORKGROUP]->(u2:User)
       OPTIONAL MATCH (p:Projek)-[:HAS_WORKGROUP]->(n)
       OPTIONAL MATCH (n)-[:HAS_STATUS]->(s:Status)
       WITH n, count(DISTINCT r) AS memberCount, collect(s.status)[0] AS status
       RETURN {
           uuid: n.uuid,
           name: n.name,
           projek: [(p:Projek)-[:HAS_WORKGROUP]->(n)|{name: p.nama, businessKey: p.businessKey}][0],
           customer:[(c:Customer)-[:HAS_CUSTOMER]->(p)|c.name][0],
           member: memberCount,
           status: status
       } AS result`,
      {
        username,
      }
    );

    return result.records.map((record) => {
      const result = record.get("result");
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
      `MATCH (n:Workgroup)
       WHERE n.uuid = $search
       RETURN {
           user: [(n)-[:HAS_WORKGROUP]->(u:User)|{username: u.username, id: u.uuid}],
           name: n.name,
           status: [(n)-[:HAS_STATUS]->(s:Status)|s.status][0]
       } AS result`,
      { search }
    );
    return result.records[0]?.get("result") || null;
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
CALL {
    WITH n, userCount
    RETURN 
        CASE 
            WHEN userCount = 0 THEN "Delete"
            ELSE "Keep"
        END AS action
}
WITH n, action
WHERE action = "Delete" OR action = "Keep"
FOREACH (ignore IN CASE WHEN action = "Delete" THEN [1] ELSE [] END |
    DETACH DELETE n
)
RETURN 
    CASE 
        WHEN action = "Delete" THEN "Success" 
        ELSE "Failed: Workgroup has users" 
    END AS response`,
      { uuid }
    );
    return (
      result.records[0]?.get("response") || {
        code: -1,
        status: false,
        message: "Unexpected error",
      }
    );
  } finally {
    await session.close();
  }
};

const addMember = async (username, uuid) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `MATCH (n:Workgroup {uuid: $uuid})
       MATCH (u:User {uuid: $username})
       MERGE (n)-[:HAS_WORKGROUP]->(u)
       RETURN {
           name_group: n.name,
           user: u.namaLengkap
       } AS result`,
      { uuid, username }
    );
    return result.records[0]?.get("result") || null;
  } finally {
    await session.close();
  }
};

const removeMember = async (username, uuid) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `MATCH (n:Workgroup {uuid: $uuid})
       MATCH (u:User {uuid: $username})
       MATCH (n)-[r:HAS_WORKGROUP]->(u)
       DELETE r
       RETURN {
           name_group: n.name,
           user: u.namaLengkap
       } AS result`,
      { uuid, username }
    );
    return result.records[0]?.get("result") || null;
  } finally {
    await session.close();
  }
};

module.exports = {
  upsertWorkgroup,
  getWorkgroup,
  getManager,
  getAllWorkgroups,
  getAllWorkgroupsWithMembers,
  searchWorkgroup,
  deleteWorkgroup,
  addMember,
  removeMember,
  getAllWorkgroupsWithMembersAdmin,
};
