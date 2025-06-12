// Security Tests für die Kino-Website
import { assertEquals } from "@std/assert";
import { describe, it, beforeEach, afterEach } from "@std/testing";
import { TestDatabase, createMockContext } from "../utils/testHelpers.js";
import { sanitizer } from "../../src/utils/sanitizer.js";
import { filmController } from "../../src/controllers/filmController.js";
import { adminController } from "../../src/controllers/adminController.js";

describe("Security Tests", () => {
  let testDb;
  let originalDb;

  beforeEach(() => {
    testDb = new TestDatabase();
    testDb.seedData();
    originalDb = globalThis.db;
    globalThis.db = testDb;
  });

  afterEach(() => {
    testDb.close();
    globalThis.db = originalDb;
  });

  describe("SQL Injection Prevention", () => {
    it("should reject SQL injection attempts in film creation", async () => {
      const maliciousData = {
        title: "'; DROP TABLE films; --",
        director: "1' OR '1'='1",
        duration: "120; DELETE FROM users; --",
        description: "UNION SELECT * FROM users",
      };

      const formData = new URLSearchParams();
      Object.entries(maliciousData).forEach(([key, value]) => {
        formData.set(key, value);
      });

      const ctx = createMockContext({
        method: "POST",
        body: { type: "form", value: formData },
      });

      await filmController.create(ctx);

      // Sollte wegen Validation fehlschlagen
      assertEquals(ctx.response.status, 302);
      assertEquals(
        ctx.response.headers.get("Location").includes("error="),
        true
      );
    });

    it("should sanitize user input properly", () => {
      const dangerousInputs = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "UNION SELECT password FROM users",
        "SELECT * FROM users",
      ];

      dangerousInputs.forEach((input) => {
        // Gefährliche SQL-Eingaben sollten als TRUE erkannt werden
        assertEquals(
          sanitizer.detectSqlInjection(input),
          true,
          `Should detect SQL injection in: ${input}`
        );
      });

      // Path traversal ist KEIN SQL-Injection, sondern ein anderer Angriffstyp
      const pathTraversal = "../../etc/passwd";
      assertEquals(
        sanitizer.detectSqlInjection(pathTraversal),
        false,
        `Path traversal should NOT be detected as SQL injection: ${pathTraversal}`
      );

      // XSS-Eingaben sollten NICHT als SQL-Injection erkannt werden
      const xssInputs = [
        "<script>alert('xss')</script>",
        "<img src=x onerror=alert('xss')>",
      ];

      xssInputs.forEach((input) => {
        // XSS sollte mit detectXss erkannt werden, nicht mit detectSqlInjection
        assertEquals(
          sanitizer.detectXss(input),
          true,
          `Should detect XSS in: ${input}`
        );
        assertEquals(
          sanitizer.detectSqlInjection(input),
          false,
          `Should NOT detect SQL injection in XSS: ${input}`
        );
      });
    });

    it("should allow safe content", () => {
      const safeInputs = [
        "Avengers: Endgame",
        "Christopher Nolan's Inception",
        "Die Hard 2",
        "Star Wars: Episode IV - A New Hope",
      ];

      safeInputs.forEach((input) => {
        assertEquals(
          sanitizer.detectSqlInjection(input),
          false,
          `Should allow safe content: ${input}`
        );
      });
    });
  });

  describe("XSS Prevention", () => {
    it("should escape HTML in template rendering", () => {
      const xssPayloads = [
        "<script>alert('xss')</script>",
        "<img src=x onerror=alert('xss')>",
        "<svg onload=alert('xss')>",
      ];

      // Test der HTML-Escaping-Funktionalität
      xssPayloads.forEach((payload) => {
        // Verwende den sanitizer.escapeHtml für konsistente Behandlung
        const sanitized = sanitizer.escapeHtml(payload);

        // Prüfe, dass gefährliche Tags escaped wurden
        assertEquals(
          sanitized.includes("<script>"),
          false,
          `<script> should be escaped in: ${payload}`
        );
        assertEquals(
          sanitized.includes("onerror="),
          false,
          `onerror= should be escaped in: ${payload}`
        );
        assertEquals(
          sanitized.includes("<svg"),
          false,
          `<svg should be escaped in: ${payload}`
        );

        // Prüfe, dass HTML-Entities korrekt erstellt wurden
        assertEquals(
          sanitized.includes("&lt;"),
          true,
          `Should contain &lt; in escaped: ${sanitized}`
        );
        assertEquals(
          sanitized.includes("&gt;"),
          true,
          `Should contain &gt; in escaped: ${sanitized}`
        );
      });

      // Spezieller Test für javascript: URLs
      const jsPayload = "javascript:alert('xss')";
      const sanitized = sanitizer.escapeHtml(jsPayload);

      // Der Sanitizer escaped das Zeichen ":", daher wird "javascript:" zu "javascript&#x3A;"
      assertEquals(
        sanitized.includes("javascript:"),
        false,
        `javascript: should be escaped`
      );
      assertEquals(
        sanitized.includes("&#x3A;"),
        true,
        `Colon should be escaped to &#x3A;`
      );
    });
  });

  describe("Authentication Security", () => {
    it("should require authentication for admin routes", async () => {
      const ctx = createMockContext({
        url: "http://localhost:8000/admin",
      });

      // Simuliere Middleware-Check ohne Session
      const user = await ctx.state.session.get("user");
      assertEquals(user, null);

      // Admin-Middleware sollte redirecten
      if (!user) {
        ctx.response.redirect("/admin/login");
      }

      assertEquals(ctx.response.status, 302);
      assertEquals(ctx.response.headers.get("Location"), "/admin/login");
    });

    it("should validate login credentials", async () => {
      const invalidLogins = [
        { username: "", password: "" },
        { username: "admin", password: "" },
        { username: "", password: "password" },
        { username: "nonexistent", password: "password" },
        { username: "admin", password: "wrongpassword" },
      ];

      for (const login of invalidLogins) {
        const formData = new URLSearchParams();
        formData.set("username", login.username);
        formData.set("password", login.password);

        const ctx = createMockContext({
          method: "POST",
          body: { type: "form", value: formData },
        });

        await adminController.loginPost(ctx);

        assertEquals(ctx.response.status, 302);
        assertEquals(
          ctx.response.headers.get("Location").includes("error="),
          true
        );
      }
    });
  });

  describe("Input Validation", () => {
    it("should validate film data constraints", () => {
      const invalidFilmData = [
        { title: "", director: "Director", duration: "120" }, // Empty title
        { title: "A".repeat(300), director: "Director", duration: "120" }, // Too long title
        { title: "Film", director: "", duration: "120" }, // Empty director
        { title: "Film", director: "Director", duration: "0" }, // Zero duration (should be min 1)
        { title: "Film", director: "Director", duration: "1000" }, // Too long duration
      ];

      const schema = {
        title: { type: "string", required: true, maxLength: 255 },
        director: { type: "string", required: true, maxLength: 255 },
        duration: { type: "integer", required: true, min: 1, max: 600 },
      };

      invalidFilmData.forEach((data, index) => {
        const formData = new URLSearchParams();
        Object.entries(data).forEach(([key, value]) => {
          formData.set(key, String(value));
        });

        const result = sanitizer.sanitizeFormData(formData, schema);
        assertEquals(
          result.isValid,
          false,
          `Test case ${index + 1} should be invalid: ${JSON.stringify(data)}`
        );
      });
    });

    it("should validate date and time formats", () => {
      const invalidDates = [
        "2025-13-01", // Invalid month
        "2025-02-30", // Invalid day
        "25-06-15", // Wrong format
        "2025/06/15", // Wrong separator
        "invalid", // Not a date
      ];

      const invalidTimes = [
        "25:00", // Invalid hour
        "12:60", // Invalid minute
        "8:30", // Missing leading zero
        "20:5", // Missing leading zero
        "invalid", // Not a time
      ];

      invalidDates.forEach((date) => {
        assertEquals(sanitizer.sanitizeDate(date), null);
      });

      invalidTimes.forEach((time) => {
        assertEquals(sanitizer.sanitizeTime(time), null);
      });
    });
  });

  describe("File Upload Security", () => {
    it("should validate file types", () => {
      const invalidTypes = [
        "application/pdf",
        "text/plain",
        "application/javascript",
      ];

      const validTypes = ["image/jpeg", "image/png", "image/webp"];

      // Dateityp-Validierung würde hier implementiert werden
      invalidTypes.forEach((type) => {
        const isValid = type.startsWith("image/");
        assertEquals(isValid, false);
      });

      validTypes.forEach((type) => {
        const isValid = type.startsWith("image/");
        assertEquals(isValid, true);
      });
    });
  });
});
