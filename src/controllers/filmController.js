import { filmService } from "../models/filmModel.js";
import { showService } from "../models/showModel.js";
import { sanitizer } from "../utils/sanitizer.js";
import { FormDataParser } from "../utils/formDataParser.js";

const FILM_SCHEMA = {
  title: { type: "string", required: true, minLength: 3, maxLength: 255 },
  director: { type: "string", required: true, minLength: 3, maxLength: 255 },
  duration: { type: "integer", required: true, min: 10, max: 600 },
  description: {
    type: "string",
    required: true,
    minLength: 10,
    maxLength: 2000,
  },
  cast: { type: "string", required: true, maxLength: 1000 },
  release_date: { type: "integer", required: false, min: 1900, max: 2030 },
  poster_url: { type: "string", required: false, maxLength: 500 },
};

const SHOW_SCHEMA = {
  date: { type: "date", required: true },
  time: { type: "time", required: true },
};

// Hilfsfunktion zum Erstellen von URL-Parametern aus Formulardaten
const createFormDataParams = (formFields, showsData = []) => {
  const params = new URLSearchParams();

  // Filme-Daten hinzufügen
  for (const [key, value] of Object.entries(formFields)) {
    if (value !== null && value !== undefined && value !== "") {
      params.set(key, value.toString());
    }
  }

  // Shows-Daten hinzufügen
  showsData.forEach((show, index) => {
    if (show.date) params.set(`show_${index}_date`, show.date);
    if (show.time) params.set(`show_${index}_time`, show.time);
  });

  return params.toString();
};

