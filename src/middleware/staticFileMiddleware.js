import { send } from "https://deno.land/x/oak@v12.6.1/send.ts";


export default function servePublicFiles() {
    return async (context, next) => {
        if (context.request.url.pathname.startsWith("/public")) {
            await send(context, context.request.url.pathname, {
                root: `${Deno.cwd()}`,
            });
        } else {
            await next();
        }
    };
}