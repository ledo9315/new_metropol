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

    if (!film.title || film.title.trim() === "") {
      ctx.response.redirect("/admin?action=create&error=Titel ist erforderlich");
      return;
    }

    if(!film.director || film.director.trim() === "") {
      ctx.response.redirect("/admin?action=create&error=Regisseur ist erforderlich");
      return;
    }

    if (film.duration && (isNaN(film.duration) || film.duration <= 0)) {
      ctx.response.redirect("/admin?action=create&error=Die Dauer muss eine positive Zahl sein");
      return;
    }

    if(!film.description || film.description.trim() === "") {
      ctx.response.redirect("/admin?action=create&error=Beschreibung ist erforderlich");
      return;
    }

    if(!film.cast || film.cast.trim() === "") {
      ctx.response.redirect("/admin?action=create&error=Besetzung ist erforderlich");
      return;
    }

    if (film.release_date && !/^\d{4}-\d{2}-\d{2}$/.test(film.release_date)) {
      ctx.response.redirect("/admin?action=create&error=Ungültiges Erscheinungsdatum (YYYY-MM-DD erforderlich)");
      return;
    }
    if (film.poster_url && !/^https?:\/\/.+\..+/.test(film.poster_url)) {
      ctx.response.redirect("/admin?action=create&error=Ungültige Poster-URL");
      return;
    }

    const filmId = filmService.createFilm(film);

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

    if (!updatedFilm.title || updatedFilm.title.trim() === "") {
      ctx.response.redirect(`/admin?action=edit&id=${filmId}&error=Titel ist erforderlich`);
      return;
    }

    if (!updatedFilm.director || updatedFilm.director.trim() === "") {
      ctx.response.redirect(`/admin?action=edit&id=${filmId}&error=Regisseur ist erforderlich`);
      return;
    }

    if (updatedFilm.duration && (isNaN(updatedFilm.duration) || updatedFilm.duration <= 0)) {
      ctx.response.redirect(`/admin?action=edit&id=${filmId}&error=Die Dauer muss eine positive Zahl sein`);
      return;
    }

    if (!updatedFilm.description || updatedFilm.description.trim() === "") {
      ctx.response.redirect(`/admin?action=edit&id=${filmId}&error=Beschreibung ist erforderlich`);
      return;
    }

    if (!updatedFilm.cast || updatedFilm.cast.trim() === "") {
      ctx.response.redirect(`/admin?action=edit&id=${filmId}&error=Besetzung ist erforderlich`);
      return;
    }

    if (updatedFilm.release_date && !/^\d{4}-\d{2}-\d{2}$/.test(updatedFilm.release_date)) {
      ctx.response.redirect(`/admin?action=edit&id=${filmId}&error=Ungültiges Erscheinungsdatum (YYYY-MM-DD erforderlich)`);
      return;
    }
    if (updatedFilm.poster_url && !/^https?:\/\/.+\..+/.test(updatedFilm.poster_url)) {
      ctx.response.redirect(`/admin?action=edit&id=${filmId}&error=Ungültige Poster-URL`);
      return;
    }


    filmService.updateFilm(filmId, updatedFilm);

    const existingShows = showService.getShowsByFilmId(filmId);

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


    for (const existingShow of existingShows) {
      const updatedShow = shows.find(s => s.id && parseInt(s.id) === existingShow.id);
      if (updatedShow) {

        showService.updateShow(existingShow.id, {
          film_id: filmId,
          date: updatedShow.date,
          time: updatedShow.time,
        });
      } else {

        showService.deleteShow(existingShow.id);
      }
    }

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