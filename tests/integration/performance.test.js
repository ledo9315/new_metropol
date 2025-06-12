// Performance und Load Tests
import { assertEquals } from "@std/assert";
import { describe, it, beforeEach, afterEach } from "@std/testing";
import { TestDatabase } from "../utils/testHelpers.js";
import { filmService } from "../../src/models/filmModel.js";
import { showService } from "../../src/models/showModel.js";

describe("Performance Tests", () => {
  let testDb;
  let originalDb;

  beforeEach(() => {
    testDb = new TestDatabase();
    originalDb = globalThis.db;
    globalThis.db = testDb;
  });

  afterEach(() => {
    testDb.close();
    globalThis.db = originalDb;
  });

  describe("Database Performance", () => {
    it("should handle bulk film creation efficiently", () => {
      const startTime = performance.now();
      const filmIds = [];

      // Erstelle 100 Filme
      for (let i = 0; i < 100; i++) {
        const filmId = filmService.createFilm({
          title: `Performance Test Film ${i}`,
          director: `Director ${i}`,
          duration: 90 + (i % 120),
        });
        filmIds.push(filmId);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Sollte unter 1 Sekunde dauern
      assertEquals(duration < 1000, true);
      assertEquals(filmIds.length, 100);
    });

    it("should retrieve films efficiently", () => {
      // Erstelle Test-Daten
      for (let i = 0; i < 50; i++) {
        filmService.createFilm({
          title: `Test Film ${i}`,
          director: `Director ${i}`,
          duration: 120,
        });
      }

      const startTime = performance.now();
      const films = filmService.getAllFilms();
      const endTime = performance.now();

      const duration = endTime - startTime;

      // Retrieval sollte sehr schnell sein
      assertEquals(duration < 100, true);
      assertEquals(films.length >= 50, true);
    });

    it("should handle concurrent show queries", async () => {
      // Erstelle Test-Film und Shows
      const filmId = filmService.createFilm({
        title: "Concurrent Test Film",
        director: "Director",
        duration: 100,
      });

      for (let i = 0; i < 20; i++) {
        showService.createShow({
          film_id: filmId,
          date: `2025-${String(6 + (i % 6)).padStart(2, "0")}-${String(
            1 + (i % 28)
          ).padStart(2, "0")}`,
          time: `${18 + (i % 4)}:00`,
        });
      }

      // Teste gleichzeitige Abfragen
      const startTime = performance.now();
      const promises = [];

      for (let i = 0; i < 10; i++) {
        promises.push(Promise.resolve(showService.getShowsByFilmId(filmId)));
      }

      const results = await Promise.all(promises);
      const endTime = performance.now();

      assertEquals(results.length, 10);
      assertEquals(results[0].length, 20);
      assertEquals(endTime - startTime < 500, true);
    });
  });

  describe("Memory Usage Tests", () => {
    it("should not leak memory during repeated operations", () => {
      const initialMemory = Deno.memoryUsage().heapUsed;

      // Führe viele Operationen aus
      for (let i = 0; i < 1000; i++) {
        const filmId = filmService.createFilm({
          title: `Memory Test ${i}`,
          director: "Director",
          duration: 90,
        });

        showService.createShow({
          film_id: filmId,
          date: "2025-06-15",
          time: "20:00",
        });

        // Lösche wieder
        filmService.deleteFilm(filmId);
      }

      const finalMemory = Deno.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory-Increase sollte begrenzt sein (unter 50MB)
      assertEquals(memoryIncrease < 50 * 1024 * 1024, true);
    });
  });
});
