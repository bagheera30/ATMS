const db = require("../db/db");

const neo = db.getInstance();

const upsert = async (data, uuid, username) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `MATCH(p:Projek{businessKey:$businessKey})
        MERGE (n:Atribut {uuid: $uuid})
            ON CREATE SET
                n.uuid = randomUUID(),
                n.value = $value,
                n.task_name = $task,
                n.name = $name,
                n.createdAt = timestamp(),
                n.createdBy = $username
            ON MATCH SET
                n.task = $task,
                n.modifiedAt = timestamp(),
                n.modifiedBy = $username
            MERGE (n)-[:HAS_ATRIBUTE]->(p)
            RETURN {
                task: n.task,
                projek:p.businessKey
            } as result`,
      {
        uuid: uuid || "",
        task: data.task || "",
        name: data.name || "",
        value: data.value || "",
        username,
      }
    );
    return result.records.length > 0 ? result.records[0].get("result") : null;
  } finally {
    await session.close();
  }
};

const upsertComment = async (uuid, username, taskname, businesskey, data) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `MATCH(u:User)where u.uuid = $data.userid
      MATCH(p:Projek) where p.businessKey = $businesskey
      MERGE(c:Comment{uuid:$uuid})
            ON CREATE SET
                c.uuid = randomUUID(),
                c.deskripsi = $data.deskripsi,
                c.user=u.username,
                c.task_name=$taskname,
                c.createdBy = $username,
                c.createdAt = timestamp()
            ON MATCH SET
                c.deskripsi = $data.deskripsi,
                c.user=u.username,
                c.task_name=$taskname,
                c.modifiedAt = timestamp(),
                c.modifiedBy = $username
      MERGE (c)-[:HAS_COMMENT]->(u)
      MERGE (c)-[:HAS_COMMENT]->(p)
            RETURN {
            username:u.username
            } as result`,
      {
        uuid,
        businesskey,
        taskname,
        data,
        username,
      }
    );
    return result.records.length > 0 ? result.records[0].get("result") : null;
  } finally {
    await session.close();
  }
};

const getcommen = async (taskname) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `match(c:Comment)-[:HAS_COMMENT]->(u:Projek)where u.businessKey = $taskname
      return{
        deskripsi: c.deskripsi,
        username:c.createdBy
      } as result`,
      {
        taskname,
      }
    );
    return result.records.length > 0
      ? result.records.map((record) => record.get("result"))
      : null;
  } finally {
    await session.close();
  }
};

module.exports = { upsert, getcommen, upsertComment };
