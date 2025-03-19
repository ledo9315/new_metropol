import { filmService } from "../services/filmService.js";
import { showService } from "../services/showService.js";
import { render } from "../services/render.js"


function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function getTodayDate() {
  return formatDate(new Date());
}

function getTomorrowDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatDate(tomorrow);
}

function getDayAfterTomorrowDate() {
  const dayAfterTomorrow = new Date();
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  return formatDate(dayAfterTomorrow);
}

export const siteController = {
  home: async (ctx) => {
    const today = getTodayDate();
    const tomorrow = getTomorrowDate();
    const dayAfterTomorrow = getDayAfterTomorrowDate();
    const todayShows = showService.getShowsByDate(today);
    const tomorrowShows = showService.getShowsByDate(tomorrow);
    const dayAfterTomorrowShows = showService.getShowsByDate(dayAfterTomorrow);
    ctx.response.body = render("index.html", { todayShows, tomorrowShows, dayAfterTomorrowShows });
  },
  programm: async (ctx) => {
    const query = ctx.request.url.searchParams;
    const startDate = query.get("start") || getTodayDate();
    const dates = [];
    const dateShows = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const formattedDate = formatDate(date);
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