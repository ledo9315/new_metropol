import { db } from "../db/database.js";

export const showService = {
  getAllShows: () => {
    return db.queryEntries(`
      SELECT shows.*, films.title AS film_title 
      FROM shows 
      JOIN films ON shows.film_id = films.id 
      ORDER BY date, time
    `);
  },
  getShowsByDate: (date) => {
    return db.queryEntries(`
      SELECT shows.*, films.title AS film_title, films.duration, films.poster_url 
      FROM shows 
      JOIN films ON shows.film_id = films.id 
      WHERE date = ? 
      ORDER BY time
    `, [date]);
  },
  getShowsByFilmId: (filmId) => {
    return db.queryEntries(`
      SELECT * FROM shows WHERE film_id = ? ORDER BY date, time
    `, [filmId]);
  },
  createShow: (show) => {
    const { film_id, date, time } = show;
    db.query(
      "INSERT INTO shows (film_id, date, time) VALUES (?, ?, ?)",
      [film_id, date, time]
    );
    return db.lastInsertId;
  },
  updateShow: (id, show) => {
    const keys = Object.keys(show);
    const values = Object.values(show);
    if (keys.length === 0) return false;
    const setClause = keys.map(key => `${key} = ?`).join(", ");
    db.query(`UPDATE shows SET ${setClause} WHERE id = ?`, [...values, id]);
    return true;
  },
  deleteShow: (id) => {
    db.query("DELETE FROM shows WHERE id = ?", [id]);
  },

  deleteShowsByFilmId(filmId) {
    const query = "DELETE FROM shows WHERE film_id = ?";
    db.query(query, [filmId]);
  },
};