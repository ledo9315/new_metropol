/**
 * File Upload Enhancement initialisieren
 * Fügt Validierung und Vorschau-Funktionalität für Datei-Uploads hinzu
 */
// deno-lint-ignore no-unused-vars
function initFileUploadEnhancement() {
  const fileInputs = document.querySelectorAll(".file-input");

  fileInputs.forEach((input) => {
    input.addEventListener("change", function (e) {
      handleFileSelection(e);
    });
  });
}

/**
 * Datei-Auswahl behandeln
 * Validiert die ausgewählte Datei und erstellt eine Vorschau
 */
function handleFileSelection(event) {
  const file = event.target.files[0];

  if (!file) return;

  // Datei-Validierung
  if (!validateFile(file, event.target)) {
    return;
  }

  // Vorschau erstellen
  createFilePreview(file, event.target);
}

/**
 * Datei-Validierung
 * Überprüft Dateityp und -größe
 */
function validateFile(file, input) {
  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  const maxSize = 5 * 1024 * 1024; // 5MB

  // Dateityp-Validierung
  if (!validTypes.includes(file.type)) {
    showFileError(
      "Ungültiger Dateityp. Bitte wählen Sie eine JPG, PNG oder WebP Datei.",
      input
    );
    return false;
  }

  // Dateigröße-Validierung
  if (file.size > maxSize) {
    showFileError("Datei zu groß. Maximum: 5MB", input);
    return false;
  }

  return true;
}

/**
 * Datei-Fehler anzeigen und Input zurücksetzen
 */
function showFileError(message, input) {
  alert(message);
  input.value = "";
}
/**
 * Datei-Vorschau erstellen
 * Erstellt eine sichere Bild-Vorschau für hochgeladene Dateien
 */
function createFilePreview(file, input) {
  // Vorherige Vorschau entfernen
  const existingPreview = input.parentNode.querySelector(".upload-preview");
  if (existingPreview) {
    existingPreview.remove();
  }

  const reader = new FileReader();

  reader.onload = function (e) {
    // Sichere DOM-Erstellung ohne innerHTML
    const preview = document.createElement("div");
    preview.className = "upload-preview";

    const img = document.createElement("img");
    img.src = e.target.result;
    img.alt = "Vorschau";
    img.style.maxWidth = "150px";
    img.style.maxHeight = "200px";
    img.style.marginTop = "10px";
    img.style.borderRadius = "4px";
    img.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";

    const fileInfo = document.createElement("p");
    fileInfo.style.fontSize = "0.8rem";
    fileInfo.style.color = "#666";
    fileInfo.style.margin = "5px 0 0 0";
    fileInfo.textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(
      1
    )} MB)`;

    preview.appendChild(img);
    preview.appendChild(fileInfo);
    input.parentNode.appendChild(preview);
  };

  reader.onerror = function () {
    showFileError("Fehler beim Lesen der Datei", input);
  };

  reader.readAsDataURL(file);
}
