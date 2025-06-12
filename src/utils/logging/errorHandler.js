// Centralized Error Handler für Production-Ready Applications
import { logger } from "./logger.js";
import { config } from "../../config/config.js";

export class AppError extends Error {
  constructor(message, statusCode = 500, code = "INTERNAL_ERROR", details = {}) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, details = {}) {
    super(message, 400, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

export class DatabaseError extends AppError {
  constructor(message, details = {}) {
    super(message, 500, "DATABASE_ERROR", details);
    this.name = "DatabaseError";
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401, "AUTH_ERROR");
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "Insufficient permissions") {
    super(message, 403, "AUTHORIZATION_ERROR");
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export const errorHandler = {
  // Globaler Error Handler Middleware
  async handleError(ctx, next) {
    try {
      await next();
    } catch (error) {
      await this.processError(ctx, error);
    }
  },

  async processError(ctx, error) {
    const requestId = ctx.state.requestId || "unknown";
    
    // Log the error
    logger.error("Unhandled Error", {
      requestId,
      error,
      url: ctx.request.url.pathname,
      method: ctx.request.method,
      userAgent: ctx.request.headers.get("user-agent"),
      stack: error.stack,
    });

    // Determine response based on error type
    if (error instanceof AppError) {
      await this.handleAppError(ctx, error);
    } else if (error.name === "ValidationError") {
      await this.handleValidationError(ctx, error);
    } else {
      await this.handleUnknownError(ctx, error);
    }
  },

  async handleAppError(ctx, error) {
    ctx.response.status = error.statusCode;
    
    if (ctx.request.headers.get("accept")?.includes("application/json")) {
      ctx.response.body = {
        error: {
          code: error.code,
          message: error.message,
          details: config.NODE_ENV === "development" ? error.details : undefined,
          timestamp: error.timestamp,
        },
      };
    } else {
      // HTML Error Page
      ctx.response.body = await this.renderErrorPage(error);
    }
  },

  async handleValidationError(ctx, error) {
    ctx.response.status = 400;
    
    const errorMessage = Array.isArray(error.message) 
      ? error.message.join(", ") 
      : error.message;

    if (ctx.request.headers.get("accept")?.includes("application/json")) {
      ctx.response.body = {
        error: {
          code: "VALIDATION_ERROR",
          message: errorMessage,
          timestamp: new Date().toISOString(),
        },
      };
    } else {
      // Redirect zu Formular mit Fehlermeldung
      const referer = ctx.request.headers.get("referer") || "/";
      ctx.response.redirect(`${referer}?error=${encodeURIComponent(errorMessage)}`);
    }
  },

  async handleUnknownError(ctx, error) {
    ctx.response.status = 500;
    
    const errorMessage = config.NODE_ENV === "development" 
      ? error.message 
      : "Internal Server Error";

    if (ctx.request.headers.get("accept")?.includes("application/json")) {
      ctx.response.body = {
        error: {
          code: "INTERNAL_ERROR",
          message: errorMessage,
          timestamp: new Date().toISOString(),
          stack: config.NODE_ENV === "development" ? error.stack : undefined,
        },
      };
    } else {
      ctx.response.body = await this.renderErrorPage({
        statusCode: 500,
        message: errorMessage,
      });
    }
  },

  async renderErrorPage(error) {
    try {
      const { render } = await import("../../services/render.js");
      return render("error.html", {
        error: {
          statusCode: error.statusCode || 500,
          message: error.message || "Ein Fehler ist aufgetreten",
          code: error.code || "UNKNOWN_ERROR",
        },
        isProduction: config.NODE_ENV === "production",
      });
    } catch (renderError) {
      logger.error("Error rendering error page", { error: renderError });
      
      // Fallback HTML
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Fehler ${error.statusCode || 500}</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .error { background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; padding: 20px; }
            h1 { color: #721c24; margin: 0 0 10px 0; }
            p { color: #721c24; margin: 0; }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>Fehler ${error.statusCode || 500}</h1>
            <p>${error.message || "Ein unerwarteter Fehler ist aufgetreten."}</p>
          </div>
        </body>
        </html>
      `;
    }
  },

  // Database Error Wrapper
  wrapDatabaseOperation(operation, context = "") {
    return async (...args) => {
      const startTime = Date.now();
      try {
        const result = await operation(...args);
        const duration = Date.now() - startTime;
        logger.logDatabaseQuery(context, args, duration);
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.logDatabaseQuery(context, args, duration, error);
        throw new DatabaseError(`Database operation failed: ${context}`, {
          operation: context,
          args,
          originalError: error.message,
        });
      }
    };
  },

  // Security Event Handler
  handleSecurityEvent(event, details, ctx) {
    logger.logSecurityEvent(event, {
      ...details,
      ip: ctx.request.ip || "unknown",
      userAgent: ctx.request.headers.get("user-agent"),
      url: ctx.request.url.pathname,
    });

    // Bei kritischen Security Events sofort Response senden
    if (details.severity === "CRITICAL") {
      ctx.response.status = 403;
      ctx.response.body = { error: "Access denied" };
      return true; // Stop further processing
    }

    return false;
  },
};

// Graceful Shutdown Handler
export const gracefulShutdown = {
  async handleShutdown(signal) {
    logger.info("Graceful shutdown initiated", { signal });
    
    try {
      // Close database connections
      if (globalThis.db) {
        globalThis.db.close();
        logger.info("Database connections closed");
      }

      // Cleanup any other resources
      logger.info("Application shutdown complete");
      Deno.exit(0);
    } catch (error) {
      logger.fatal("Error during shutdown", { error });
      Deno.exit(1);
    }
  },

  register() {
    // Register signal handlers for graceful shutdown
    ["SIGINT", "SIGTERM"].forEach(signal => {
      // Note: Deno doesn't support process signals the same way as Node.js
      // This is a placeholder for when Deno adds better signal handling
      if (typeof Deno.addSignalListener === "function") {
        Deno.addSignalListener(signal, () => this.handleShutdown(signal));
      }
    });
  },
};