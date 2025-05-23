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

const command = async (uuid, data) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `MERGE(c:Comment{uuid:$uuid})
            ON CREATE SET
                c.uuid = randomUUID(),
                c.deskripsi = $data.deskripsi,
                c.user:$data.username,
                c.task_name:$data.task_name,
                c.createdBy = $data.username,
                c.createdAt = timestamp()
            ON MATCH SET
                c.deskripsi = $data.deskripsi,
                c.user:$data.username,
                c.task_name:$data.task_name,
                c.modifiedAt = timestamp(),
                c.modifiedBy = $data.username
            RETURN {
                code: 0, status: true, message: 'create user success' 
            } as result`,
      {
        uuid,
        data,
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
      `match(c:Comment{task_name:$taskname})return{deskripsi:c.deskripsi,user:[(c)-[:HAS_USER]->(u:User)|u.namaLengkap]} as result`,
      {
        taskname,
      }
    );
    return result.records.length > 0 ? result.records[0].get("result") : null;
  } finally {
    await session.close();
  }
};

module.exports = { upsert, command, getcommen };
