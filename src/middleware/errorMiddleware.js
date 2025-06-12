import { render } from "../services/render.js";

export async function errorMiddleware(ctx, next) {
  try {
    await next();

    if (ctx.response.status === 404) {
      ctx.response.body = await render("not-found.html", {
        message: "Seite nicht gefunden",
      });
    }

    if (ctx.response.status === 405) {
      ctx.response.body = await render("not-found.html", {
        message: "Methode nicht erlaubt",
      });
    }
  } catch (err) {
    console.error(err);
    ctx.response.status = 500;
    ctx.response.body = await render("not-found.html", {
      error: "Interner Serverfehler",
    });
  }
}
