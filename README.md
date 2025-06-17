---

**Standard Admin-Account:**

- Benutzername: `admin`
- Passwort: `password`

---

### Installation

```bash
# Production
deno task start

# Development (mit Auto-Reload)
deno task dev
```

---

### Datenbank-Management

```bash
# Datenbank zurücksetzen
deno task db:reset

# Testdaten einfügen
deno task db:seed

# Vollständiger Reset mit Testdaten
deno task db:reset-and-seed

# Umfangreiche Testdaten
deno task db:full

# Datenbankstatistiken anzeigen
deno task db:stats

# Schema anzeigen
deno task db:schema
```

---

### Tests

```bash
# Alle Tests ausführen
deno task test:all

# Nur Unit-Tests
deno task test:unit

# Nur Integration-Tests
deno task test:integration

# Tests mit Coverage
deno task test:coverage
```

---

### Öffentliche Bereiche

- `/` - Startseite mit heutigem Programm
- `/programm` - Vollständige Programmübersicht
- `/film/:id` - Film-Detailseite
- `/preise` - Preisübersicht
- `/ueberuns` - Über das Theater
- `/impressum` - Impressum
- `/datenschutz` - Datenschutzerklärung
- `/kolophon` - Technische Informationen
- `/zeitleiste` - Projektverlauf
- `/www-dokumentation` - Technische Dokumentation

### Admin-Bereiche (geschützt)

- `/admin/login` - Admin-Anmeldung
- `/admin` - Dashboard (nur nach Login)
- `/admin/films` - Film-Verwaltung
- `/admin/films/update/:id` - Film bearbeiten
- `/admin/films/delete/:id` - Film löschen

---

### Tabelle: films

- `id` - Eindeutige Film-ID (Primärschlüssel)
- `title` - Filmtitel
- `director` - Regisseur
- `duration` - Filmdauer in Minuten
- `description` - Filmbeschreibung
- `cast` - Schauspieler
- `poster_url` - Pfad zum Poster-Bild
- `release_date` - Erscheinungsjahr
- `created_at` - Erstellungsdatum

### Tabelle: shows

- `id` - Eindeutige Vorstellungs-ID
- `film_id` - Verknüpfung zum Film (Fremdschlüssel)
- `date` - Vorstellungsdatum
- `time` - Vorstellungszeit
- `created_at` - Erstellungsdatum

### Tabelle: users

- `id` - Eindeutige Benutzer-ID
- `username` - Benutzername
- `password` - Gehashtes Passwort
- `created_at` - Erstellungsdatum

---

### Models (Datenbank)

- `filmModel.js` - Alle Datenbankoperationen für Filme
- `showModel.js` - Operationen für Vorstellungen
- `userModel.js` - Benutzer-Verwaltung

### Views (Templates)

- `layout.html` - Grundlayout mit Navigation
- `index.html` - Startseite
- `programm.html` - Programmübersicht
- `movieDetail.html` - Film-Detailseite
- `dashboard.html` - Admin-Dashboard
- `login.html` - Login-Seite

### Controllers (Geschäftslogik)

- `siteController.js` - Öffentliche Seiten
- `filmController.js` - Film-Verwaltung
- `adminController.js` - Admin-Funktionen

---

### Umgebungsvariablen

```bash
# Optional: Port für die Anwendung (Standard: 8000)
PORT=8000

# Optional: Datenbankpfad (Standard: ./cinema.db)
DATABASE_PATH=./cinema.db
```

---

### Code-Struktur

```
src/
├── controllers/     # Controller
├── models/         # Datenbank-Models
├── routes/         # URL-Routing
├── templates/      # HTML-Templates (Views)
├── middleware/     # Eigene Middleware
├── services/       # Hilfsdienste
└── utils/          # Utility-Funktionen
```
