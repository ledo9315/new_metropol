// utils/fileUpload.js
import { ensureDir } from "https://deno.land/std@0.208.0/fs/mod.ts";
import { extname } from "https://deno.land/std@0.208.0/path/mod.ts";

const UPLOAD_DIR = "./public/uploads/posters";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

export class FileUploadError extends Error {
  constructor(message) {
    super(message);
    this.name = "FileUploadError";
  }
}

export const fileUpload = {
  async uploadPoster(file, filmId) {
    try {
      // Verzeichnis sicherstellen
      await ensureDir(UPLOAD_DIR);

      // Dateivalidierung
      this.validateFile(file);

      // Eindeutigen Dateinamen generieren
      const extension = extname(file.originalName || file.name);
      const timestamp = Date.now();
      const filename = `poster_${filmId}_${timestamp}${extension}`;
      const filepath = `${UPLOAD_DIR}/${filename}`;

      // Datei speichern
      const buffer = await file.arrayBuffer();
      await Deno.writeFile(filepath, new Uint8Array(buffer));

      // Relativen Pfad für die Datenbank zurückgeben
      return `/public/uploads/posters/${filename}`;
    } catch (error) {
      if (error instanceof FileUploadError) {
        throw error;
      }
      throw new FileUploadError(`Upload fehlgeschlagen: ${error.message}`);
    }
  },

  validateFile(file) {
    // Prüfen ob eine Datei hochgeladen wurde
    if (!file || !file.name) {
      return;
    }

    // Dateigröße prüfen
    if (file.size > MAX_FILE_SIZE) {
      throw new FileUploadError(
        `Datei zu groß. Maximum: ${MAX_FILE_SIZE / 1024 / 1024}MB`
      );
    }

    // Dateierweiterung prüfen
    const extension = extname(file.originalName || file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      throw new FileUploadError(
        `Ungültiger Dateityp. Erlaubt: ${ALLOWED_EXTENSIONS.join(", ")}`
      );
    }

    // MIME-Type prüfen (zusätzliche Sicherheit)
    if (file.type && !file.type.startsWith("image/")) {
      throw new FileUploadError("Nur Bilddateien sind erlaubt");
    }
  },

  async deletePoster(posterPath) {
    try {
      if (posterPath && posterPath.startsWith("/public/uploads/posters/")) {
        const fullPath = `.${posterPath}`;
        await Deno.remove(fullPath);
      }
    } catch (error) {
      // Ignoriere Fehler beim Löschen (Datei existiert möglicherweise nicht)
      console.warn(`Konnte Poster nicht löschen: ${error.message}`);
    }
  },
};
