import nunjucks from "npm:nunjucks@3.2.4";

nunjucks.configure("src/templates", {
  autoescape: true,
  noCache: true,
});


export function render(templateName, context = {}) {
  try {
    return nunjucks.render(templateName, context);
  } catch (error) {
    console.error(`Fehler beim Rendern des Templates ${templateName}:`, error);
    throw error;
  }
}