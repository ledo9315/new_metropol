// src/controllers/adminController.js
import { filmService } from "../services/filmService.js";
import { showService } from "../services/showService.js";
import { userService } from "../services/userService.js";
import { render } from "../services/render.js";

export const adminController = {
  dashboard: async (ctx) => {
    const films = filmService.getAllFilms();
    const shows = showService.getAllShows();
    const action = ctx.request.url.searchParams.get("action") || "list";
    const filmIdRaw = ctx.request.url.searchParams.get("id");
    const message = ctx.request.url.searchParams.get("message") || null;
    const error = ctx.request.url.searchParams.get("error") || null;

    let filmId = null;
    let film = null;
    if (filmIdRaw) {
      filmId = parseInt(filmIdRaw);
      if (isNaN(filmId)) {
        ctx.response.redirect("/admin?error=Ungültige Film-ID");
        return;
      }
      if (action === "edit" || action === "delete") {
        film = filmService.getFilmById(filmId);
        if (!film) {
          ctx.response.redirect("/admin?error=Film nicht gefunden");
          return;
        }
        // Shows für den Film laden
        if (action === "edit") {
          film.shows = showService.getShowsByFilmId(filmId);
        }
      }
    }

    ctx.response.body = render("dashboard.html", {
      filmCount: films.length,
      showCount: shows.length,
      films,
      action,
      film,
      message,
      error,
      user: ctx.state.user,
    });
  },

  login: async (ctx) => {
    const error = ctx.request.url.searchParams.get("error") || null;
    ctx.response.body = render("login.html", { error });
  },

  loginPost: async (ctx) => {
    const body = await ctx.request.body({ type: "form" }).value;
    const username = body.get("username");
    const password = body.get("password");

    if (!username || !password) {
      ctx.response.redirect("/admin/login?error=Bitte Benutzername und Passwort angeben");
      return;
    }

    const user = userService.getUserByUsername(username);
    if (!user) {
      ctx.response.redirect("/admin/login?error=Benutzer nicht gefunden");
      return;
    }

    const passwordMatch = await userService.verifyPassword(password, user.password);
    if (!passwordMatch) {
      ctx.response.redirect("/admin/login?error=Ungültiges Passwort");
      return;
    }

    await ctx.state.session.set("user", { id: user.id, username: user.username });
    ctx.response.redirect("/admin?message=Erfolgreich eingeloggt");
  },

  logout: async (ctx) => {
    await ctx.state.session.set("user", null);
    ctx.response.redirect("/admin/login?message=Erfolgreich ausgeloggt");
  },

  showsIndex: async (ctx) => {
    const shows = showService.getAllShows();
    ctx.response.body = { shows };
  },

  showsCreate: async (ctx) => {
    const body = await ctx.request.body();
    if (body.type === "json") {
      const show = body.value;
      const id = showService.createShow(show);
      ctx.response.body = { id };
    } else {
      ctx.response.status = 400;
      ctx.response.body = "Ungültige Anfrage";
    }
  },

  showsUpdate: async (ctx) => {
    const showId = parseInt(ctx.params.id);
    const body = await ctx.request.body();
    if (body.type === "json") {
      const updatedShow = body.value;
      showService.updateShow(showId, updatedShow);
      ctx.response.body = { success: true };
    } else {
      ctx.response.status = 400;
      ctx.response.body = "Ungültige Anfrage";
    }
  },

  showsDelete: async (ctx) => {
    const showId = parseInt(ctx.params.id);
    showService.deleteShow(showId);
    ctx.response.body = { success: true };
  },
};