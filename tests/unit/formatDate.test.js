// Unit Tests für formatDate utility
import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing";
import * as formatDate from "../../src/utils/formatDate.js";

describe("FormatDate Unit Tests", () => {
  describe("getTodayDate", () => {
    it("should return today's date in ISO format", () => {
      const today = formatDate.getTodayDate();
      // Verwende lokale Zeit statt UTC für konsistente Tests
      const expected = formatDate.formatDate(new Date());
      assertEquals(today, expected);
    });
  });

  describe("getTomorrowDate", () => {
    it("should return tomorrow's date in ISO format", () => {
      const tomorrow = formatDate.getTomorrowDate();
      const expected = new Date();
      expected.setDate(expected.getDate() + 1);
      const expectedString = formatDate.formatDate(expected);
      assertEquals(tomorrow, expectedString);
    });
  });

  describe("getDayAfterTomorrowDate", () => {
    it("should return day after tomorrow's date in ISO format", () => {
      const dayAfterTomorrow = formatDate.getDayAfterTomorrowDate();
      const expected = new Date();
      expected.setDate(expected.getDate() + 2);
      const expectedString = formatDate.formatDate(expected);
      assertEquals(dayAfterTomorrow, expectedString);
    });
  });

  describe("formatDate", () => {
    it("should format Date object to ISO string", () => {
      const date = new Date("2025-06-15T12:00:00Z");
      const formatted = formatDate.formatDate(date);
      assertEquals(formatted, "2025-06-15");
    });

    it("should handle different date inputs", () => {
      const testCases = [
        { input: new Date("2025-01-01"), expected: "2025-01-01" },
        { input: new Date("2025-12-31"), expected: "2025-12-31" },
      ];

      testCases.forEach(({ input, expected }) => {
        assertEquals(formatDate.formatDate(input), expected);
      });
    });
  });
});
