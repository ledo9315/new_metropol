import { db } from "../db/database.js";
import { hash, compare } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

export const userService = {
  getUserByUsername(username) {
    const users = db.safeQueryEntries(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );
    return users.length > 0 ? users[0] : null;
  },

  async createUser(username, password) {
    const hashedPassword = await hash(password);
    db.safeQuery("INSERT INTO users (username, password) VALUES (?, ?)", [
      username,
      hashedPassword,
    ]);
    return db.lastInsertId;
  },

  async verifyPassword(plainPassword, hashedPassword) {
    return await compare(plainPassword, hashedPassword);
  },
};
