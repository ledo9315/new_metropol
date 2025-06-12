// Test Utilities und Helper-Funktionen
import { DB } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";
import { Application } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { Session } from "https://deno.land/x/oak_sessions@v4.0.1/mod.ts";

export class TestDatabase {
  constructor() {
    this.db = new DB(":memory:");
    // Aktiviere Foreign Key Constraints
    this.db.query("PRAGMA foreign_keys = ON");
    this.setupSchema();
  }

  setupSchema() {
    this.db.query(`
      CREATE TABLE IF NOT EXISTS films (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        director TEXT NOT NULL,
        duration INTEGER NOT NULL,
        description TEXT,
        cast TEXT,
        poster_url TEXT,
        release_date DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.query(`
      CREATE TABLE IF NOT EXISTS shows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        film_id INTEGER NOT NULL,
        date DATE NOT NULL,
        time TIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (film_id) REFERENCES films(id) ON DELETE CASCADE
      )
    `);

    this.db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  seedData() {
    this.db.query(
      "INSERT INTO films (title, director, duration, description) VALUES (?, ?, ?, ?)",
      ["Test Film", "Test Director", 120, "Test Description"]
    );
    const filmId = this.db.lastInsertRowId;

    this.db.query("INSERT INTO shows (film_id, date, time) VALUES (?, ?, ?)", [
      filmId,
      "2025-06-15",
      "20:00",
    ]);

    // Test-User mit gehashtem Passwort
    const hashedPassword =
      "$2a$10$N9qo8uLOickgx2ZMRZoMye.fgsUOUZTTh.8T1xh8ZvBs4iSGOB8J6"; // "secret"
    this.db.query("INSERT INTO users (username, password) VALUES (?, ?)", [
      "testuser",
      hashedPassword,
    ]);
  }

  close() {
    this.db.close();
  }

  query(sql, params = []) {
    try {
      return this.db.query(sql, params);
    } catch (error) {
      console.error("Database query error:", error.message);
      throw error;
    }
  }

  // Implementiere die gleichen Methoden wie SecureDatabase
  safeQuery(sql, params = []) {
    return this.query(sql, params);
  }

  safeQueryEntries(sql, params = []) {
    try {
      return this.db.queryEntries(sql, params);
    } catch (error) {
      console.error("Database query error:", error.message);
      throw error;
    }
  }

  internalQuery(sql, params = []) {
    return this.query(sql, params);
  }

  internalQueryEntries(sql, params = []) {
    return this.safeQueryEntries(sql, params);
  }

  transaction(callback) {
    this.db.query("BEGIN TRANSACTION");
    try {
      const result = callback(this);
      this.db.query("COMMIT");
      return result;
    } catch (error) {
      this.db.query("ROLLBACK");
      throw error;
    }
  }

  get lastInsertId() {
    return this.db.lastInsertRowId;
  }
}

export function createTestApp() {
  const app = new Application();
  app.use(Session.initMiddleware());
  return app;
}

export function createMockContext(options = {}) {
  const ctx = {
    request: {
      url: new URL(options.url || "http://localhost:8000/"),
      method: options.method || "GET",
      body: () => options.body || { type: "json", value: {} },
      headers: new Headers(options.headers || {}),
    },
    response: {
      status: 200,
      body: null,
      headers: new Headers(),
      redirect: (url) => {
        ctx.response.status = 302;
        ctx.response.headers.set("Location", url);
      },
    },
    params: options.params || {},
    state: {
      session: {
        get: (key) => options.session?.[key] || null,
        set: (key, value) => {
          if (!options.session) options.session = {};
          options.session[key] = value;
          return Promise.resolve();
        },
      },
    },
  };
  return ctx;
}

export function createFormData(data) {
  // Erstelle eine echte Map für Oak FormData
  const formDataMap = new Map();

  for (const [key, value] of Object.entries(data)) {
    formDataMap.set(key, value);
  }

  // Überschreibe die get-Methode für korrekte Funktionalität
  const originalGet = formDataMap.get.bind(formDataMap);
  formDataMap.get = (key) => {
    const value = originalGet(key);
    return value !== undefined ? value : null;
  };

  return {
    type: "form",
    value: Promise.resolve(formDataMap),
  };
}

// Neue Hilfsfunktion um URLSearchParams zu erstellen (für Standard FormData)
export function createURLSearchParams(data) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(data)) {
    if (value !== null && value !== undefined) {
      params.append(key, value.toString());
    }
  }

  return params;
}

export const testFilmData = {
  valid: {
    title: "Avengers: Endgame",
    director: "Anthony Russo",
    duration: "181",
    description: "The epic conclusion to the Infinity Saga",
    cast: "Robert Downey Jr., Chris Evans",
    release_date: "2019",
  },
  invalid: {
    empty: {},
    invalidDuration: {
      title: "Test Film",
      director: "Test Director",
      duration: "-5",
      description: "Test description",
      cast: "Test cast",
      release_date: "2019",
    },
    tooLongTitle: {
      title: "A".repeat(300),
      director: "Test Director",
      duration: "120",
      description: "Test description",
      cast: "Test cast",
      release_date: "2019",
    },
  },
};

export const testShowData = {
  valid: {
    date: "2025-06-15",
    time: "20:00",
  },
  invalid: {
    pastDate: {
      date: "2020-01-01",
      time: "20:00",
    },
    invalidTime: {
      date: "2025-06-15",
      time: "25:00",
    },
  },
};

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
