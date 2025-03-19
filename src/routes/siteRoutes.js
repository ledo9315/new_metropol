import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { siteController } from "../controllers/siteController.js";

export const siteRoutes = new Router();

siteRoutes.get("/", siteController.home);
siteRoutes.get("/programm", siteController.programm);
siteRoutes.get("/film/:id", siteController.filmDetail);
siteRoutes.get("/ueberuns", siteController.about);
siteRoutes.get("/preise", siteController.prices);
siteRoutes.get("/impressum", siteController.imprint);
siteRoutes.get("/datenschutz", siteController.privacy);
siteRoutes.get("/kolophon", siteController.kolophon);
siteRoutes.get("/zeitleiste", siteController.timeline);
siteRoutes.get("/www-dokumentation", siteController.documentation);
siteRoutes.get("/frontend-dokumentation", siteController.documentation);