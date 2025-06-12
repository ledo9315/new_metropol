// Professional Logging System für Production-Ready Applications
import { config } from "../../config/config.js";
import process from "node:process"; // Importiere process für Deno Kompatibilität

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4,
};

const LOG_COLORS = {
  DEBUG: "\x1b[36m", // Cyan
  INFO: "\x1b[32m", // Green
  WARN: "\x1b[33m", // Yellow
  ERROR: "\x1b[31m", // Red
  FATAL: "\x1b[35m", // Magenta
  RESET: "\x1b[0m",
};

class Logger {
  constructor() {
    this.level = LOG_LEVELS[config.LOG_LEVEL] || LOG_LEVELS.INFO;
    this.requestCounter = 0;
    this.errorStats = {
      total: 0,
      byType: {},
      lastHour: [],
    };
  }

  formatTimestamp() {
    return new Date().toISOString();
  }

  formatLogEntry(level, message, meta = {}) {
    const timestamp = this.formatTimestamp();
    const color = LOG_COLORS[level];
    const reset = LOG_COLORS.RESET;

    const logEntry = {
      timestamp,
      level,
      message,
      pid: Deno.pid,
      requestId: meta.requestId || null,
      ...meta,
    };

    // Console output mit Farben
    if (config.NODE_ENV !== "production") {
      console.log(
        `${color}[${timestamp}] ${level}:${reset} ${message}`,
        meta.error ? `\n${meta.error.stack}` : ""
      );
    }

    // Structured JSON für Produktion
    if (config.LOG_TO_FILE) {
      this.writeToFile(logEntry);
    }

    return logEntry;
  }

  async writeToFile(logEntry) {
    try {
      const logLine = JSON.stringify(logEntry) + "\n";
      const logFile = `logs/app-${new Date().toISOString().split("T")[0]}.log`;

      // Erstelle logs Verzeichnis falls es nicht existiert
      try {
        await Deno.mkdir("logs", { recursive: true });
      } catch (_) {
        // Verzeichnis existiert bereits
      }

      await Deno.writeTextFile(logFile, logLine, { append: true });
    } catch (error) {
      console.error("Fehler beim Schreiben der Log-Datei:", error);
    }
  }

  debug(message, meta = {}) {
    if (this.level <= LOG_LEVELS.DEBUG) {
      this.formatLogEntry("DEBUG", message, meta);
    }
  }

  info(message, meta = {}) {
    if (this.level <= LOG_LEVELS.INFO) {
      this.formatLogEntry("INFO", message, meta);
    }
  }

  warn(message, meta = {}) {
    if (this.level <= LOG_LEVELS.WARN) {
      this.formatLogEntry("WARN", message, meta);
    }
  }

  error(message, meta = {}) {
    if (this.level <= LOG_LEVELS.ERROR) {
      this.updateErrorStats(meta.error);
      this.formatLogEntry("ERROR", message, meta);
    }
  }

  fatal(message, meta = {}) {
    this.updateErrorStats(meta.error);
    this.formatLogEntry("FATAL", message, meta);
  }

  updateErrorStats(error) {
    this.errorStats.total++;

    if (error) {
      const errorType = error.constructor.name;
      this.errorStats.byType[errorType] =
        (this.errorStats.byType[errorType] || 0) + 1;
    }

    // Cleanup old entries (keep last hour)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    this.errorStats.lastHour = this.errorStats.lastHour.filter(
      (timestamp) => timestamp > oneHourAgo
    );
    this.errorStats.lastHour.push(Date.now());
  }

  // Request/Response Monitoring
  logRequest(ctx, startTime) {
    const requestId = ++this.requestCounter;
    const duration = Date.now() - startTime;

    this.info("HTTP Request", {
      requestId,
      method: ctx.request.method,
      url: ctx.request.url.pathname,
      userAgent: ctx.request.headers.get("user-agent"),
      ip: ctx.request.ip || "unknown",
      duration: `${duration}ms`,
      status: ctx.response.status,
    });

    // Performance Warning bei langsamen Requests
    if (duration > 1000) {
      this.warn("Slow Request Detected", {
        requestId,
        duration: `${duration}ms`,
        url: ctx.request.url.pathname,
      });
    }

    return requestId;
  }

  // Database Operation Logging
  logDatabaseQuery(query, params, duration, error = null) {
    if (error) {
      this.error("Database Query Failed", {
        query: query.substring(0, 100) + "...",
        params,
        duration: `${duration}ms`,
        error,
      });
    } else if (duration > 100) {
      this.warn("Slow Database Query", {
        query: query.substring(0, 100) + "...",
        duration: `${duration}ms`,
      });
    } else {
      this.debug("Database Query", {
        query: query.substring(0, 100) + "...",
        duration: `${duration}ms`,
      });
    }
  }

  // Security Event Logging
  logSecurityEvent(event, details = {}) {
    this.warn("Security Event", {
      event,
      ...details,
      severity: "HIGH",
    });
  }

  // Application Lifecycle Events
  logStartup(port) {
    this.info("Application Started", {
      port,
      environment: config.NODE_ENV,
      logLevel: config.LOG_LEVEL,
      pid: Deno.pid,
    });
  }

  logShutdown(signal) {
    this.info("Application Shutdown", {
      signal,
      uptime: process.uptime?.() || "unknown",
      totalErrors: this.errorStats.total,
    });
  }

  // Health Check Data
  getHealthStats() {
    return {
      totalErrors: this.errorStats.total,
      errorsByType: this.errorStats.byType,
      errorsLastHour: this.errorStats.lastHour.length,
      logLevel: config.LOG_LEVEL,
      uptime: process.uptime?.() || "unknown",
    };
  }
}

export const logger = new Logger();
