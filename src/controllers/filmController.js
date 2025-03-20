import { filmService } from "../services/filmService.js";
import { showService } from "../services/showService.js";

export const filmController = {
  index: async (ctx) => {
    const films = filmService.getAllFilms();
    ctx.response.body = { films };
  },

  create: async (ctx) => {
    const body = await ctx.request.body({ type: "form" }).value;
    const film = {
      title: body.get("title"),
      director: body.get("director"),
      duration: body.get("duration") ? parseInt(body.get("duration")) : null,
      description: body.get("description"),
      cast: body.get("cast"),
      poster_url: body.get("poster_url"),
      release_date: body.get("release_date"),
    };

    // Film erstellen
    const filmId = filmService.createFilm(film);

    // Shows aus dem Formular verarbeiten
    const shows = [];
    for (const [key, value] of body.entries()) {
      const match = key.match(/^shows\[(\d+)\]\[(date|time)\]$/);
      if (match) {
        const index = parseInt(match[1]);
        const field = match[2];
        if (!shows[index]) shows[index] = { film_id: filmId };
        shows[index][field] = value;
      }
    }

    // Shows speichern
    for (const show of shows.filter(s => s.date && s.time)) {
      showService.createShow(show);
    }

    ctx.response.redirect(`/admin?message=Film erfolgreich erstellt (ID: ${filmId})`);
  },

  update: async (ctx) => {
    const filmId = parseInt(ctx.params.id);
    const body = await ctx.request.body({ type: "form" }).value;
    const updatedFilm = {
      title: body.get("title"),
      director: body.get("director"),
      duration: body.get("duration") ? parseInt(body.get("duration")) : null,
      description: body.get("description"),
      cast: body.get("cast"),
      poster_url: body.get("poster_url"),
      release_date: body.get("release_date"),
    };

    // Film aktualisieren
    filmService.updateFilm(filmId, updatedFilm);

    // Bestehende Shows laden
    const existingShows = showService.getShowsByFilmId(filmId);

    // Shows aus dem Formular verarbeiten
    const shows = [];
    for (const [key, value] of body.entries()) {
      const match = key.match(/^shows\[(\d+)\]\[(id|date|time)\]$/);
      if (match) {
        const index = parseInt(match[1]);
        const field = match[2];
        if (!shows[index]) shows[index] = { film_id: filmId };
        shows[index][field] = value;
      }
    }

    // Bestehende Shows aktualisieren oder löschen
    for (const existingShow of existingShows) {
      const updatedShow = shows.find(s => s.id && parseInt(s.id) === existingShow.id);
      if (updatedShow) {
        // Show aktualisieren
        showService.updateShow(existingShow.id, {
          film_id: filmId,
          date: updatedShow.date,
          time: updatedShow.time,
        });
      } else {
        // Show löschen, wenn sie nicht mehr im Formular vorhanden ist
        showService.deleteShow(existingShow.id);
      }
    }

    // Neue Shows hinzufügen
    for (const show of shows.filter(s => !s.id && s.date && s.time)) {
      showService.createShow(show);
    }

    ctx.response.redirect("/admin?message=Film erfolgreich aktualisiert");
  },

  delete: async (ctx) => {
    const filmId = parseInt(ctx.params.id);
    try {
      filmService.deleteFilm(filmId);
      ctx.response.redirect("/admin?message=Film erfolgreich gelöscht");
    } catch (error) {
      ctx.response.redirect(`/admin?error=${encodeURIComponent(error.message)}`);
    }
  },
};