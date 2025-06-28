const db = require("../db/db");

const neo = db.getInstance();

const upsertWorkgroup = async (uuid, username, name, status) => {
  const session = neo.session();
  try {
    const result = await session.run(
      ` MERGE (n:Role {uuid: $uuid})
       ON CREATE SET
           n.uuid = randomUUID(),
           n.RoleName = $name,
           n.createdAt = timestamp(),
           n.createdBy = $username
       ON MATCH SET
           n.RoleName = $name,
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
           name: n.RoleName,
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
const getAll = async () => {
  const session = neo.session();
  const result = await session.run(`MATCH (n:Role)
OPTIONAL MATCH (u:User)-[r:HAS_ROLE]->(n)
OPTIONAL MATCH (n)-[:HAS_STATUS]->(s:Status)
WITH n, count(DISTINCT r) AS userCount, s.status AS status
RETURN {
  uuid: n.uuid,
  name: n.RoleName,
  member: userCount,
  status: status
} AS result
`);

  return result.records.map((record) => record.get("result"));
};
const searchWorkgroup = async (search) => {
  const session = neo.session();
  const result = await session.run(
    `MATCH (n:Role)where LOWER (n.RoleName) CONTAINS $search
    RETURN {
      userName: [(u:User)-[:HAS_ROLE]->(n)|u.username],
      email: [(u:User)-[:HAS_ROLE]->(n)|u.email],
      name: n.RoleName,
      status: [(n)-[:HAS_STATUS]->(s:Status)|s.status][0]
      } as result`,
    { search }
  );
  return result.records.length > 0 ? result.records[0].get("result") : null;
};
const deleteWorkgroup = async (uuid) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `MATCH (n:Role )where n.uuid=$uuid
OPTIONAL MATCH (u:User)-[userRel:HAS_ROLE]->(n)
WITH n, count(userRel) AS userCount
// Find all relationships from the Workgroup (not just HAS_WORKGROUP)
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

const addmember = async (username, RoleName) => {
  const session = neo.session();
  const result = await session.run(
    `MATCH (n:Role) where LOWER (n.RoleName) CONTAINS $RoleName
    MATCH (u:User)where u.uuid CONTAINS $username
    MERGE (u)-[:HAS_ROLE]->(n)
    RETURN {
      name_Role: n.RoleName,
      user: u.namaLengkap
      } as result`,
    { RoleName, username }
  );
  console.log(result.records[0].get("result"));
  return result.records.length > 0 ? result.records[0].get("result") : null;
};
const removemember = async (username, uuid) => {
  const session = neo.session();
  console.log(username, uuid);
  const result = await session.run(
    `MATCH (n:Role) where LOWER (n.RoleName) CONTAINS $uuid
    MATCH (u:User)where u.uuid CONTAINS $username
      match (u)-[r:HAS_ROLE]->(n)
      delete r
    RETURN {
      Name_Role: n.RoleName,
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
  removemember,
};
