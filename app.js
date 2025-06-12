import { Application } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { Session } from "https://deno.land/x/oak_sessions@v4.0.1/mod.ts";
import { errorMiddleware } from "./src/middleware/errorMiddleware.js";
import { siteRoutes } from "./src/routes/siteRoutes.js";
import { adminRoutes } from "./src/routes/adminRoutes.js";
import staticFileMiddleware from "./src/middleware/staticFileMiddleware.js";
import { render } from "./src/services/render.js";

const app = new Application();

// Einfache Session-Initialisierung ohne zusätzliche Konfiguration
app.use(Session.initMiddleware());

app.use(staticFileMiddleware());
app.use(errorMiddleware);
app.use(siteRoutes.routes());
app.use(siteRoutes.allowedMethods());
app.use(adminRoutes.routes());
app.use(adminRoutes.allowedMethods());

app.use(async (ctx) => {
  ctx.response.status = 404;
  ctx.response.headers.set("Content-Type", "text/html; charset=utf-8");
  ctx.response.body = await render("not-found.html", {
    title: "404 - Seite nicht gefunden",
    requestedPath: ctx.request.url.pathname,
  });
});

const PORT = 8000;
console.log(`Server läuft auf http://localhost:${PORT}`);
await app.listen({ port: PORT });
