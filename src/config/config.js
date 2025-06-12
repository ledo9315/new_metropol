export const config = {
  PORT: parseInt(Deno.env.get("PORT") || "8000"),
  NODE_ENV: Deno.env.get("NODE_ENV") || "development",
  SESSION_SECRET: Deno.env.get("SESSION_SECRET") || "your-secret-key-here",
  DATABASE_URL: Deno.env.get("DATABASE_URL") || "cinema.db",

  // Logging Configuration
  LOG_LEVEL: Deno.env.get("LOG_LEVEL") || "INFO",
  LOG_TO_FILE: Deno.env.get("LOG_TO_FILE") === "true",

  // Security Configuration
  ENABLE_RATE_LIMITING: Deno.env.get("ENABLE_RATE_LIMITING") !== "false",
  MAX_REQUESTS_PER_MINUTE: parseInt(
    Deno.env.get("MAX_REQUESTS_PER_MINUTE") || "60"
  ),

  // Performance Configuration
  ENABLE_COMPRESSION: Deno.env.get("ENABLE_COMPRESSION") !== "false",
  CACHE_STATIC_FILES: Deno.env.get("CACHE_STATIC_FILES") !== "false",
};
