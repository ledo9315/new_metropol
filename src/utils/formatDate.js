export function formatDate(date) {
  return date.toISOString().split("T")[0];
}

export function getTodayDate() {
  return formatDate(new Date());
}

export function getTomorrowDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatDate(tomorrow);
}

export function getDayAfterTomorrowDate() {
  const dayAfterTomorrow = new Date();
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  return formatDate(dayAfterTomorrow);
}