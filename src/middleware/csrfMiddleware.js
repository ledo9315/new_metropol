const csrfTokens = new Map();
const TOKEN_EXPIRY = 3600000; // 1 hour

export const csrfProtection = {
  generateToken: () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
      ""
    );
  },

  storeToken: (sessionId, token) => {
    csrfTokens.set(sessionId, {
      token,
      expires: Date.now() + TOKEN_EXPIRY,
    });
  },

  validateToken: (sessionId, token) => {
    const stored = csrfTokens.get(sessionId);
    if (!stored || stored.expires < Date.now()) {
      csrfTokens.delete(sessionId);
      return false;
    }
    return stored.token === token;
  },

  cleanupExpiredTokens: () => {
    const now = Date.now();
    for (const [sessionId, data] of csrfTokens.entries()) {
      if (data.expires < now) {
        csrfTokens.delete(sessionId);
      }
    }
  },

  middleware: async (ctx, next) => {
    const sessionId = ctx.state.session?.id || "anonymous";

    // Cleanup expired tokens periodically
    if (Math.random() < 0.01) {
      csrfProtection.cleanupExpiredTokens();
    }

    if (ctx.request.method === "GET" || ctx.request.method === "HEAD") {
      // Generate and store CSRF token for safe methods
      const token = csrfProtection.generateToken();
      csrfProtection.storeToken(sessionId, token);
      ctx.state.csrfToken = token;
      await next();
    } else {
      // Validate CSRF token for unsafe methods
      const token =
        ctx.request.headers.get("x-csrf-token") ||
        (await ctx.request.body({ type: "form" }).value).get("_csrf_token");

      if (!token || !csrfProtection.validateToken(sessionId, token)) {
        ctx.response.status = 403;
        ctx.response.body = { error: "Invalid CSRF token" };
        return;
      }

      await next();
    }
  },
};
