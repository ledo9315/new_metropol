import nunjucks from "https://deno.land/x/nunjucks@3.2.4/mod.js";
import { sanitizer } from "../utils/sanitizer.js";

const _env = nunjucks.configure("src/templates", {
  autoescape: true,
  noCache: true,
});

export function render(templateName, context = {}) {
  try {
    // Sanitize context data vor dem Rendering
    const sanitizedContext = sanitizeContext(context);
    return nunjucks.render(templateName, sanitizedContext);
  } catch (error) {
    console.error(`Fehler beim Rendern des Templates ${templateName}:`, error);
    throw error;
  }
}

function sanitizeContext(obj) {
  if (typeof obj === "string") {
    // Prüfe auf XSS-Patterns
    if (sanitizer.detectXss(obj)) {
      return sanitizer.escapeHtml(obj);
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeContext);
  }

  if (obj && typeof obj === "object") {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeContext(value);
    }
    return sanitized;
  }

  return obj;
}
