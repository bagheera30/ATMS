const db = require("../db/db");
const neo = db.getInstance();

const getAtribut = async (id) => {
  const session = neo.session();
  try {
    const result = await session.run(
      `MATCH (a:Atribut)where a.uuid= $id RETURN {
      value:a.value
      } as result`,
      { id }
    );
    return result.records.length > 0 ? result.records[0].get("result") : null;
  } catch (error) {
    console.error("Error executing query:", error);
    throw new Error(`Database query failed: ${error.message}`);
  } finally {
    await session.close(); // Ensure the session is closed
  }
};

module.exports = { getAtribut };
