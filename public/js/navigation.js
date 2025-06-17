/**
 * Mobile Navigation (Hamburger Menu) JavaScript
 */

// Mobile Navigation Toggle
document.addEventListener("DOMContentLoaded", function () {
  // JavaScript ist aktiviert - Klasse zum Body hinzufügen
  document.body.classList.add("js-enabled");

  const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
  const mainNav = document.querySelector(".main-nav");

  // Hilfsfunktion zum Schließen der Navigation
  function closeNavigation() {
    mainNav.classList.remove("active");
    mobileMenuBtn.setAttribute("aria-expanded", "false");
    mobileMenuBtn.setAttribute("aria-label", "Navigation öffnen");
  }

  // Nur ausführen wenn beide Elemente vorhanden sind
  if (mobileMenuBtn && mainNav) {
    // Hamburger Menu Button Click Handler
    mobileMenuBtn.addEventListener("click", function () {
      const isExpanded = mobileMenuBtn.getAttribute("aria-expanded") === "true";

      // Toggle aria-expanded für Barrierefreiheit
      mobileMenuBtn.setAttribute("aria-expanded", !isExpanded);

      // Toggle navigation visibility
      mainNav.classList.toggle("active");

      // Update aria-label für Screen Reader
      mobileMenuBtn.setAttribute(
        "aria-label",
        isExpanded ? "Navigation öffnen" : "Navigation schließen"
      );
    });

    // Navigation schließen wenn auf einen Link geklickt wird
    const navLinks = mainNav.querySelectorAll("a");
    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        closeNavigation();
      });
    });

    // Navigation schließen wenn außerhalb geklickt wird
    document.addEventListener("click", function (event) {
      if (
        !mobileMenuBtn.contains(event.target) &&
        !mainNav.contains(event.target)
      ) {
        closeNavigation();
      }
    });
  }
});
