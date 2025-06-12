// Unit Tests für Sanitizer
import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing";
import { sanitizer } from "../../src/utils/sanitizer.js";

describe("Sanitizer Unit Tests", () => {
  describe("sanitizeInteger", () => {
    it("should convert valid string numbers to integers", () => {
      assertEquals(sanitizer.sanitizeInteger("123"), 123);
      assertEquals(sanitizer.sanitizeInteger("0"), 0);
    });

    it("should return null for invalid inputs", () => {
      assertEquals(sanitizer.sanitizeInteger("abc"), null);
      assertEquals(sanitizer.sanitizeInteger("12.5"), null);
      assertEquals(sanitizer.sanitizeInteger(""), null);
      assertEquals(sanitizer.sanitizeInteger(null), null);
    });

    it("should handle negative numbers", () => {
      assertEquals(sanitizer.sanitizeInteger("-5"), -5);
    });
  });

  describe("sanitizeDate", () => {
    it("should validate correct date formats", () => {
      assertEquals(sanitizer.sanitizeDate("2025-06-15"), "2025-06-15");
      assertEquals(sanitizer.sanitizeDate("2025-12-31"), "2025-12-31");
    });

    it("should reject invalid date formats", () => {
      assertEquals(sanitizer.sanitizeDate("15.06.2025"), null);
      assertEquals(sanitizer.sanitizeDate("2025/06/15"), null);
      assertEquals(sanitizer.sanitizeDate("invalid"), null);
      assertEquals(sanitizer.sanitizeDate(""), null);
    });

    it("should reject impossible dates", () => {
      assertEquals(sanitizer.sanitizeDate("2025-13-01"), null);
      assertEquals(sanitizer.sanitizeDate("2025-02-30"), null);
    });
  });

  describe("sanitizeTime", () => {
    it("should validate correct time formats", () => {
      assertEquals(sanitizer.sanitizeTime("20:30"), "20:30");
      assertEquals(sanitizer.sanitizeTime("08:00"), "08:00");
      assertEquals(sanitizer.sanitizeTime("23:59"), "23:59");
    });

    it("should reject invalid time formats", () => {
      assertEquals(sanitizer.sanitizeTime("25:00"), null);
      assertEquals(sanitizer.sanitizeTime("12:60"), null);
      assertEquals(sanitizer.sanitizeTime("8:30"), null); // Missing leading zero
      assertEquals(sanitizer.sanitizeTime("invalid"), null);
    });
  });

  describe("detectSqlInjection", () => {
    it("should detect common SQL injection patterns", () => {
      assertEquals(
        sanitizer.detectSqlInjection("'; DROP TABLE users; --"),
        true
      );
      assertEquals(sanitizer.detectSqlInjection("1' OR '1'='1"), true);
      assertEquals(sanitizer.detectSqlInjection("UNION SELECT * FROM"), true);
    });

    it("should allow safe content", () => {
      assertEquals(sanitizer.detectSqlInjection("Normal movie title"), false);
      assertEquals(sanitizer.detectSqlInjection("Director's Name"), false);
      assertEquals(sanitizer.detectSqlInjection("2025-06-15"), false);
    });
  });

  describe("sanitizeFormData", () => {
    const schema = {
      title: { type: "string", required: true, maxLength: 100 },
      duration: { type: "integer", required: true, min: 1, max: 600 },
      description: { type: "string", required: false, maxLength: 1000 },
    };

    it("should validate correct form data", () => {
      const formData = new URLSearchParams();
      formData.set("title", "Test Movie");
      formData.set("duration", "120");
      formData.set("description", "A great movie");

      const result = sanitizer.sanitizeFormData(formData, schema);

      assertEquals(result.isValid, true);
      assertEquals(result.data.title, "Test Movie");
      assertEquals(result.data.duration, 120);
    });

    it("should reject missing required fields", () => {
      const formData = new URLSearchParams();
      formData.set("description", "Missing title and duration");

      const result = sanitizer.sanitizeFormData(formData, schema);

      assertEquals(result.isValid, false);
      assertEquals(result.errors.length > 0, true);
    });

    it("should reject values exceeding length limits", () => {
      const formData = new URLSearchParams();
      formData.set("title", "A".repeat(150));
      formData.set("duration", "120");

      const result = sanitizer.sanitizeFormData(formData, schema);

      assertEquals(result.isValid, false);
    });
  });
});
