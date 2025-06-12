export class ShowValidationError extends Error {
  constructor(field, message) {
    super(message);
    this.field = field;
    this.name = "ShowValidationError";
  }
}

export const showValidator = {
  validateShow(show) {
    const errors = [];

    if (!show.date || show.date.trim() === "") {
      errors.push(new ShowValidationError("date", "Datum ist erforderlich"));
    } else if (!this._isValidDate(show.date)) {
      errors.push(
        new ShowValidationError(
          "date",
          "Ungültiges Datumsformat (YYYY-MM-DD erforderlich)"
        )
      );
    } else if (this._isPastDate(show.date)) {
      errors.push(
        new ShowValidationError(
          "date",
          "Datum darf nicht in der Vergangenheit liegen"
        )
      );
    }

    if (!show.time || show.time.trim() === "") {
      errors.push(new ShowValidationError("time", "Uhrzeit ist erforderlich"));
    } else if (!this._isValidTime(show.time)) {
      errors.push(
        new ShowValidationError(
          "time",
          "Ungültiges Zeitformat (HH:MM erforderlich)"
        )
      );
    }

    if (!show.film_id || isNaN(parseInt(show.film_id))) {
      errors.push(
        new ShowValidationError("film_id", "Gültige Film-ID ist erforderlich")
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  validateShows(shows) {
    const allErrors = [];

    shows.forEach((show, index) => {
      const validation = this.validateShow(show);
      if (!validation.isValid) {
        validation.errors.forEach((error) => {
          error.showIndex = index;
          allErrors.push(error);
        });
      }
    });

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
    };
  },

  _isValidDate(date) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;

    const dateObj = new Date(date);
    return dateObj instanceof Date && !isNaN(dateObj);
  },

  _isPastDate(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    return checkDate < today;
  },

  _isValidTime(time) {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  },
};
