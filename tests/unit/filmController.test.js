// Unit Tests für FilmController
import { assertEquals, assertExists } from "@std/assert";
import { describe, it, beforeEach, afterEach } from "@std/testing";
import { filmController } from "../../src/controllers/filmController.js";
import {
  TestDatabase,
  createMockContext,
  createFormData,
  testFilmData,
} from "../utils/testHelpers.js";

describe("FilmController Unit Tests", () => {
  let testDb;
  let originalDb;

  beforeEach(() => {
    testDb = new TestDatabase();
    testDb.seedData();

    // Mock der Database für Tests
    originalDb = globalThis.db;
    globalThis.db = testDb;
  });

  afterEach(() => {
    testDb.close();
    globalThis.db = originalDb;
  });

  describe("index", () => {
    it("should return all films successfully", async () => {
      const ctx = createMockContext();

      await filmController.index(ctx);

      assertEquals(ctx.response.status, 200);
      assertExists(ctx.response.body);
      assertExists(ctx.response.body.films);
    });

    it("should handle database errors gracefully", async () => {
      const ctx = createMockContext();

      // Importiere den filmService direkt
      const { filmService } = await import("../../src/models/filmModel.js");

      // Mock der getAllFilms Methode
      const originalGetAllFilms = filmService.getAllFilms;
      filmService.getAllFilms = () => {
        throw new Error("Database connection failed");
      };

      await filmController.index(ctx);

      assertEquals(ctx.response.status, 500);
      assertEquals(ctx.response.body.error, "Failed to retrieve films");

      // Stelle den ursprünglichen Service wieder her
      filmService.getAllFilms = originalGetAllFilms;
    });
  });

  describe("create", () => {
    it("should create a film with valid data", async () => {
      const ctx = createMockContext({
        method: "POST",
        body: createFormData({
          ...testFilmData.valid,
          poster_url: "http://example.com/poster.jpg",
        }),
      });

      await filmController.create(ctx);

      assertEquals(ctx.response.status, 302);
      const location = ctx.response.headers.get("Location");
      console.log("Debug - Actual location:", location); // Debug-Ausgabe
      assertEquals(location.includes("/admin?message="), true);
    });

    it("should reject empty form data", async () => {
      const ctx = createMockContext({
        method: "POST",
        body: createFormData({}),
      });

      await filmController.create(ctx);

      assertEquals(ctx.response.status, 302);
      assertEquals(
        ctx.response.headers.get("Location").includes("error="),
        true
      );
    });

    it("should reject invalid duration", async () => {
      const ctx = createMockContext({
        method: "POST",
        body: createFormData({
          title: "Test Film",
          director: "Test Director",
          duration: "abc", // Invalid duration
          description: "Test description",
          cast: "Test cast",
          release_date: "2019",
        }),
      });

      await filmController.create(ctx);

      assertEquals(ctx.response.status, 302);
      assertEquals(
        ctx.response.headers.get("Location").includes("error="),
        true
      );
    });

    it("should create film with shows", async () => {
      const formData = createFormData({
        ...testFilmData.valid,
        poster_url: "http://example.com/poster.jpg",
        "shows[0][date]": "2025-06-15",
        "shows[0][time]": "20:00",
        "shows[1][date]": "2025-06-16",
        "shows[1][time]": "22:30",
      });

      const ctx = createMockContext({
        method: "POST",
        body: formData,
      });

      await filmController.create(ctx);

      assertEquals(ctx.response.status, 302);
      const location = ctx.response.headers.get("Location");
      assertEquals(location.includes("message="), true);
    });
  });

  describe("update", () => {
    it("should update an existing film", async () => {
      const ctx = createMockContext({
        method: "POST",
        params: { id: "1" },
        body: createFormData({
          ...testFilmData.valid,
          title: "Updated Title",
        }),
      });

      await filmController.update(ctx);

      assertEquals(ctx.response.status, 302);
      assertEquals(
        ctx.response.headers.get("Location").includes("message="),
        true
      );
    });

    it("should reject invalid film ID", async () => {
      const ctx = createMockContext({
        method: "POST",
        params: { id: "invalid" },
        body: createFormData(testFilmData.valid),
      });

      await filmController.update(ctx);

      assertEquals(ctx.response.status, 400);
      assertEquals(ctx.response.body.error, "Invalid film ID");
    });

    it("should handle non-existent film ID", async () => {
      const ctx = createMockContext({
        method: "POST",
        params: { id: "999" },
        body: createFormData(testFilmData.valid),
      });

      await filmController.update(ctx);

      assertEquals(ctx.response.status, 302);
      const location = ctx.response.headers.get("Location");
      console.log("Debug - Non-existent film location:", location); // Debug-Ausgabe
      // Der Controller redirected zu /admin?error= bei nicht-existierenden Filmen
      assertEquals(location.includes("error="), true);
    });
  });

  describe("delete", () => {
    it("should delete an existing film", async () => {
      const ctx = createMockContext({
        method: "POST",
        params: { id: "1" },
      });

      await filmController.delete(ctx);

      assertEquals(ctx.response.status, 302);
      assertEquals(
        ctx.response.headers.get("Location").includes("message="),
        true
      );
    });

    it("should reject invalid film ID", async () => {
      const ctx = createMockContext({
        method: "POST",
        params: { id: "invalid" },
      });

      await filmController.delete(ctx);

      assertEquals(ctx.response.status, 400);
      assertEquals(ctx.response.body.error, "Invalid film ID");
    });
  });
});
