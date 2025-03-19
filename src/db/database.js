// db/database.js
import { DB } from "https://deno.land/x/sqlite@v3.8/mod.ts";

export const db = new DB("cinema.db");

// db.query(`
//   CREATE TABLE IF NOT EXISTS films (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     title TEXT NOT NULL,
//     director TEXT,
//     duration INTEGER,
//     description TEXT,
//     cast TEXT,
//     poster_url TEXT,
//     release_date TEXT
//   )
// `);

// db.query(`
//   CREATE TABLE IF NOT EXISTS shows (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     film_id INTEGER,
//     date TEXT NOT NULL,
//     time TEXT NOT NULL,
//     FOREIGN KEY (film_id) REFERENCES films(id)
//   )
// `);


export default db;