// Unit Tests für SiteController
import { assertEquals, assertExists } from "@std/assert";
import { describe, it, beforeEach, afterEach } from "@std/testing";
import { siteController } from "../../src/controllers/siteController.js";
import { TestDatabase, createMockContext } from "../utils/testHelpers.js";

describe("SiteController Unit Tests", () => {
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

  describe("home", () => {
    it("should render home page with show data", async () => {
      const ctx = createMockContext();

      await siteController.home(ctx);

      assertExists(ctx.response.body);
      assertEquals(typeof ctx.response.body, "string");
    });
  });

  describe("programm", () => {
    it("should render program page with upcoming shows", async () => {
      const ctx = createMockContext();

      await siteController.programm(ctx);

      assertExists(ctx.response.body);
      assertEquals(typeof ctx.response.body, "string");
    });
  });

  describe("filmDetail", () => {
    it("should render film detail for existing film", async () => {
      const ctx = createMockContext({
        params: { id: "1" },
      });

      await siteController.filmDetail(ctx);

      assertExists(ctx.response.body);
    });

    it("should return 404 for non-existent film", async () => {
      const ctx = createMockContext({
        params: { id: "999" },
      });

      await siteController.filmDetail(ctx);

      assertEquals(ctx.response.status, 404);
      assertEquals(ctx.response.body.error, "Film nicht gefunden");
    });
  });

  describe("static pages", () => {
    const staticPages = [
      { method: "about", template: "ueberuns.html" },
      { method: "prices", template: "preise.html" },
      { method: "imprint", template: "impressum.html" },
      { method: "privacy", template: "datenschutz.html" },
      { method: "kolophon", template: "kolophon.html" },
      { method: "timeline", template: "zeitleiste.html" },
      { method: "documentation", template: "www-dokumentation.html" },
    ];

    staticPages.forEach(({ method }) => {
      it(`should render ${method} page`, async () => {
        const ctx = createMockContext();

        await siteController[method](ctx);

        assertExists(ctx.response.body);
        assertEquals(typeof ctx.response.body, "string");
      });
    });
  });
});
