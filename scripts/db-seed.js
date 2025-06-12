#!/usr/bin/env deno run --allow-read --allow-write
// scripts/db-seed.js

import { DatabaseSeed } from "../src/db/seed.js";

const command = Deno.args[0];

switch (command) {
  case "reset":
    DatabaseSeed.resetDatabase();
    break;

  case "seed":
    DatabaseSeed.seedData();
    break;

  case "reset-and-seed":
  case "full":
    DatabaseSeed.resetAndSeed();
    break;

  case "stats":
    DatabaseSeed.showStats();
    break;

  case "schema":
    DatabaseSeed.createSchema();
    break;

  default:
    console.log("🎬 Metropol Kino - Datenbank-Tool");
    console.log("");
    console.log("Verfügbare Kommandos:");
    console.log("  reset           - Löscht alle Daten aus der Datenbank");
    console.log("  seed            - Fügt Beispieldaten ein");
    console.log(
      "  reset-and-seed  - Löscht alles und fügt neue Beispieldaten ein"
    );
    console.log("  full            - Alias für reset-and-seed");
    console.log("  schema          - Erstellt die Datenbankstruktur");
    console.log("  stats           - Zeigt Datenbank-Statistiken");
    console.log("");
    console.log("Beispiele:");
    console.log(
      "  deno run --allow-read --allow-write scripts/db-seed.js reset-and-seed"
    );
    console.log(
      "  deno run --allow-read --allow-write scripts/db-seed.js stats"
    );
}
