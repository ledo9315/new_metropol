import { db } from "../db/database.js";
import { showService } from "./showModel.js";

// Helper function to get the correct database instance
const getDb = () => globalThis.db || db;

export const filmService = {
  getAllFilms: () => {
    return getDb().internalQueryEntries("SELECT * FROM films ORDER BY id DESC");
  },
  getFilmById: (id) => {
    const film = getDb().safeQueryEntries("SELECT * FROM films WHERE id = ?", [
      id,
    ])[0];
    if (film) {
      film.release_date = parseInt(film.release_date);
    }
    return film || null;
  },
  createFilm: (film) => {
    const {
      title,
      director,
      duration,
      description,
      cast,
      poster_url,
      release_date,
    } = film;

    return getDb().transaction(() => {
      getDb().safeQuery(
        "INSERT INTO films (title, director, duration, description, cast, poster_url, release_date) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [title, director, duration, description, cast, poster_url, release_date]
      );

      // Hole die ID des zuletzt eingefügten Films
      const result = getDb().safeQueryEntries(
        "SELECT id FROM films WHERE title = ? AND director = ? ORDER BY id DESC LIMIT 1",
        [title, director]
      );

      return result[0]?.id || getDb().lastInsertId;
    });
  },
  updateFilm: (id, film) => {
    return getDb().transaction(() => {
      const keys = Object.keys(film);
      const values = Object.values(film);
      if (keys.length === 0) return false;
      const setClause = keys.map((key) => `${key} = ?`).join(", ");
      getDb().safeQuery(`UPDATE films SET ${setClause} WHERE id = ?`, [
        ...values,
        id,
      ]);
      return true;
    });
  },
  deleteFilm(id) {
    return getDb().transaction(() => {
      showService.deleteShowsByFilmId(id);
      getDb().safeQuery("DELETE FROM films WHERE id = ?", [id]);
    });
  },
};
