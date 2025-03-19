import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { adminController } from "../controllers/adminController.js";
import { filmController } from "../controllers/filmController.js";
import { adminMiddleware } from "../middleware/authMiddleware.js";

export const adminRoutes = new Router();

// Routen ohne Authentifizierung (Login)
adminRoutes.get("/admin/login", adminController.login);
adminRoutes.post("/admin/login-post", adminController.loginPost);

// Routen mit Authentifizierung
adminRoutes.use(adminMiddleware);

adminRoutes.get("/admin", adminController.dashboard);
adminRoutes.post("/admin/films", filmController.create);
adminRoutes.post("/admin/films/update/:id", filmController.update);
adminRoutes.post("/admin/films/delete/:id", filmController.delete);
adminRoutes.post("/admin/shows", adminController.showsCreate);
adminRoutes.put("/admin/shows/:id", adminController.showsUpdate);
adminRoutes.delete("/admin/shows/:id", adminController.showsDelete);
adminRoutes.get("/admin/logout", adminController.logout);