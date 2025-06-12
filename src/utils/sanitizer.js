// Deutsche Übersetzungen für Feldnamen
const FIELD_TRANSLATIONS = {
  title: "Titel",
  director: "Regisseur",
  duration: "Dauer",
  description: "Beschreibung",
  cast: "Besetzung",
  poster_url: "Poster-URL",
  release_date: "Erscheinungsjahr",
  date: "Datum",
  time: "Uhrzeit",
  film_id: "Film-ID",
};

const HTML_ENTITIES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#96;",
  "=": "&#x3D;",
  ":": "&#x3A;",
};

const SQL_INJECTION_PATTERNS = [
  // Gefährliche SQL-Injections (erweiterte Patterns)
  /(;[\s]*(\-\-|\/\*|DROP|DELETE|UPDATE|INSERT|CREATE|ALTER|EXEC))/i,
  /([\'\"][\s]*(OR|AND)[\s]+[\'\"]?[\s]*=[\s]*[\'\"])/i,
  /(UNION[\s]+ALL[\s]+SELECT)/i,
  /(UNION[\s]+SELECT)/i, // Einfaches UNION SELECT
  /([\'\"][\s]*;[\s]*DROP)/i,
  /(\-\-[\s]*$)/,
  /(\/\*[\s\S]*?\*\/)/,
  /([\'\"][\s]*\+[\s]*[\'\"])/i,
  /(exec[\s]*\()/i,
  /(script[\s]*:)/i,
  // Zusätzliche SQL Injection Patterns
  /(SELECT[\s]+\*[\s]+FROM)/i,
  /(SELECT[\s]+.*[\s]+FROM)/i, // Allgemeineres SELECT Pattern
  /([\'\"][\s]*OR[\s]+[\'\"]?1[\'\"]?[\s]*=[\s]*[\'\"]?1)/i,
  /([\'\"][\s]*OR[\s]+[\'\"]?true[\'\"]?)/i,
  /(DROP[\s]+TABLE)/i,
  /(INSERT[\s]+INTO)/i,
  /(UPDATE[\s]+.*[\s]+SET)/i,
  /(DELETE[\s]+FROM)/i,
  // Zusätzliche gefährliche Patterns für die Tests
  /(\'[\s]*OR[\s]*\'1\'[\s]*=[\s]*\'1)/i, // 1' OR '1'='1
  /(\'[\s]*;[\s]*DROP[\s]+TABLE)/i, // '; DROP TABLE
  /(UNION[\s]+SELECT[\s]+.*[\s]+FROM)/i, // UNION SELECT ... FROM
];

const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^>]*>/gi,
  /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi,
];

export const sanitizer = {
  // Hilfsfunktion um Feldnamen zu übersetzen
  translateFieldName: (fieldName) => {
    return FIELD_TRANSLATIONS[fieldName] || fieldName;
  },

  escapeHtml: (text) => {
    if (typeof text !== "string") return text;
    return text.replace(/[&<>"'`=\/:]/g, (match) => HTML_ENTITIES[match]);
  },

  sanitizeString: (input, maxLength = 1000) => {
    if (typeof input !== "string") return "";

    let sanitized = input.trim();
    sanitized = sanitized.substring(0, maxLength);
    // Entferne Control Characters durch Filterung der einzelnen Zeichen
    sanitized = sanitized
      .split("")
      .filter((char) => {
        const code = char.charCodeAt(0);
        return code > 31 && code !== 127; // Behalte nur druckbare Zeichen
      })
      .join("");

    for (const pattern of XSS_PATTERNS) {
      sanitized = sanitized.replace(pattern, "");
    }

    return sanitized;
  },

  sanitizeInteger: (
    input,
    min = Number.MIN_SAFE_INTEGER,
    max = Number.MAX_SAFE_INTEGER
  ) => {
    if (typeof input !== "string" && typeof input !== "number") return null;

    const inputStr = String(input).trim();
    const num = parseInt(inputStr, 10);

    if (isNaN(num)) return null;

    // Prüfe auf ungültige Eingaben wie "12abc" - der String sollte nur Zahlen enthalten
    if (!/^-?\d+$/.test(inputStr)) return null;

    // Prüfe Bereichsgrenzen - gib null zurück wenn außerhalb des Bereichs
    if (num < min || num > max) return null;

    return num;
  },

  sanitizeFloat: (input, min = -Infinity, max = Infinity) => {
    const num = parseFloat(input);
    if (isNaN(num)) return null;
    return Math.max(min, Math.min(max, num));
  },

  sanitizeEmail: (email) => {
    if (typeof email !== "string") return "";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const sanitized = email.trim().toLowerCase();
    return emailRegex.test(sanitized) ? sanitized : "";
  },

  sanitizeUrl: (url) => {
    if (typeof url !== "string") return "";
    try {
      const urlObj = new URL(url);
      if (!["http:", "https:"].includes(urlObj.protocol)) return "";
      return urlObj.toString();
    } catch {
      return "";
    }
  },

  sanitizeDate: (dateString) => {
    if (typeof dateString !== "string") return null;
    // Prüfe auf gültiges Datumsformat YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString.trim())) return null;

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;

    // Prüfe auf unmögliche Daten - erweiterte Validierung
    const parts = dateString.split("-");
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const day = parseInt(parts[2]);

    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;
    if (year < 1900 || year > 2100) return null;

    // Spezifische Monatsvalidierung
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) {
      daysInMonth[1] = 29; // Schaltjahr
    }

    if (day > daysInMonth[month - 1]) return null;

    return date.toISOString().split("T")[0];
  },

  sanitizeTime: (timeString) => {
    if (typeof timeString !== "string") return null;
    // Sehr strenge Zeitvalidierung - nur HH:MM Format mit führenden Nullen
    const timeRegex = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
    const trimmed = timeString.trim();
    return timeRegex.test(trimmed) ? trimmed : null;
  },

  detectSqlInjection: (input) => {
    if (typeof input !== "string") return false;
    // Nur bei User-Input prüfen, nicht bei vorgefertigten Queries
    return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(input));
  },

  detectXss: (input) => {
    if (typeof input !== "string") return false;
    return XSS_PATTERNS.some((pattern) => pattern.test(input));
  },

  sanitizeFormData: (formData, schema) => {
    const sanitized = {};
    const errors = [];

    for (const [key, config] of Object.entries(schema)) {
      const value = formData.get(key);
      const fieldName = sanitizer.translateFieldName(key);

      if (config.required && (!value || value.toString().trim() === "")) {
        errors.push(`${fieldName} ist erforderlich`);
        continue;
      }

      if (!value && !config.required) {
        sanitized[key] = config.default || null;
        continue;
      }

      if (sanitizer.detectSqlInjection(value)) {
        errors.push(`${fieldName} enthält potentiell gefährlichen Content`);
        continue;
      }

      if (sanitizer.detectXss(value)) {
        errors.push(`${fieldName} enthält potentiell gefährlichen Content`);
        continue;
      }

      switch (config.type) {
        case "string":
          // Prüfe Mindestlänge
          if (
            config.minLength &&
            value.toString().trim().length < config.minLength
          ) {
            errors.push(
              `${fieldName} muss mindestens ${config.minLength} Zeichen haben`
            );
          }
          // Prüfe Längenbeschränkungen VOR der Sanitization
          if (config.maxLength && value.toString().length > config.maxLength) {
            errors.push(
              `${fieldName} ist zu lang (max. ${config.maxLength} Zeichen)`
            );
          }
          sanitized[key] = sanitizer.sanitizeString(value, config.maxLength);
          break;
        case "integer":
          sanitized[key] = sanitizer.sanitizeInteger(
            value,
            config.min,
            config.max
          );
          if (sanitized[key] === null && config.required) {
            errors.push(`${fieldName} muss eine gültige Zahl sein`);
          }
          break;
        case "email":
          sanitized[key] = sanitizer.sanitizeEmail(value);
          if (!sanitized[key] && config.required) {
            errors.push(`${fieldName} muss eine gültige E-Mail-Adresse sein`);
          }
          break;
        case "url":
          sanitized[key] = sanitizer.sanitizeUrl(value);
          if (!sanitized[key] && config.required) {
            errors.push(`${fieldName} muss eine gültige URL sein`);
          }
          break;
        case "date":
          sanitized[key] = sanitizer.sanitizeDate(value);
          if (!sanitized[key] && config.required) {
            errors.push(`${fieldName} muss ein gültiges Datum sein`);
          }
          break;
        case "time":
          sanitized[key] = sanitizer.sanitizeTime(value);
          if (!sanitized[key] && config.required) {
            errors.push(`${fieldName} muss eine gültige Zeit sein`);
          }
          break;
        default:
          sanitized[key] = sanitizer.sanitizeString(value);
      }
    }

    return {
      data: sanitized,
      errors,
      isValid: errors.length === 0,
    };
  },
};
