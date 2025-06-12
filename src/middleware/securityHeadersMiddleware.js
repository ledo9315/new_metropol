export const securityHeadersMiddleware = async (ctx, next) => {
  // Content Security Policy
  ctx.response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self';"
  );

  // Strict Transport Security
  ctx.response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );

  // Cross-Origin Opener Policy
  ctx.response.headers.set("Cross-Origin-Opener-Policy", "same-origin");

  // X-Frame-Options
  ctx.response.headers.set("X-Frame-Options", "DENY");

  // X-Content-Type-Options
  ctx.response.headers.set("X-Content-Type-Options", "nosniff");

  // Referrer Policy
  ctx.response.headers.set(
    "Referrer-Policy",
    "strict-origin-when-cross-origin"
  );

  // Permissions Policy
  ctx.response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  await next();
};
