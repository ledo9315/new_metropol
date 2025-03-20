import { filmService } from "../services/filmService.js";
import { showService } from "../services/showService.js";
import { render } from "../services/render.js"
import * as formatDate from "../utils/formatDate.js";


export const siteController = {
  home: async (ctx) => {
    const today = formatDate.getTodayDate();
    const tomorrow = formatDate.getTomorrowDate();
    const dayAfterTomorrow = formatDate.getDayAfterTomorrowDate();
    const todayShows = showService.getShowsByDate(today);
    const tomorrowShows = showService.getShowsByDate(tomorrow);
    const dayAfterTomorrowShows = showService.getShowsByDate(dayAfterTomorrow);
    ctx.response.body = render("index.html", { todayShows, tomorrowShows, dayAfterTomorrowShows });
  },
  programm: async (ctx) => {
    const query = ctx.request.url.searchParams;
    const startDate = query.get("start") || formatDate.getTodayDate();
    const dates = [];
    const dateShows = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const formattedDate = formatDate.formatDate(date);
      dates.push(formattedDate);
      dateShows[formattedDate] = showService.getShowsByDate(formattedDate);
    }
    ctx.response.body = render("programm.html", { dates, shows: dateShows });
  },
  filmDetail: async (ctx) => {
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

  about: async (ctx) => {
    ctx.response.body = render("ueberuns.html", {});
  },
  prices: async (ctx) => {
    ctx.response.body = render("preise.html", {});
  },
  imprint: async (ctx) => {
    ctx.response.body = render("impressum.html", {});
  },
  privacy: async (ctx) => {
    ctx.response.body = render("datenschutz.html", {});
  },
  kolophon: async (ctx) => {
    ctx.response.body = render("kolophon.html", {});
  },
  timeline: async (ctx) => {
    ctx.response.body = render("zeitleiste.html", {});
  },
  documentation: async (ctx) => {
    ctx.response.body = render("www-dokumentation.html", {});
  },
  frontendDocumentation: async (ctx) => {
    ctx.response.body = render("frontend-dokumentation.html", {});
  }
};