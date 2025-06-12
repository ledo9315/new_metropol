# Test-Setup für Metropol Kino-Website

## 🧪 Test-Struktur

```
tests/
├── config/
│   └── testConfig.js        # Zentrale Test-Konfiguration
├── utils/
│   └── testHelpers.js       # Test-Utilities und Mock-Funktionen
├── unit/                    # Unit-Tests für einzelne Komponenten
│   ├── filmController.test.js
│   ├── siteController.test.js
│   ├── sanitizer.test.js
│   └── formatDate.test.js
├── integration/             # Integration-Tests für Systemkomponenten
│   ├── database.test.js     # Database-Operations
│   ├── filmApi.test.js      # API-Endpunkte
│   ├── performance.test.js  # Performance-Tests
│   └── security.test.js     # Security-Tests
└── testRunner.js           # Haupt-Test-Runner
```

## 🚀 Test-Ausführung

### Alle Tests ausführen

```bash
deno task test
```

### Nur Unit-Tests

```bash
deno task test:unit
```

### Nur Integration-Tests

```bash
deno task test:integration
```

### Tests mit Coverage

```bash
deno task test:coverage
```

### Tests im Watch-Modus

```bash
deno task test:watch
```

## 📊 Test-Kategorien

### Unit-Tests

- **FilmController**: CRUD-Operationen für Filme
- **SiteController**: Public-Seiten und Navigation
- **Sanitizer**: Input-Validation und Sanitization
- **FormatDate**: Datums-Utilities

### Integration-Tests

- **Database**: Cross-Service Database-Operationen
- **API-Endpoints**: HTTP-Request/Response-Zyklen
- **Performance**: Load- und Performance-Tests
- **Security**: SQL-Injection, XSS, Authentication

## 🛡️ Security-Tests

Das Setup testet explizit gegen:

- SQL-Injection-Attacken
- Cross-Site Scripting (XSS)
- Ungültige Authentication
- Input-Validation-Bypässe
- Unsafe File-Uploads

## 📈 Performance-Tests

- Bulk-Operations (100+ Datensätze)
- Concurrent Database-Queries
- Memory-Leak-Detection
- Response-Time-Validierung

## 🔧 Test-Konfiguration

### Mock-Database

- In-Memory SQLite für isolierte Tests
- Automatisches Schema-Setup
- Seed-Data für konsistente Tests

### Test-Daten

```javascript
// Vordefinierte Test-Filme
const testFilmData = {
  valid: {
    title: "Avengers: Endgame",
    director: "Anthony Russo",
    duration: 181,
    // ...
  },
};
```

### Custom Assertions

```javascript
// Erweiterte Matcher
assertEquals(customMatchers.toBeValidDate("2025-06-15"), true);
assertEquals(customMatchers.toBeValidTime("20:30"), true);
assertEquals(customMatchers.toBeValidUrl("https://example.com"), true);
```

## 🎯 Test-Best-Practices

### 1. Test-Isolation

- Jeder Test läuft in isolierter Umgebung
- Fresh Database pro Test-Suite
- Keine Test-Dependencies

### 2. Comprehensive Coverage

- Unit-Tests für Business-Logic
- Integration-Tests für System-Interaction
- Security-Tests für Vulnerability-Detection

### 3. Realistic Test-Data

- Production-ähnliche Datensätze
- Edge-Cases und Error-Scenarios
- Internationalization (Deutsche Inhalte)

### 4. Performance-Monitoring

- Response-Time-Thresholds
- Memory-Usage-Tracking
- Concurrent-Load-Testing

## 🔍 Debugging

### Test-Logs

```bash
# Detaillierte Logs
deno task test -- --verbose

# Einzelner Test
deno test tests/unit/filmController.test.js
```

### Coverage-Report

```bash
deno task test:coverage
# Generiert HTML-Report in coverage/
```

## 📝 Neue Tests hinzufügen

### Unit-Test-Template

```javascript
import { assertEquals } from "std/assert";
import { describe, it, beforeEach, afterEach } from "std/testing/bdd.ts";

describe("ComponentName Unit Tests", () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it("should do something specific", () => {
    // Test implementation
    assertEquals(actual, expected);
  });
});
```

### Integration-Test-Template

```javascript
import { TestDatabase, createMockContext } from "../utils/testHelpers.js";

describe("FeatureName Integration Tests", () => {
  let testDb;

  beforeEach(() => {
    testDb = new TestDatabase();
    testDb.seedData();
  });

  afterEach(() => {
    testDb.close();
  });

  // Tests hier...
});
```

## 🎉 Erfolgs-Metriken

Das Test-Setup zielt auf:

- **90%+** Code-Coverage
- **< 100ms** Unit-Test-Execution
- **< 5s** Integration-Test-Suite
- **0** Security-Vulnerabilities
- **< 50MB** Memory-Footprint

## 🔗 Kontinuierliche Integration

Tests sind optimiert für:

- GitHub Actions
- GitLab CI/CD
- Jenkins
- Lokale Pre-Commit-Hooks
