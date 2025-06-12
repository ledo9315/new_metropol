// Integration Tests für Database Operations
import { assertEquals, assertExists } from "@std/assert";
import { describe, it, beforeEach, afterEach } from "@std/testing";
import { TestDatabase } from "../utils/testHelpers.js";
import { filmService } from "../../src/models/filmModel.js";
import { showService } from "../../src/models/showModel.js";

describe("Database Integration Tests", () => {
  let testDb;
  let originalDb;

  beforeEach(() => {
    testDb = new TestDatabase();
    testDb.seedData();

    // Mock der globalen Database-Instanz
    originalDb = globalThis.db;
    globalThis.db = testDb;
  });

  afterEach(() => {
    testDb.close();
    globalThis.db = originalDb;
  });

  describe("Film Service Integration", () => {
    it("should create and retrieve films", () => {
      const filmData = {
        title: "Integration Test Film",
        director: "Test Director",
        duration: 120,
        description: "A test film for integration testing",
      };

      const filmId = filmService.createFilm(filmData);
      assertExists(filmId);
      assertEquals(typeof filmId, "number");

      const retrievedFilm = filmService.getFilmById(filmId);
      assertExists(retrievedFilm);
      assertEquals(retrievedFilm.title, filmData.title);
      assertEquals(retrievedFilm.director, filmData.director);
    });

    it("should update existing films", () => {
      const originalFilm = filmService.getFilmById(1);
      assertExists(originalFilm);

      const updateData = {
        title: "Updated Film Title",
        director: originalFilm.director,
        duration: originalFilm.duration,
      };

      filmService.updateFilm(1, updateData);

      const updatedFilm = filmService.getFilmById(1);
      assertEquals(updatedFilm.title, "Updated Film Title");
    });

    it("should delete films and cascade to shows", () => {
      // Erstelle einen Film mit Shows
      const filmId = filmService.createFilm({
        title: "Film to Delete",
        director: "Director",
        duration: 90,
      });

      showService.createShow({
        film_id: filmId,
        date: "2025-06-20",
        time: "19:00",
      });

      // Prüfe dass Film und Show existieren
      assertExists(filmService.getFilmById(filmId));
      const showsBefore = showService.getShowsByFilmId(filmId);
      assertEquals(showsBefore.length, 1);

      // Lösche Film
      filmService.deleteFilm(filmId);

      // Prüfe dass Film und Shows gelöscht wurden
      assertEquals(filmService.getFilmById(filmId), null);
      const showsAfter = showService.getShowsByFilmId(filmId);
      assertEquals(showsAfter.length, 0);
    });
  });

  describe("Show Service Integration", () => {
    it("should create shows linked to films", () => {
      const showData = {
        film_id: 1,
        date: "2025-07-01",
        time: "21:00",
      };

      const showId = showService.createShow(showData);
      assertExists(showId);

      const retrievedShow = showService.getShowById(showId);
      assertExists(retrievedShow);
      assertEquals(retrievedShow.film_id, 1);
      assertEquals(retrievedShow.date, "2025-07-01");
    });

    it("should retrieve shows by date", () => {
      // Erstelle Shows für verschiedene Daten
      showService.createShow({
        film_id: 1,
        date: "2025-08-01",
        time: "20:00",
      });

      showService.createShow({
        film_id: 1,
        date: "2025-08-01",
        time: "22:30",
      });

      showService.createShow({
        film_id: 1,
        date: "2025-08-02",
        time: "19:00",
      });

      const showsAug1 = showService.getShowsByDate("2025-08-01");
      assertEquals(showsAug1.length, 2);

      const showsAug2 = showService.getShowsByDate("2025-08-02");
      assertEquals(showsAug2.length, 1);
    });
  });

  describe("Cross-Service Operations", () => {
    it("should handle complex film and show operations", () => {
      // Erstelle Film
      const filmId = filmService.createFilm({
        title: "Complex Test Film",
        director: "Test Director",
        duration: 150,
      });

      // Erstelle mehrere Shows
      const showIds = [];
      for (let i = 0; i < 3; i++) {
        const showId = showService.createShow({
          film_id: filmId,
          date: `2025-09-${10 + i}`,
          time: "20:00",
        });
        showIds.push(showId);
      }

      // Prüfe Film-Show-Verknüpfung
      const filmShows = showService.getShowsByFilmId(filmId);
      assertEquals(filmShows.length, 3);

      // Update einzelne Show
      showService.updateShow(showIds[0], {
        film_id: filmId,
        date: "2025-09-10",
        time: "21:30",
      });

      const updatedShow = showService.getShowById(showIds[0]);
      assertEquals(updatedShow.time, "21:30");

      // Lösche eine Show
      showService.deleteShow(showIds[1]);

      const remainingShows = showService.getShowsByFilmId(filmId);
      assertEquals(remainingShows.length, 2);
    });
  });
});
