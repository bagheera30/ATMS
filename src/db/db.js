const neo4j = require("neo4j-driver");
const dotenv = require("dotenv");
dotenv.config();

class Neo4jDB {

  static instance;

  static getInstance() {
    if (!this.instance) {
      const uri = process.env.NEO4J_URI;
      const user = process.env.NEO4J_USERNAME;
      const password = process.env.NEO4J_PASSWORD;

      this.instance = neo4j.driver(uri, neo4j.auth.basic(user, password));
    }
    return this.instance;
  }
}

module.exports = Neo4jDB;
