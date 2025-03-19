import { Application } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { Session } from "https://deno.land/x/oak_sessions@v4.0.1/mod.ts";
import { errorMiddleware } from "./src/middleware/errorMiddleware.js";
import { siteRoutes } from "./src/routes/siteRoutes.js";
import { adminRoutes } from "./src/routes/adminRoutes.js";
import staticFileMiddleware from "./src/middleware/staticFileMiddleware.js";


const app = new Application();

app.use(Session.initMiddleware());
app.use(async (ctx, next) => await next());
app.use(staticFileMiddleware());
app.use(errorMiddleware);
app.use(siteRoutes.routes());
app.use(siteRoutes.allowedMethods());
app.use(adminRoutes.routes());
app.use(adminRoutes.allowedMethods());




const PORT = 8000;
console.log(`Server läuft auf http://localhost:${PORT}`);
await app.listen({ port: PORT });


