import { db } from "../db/database.js";
import { showService } from "./showService.js";

export const filmService = {
  getAllFilms: () => {
    return db.queryEntries("SELECT * FROM films ORDER BY id DESC");
  },
  getFilmById: (id) => {
    return db.queryEntries("SELECT * FROM films WHERE id = ?", [id])[0];
  },
  createFilm: (film) => {
    const { title, director, duration, description, cast, poster_url, release_date } = film;
    db.query(
      "INSERT INTO films (title, director, duration, description, cast, poster_url, release_date) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [title, director, duration, description, cast, poster_url, release_date]
    );
    return db.lastInsertId;
  },
  updateFilm: (id, film) => {
    const keys = Object.keys(film);
    const values = Object.values(film);
    if (keys.length === 0) return false;
    const setClause = keys.map(key => `${key} = ?`).join(", ");
    db.query(`UPDATE films SET ${setClause} WHERE id = ?`, [...values, id]);
    return true;
  },
  deleteFilm(id) {
    showService.deleteShowsByFilmId(id);
    const query = "DELETE FROM films WHERE id = ?";
    db.query(query, [id]);
  },
};