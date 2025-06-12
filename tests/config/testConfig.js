// Test-Konfiguration und Setup
export const testConfig = {
  // Database-Konfiguration für Tests
  database: {
    type: "memory", // Verwende In-Memory-Database für Tests
    path: ":memory:",
    options: {
      enableForeignKeys: true,
      enableJournal: true,
    },
  },

  // Test-Server-Konfiguration
  server: {
    basePort: 8001,
    maxRetries: 10,
    timeout: 5000,
  },

  // Test-Timeouts
  timeouts: {
    unit: 1000, // 1 Sekunde für Unit-Tests
    integration: 5000, // 5 Sekunden für Integration-Tests
    e2e: 10000, // 10 Sekunden für E2E-Tests
  },

  // Coverage-Einstellungen
  coverage: {
    enabled: true,
    threshold: 80, // Mindestens 80% Code-Coverage
    exclude: ["tests/", "public/", "src/templates/"],
  },

  // Mock-Daten für Tests
  mockData: {
    users: [
      {
        username: "testadmin",
        password:
          "$2a$10$N9qo8uLOickgx2ZMRZoMye.fgsUOUZTTh.8T1xh8ZvBs4iSGOB8J6", // "secret"
      },
    ],
    films: [
      {
        title: "Test Film 1",
        director: "Test Director 1",
        duration: 120,
        description: "Ein Testfilm für automatisierte Tests",
        cast: "Test Actor 1, Test Actor 2",
        poster_url: "https://example.com/poster1.jpg",
        release_date: "2025-06-15",
      },
      {
        title: "Test Film 2",
        director: "Test Director 2",
        duration: 95,
        description: "Noch ein Testfilm",
        cast: "Test Actor 3, Test Actor 4",
        poster_url: "https://example.com/poster2.jpg",
        release_date: "2025-07-01",
      },
    ],
    shows: [
      { date: "2025-06-15", time: "20:00" },
      { date: "2025-06-15", time: "22:30" },
      { date: "2025-06-16", time: "19:00" },
      { date: "2025-06-16", time: "21:30" },
    ],
  },

  // Test-Kategorien
  categories: {
    unit: {
      pattern: "tests/unit/**/*.test.js",
      parallel: true,
      timeout: 1000,
    },
    integration: {
      pattern: "tests/integration/**/*.test.js",
      parallel: false,
      timeout: 5000,
    },
    security: {
      pattern: "tests/integration/security.test.js",
      parallel: false,
      timeout: 3000,
    },
    performance: {
      pattern: "tests/integration/performance.test.js",
      parallel: false,
      timeout: 10000,
    },
  },

  // Reporting-Optionen
  reporting: {
    formats: ["console", "json", "html"],
    outputDir: "test-results",
    detailedErrors: true,
    showStackTrace: true,
  },
};

// Test-Utilities für Setup und Teardown
export class TestEnvironment {
  constructor() {
    this.originalEnv = {};
    this.testDb = null;
  }

  setup() {
    // Sichere Original-Environment-Variablen
    this.originalEnv = {
      NODE_ENV: Deno.env.get("NODE_ENV"),
      DATABASE_PATH: Deno.env.get("DATABASE_PATH"),
    };

    // Setze Test-Environment
    Deno.env.set("NODE_ENV", "test");
    Deno.env.set("DATABASE_PATH", ":memory:");

    console.log("🔧 Test-Umgebung wurde eingerichtet");
  }

  teardown() {
    // Stelle Original-Environment wieder her
    Object.entries(this.originalEnv).forEach(([key, value]) => {
      if (value) {
        Deno.env.set(key, value);
      } else {
        Deno.env.delete(key);
      }
    });

    if (this.testDb) {
      this.testDb.close();
    }

    console.log("🧹 Test-Umgebung wurde aufgeräumt");
  }
}

// Test-Matcher für erweiterte Assertions
export const customMatchers = {
  toBeValidDate: (actual) => {
    const date = new Date(actual);
    return !isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(actual);
  },

  toBeValidTime: (actual) => {
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(actual);
  },

  toBeValidUrl: (actual) => {
    try {
      new URL(actual);
      return true;
    } catch {
      return false;
    }
  },

  toHaveProperty: (actual, property) => {
    return Object.prototype.hasOwnProperty.call(actual, property);
  },

  toBeWithinRange: (actual, min, max) => {
    return actual >= min && actual <= max;
  },
};

export default testConfig;
