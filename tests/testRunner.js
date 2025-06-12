// Test Runner mit erweiterten Funktionen
import { walk } from "https://deno.land/std@0.208.0/fs/walk.ts";

class TestReporter {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
    };
    this.failures = [];
  }

  onTestStart(name) {
    console.log(`🧪 Starte Test: ${name}`);
  }

  onTestPass(name, duration) {
    this.results.passed++;
    this.results.total++;
    console.log(`✅ ${name} (${duration}ms)`);
  }

  onTestFail(name, error, duration) {
    this.results.failed++;
    this.results.total++;
    this.failures.push({ name, error });
    console.log(`❌ ${name} (${duration}ms)`);
    console.log(`   Error: ${error.message}`);
  }

  generateReport() {
    console.log("\n" + "=".repeat(60));
    console.log("📊 TEST ERGEBNISSE");
    console.log("=".repeat(60));
    console.log(`Gesamt:     ${this.results.total}`);
    console.log(`Erfolgreich: ${this.results.passed} ✅`);
    console.log(`Fehlgeschlagen: ${this.results.failed} ❌`);
    console.log(`Übersprungen: ${this.results.skipped} ⏭️`);

    const successRate = (
      (this.results.passed / this.results.total) *
      100
    ).toFixed(1);
    console.log(`Erfolgsrate: ${successRate}%`);

    if (this.failures.length > 0) {
      console.log("\n❌ FEHLGESCHLAGENE TESTS:");
      this.failures.forEach(({ name, error }) => {
        console.log(`  • ${name}: ${error.message}`);
      });
    }

    console.log("=".repeat(60));
    return this.results.failed === 0;
  }
}

export class TestSuite {
  constructor() {
    this.reporter = new TestReporter();
    this.beforeEachHooks = [];
    this.afterEachHooks = [];
  }

  async runAllTests() {
    console.log("🚀 Starte umfassende Test-Suite für Metropol Kino-Website\n");

    const testFiles = [];
    for await (const entry of walk("tests", {
      exts: [".test.js"],
      includeDirs: false,
    })) {
      testFiles.push(entry.path);
    }

    console.log(`📁 Gefundene Test-Dateien: ${testFiles.length}`);
    testFiles.forEach((file) => console.log(`   - ${file}`));
    console.log("");

    const startTime = performance.now();

    for (const testFile of testFiles) {
      await this.runTestFile(testFile);
    }

    const endTime = performance.now();
    this.reporter.results.duration = Math.round(endTime - startTime);

    console.log(`⏱️  Gesamtdauer: ${this.reporter.results.duration}ms\n`);

    return this.reporter.generateReport();
  }

  async runTestFile(filePath) {
    try {
      console.log(`📄 Führe Tests aus: ${filePath}`);
      await import(`../${filePath}`);
    } catch (error) {
      console.error(`❌ Fehler beim Laden der Test-Datei ${filePath}:`, error);
    }
  }
}

// CLI Interface
if (import.meta.main) {
  const testSuite = new TestSuite();
  const success = await testSuite.runAllTests();

  if (!success) {
    console.log("\n💥 Einige Tests sind fehlgeschlagen!");
    Deno.exit(1);
  } else {
    console.log("\n🎉 Alle Tests erfolgreich!");
    Deno.exit(0);
  }
}
