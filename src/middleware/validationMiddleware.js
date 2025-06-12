import { sanitizer } from "../utils/sanitizer.js";

export const validationMiddleware = {
  validateRequest: (schema) => {
    return async (ctx, next) => {
      if (ctx.request.method === "GET" || ctx.request.method === "HEAD") {
        await next();
        return;
      }

      try {
        const body = await ctx.request.body({ type: "form" }).value;
        const result = sanitizer.sanitizeFormData(body, schema);

        if (!result.isValid) {
          ctx.response.status = 400;
          ctx.response.body = {
            error: "Validation failed",
            details: result.errors,
          };
          return;
        }

        ctx.state.validatedData = result.data;
        await next();
      } catch (_error) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Invalid request format" };
      }
    };
  },

  validatePathParams: (paramSchema) => {
    return async (ctx, next) => {
      const errors = [];

      for (const [param, config] of Object.entries(paramSchema)) {
        const value = ctx.params[param];

        if (value === undefined && config.required) {
          errors.push(`Parameter ${param} ist erforderlich`);
          continue;
        }

        if (value !== undefined) {
          if (sanitizer.detectSqlInjection(value)) {
            errors.push(`Parameter ${param} enthält ungültige Zeichen`);
            continue;
          }

          switch (config.type) {
            case "integer": {
              const num = sanitizer.sanitizeInteger(value);
              if (num === null) {
                errors.push(`Parameter ${param} muss eine gültige Zahl sein`);
              }
              break;
            }
            case "string":
              if (
                typeof value !== "string" ||
                value.length > (config.maxLength || 100)
              ) {
                errors.push(`Parameter ${param} ist ungültig`);
              }
              break;
          }
        }
      }

      if (errors.length > 0) {
        ctx.response.status = 400;
        ctx.response.body = {
          error: "Invalid path parameters",
          details: errors,
        };
        return;
      }

      await next();
    };
  },

  validateQueryParams: (querySchema) => {
    return async (ctx, next) => {
      const errors = [];
      const url = new URL(ctx.request.url);

      for (const [param, config] of Object.entries(querySchema)) {
        const value = url.searchParams.get(param);

        if (value === null && config.required) {
          errors.push(`Query parameter ${param} ist erforderlich`);
          continue;
        }

        if (value !== null) {
          if (
            sanitizer.detectSqlInjection(value) ||
            sanitizer.detectXss(value)
          ) {
            errors.push(`Query parameter ${param} enthält ungültige Zeichen`);
            continue;
          }

          switch (config.type) {
            case "integer": {
              const num = sanitizer.sanitizeInteger(value);
              if (num === null) {
                errors.push(
                  `Query parameter ${param} muss eine gültige Zahl sein`
                );
              }
              break;
            }
            case "string": {
              if (value.length > (config.maxLength || 100)) {
                errors.push(`Query parameter ${param} ist zu lang`);
              }
              break;
            }
          }
        }
      }

      if (errors.length > 0) {
        ctx.response.status = 400;
        ctx.response.body = {
          error: "Invalid query parameters",
          details: errors,
        };
        return;
      }

      await next();
    };
  },
};
