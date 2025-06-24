const db = require("../db/db");

const neo = db.getInstance();

const upsertatribut = async (
  data,
  uuid,
  value,
  taskname,
  username,
  businessKey
) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `
      MATCH (p:Projek) WHERE p.businessKey=$businessKey
      MERGE (n:Atribut{uuid:$uuid})
      ON CREATE SET
          n.uuid=randomUUID(),
          n.name=$data.name,
          n.value=$value,
          n.taskname=$taskname,
          n.createdAt=timestamp(),
          n.createdBy=$username
      ON MATCH SET
          n.name=$data.name,
          n.value=$value,
          n.taskname=$taskname,
          n.modifiedAt=timestamp(),
          n.modifiedBy=$username
      MERGE (n)-[:HAS_ATRIBUTE]->(p)
      RETURN {
          task:n.task,
          projek:p.businessKey
      } AS result`,
      {
        uuid: uuid || "",
        data: data || {}, // Ensure data is an object
        value: value || null,
        username: username || "anonymous", // Provide default if username is not provided
        taskname: taskname || null,
        businessKey: businessKey || null,
      }
    );
    return result.records.map((record) => record.get("result"));
  } catch (error) {
    console.error("Error executing query:", error);
    throw new Error(`Database query failed: ${error.message}`);
  } finally {
    await session.close();
  }
};

module.exports = { upsertatribut };
