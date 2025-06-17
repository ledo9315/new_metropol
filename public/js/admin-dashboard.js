/**
 * Admin Dashboard JavaScript
 * Kino Metropol - Dynamische Formular-Funktionen für das Admin-Dashboard
 */

// Globale Variable für Show-Index
let showIndex = 0;

// Initialisierung nach DOM-Load
document.addEventListener("DOMContentLoaded", function () {
  // Show-Index basierend auf existierenden Einträgen setzen
  const existingShows = document.querySelectorAll(
    "#shows-container .show-entry"
  );
  showIndex = existingShows.length;

  // File Upload Enhancement initialisieren
  initFileUploadEnhancement();
});

/**
 * Neue Vorstellung hinzufügen
 * Erstellt dynamisch ein neues Formular-Element für eine Vorstellung
 */
function _addShowField() {
  const container = document.getElementById("shows-container");

  if (!container) {
    console.error("Shows-Container nicht gefunden");
    return;
  }

  const newShow = document.createElement("div");
  newShow.className = "show-entry";

  // Sichere HTML-Erstellung ohne innerHTML für bessere Sicherheit
  const showGrid = document.createElement("div");
  showGrid.className = "show-entry-grid";

  // Datum-Gruppe
  const dateGroup = document.createElement("div");
  dateGroup.className = "form-group";
  const dateLabel = document.createElement("label");
  dateLabel.textContent = "Datum:";
  const dateInput = document.createElement("input");
  dateInput.type = "date";
  dateInput.name = `shows[${showIndex}][date]`;
  dateGroup.appendChild(dateLabel);
  dateGroup.appendChild(dateInput);

  // Zeit-Gruppe
  const timeGroup = document.createElement("div");
  timeGroup.className = "form-group";
  const timeLabel = document.createElement("label");
  timeLabel.textContent = "Uhrzeit:";
  const timeInput = document.createElement("input");
  timeInput.type = "time";
  timeInput.name = `shows[${showIndex}][time]`;
  timeGroup.appendChild(timeLabel);
  timeGroup.appendChild(timeInput);

  // Entfernen-Button
  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className = "delete-link";
  removeButton.textContent = "Entfernen";
  removeButton.addEventListener("click", function () {
    removeShowField(this);
  });

  // Zusammenfügen
  showGrid.appendChild(dateGroup);
  showGrid.appendChild(timeGroup);
  showGrid.appendChild(removeButton);
  newShow.appendChild(showGrid);

  container.appendChild(newShow);
  showIndex++;
}

/**
 * Vorstellung entfernen
 * Entfernt ein Vorstellungs-Formular-Element
 */
function removeShowField(button) {
  if (!button) return;

  const showEntry = button.closest(".show-entry");
  if (showEntry) {
    showEntry.remove();
  }
}
