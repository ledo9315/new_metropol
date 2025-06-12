// db/database.js
import { DB } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";
import { config } from "../config/config.js";
import { sanitizer } from "../utils/sanitizer.js";

class SecureDatabase {
  constructor() {
    this.db = new DB(config.DATABASE_URL);
    this.setupPragmas();
  }

  setupPragmas() {
    this.db.query("PRAGMA foreign_keys = ON");
    this.db.query("PRAGMA journal_mode = WAL");
    this.db.query("PRAGMA synchronous = NORMAL");
    this.db.query("PRAGMA temp_store = MEMORY");
    this.db.query("PRAGMA mmap_size = 268435456");
  }

  validateUserInput(params = []) {
    for (const param of params) {
      if (typeof param === "string" && sanitizer.detectSqlInjection(param)) {
        throw new Error("Potentially malicious parameter detected");
      }
    }
  }

  validateQueryStructure(sql) {
    const allowedOperations = ["SELECT", "INSERT", "UPDATE", "DELETE"];
    const operation = sql.trim().split(" ")[0].toUpperCase();

    if (!allowedOperations.includes(operation)) {
      throw new Error(`Operation ${operation} not allowed`);
    }
  }

  // Spezielle Validierung für Schema-Operationen
  validateSchemaOperation(sql) {
    const allowedSchemaOperations = ["CREATE", "DROP", "ALTER"];
    const operation = sql.trim().split(" ")[0].toUpperCase();

    if (!allowedSchemaOperations.includes(operation)) {
      throw new Error(`Schema operation ${operation} not allowed`);
    }
  }

  safeQuery(sql, params = [], validateParams = true) {
    try {
      this.validateQueryStructure(sql);
      if (validateParams) {
        this.validateUserInput(params);
      }
      return this.db.query(sql, params);
    } catch (error) {
      console.error("Database query error:", error.message);
      throw new Error("Database operation failed");
    }
  }

  safeQueryEntries(sql, params = [], validateParams = true) {
    try {
      this.validateQueryStructure(sql);
      if (validateParams) {
        this.validateUserInput(params);
      }
      return this.db.queryEntries(sql, params);
    } catch (error) {
      console.error("Database query error:", error.message);
      throw new Error("Database operation failed");
    }
  }

  // Interne Queries ohne Parameter-Validierung
  internalQuery(sql, params = []) {
    return this.safeQuery(sql, params, false);
  }

  internalQueryEntries(sql, params = []) {
    return this.safeQueryEntries(sql, params, false);
  }

  // Schema-Operationen für CREATE/DROP/ALTER
  schemaQuery(sql, params = []) {
    try {
      this.validateSchemaOperation(sql);
      return this.db.query(sql, params);
    } catch (error) {
      console.error("Database schema query error:", error.message);
      throw new Error("Database schema operation failed");
    }
  }

  transaction(callback) {
    this.db.query("BEGIN TRANSACTION");
    try {
      const result = callback(this);
      this.db.query("COMMIT");
      return result;
    } catch (error) {
      this.db.query("ROLLBACK");
      throw error;
    }
  }

  get lastInsertId() {
    return this.db.lastInsertId;
  }

  close() {
    this.db.close();
  }
}

export const db = new SecureDatabase();
export default db;
