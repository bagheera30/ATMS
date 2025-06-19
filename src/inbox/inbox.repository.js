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
            MATCH (p:Projek) where p.businessKey=businessKey
            MARGE(n:Atribut{uuid:$uuid})
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
            MERGE(n)-[:HAS_ATRIBUTE]->(p)
            RETURN{
                task:n.task,
                projek:p.businessKey
            }as result`,
      {
        uuid: uuid || "",
        data,
        value,
        username,
        taskname,
        businessKey,
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
