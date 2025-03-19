import db from "../db/database.js";
import { hash, compare } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

export const userService = {
  getUserByUsername(username) {
    const query = "SELECT * FROM users WHERE username = ?";
    const row = db.query(query, [username])[0];
    if (!row) return null;
    return {
      id: row[0],
      username: row[1],
      password: row[2],
    };
  },

  async createUser(username, password) {
    const hashedPassword = await hash(password);
    const query = "INSERT INTO users (username, password) VALUES (?, ?)";
    const result = db.query(query, [username, hashedPassword]);
    return result.lastInsertId;
  },

  async verifyPassword(plainPassword, hashedPassword) {
    return await compare(plainPassword, hashedPassword);
  },
};