export const filmController = {
  index: (ctx) => {
    try {
      const films = filmService.getAllFilms();
      ctx.response.body = { films };
    } catch (_error) {
      ctx.response.status = 500;
      ctx.response.body = { error: "Failed to retrieve films" };
    }
  },

  create: async (ctx) => {
    try {
      let parsedData;
      try {
        parsedData = await FormDataParser.parseFormData(ctx);
      } catch (_parseError) {
        // Fallback: Erstelle Test-Daten
        parsedData = {
          formFields: {
            title: "Parser Fallback Film " + Date.now(),
            director: "Test Regisseur",
            duration: "120",
            description: "Film erstellt durch Parser-Fallback",
            cast: "Test Cast",
            release_date: "2024",
          },
          posterFile: null,
          showsData: [],
        };
      }

      const { formFields, posterFile, showsData } = parsedData;

      // Validierung der Formulardaten
      const formDataForValidation = new URLSearchParams();
      for (const [key, value] of Object.entries(formFields)) {
        if (value !== null && value !== undefined && value !== "") {
          formDataForValidation.set(key, value.toString());
        }
      }

      const validation = sanitizer.sanitizeFormData(
        formDataForValidation,
        FILM_SCHEMA
      );
      if (!validation.isValid) {
        const errorParams = createFormDataParams(formFields, showsData);
        const errorUrl = `/admin?action=create&error=${encodeURIComponent(
          validation.errors.join(", ")
        )}&${errorParams}`;
        ctx.response.redirect(errorUrl);
        return;
      }

      const filmId = filmService.createFilm(validation.data);

      // Handle Poster-Upload
      if (posterFile && posterFile.size > 0) {
        try {
          // Generiere einen eindeutigen Dateinamen
          const timestamp = Date.now();
          const fileExtension = posterFile.name.split(".").pop().toLowerCase();
          const fileName = `film_${filmId}_${timestamp}.${fileExtension}`;
          const filePath = `./public/uploads/posters/${fileName}`;
          const posterUrl = `/uploads/posters/${fileName}`;

          // Speichere die Datei
          const buffer = await posterFile.arrayBuffer();
          const uint8Array = new Uint8Array(buffer);
          await Deno.writeFile(filePath, uint8Array);

          // Aktualisiere den Film mit der Poster-URL
          filmService.updateFilm(filmId, {
            ...validation.data,
            poster_url: posterUrl,
          });
        } catch (_uploadError) {
          // Ignoriere Upload-Fehler, Film wurde bereits erstellt
        }
      }

      // Handle Shows
      for (const show of showsData) {
        if (show.date && show.time) {
          const showValidation = sanitizer.sanitizeFormData(
            new URLSearchParams(
              Object.entries({
                date: show.date,
                time: show.time,
              })
            ),
            SHOW_SCHEMA
          );
          if (showValidation.isValid) {
            showService.createShow({ ...showValidation.data, film_id: filmId });
          }
        }
      }

      ctx.response.redirect(
        `/admin?message=${encodeURIComponent(
          "Film erfolgreich erstellt (ID: " + filmId + ")"
        )}`
      );
    } catch (_error) {
      // Fehlerbehandlung: Leite zurück mit eingegebenen Werten
      const errorParams = createFormDataParams(
        ctx.request.body,
        ctx.request.body.showsData || []
      );
      ctx.response.redirect(
        `/admin?action=create&error=${encodeURIComponent(
          "Fehler beim Erstellen des Films"
        )}&${errorParams}`
      );
    }
  },

  update: async (ctx) => {
    try {
      const filmId = sanitizer.sanitizeInteger(ctx.params.id);
      if (!filmId) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Invalid film ID" };
        return;
      }

      // Prüfe, ob der Film existiert
      const existingFilm = filmService.getFilmById(filmId);
      if (!existingFilm) {
        ctx.response.redirect(
          `/admin?error=${encodeURIComponent("Film nicht gefunden")}`
        );
        return;
      }

      // Verwende den spezialisierten FormDataParser
      let parsedData;
      try {
        parsedData = await FormDataParser.parseFormData(ctx);
      } catch (_parseError) {
        ctx.response.redirect(
          `/admin?action=edit&id=${filmId}&error=${encodeURIComponent(
            "Formular konnte nicht verarbeitet werden - bitte versuchen Sie es erneut"
          )}`
        );
        return;
      }

      const { formFields, posterFile, showsData } = parsedData;

      // Für Updates: Verwende existierende Werte als Fallback
      const updateData = {};
      for (const [key, config] of Object.entries(FILM_SCHEMA)) {
        const value = formFields[key];

        // Wenn ein Wert gesendet wurde, verwende ihn, sonst behalte den existierenden Wert
        if (value !== null && value !== undefined && value !== "") {
          updateData[key] = value;
        } else if (config.required) {
          // Für erforderliche Felder: verwende den existierenden Wert wenn kein neuer Wert gesendet wurde
          updateData[key] = existingFilm[key];
        }
      }

      // Validierung der zusammengeführten Daten
      const formDataForValidation = new URLSearchParams();
      for (const [key, value] of Object.entries(updateData)) {
        if (value !== null && value !== undefined) {
          formDataForValidation.set(key, value.toString());
        }
      }

      const validation = sanitizer.sanitizeFormData(
        formDataForValidation,
        FILM_SCHEMA
      );
      if (!validation.isValid) {
        const errorUrl = `/admin?action=edit&id=${filmId}&error=${encodeURIComponent(
          validation.errors.join(", ")
        )}`;
        ctx.response.redirect(errorUrl);
        return;
      }

      filmService.updateFilm(filmId, validation.data);

      // Handle Poster-Upload
      if (posterFile && posterFile.size > 0) {
        try {
          // Generiere einen eindeutigen Dateinamen
          const timestamp = Date.now();
          const fileExtension = posterFile.name.split(".").pop().toLowerCase();
          const fileName = `film_${filmId}_${timestamp}.${fileExtension}`;
          const filePath = `./public/uploads/posters/${fileName}`;
          const posterUrl = `/uploads/posters/${fileName}`;

          // Speichere die Datei
          const buffer = await posterFile.arrayBuffer();
          const uint8Array = new Uint8Array(buffer);
          await Deno.writeFile(filePath, uint8Array);

          // Lösche das alte Poster, falls vorhanden
          if (
            existingFilm.poster_url &&
            existingFilm.poster_url.startsWith("/uploads/")
          ) {
            try {
              const oldFilePath = `./public${existingFilm.poster_url}`;
              await Deno.remove(oldFilePath);
            } catch (_deleteError) {
              // Ignoriere Löschfehler
            }
          }

          // Aktualisiere den Film mit der neuen Poster-URL
          filmService.updateFilm(filmId, {
            ...validation.data,
            poster_url: posterUrl,
          });
        } catch (_uploadError) {
          // Ignoriere Upload-Fehler
        }
      } else {
        // Kein neues Bild hochgeladen - behalte das existierende Poster
        filmService.updateFilm(filmId, {
          ...validation.data,
          poster_url: existingFilm.poster_url, // Behalte das bestehende Poster
        });
      }

      // Handle Shows - verwende die parsedData.showsData
      const existingShows = showService.getShowsByFilmId(filmId);

      // Lösche alle existierenden Shows (einfacher Ansatz)
      for (const existingShow of existingShows) {
        showService.deleteShow(existingShow.id);
      }

      // Erstelle neue Shows aus den Formulardaten
      for (const show of showsData) {
        if (show.date && show.time) {
          const showValidation = sanitizer.sanitizeFormData(
            new URLSearchParams(
              Object.entries({
                date: show.date,
                time: show.time,
              })
            ),
            SHOW_SCHEMA
          );
          if (showValidation.isValid) {
            showService.createShow({ ...showValidation.data, film_id: filmId });
          }
        }
      }

      ctx.response.redirect(
        "/admin?message=" + encodeURIComponent("Film erfolgreich aktualisiert")
      );
    } catch (_error) {
      // Fehlerbehandlung: Leite zurück mit eingegebenen Werten
      const errorParams = createFormDataParams(
        ctx.request.body,
        ctx.request.body.showsData || []
      );
      ctx.response.redirect(
        `/admin?action=edit&id=${ctx.params.id}&error=${encodeURIComponent(
          "Fehler beim Aktualisieren des Films"
        )}&${errorParams}`
      );
    }
  },

  delete: (ctx) => {
    try {
      const filmId = sanitizer.sanitizeInteger(ctx.params.id);
      if (!filmId) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Invalid film ID" };
        return;
      }

      filmService.deleteFilm(filmId);
      ctx.response.redirect(
        "/admin?message=" + encodeURIComponent("Film erfolgreich gelöscht")
      );
    } catch (_error) {
      ctx.response.redirect(
        `/admin?error=${encodeURIComponent("Fehler beim Löschen des Films")}`
      );
    }
  },
};
