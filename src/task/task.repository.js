const db = require("../db/db");

const neo = db.getInstance();

const upsert = async (data, username) => {
    const session = neo.session();
    try {
        const result = await session.run(
            `MERGE (n:Task {uuid: $uuid})
            ON CREATE SET
                n.uuid = randomUUID(),
                n.createdAt = timestamp(),
                n.createdBy = $username
            ON MATCH SET
                n.task = $task,
                n.modifiedAt = timestamp(),
                n.modifiedBy = $username
            RETURN {
                task: n.task
            } as result`,
            {
                uuid: uuid || "",
                task: task || "",
                username,
            }
        );
        return result.records.length > 0 ? result.records[0].get("result") : null;
    } finally {
        await session.close();
    }
};

module.exports = { upsert };