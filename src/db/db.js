const neo4j = require("neo4j-driver");

class Neo4jDB {
  constructor() {}

  static instance;

  static getInstance() {
    if (!this.instance) {
      const uri = Bun.env.URL_NEO4J;
      const user = Bun.env.USERNAME_NEO4J;
      const password = Bun.env.PASSWORD_NEO4J;

      this.instance = neo4j.driver(uri, neo4j.auth.basic(user, password));
    }
    return this.instance;
  }
}

module.exports = Neo4jDB;
