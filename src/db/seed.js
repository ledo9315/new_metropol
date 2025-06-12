// db/seed.js
import { db } from "./database.js";

export class DatabaseSeed {
  // Datenbank komplett zurücksetzen
  static resetDatabase() {
    console.log("🗑️  Setze Datenbank zurück...");

    db.transaction(() => {
      // Alle Tabellen leeren (in der richtigen Reihenfolge wegen Foreign Keys)
      db.internalQuery("DELETE FROM shows");
      db.internalQuery("DELETE FROM films");
      db.internalQuery("DELETE FROM users");

      // Auto-Increment zurücksetzen
      db.internalQuery(
        "DELETE FROM sqlite_sequence WHERE name IN ('films', 'shows', 'users')"
      );
    });

    console.log("✅ Datenbank erfolgreich zurückgesetzt");
  }

  // Schema neu erstellen (falls Tabellen nicht existieren)
  static createSchema() {
    console.log("📋 Erstelle Datenbankschema...");

    // Filme-Tabelle
    db.schemaQuery(`
      CREATE TABLE IF NOT EXISTS films (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        director TEXT,
        duration INTEGER,
        description TEXT,
        cast TEXT,
        release_date TEXT,
        poster_url TEXT
      )
    `);

    // Vorstellungen-Tabelle
    db.schemaQuery(`
      CREATE TABLE IF NOT EXISTS shows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        film_id INTEGER,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        FOREIGN KEY (film_id) REFERENCES films(id)
      )
    `);

    // Benutzer-Tabelle
    db.schemaQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      )
    `);

    console.log("✅ Schema erfolgreich erstellt");
  }

  // Beispieldaten einfügen
  static seedData() {
    console.log("🌱 Füge Beispieldaten ein...");

    db.transaction(() => {
      // Admin-Benutzer erstellen
      const adminPassword =
        "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi"; // "password"
      db.internalQuery("INSERT INTO users (username, password) VALUES (?, ?)", [
        "admin",
        adminPassword,
      ]);

      // Beispielfilme
      const films = [
        {
          title: "Matrix",
          director: "Lana Wachowski, Lilly Wachowski",
          duration: 136,
          description:
            "Ein Computerhacker erfährt von mysteriösen Rebellen die Wahrheit über seine Realität und seine Rolle im Krieg gegen deren Kontrolleure.",
          cast: "Keanu Reeves, Laurence Fishburne, Carrie-Anne Moss, Hugo Weaving",
          release_date: "1999",
          poster_url: "/uploads/posters/matrix.jpg",
        },
        {
          title: "Parasite",
          director: "Bong Joon-ho",
          duration: 132,
          description:
            "Die Familie Kim lebt in einer schäbigen Kellerwohnung und schlägt sich mit Gelegenheitsjobs durch. Als der Sohn Ki-woo die Chance erhält, als Nachhilfelehrer für die wohlhabende Familie Park zu arbeiten, wittert die Familie ihre Chance auf sozialen Aufstieg.",
          cast: "Song Kang-ho, Lee Sun-kyun, Cho Yeo-jeong, Choi Woo-shik",
          release_date: "2019",
          poster_url: "/uploads/posters/parasite.jpg",
        },
        {
          title: "Dune",
          director: "Denis Villeneuve",
          duration: 155,
          description:
            "Paul Atreides, ein brillanter und begabter junger Mann geboren in eine große Bestimmung jenseits seines Verständnisses, muss zum gefährlichsten Planeten im Universum reisen, um die Zukunft seiner Familie und seines Volkes zu sichern.",
          cast: "Timothée Chalamet, Rebecca Ferguson, Oscar Isaac, Josh Brolin",
          release_date: "2021",
          poster_url: "/uploads/posters/dune.jpg",
        },
        {
          title: "Der Name der Rose",
          director: "Jean-Jacques Annaud",
          duration: 130,
          description:
            "Im Jahr 1327 kommt der Franziskanermönch William von Baskerville zusammen mit seinem Schüler Adson in ein abgelegenes Kloster, um an einer theologischen Disputation teilzunehmen. Doch eine Serie mysteriöser Todesfälle überschattet ihren Aufenthalt.",
          cast: "Sean Connery, F. Murray Abraham, Christian Slater",
          release_date: "1986",
          poster_url: "/uploads/posters/name-der-rose.jpg",
        },
        {
          title: "Pulp Fiction",
          director: "Quentin Tarantino",
          duration: 154,
          description:
            "Die Wege von zwei Auftragskillern, einem Boxkämpfer, einer Gangsterfrau und einem Gangsterboss kreuzen sich in dieser stilbildenden Gangsterkomödie.",
          cast: "John Travolta, Uma Thurman, Samuel L. Jackson, Bruce Willis",
          release_date: "1994",
          poster_url: "/uploads/posters/pulp-fiction.jpg",
        },
      ];

      // Filme einfügen und IDs speichern
      const filmIds = [];
      for (const film of films) {
        const _result = db.internalQuery(
          `
          INSERT INTO films (title, director, duration, description, cast, release_date, poster_url)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
          [
            film.title,
            film.director,
            film.duration,
            film.description,
            film.cast,
            film.release_date,
            film.poster_url,
          ]
        );

        // Film-ID aus der Datenbank abrufen
        const insertedFilm = db.internalQueryEntries(
          "SELECT id FROM films WHERE title = ? AND director = ?",
          [film.title, film.director]
        )[0];

        console.log(
          `   🎬 Film eingefügt: ${film.title} (ID: ${insertedFilm.id})`
        );
        filmIds.push(insertedFilm.id);
      }

      console.log(
        `📋 ${filmIds.length} Filme eingefügt. IDs: [${filmIds.join(", ")}]`
      );

      const today = new Date();

      console.log("🎬 Erstelle Vorstellungen...");

      // Tag 1 - Heute (2 Filme)
      const heute = new Date(today);
      const heuteString = heute.toISOString().split("T")[0];
      console.log(`   📅 Heute (${heuteString}): Matrix + Parasite`);
      db.internalQuery(
        "INSERT INTO shows (film_id, date, time) VALUES (?, ?, ?)",
        [1, heuteString, "14:30"]
      ); // Matrix
      db.internalQuery(
        "INSERT INTO shows (film_id, date, time) VALUES (?, ?, ?)",
        [2, heuteString, "17:00"]
      ); // Parasite

      // Tag 2 - Morgen (2 Filme)
      const morgen = new Date(today);
      morgen.setDate(today.getDate() + 1);
      const morgenString = morgen.toISOString().split("T")[0];
      console.log(`   📅 Morgen (${morgenString}): Dune + Der Name der Rose`);
      db.internalQuery(
        "INSERT INTO shows (film_id, date, time) VALUES (?, ?, ?)",
        [3, morgenString, "14:30"]
      ); // Dune
      db.internalQuery(
        "INSERT INTO shows (film_id, date, time) VALUES (?, ?, ?)",
        [4, morgenString, "17:00"]
      ); // Der Name der Rose

      // Tag 3 - Übermorgen (1 Film)
      const uebermorgen = new Date(today);
      uebermorgen.setDate(today.getDate() + 2);
      const uebermorgenString = uebermorgen.toISOString().split("T")[0];
      console.log(
        `   📅 Übermorgen (${uebermorgenString}): Das Leben der Anderen`
      );
      db.internalQuery(
        "INSERT INTO shows (film_id, date, time) VALUES (?, ?, ?)",
        [5, uebermorgenString, "20:15"]
      ); // Das Leben der Anderen

      // Tag 4 (2 Filme)
      const tag4 = new Date(today);
      tag4.setDate(today.getDate() + 3);
      const tag4String = tag4.toISOString().split("T")[0];
      console.log(`   📅 Tag 4 (${tag4String}): Matrix + Dune`);
      db.internalQuery(
        "INSERT INTO shows (film_id, date, time) VALUES (?, ?, ?)",
        [1, tag4String, "17:00"]
      ); // Matrix
      db.internalQuery(
        "INSERT INTO shows (film_id, date, time) VALUES (?, ?, ?)",
        [3, tag4String, "20:15"]
      ); // Dune

      // Tag 5 (1 Film)
      const tag5 = new Date(today);
      tag5.setDate(today.getDate() + 4);
      const tag5String = tag5.toISOString().split("T")[0];
      console.log(`   📅 Tag 5 (${tag5String}): Parasite`);
      db.internalQuery(
        "INSERT INTO shows (film_id, date, time) VALUES (?, ?, ?)",
        [2, tag5String, "14:30"]
      ); // Parasite
    });

    console.log("✅ Beispieldaten erfolgreich eingefügt");
  }

  // Komplett-Reset: Schema + Seed
  static resetAndSeed() {
    console.log("🔄 Führe kompletten Datenbank-Reset durch...");
    this.resetDatabase();
    this.createSchema();
    this.seedData();
    console.log(
      "🎉 Datenbank erfolgreich zurückgesetzt und mit Beispieldaten gefüllt!"
    );
  }

  // Statistiken anzeigen
  static showStats() {
    console.log("📊 Datenbank-Statistiken:");

    const filmCount = db.internalQueryEntries(
      "SELECT COUNT(*) as count FROM films"
    )[0].count;
    const showCount = db.internalQueryEntries(
      "SELECT COUNT(*) as count FROM shows"
    )[0].count;
    const userCount = db.internalQueryEntries(
      "SELECT COUNT(*) as count FROM users"
    )[0].count;

    console.log(`   📽️  Filme: ${filmCount}`);
    console.log(`   🎬 Vorstellungen: ${showCount}`);
    console.log(`   👤 Benutzer: ${userCount}`);

    // Nächste Vorstellungen anzeigen
    const upcomingShows = db.internalQueryEntries(`
      SELECT f.title, s.date, s.time 
      FROM shows s 
      JOIN films f ON s.film_id = f.id 
      WHERE s.date >= date('now') 
      ORDER BY s.date, s.time 
      LIMIT 5
    `);

    if (upcomingShows.length > 0) {
      console.log("\n🎭 Nächste Vorstellungen:");
      upcomingShows.forEach((show) => {
        console.log(`   ${show.date} ${show.time} - ${show.title}`);
      });
    }
  }
}

export default DatabaseSeed;
