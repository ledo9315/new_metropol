import { send } from "https://deno.land/x/oak@v12.6.1/send.ts";

export const staticFileMiddleware = async (context, next) => {
  const path = context.request.url.pathname;

  // Spezielle Behandlung für robots.txt
  if (path === "/robots.txt") {
    await send(context, "robots.txt", {
      root: `${Deno.cwd()}/public`,
      type: "text/plain",
    });
    return;
  }

  // Behandlung für Upload-Dateien (/uploads/...)
  if (path.startsWith("/uploads/")) {
    try {
      await send(context, path, {
        root: `${Deno.cwd()}/public`,
      });
      return;
    } catch (_error) {
      console.log("Upload-Datei nicht gefunden:", path);
    }
  }

  // Normale Behandlung für andere statische Dateien (/public/...)
  if (path.startsWith("/public")) {
    await send(context, path, {
      root: `${Deno.cwd()}`,
    });
  } else {
    await next();
  }
};

export default function servePublicFiles() {
  return staticFileMiddleware;
}
