import { db } from "../db/database.js";

// Helper function to get the correct database instance
const getDb = () => globalThis.db || db;

export const showService = {
  getAllShows: () => {
    return getDb().internalQueryEntries(`
      SELECT shows.*, films.title AS film_title 
      FROM shows 
      JOIN films ON shows.film_id = films.id 
      ORDER BY date, time
    `);
  },
  getShowsByDate: (date) => {
    return getDb().safeQueryEntries(
      `
      SELECT shows.*, films.title AS film_title, films.duration, films.poster_url 
      FROM shows 
      JOIN films ON shows.film_id = films.id 
      WHERE date = ? 
      ORDER BY time
    `,
      [date]
    );
  },
  getShowsByFilmId: (filmId) => {
    return getDb().safeQueryEntries(
      `
      SELECT * FROM shows WHERE film_id = ? ORDER BY date, time
    `,
      [filmId]
    );
  },
  getShowById: (id) => {
    const show = getDb().safeQueryEntries("SELECT * FROM shows WHERE id = ?", [
      id,
    ])[0];
    return show || null;
  },
  createShow: (show) => {
    const { film_id, date, time } = show;
    getDb().safeQuery(
      "INSERT INTO shows (film_id, date, time) VALUES (?, ?, ?)",
      [film_id, date, time]
    );
    return getDb().lastInsertId;
  },
  updateShow: (id, show) => {
    return getDb().transaction(() => {
      const keys = Object.keys(show);
      const values = Object.values(show);
      if (keys.length === 0) return false;
      const setClause = keys.map((key) => `${key} = ?`).join(", ");
      getDb().safeQuery(`UPDATE shows SET ${setClause} WHERE id = ?`, [
        ...values,
        id,
      ]);
      return true;
    });
  },
  deleteShow: (id) => {
    getDb().safeQuery("DELETE FROM shows WHERE id = ?", [id]);
  },

  deleteShowsByFilmId(filmId) {
    getDb().safeQuery("DELETE FROM shows WHERE film_id = ?", [filmId]);
  },
};
