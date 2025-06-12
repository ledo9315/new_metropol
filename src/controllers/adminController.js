import { filmService } from "../models/filmModel.js";
import { showService } from "../models/showModel.js";
import { userService } from "../models/userModel.js";
import { render } from "../services/render.js";

export const adminController = {
  dashboard: (ctx) => {
    const films = filmService.getAllFilms();
    const shows = showService.getAllShows();
    const action = ctx.request.url.searchParams.get("action") || "list";
    const filmIdRaw = ctx.request.url.searchParams.get("id");
    const message = ctx.request.url.searchParams.get("message") || null;
    const error = ctx.request.url.searchParams.get("error") || null;

    // Parse die zurückgegebenen Formulardaten bei Fehlern aus URL-Parametern
    let formData = null;
    if (action === "create" || action === "edit") {
      const urlParams = ctx.request.url.searchParams;

      // Sammle alle Formulardaten aus den URL-Parametern
      const formFields = {};
      const showsData = [];

      // Standard-Formularfelder
      const fieldNames = [
        "title",
        "director",
        "duration",
        "description",
        "cast",
        "release_date",
        "poster_url",
      ];
      for (const field of fieldNames) {
        const value = urlParams.get(field);
        if (value) {
          formFields[field] = value;
        }
      }

      // Shows-Daten aus URL-Parametern extrahieren
      const showParams = new Map();
      for (const [key, value] of urlParams.entries()) {
        if (key.startsWith("show_")) {
          const match = key.match(/show_(\d+)_(date|time)/);
          if (match) {
            const index = parseInt(match[1]);
            const type = match[2];
            if (!showParams.has(index)) {
              showParams.set(index, {});
            }
            showParams.get(index)[type] = value;
          }
        }
      }

      // Konvertiere zu Array
      for (const [index, showData] of showParams.entries()) {
        showsData[index] = showData;
      }

      // Nur formData setzen wenn tatsächlich Daten vorhanden sind
      if (Object.keys(formFields).length > 0 || showsData.length > 0) {
        formData = {
          ...formFields,
          shows: showsData,
        };
      }
    }

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
        if (action === "edit")
          film.shows = showService.getShowsByFilmId(filmId);
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
      formData, // Formulardaten für Wiederanzeige bei Fehlern
      user: ctx.state.user,
    });
  },

  login: (ctx) => {
    const error = ctx.request.url.searchParams.get("error") || null;
    ctx.response.body = render("login.html", { error });
  },

  loginPost: async (ctx) => {
    const body = await ctx.request.body({ type: "form" }).value;
    const username = body.get("username");
    const password = body.get("password");

    if (!username || !password) {
      ctx.response.redirect(
        "/admin/login?error=Bitte Benutzername und Passwort angeben"
      );
      return;
    }

    const user = userService.getUserByUsername(username);
    if (!user) {
      ctx.response.redirect("/admin/login?error=Benutzer nicht gefunden");
      return;
    }

    const passwordMatch = await userService.verifyPassword(
      password,
      user.password
    );
    if (!passwordMatch) {
      ctx.response.redirect("/admin/login?error=Ungültiges Passwort");
      return;
    }

    await ctx.state.session.set("user", {
      id: user.id,
      username: user.username,
    });

    // Setze Timestamp für Session-Timeout-Verwaltung
    await ctx.state.session.set("lastActivity", Date.now());

    ctx.response.redirect("/admin?message=Erfolgreich eingeloggt");
  },

  logout: async (ctx) => {
    await ctx.state.session.set("user", null);
    ctx.response.redirect("/admin/login?message=Erfolgreich ausgeloggt");
  },

  showsIndex: (ctx) => {
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

  showsDelete: (ctx) => {
    const showId = parseInt(ctx.params.id);
    showService.deleteShow(showId);
    ctx.response.body = { success: true };
  },
};
