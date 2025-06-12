import { filmService } from "../models/filmModel.js";
import { showService } from "../models/showModel.js";
import { render } from "../services/render.js";
import * as formatDate from "../utils/formatDate.js";

export const siteController = {
  home: (ctx) => {
    const today = formatDate.getTodayDate();
    const tomorrow = formatDate.getTomorrowDate();
    const dayAfterTomorrow = formatDate.getDayAfterTomorrowDate();
    const todayShows = showService.getShowsByDate(today);
    const tomorrowShows = showService.getShowsByDate(tomorrow);
    const dayAfterTomorrowShows = showService.getShowsByDate(dayAfterTomorrow);
    ctx.response.body = render("index.html", {
      todayShows,
      tomorrowShows,
      dayAfterTomorrowShows,
    });
  },

  programm: (ctx) => {
    const startDate = formatDate.getTodayDate();
    const dates = [];
    const dateShows = {};

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const isoDate = formatDate.formatDate(date);
      const germanDate = new Date(date).toLocaleDateString("de-DE", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      dates.push(germanDate);
      dateShows[germanDate] = showService.getShowsByDate(isoDate);
    }

    ctx.response.body = render("programm.html", { dates, shows: dateShows });
  },

  filmDetail: (ctx) => {
    const filmId = parseInt(ctx.params.id);
    const film = filmService.getFilmById(filmId);

    if (!film) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Film nicht gefunden" };
      return;
    }
    const shows = showService.getShowsByFilmId(filmId);

    ctx.response.body = render("movieDetail.html", { film, shows });
  },

  about: (ctx) => {
    ctx.response.body = render("ueberuns.html", {});
  },
  prices: (ctx) => {
    ctx.response.body = render("preise.html", {});
  },
  imprint: (ctx) => {
    ctx.response.body = render("impressum.html", {});
  },
  privacy: (ctx) => {
    ctx.response.body = render("datenschutz.html", {});
  },
  kolophon: (ctx) => {
    ctx.response.body = render("kolophon.html", {});
  },
  timeline: (ctx) => {
    ctx.response.body = render("zeitleiste.html", {});
  },
  documentation: (ctx) => {
    ctx.response.body = render("www-dokumentation.html", {});
  },
};
